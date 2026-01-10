from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Secret (required, no fallback for security)
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Health check endpoint for Kubernetes (must be at root, not under /api)
@app.get("/health")
async def health_check():
    """Health check endpoint for Kubernetes liveness/readiness probes"""
    return {"status": "healthy", "service": "hbd-speedy-api"}

# Telegram Bot Webhook endpoint
@app.post("/webhook/telegram")
async def telegram_webhook(request: Request):
    """Handle incoming Telegram updates via webhook"""
    try:
        from bot import process_update, get_application
        
        # Initialize the application if needed
        app_bot = get_application()
        if app_bot is None:
            return {"ok": False, "error": "Bot not initialized"}
        
        # Initialize the application
        if not app_bot._initialized:
            await app_bot.initialize()
        
        update_data = await request.json()
        await process_update(update_data)
        return {"ok": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"ok": False, "error": str(e)}

# Endpoint to set up the webhook
@app.get("/webhook/setup")
async def setup_webhook():
    """Set up Telegram webhook"""
    try:
        from bot import get_application
        import httpx
        
        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
        web_app_url = os.environ.get('WEB_APP_URL', 'https://deploy-app-21.emergent.host')
        webhook_url = f"{web_app_url}/webhook/telegram"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.telegram.org/bot{bot_token}/setWebhook",
                json={"url": webhook_url}
            )
            result = response.json()
            
        return {"webhook_url": webhook_url, "result": result}
    except Exception as e:
        logger.error(f"Setup webhook error: {e}")
        return {"ok": False, "error": str(e)}

# Endpoint to remove the webhook (for testing with polling)
@app.get("/webhook/delete")
async def delete_webhook():
    """Delete Telegram webhook"""
    try:
        import httpx
        
        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.telegram.org/bot{bot_token}/deleteWebhook"
            )
            result = response.json()
            
        return {"result": result}
    except Exception as e:
        logger.error(f"Delete webhook error: {e}")
        return {"ok": False, "error": str(e)}

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Models
class TelegramAuthRequest(BaseModel):
    telegram_id: int
    username: str
    first_name: Optional[str] = None

class UserProfile(BaseModel):
    telegram_id: int
    username: str
    points: int
    join_date: str
    referral_count: int
    streak_day: int
    join_bonus_claimed: bool

class TaskModel(BaseModel):
    task_id: str
    title: str
    description: str
    type: str
    url: Optional[str] = None
    reward_points: int
    active: bool

class TaskCreateRequest(BaseModel):
    title: str
    description: str
    type: str
    url: Optional[str] = None
    reward_points: int

class TaskCompleteRequest(BaseModel):
    task_id: str

class WithdrawalRequest(BaseModel):
    amount: int

class AdminLoginRequest(BaseModel):
    username: str
    password: str

class AdminPointsAdjustRequest(BaseModel):
    telegram_id: int
    amount: int

class AdminSettingsUpdate(BaseModel):
    background_image_url: Optional[str] = None
    tap_image_url: Optional[str] = None
    tap_video_url: Optional[str] = None

# Helper functions
def create_jwt_token(data: dict):
    expire = datetime.now(timezone.utc) + timedelta(days=30)
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_jwt_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload

async def get_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_jwt_token(token)
    if not payload or not payload.get('is_admin'):
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload

def calculate_join_bonus():
    """Calculate join bonus - same amount for everyone"""
    # Everyone gets 1200 points when they join, regardless of date
    return 1200

def get_countdown_data():
    """Get countdown data"""
    target = datetime(2026, 1, 21, 0, 0, 0, tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    diff = target - now
    
    if diff.total_seconds() <= 0:
        return {
            "is_active": False,
            "message": "🎉 It's Speedy's Birthday! 🎂",
            "days": 0,
            "hours": 0,
            "minutes": 0
        }
    
    return {
        "is_active": True,
        "message": f"🎂 Speedy's Birthday in {diff.days}d {diff.seconds // 3600}h {(diff.seconds % 3600) // 60}m 🎉",
        "days": diff.days,
        "hours": diff.seconds // 3600,
        "minutes": (diff.seconds % 3600) // 60
    }

# API Routes
@api_router.get("/")
async def root():
    return {"message": "HBD Speedy API", "version": "1.0.0"}

@api_router.get("/countdown")
async def get_countdown():
    return get_countdown_data()

@api_router.post("/auth/telegram")
async def telegram_auth(auth_req: TelegramAuthRequest):
    """Authenticate Telegram user"""
    user = await db.users.find_one({"telegram_id": auth_req.telegram_id}, {"_id": 0})
    
    if not user:
        # Create new user
        user_doc = {
            "telegram_id": auth_req.telegram_id,
            "username": auth_req.username,
            "points": 0,
            "join_date": datetime.now(timezone.utc).isoformat(),
            "referral_count": 0,
            "streak_day": 0,
            "last_checkin": None,
            "referred_by": None,
            "join_bonus_claimed": False
        }
        await db.users.insert_one(user_doc)
        # Return user without _id
        user = {k: v for k, v in user_doc.items() if k != '_id'}
    
    token = create_jwt_token({"telegram_id": auth_req.telegram_id, "username": auth_req.username})
    return {"token": token, "user": user}

@api_router.get("/user/profile")
async def get_user_profile(current_user = Depends(get_current_user)):
    # Check if it's an admin token (has 'username' but no 'telegram_id')
    if 'telegram_id' not in current_user:
        raise HTTPException(status_code=403, detail="Admin cannot access user profile")
    
    user = await db.users.find_one({"telegram_id": current_user['telegram_id']}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.post("/user/claim-join-bonus")
async def claim_join_bonus(current_user = Depends(get_current_user)):
    user = await db.users.find_one({"telegram_id": current_user['telegram_id']})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get('join_bonus_claimed'):
        raise HTTPException(status_code=400, detail="Join bonus already claimed")
    
    bonus = calculate_join_bonus()
    
    await db.users.update_one(
        {"telegram_id": current_user['telegram_id']},
        {"$set": {"join_bonus_claimed": True}, "$inc": {"points": bonus}}
    )
    
    return {"success": True, "bonus": bonus, "message": f"Claimed {bonus} points!"}

@api_router.post("/user/checkin")
async def daily_checkin(current_user = Depends(get_current_user)):
    user = await db.users.find_one({"telegram_id": current_user['telegram_id']})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    now = datetime.now(timezone.utc)
    last_checkin = user.get('last_checkin')
    
    if last_checkin:
        last_checkin_dt = datetime.fromisoformat(last_checkin) if isinstance(last_checkin, str) else last_checkin
        hours_diff = (now - last_checkin_dt).total_seconds() / 3600
        
        # Must wait 24 hours between check-ins
        if hours_diff < 24:
            remaining_hours = 24 - hours_diff
            raise HTTPException(
                status_code=400, 
                detail=f"Already checked in today. Come back in {int(remaining_hours)}h {int((remaining_hours % 1) * 60)}m"
            )
        
        # Check if consecutive (within 48 hours)
        if hours_diff <= 48:
            streak_day = user.get('streak_day', 0) + 1
        else:
            # Reset streak if more than 48 hours
            streak_day = 1
    else:
        streak_day = 1
    
    # Calculate points (doubles each day of streak)
    points = 100 * (2 ** (streak_day - 1))
    
    # Cap points at a reasonable maximum (e.g., 12800 for day 8)
    points = min(points, 12800)
    
    await db.users.update_one(
        {"telegram_id": current_user['telegram_id']},
        {
            "$set": {"last_checkin": now.isoformat(), "streak_day": streak_day},
            "$inc": {"points": points}
        }
    )
    
    return {"success": True, "points": points, "streak_day": streak_day}

@api_router.get("/user/referral-stats")
async def get_referral_stats(current_user = Depends(get_current_user)):
    user = await db.users.find_one({"telegram_id": current_user['telegram_id']}, {"_id": 0})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    referral_count = user.get('referral_count', 0)
    
    # Check claimed milestones
    milestones = await db.referral_milestones.find({"user_id": current_user['telegram_id']}, {"_id": 0}).limit(10).to_list(10)
    claimed = {m['milestone'] for m in milestones}
    
    # Calculate available rewards
    available_rewards = []
    if referral_count >= 1 and 1 not in claimed:
        available_rewards.append({"milestone": 1, "reward": 1000})
    if referral_count >= 3 and 3 not in claimed:
        available_rewards.append({"milestone": 3, "reward": 5000})
    if referral_count >= 5 and 5 not in claimed:
        available_rewards.append({"milestone": 5, "reward": 10000})
    
    return {
        "referral_count": referral_count,
        "claimed_milestones": list(claimed),
        "available_rewards": available_rewards
    }

@api_router.post("/user/claim-referral-reward")
async def claim_referral_reward(milestone: int, current_user = Depends(get_current_user)):
    user = await db.users.find_one({"telegram_id": current_user['telegram_id']})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    referral_count = user.get('referral_count', 0)
    
    # Check if already claimed
    existing = await db.referral_milestones.find_one({
        "user_id": current_user['telegram_id'],
        "milestone": milestone
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Reward already claimed")
    
    # Validate milestone
    rewards = {1: 1000, 3: 5000, 5: 10000}
    if milestone not in rewards or referral_count < milestone:
        raise HTTPException(status_code=400, detail="Milestone not reached")
    
    reward = rewards[milestone]
    
    # Claim reward
    await db.referral_milestones.insert_one({
        "user_id": current_user['telegram_id'],
        "milestone": milestone,
        "claimed_at": datetime.now(timezone.utc).isoformat()
    })
    
    await db.users.update_one(
        {"telegram_id": current_user['telegram_id']},
        {"$inc": {"points": reward}}
    )
    
    return {"success": True, "reward": reward}

@api_router.get("/tasks/list")
async def list_tasks(current_user = Depends(get_current_user)):
    tasks = await db.tasks.find({"active": True}, {"_id": 0}).limit(100).to_list(100)
    
    # Get user's completed tasks
    completed = await db.task_completions.find(
        {"user_id": current_user['telegram_id']},
        {"_id": 0, "task_id": 1}
    ).limit(1000).to_list(1000)
    completed_ids = {c['task_id'] for c in completed}
    
    for task in tasks:
        task['completed'] = task['task_id'] in completed_ids
    
    return tasks

@api_router.post("/tasks/complete")
async def complete_task(req: TaskCompleteRequest, current_user = Depends(get_current_user)):
    # Check if task exists
    task = await db.tasks.find_one({"task_id": req.task_id, "active": True})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if already completed
    existing = await db.task_completions.find_one({
        "user_id": current_user['telegram_id'],
        "task_id": req.task_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Task already completed")
    
    # Mark as completed
    await db.task_completions.insert_one({
        "user_id": current_user['telegram_id'],
        "task_id": req.task_id,
        "completed_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Award points
    await db.users.update_one(
        {"telegram_id": current_user['telegram_id']},
        {"$inc": {"points": task['reward_points']}}
    )
    
    return {"success": True, "reward": task['reward_points']}

@api_router.post("/withdrawal/request")
async def request_withdrawal(req: WithdrawalRequest, current_user = Depends(get_current_user)):
    user = await db.users.find_one({"telegram_id": current_user['telegram_id']})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user['points'] < req.amount:
        raise HTTPException(status_code=400, detail="Insufficient points")
    
    # Create withdrawal request
    withdrawal_doc = {
        "withdrawal_id": str(uuid.uuid4()),
        "user_id": current_user['telegram_id'],
        "username": user['username'],
        "amount": req.amount,
        "status": "pending",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "admin_note": None
    }
    
    await db.withdrawals.insert_one(withdrawal_doc)
    
    return {"success": True, "message": "Withdrawal request submitted"}

@api_router.get("/withdrawal/my-requests")
async def get_my_withdrawals(current_user = Depends(get_current_user)):
    withdrawals = await db.withdrawals.find(
        {"user_id": current_user['telegram_id']},
        {"_id": 0}
    ).sort("timestamp", -1).limit(100).to_list(100)
    
    return withdrawals

@api_router.get("/leaderboard")
async def get_leaderboard():
    top_users = await db.users.find(
        {},
        {"_id": 0, "username": 1, "points": 1, "telegram_id": 1}
    ).sort("points", -1).limit(100).to_list(100)
    
    return top_users

@api_router.get("/settings")
async def get_settings():
    settings = await db.admin_settings.find_one({}, {"_id": 0})
    if not settings:
        # Default settings
        settings = {
            "background_image_url": "https://customer-assets.emergentagent.com/job_ff141841-2e59-4507-96bf-1bcd7ee18354/artifacts/neszsaji_gpt-image-1.5_a_made_this_pic_into_a.png",
            "tap_image_url": "https://customer-assets.emergentagent.com/job_ff141841-2e59-4507-96bf-1bcd7ee18354/artifacts/neszsaji_gpt-image-1.5_a_made_this_pic_into_a.png",
            "tap_video_url": "https://customer-assets.emergentagent.com/job_ff141841-2e59-4507-96bf-1bcd7ee18354/artifacts/ind1ownr_m.mp4"
        }
        await db.admin_settings.insert_one(settings)
    
    return settings

# Admin Routes
@api_router.post("/admin/login")
async def admin_login(req: AdminLoginRequest):
    # Check admin credentials (no fallbacks for security)
    admin_username = os.environ['ADMIN_TELEGRAM_USERNAME'].replace('@', '')
    admin_password = os.environ['ADMIN_PASSWORD']
    
    if req.username != admin_username or req.password != admin_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token({"username": req.username, "is_admin": True})
    return {"token": token}

@api_router.get("/admin/stats")
async def get_admin_stats(admin = Depends(get_admin_user)):
    total_users = await db.users.count_documents({})
    total_points_result = await db.users.aggregate([{"$group": {"_id": None, "total": {"$sum": "$points"}}}]).to_list(1)
    total_points = total_points_result[0]['total'] if total_points_result else 0
    pending_withdrawals = await db.withdrawals.count_documents({"status": "pending"})
    total_tasks = await db.tasks.count_documents({"active": True})
    total_task_completions = await db.task_completions.count_documents({})
    total_checkins = await db.users.count_documents({"last_checkin": {"$ne": None}})
    total_referrals_result = await db.users.aggregate([{"$group": {"_id": None, "total": {"$sum": "$referral_count"}}}]).to_list(1)
    total_referrals = total_referrals_result[0]['total'] if total_referrals_result else 0
    join_bonus_claimed = await db.users.count_documents({"join_bonus_claimed": True})
    
    # Get users joined today
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    users_today = await db.users.count_documents({"join_date": {"$gte": today.isoformat()}})
    
    return {
        "total_users": total_users,
        "total_points": total_points,
        "pending_withdrawals": pending_withdrawals,
        "total_tasks": total_tasks,
        "total_task_completions": total_task_completions,
        "total_checkins": total_checkins,
        "total_referrals": total_referrals,
        "join_bonus_claimed": join_bonus_claimed,
        "users_today": users_today
    }

@api_router.get("/admin/users")
async def get_all_users(admin = Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0}).sort("join_date", -1).limit(1000).to_list(1000)
    
    # Batch fetch task completion counts using aggregation
    user_ids = [u['telegram_id'] for u in users]
    
    # Aggregate task completions by user
    task_counts = await db.task_completions.aggregate([
        {"$match": {"user_id": {"$in": user_ids}}},
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}}
    ]).to_list(1000)
    task_count_map = {tc['_id']: tc['count'] for tc in task_counts}
    
    # Aggregate withdrawal counts by user
    withdrawal_counts = await db.withdrawals.aggregate([
        {"$match": {"user_id": {"$in": user_ids}}},
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}}
    ]).to_list(1000)
    withdrawal_count_map = {wc['_id']: wc['count'] for wc in withdrawal_counts}
    
    # Enrich users with counts
    for user in users:
        user['tasks_completed'] = task_count_map.get(user['telegram_id'], 0)
        user['withdrawal_count'] = withdrawal_count_map.get(user['telegram_id'], 0)
    
    return users

@api_router.get("/admin/users/{telegram_id}")
async def get_user_details(telegram_id: int, admin = Depends(get_admin_user)):
    """Get detailed information about a specific user"""
    user = await db.users.find_one({"telegram_id": telegram_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get all task completions for this user
    task_completions = await db.task_completions.find(
        {"user_id": telegram_id},
        {"_id": 0}
    ).sort("completed_at", -1).limit(100).to_list(100)
    
    # Batch fetch all tasks for completions
    task_ids = [c['task_id'] for c in task_completions]
    tasks_list = await db.tasks.find({"task_id": {"$in": task_ids}}, {"_id": 0}).to_list(100) if task_ids else []
    tasks_map = {t['task_id']: t for t in tasks_list}
    
    # Build completed tasks list
    completed_tasks = []
    for completion in task_completions:
        task = tasks_map.get(completion['task_id'])
        if task:
            completed_tasks.append({
                "task_id": task['task_id'],
                "title": task['title'],
                "reward_points": task['reward_points'],
                "completed_at": completion['completed_at']
            })
    
    # Get all withdrawals for this user
    withdrawals = await db.withdrawals.find(
        {"user_id": telegram_id},
        {"_id": 0}
    ).sort("timestamp", -1).limit(50).to_list(50)
    
    # Get referral milestones claimed
    milestones = await db.referral_milestones.find(
        {"user_id": telegram_id},
        {"_id": 0}
    ).limit(10).to_list(10)
    
    # Get users referred by this user
    referred_users = await db.users.find(
        {"referred_by": telegram_id},
        {"_id": 0, "telegram_id": 1, "username": 1, "join_date": 1, "points": 1}
    ).limit(100).to_list(100)
    
    return {
        "user": user,
        "completed_tasks": completed_tasks,
        "withdrawals": withdrawals,
        "referral_milestones": milestones,
        "referred_users": referred_users,
        "total_tasks_completed": len(completed_tasks),
        "total_withdrawals": len(withdrawals)
    }

@api_router.get("/admin/recent-activities")
async def get_recent_activities(admin = Depends(get_admin_user), limit: int = 50):
    """Get recent activities across the platform"""
    activities = []
    
    # Get recent user registrations
    recent_users = await db.users.find(
        {},
        {"_id": 0, "telegram_id": 1, "username": 1, "join_date": 1}
    ).sort("join_date", -1).limit(20).to_list(20)
    
    for user in recent_users:
        activities.append({
            "type": "user_joined",
            "telegram_id": user['telegram_id'],
            "username": user['username'],
            "timestamp": user['join_date'],
            "description": f"@{user['username']} joined the event"
        })
    
    # Get recent task completions
    recent_completions = await db.task_completions.find(
        {},
        {"_id": 0}
    ).sort("completed_at", -1).limit(20).to_list(20)
    
    # Batch fetch users and tasks for completions
    if recent_completions:
        user_ids = list(set(c['user_id'] for c in recent_completions))
        task_ids = list(set(c['task_id'] for c in recent_completions))
        
        users_list = await db.users.find({"telegram_id": {"$in": user_ids}}, {"_id": 0, "telegram_id": 1, "username": 1}).to_list(100)
        users_map = {u['telegram_id']: u for u in users_list}
        
        tasks_list = await db.tasks.find({"task_id": {"$in": task_ids}}, {"_id": 0, "task_id": 1, "title": 1, "reward_points": 1}).to_list(100)
        tasks_map = {t['task_id']: t for t in tasks_list}
        
        for completion in recent_completions:
            user = users_map.get(completion['user_id'])
            task = tasks_map.get(completion['task_id'])
            if user and task:
                activities.append({
                    "type": "task_completed",
                    "telegram_id": completion['user_id'],
                    "username": user.get('username', 'Unknown'),
                    "timestamp": completion['completed_at'],
                    "description": f"@{user.get('username', 'Unknown')} completed '{task['title']}' (+{task['reward_points']} pts)"
                })
    
    # Get recent withdrawals
    recent_withdrawals = await db.withdrawals.find(
        {},
        {"_id": 0}
    ).sort("timestamp", -1).limit(20).to_list(20)
    
    for withdrawal in recent_withdrawals:
        activities.append({
            "type": "withdrawal",
            "telegram_id": withdrawal['user_id'],
            "username": withdrawal.get('username', 'Unknown'),
            "timestamp": withdrawal['timestamp'],
            "description": f"@{withdrawal.get('username', 'Unknown')} requested {withdrawal['amount']} pts withdrawal ({withdrawal['status']})"
        })
    
    # Get recent check-ins (users with last_checkin)
    recent_checkins = await db.users.find(
        {"last_checkin": {"$ne": None}},
        {"_id": 0, "telegram_id": 1, "username": 1, "last_checkin": 1, "streak_day": 1}
    ).sort("last_checkin", -1).limit(20).to_list(20)
    
    for checkin in recent_checkins:
        activities.append({
            "type": "checkin",
            "telegram_id": checkin['telegram_id'],
            "username": checkin['username'],
            "timestamp": checkin['last_checkin'],
            "description": f"@{checkin['username']} checked in (Day {checkin['streak_day']} streak)"
        })
    
    # Sort all activities by timestamp
    activities.sort(key=lambda x: x['timestamp'] if x['timestamp'] else '', reverse=True)
    
    return activities[:limit]

@api_router.get("/admin/task-stats")
async def get_task_stats(admin = Depends(get_admin_user)):
    """Get statistics for each task"""
    tasks = await db.tasks.find({}, {"_id": 0}).limit(100).to_list(100)
    
    # Batch fetch completion counts using aggregation
    task_ids = [t['task_id'] for t in tasks]
    completion_counts = await db.task_completions.aggregate([
        {"$match": {"task_id": {"$in": task_ids}}},
        {"$group": {"_id": "$task_id", "count": {"$sum": 1}}}
    ]).to_list(100) if task_ids else []
    completion_map = {cc['_id']: cc['count'] for cc in completion_counts}
    
    task_stats = []
    for task in tasks:
        completion_count = completion_map.get(task['task_id'], 0)
        task_stats.append({
            **task,
            "completion_count": completion_count,
            "total_points_awarded": completion_count * task['reward_points']
        })
    
    return task_stats

@api_router.post("/admin/adjust-points")
async def adjust_points(req: AdminPointsAdjustRequest, admin = Depends(get_admin_user)):
    await db.users.update_one(
        {"telegram_id": req.telegram_id},
        {"$inc": {"points": req.amount}}
    )
    return {"success": True}

@api_router.get("/admin/withdrawals")
async def get_all_withdrawals(admin = Depends(get_admin_user)):
    withdrawals = await db.withdrawals.find({}, {"_id": 0}).sort("timestamp", -1).limit(500).to_list(500)
    return withdrawals

@api_router.post("/admin/withdrawal/{withdrawal_id}/approve")
async def approve_withdrawal(withdrawal_id: str, admin = Depends(get_admin_user)):
    withdrawal = await db.withdrawals.find_one({"withdrawal_id": withdrawal_id})
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    
    await db.withdrawals.update_one(
        {"withdrawal_id": withdrawal_id},
        {"$set": {"status": "approved", "admin_note": "Approved"}}
    )
    
    # Deduct points from user
    await db.users.update_one(
        {"telegram_id": withdrawal['user_id']},
        {"$inc": {"points": -withdrawal['amount']}}
    )
    
    return {"success": True}

@api_router.post("/admin/withdrawal/{withdrawal_id}/reject")
async def reject_withdrawal(withdrawal_id: str, reason: str = "Rejected", admin = Depends(get_admin_user)):
    await db.withdrawals.update_one(
        {"withdrawal_id": withdrawal_id},
        {"$set": {"status": "rejected", "admin_note": reason}}
    )
    return {"success": True}

@api_router.get("/admin/tasks")
async def get_admin_tasks(admin = Depends(get_admin_user)):
    tasks = await db.tasks.find({}, {"_id": 0}).limit(100).to_list(100)
    return tasks

@api_router.post("/admin/tasks")
async def create_task(req: TaskCreateRequest, admin = Depends(get_admin_user)):
    task_doc = {
        "task_id": str(uuid.uuid4()),
        "title": req.title,
        "description": req.description,
        "type": req.type,
        "url": req.url,
        "reward_points": req.reward_points,
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.tasks.insert_one(task_doc)
    
    # Return without _id
    return {"success": True, "task": {
        "task_id": task_doc["task_id"],
        "title": task_doc["title"],
        "description": task_doc["description"],
        "type": task_doc["type"],
        "url": task_doc["url"],
        "reward_points": task_doc["reward_points"],
        "active": task_doc["active"]
    }}

@api_router.delete("/admin/tasks/{task_id}")
async def delete_task(task_id: str, admin = Depends(get_admin_user)):
    await db.tasks.update_one(
        {"task_id": task_id},
        {"$set": {"active": False}}
    )
    return {"success": True}

@api_router.put("/admin/settings")
async def update_settings(req: AdminSettingsUpdate, admin = Depends(get_admin_user)):
    update_data = {k: v for k, v in req.model_dump().items() if v is not None}
    
    await db.admin_settings.update_one(
        {},
        {"$set": update_data},
        upsert=True
    )
    
    return {"success": True}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()