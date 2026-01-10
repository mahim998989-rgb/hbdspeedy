import os
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB setup
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# Logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Bot token
BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN')
WEB_APP_URL = os.environ.get('WEB_APP_URL', 'https://deploy-app-21.emergent.host')
ADMIN_TELEGRAM_USERNAME = os.environ.get('ADMIN_TELEGRAM_USERNAME', 'Noone55550')

# Global application instance for webhook mode
application = None

def get_countdown_text():
    """Generate countdown text"""
    target = datetime(2026, 1, 21, 0, 0, 0, tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    diff = target - now
    
    if diff.total_seconds() <= 0:
        return "🎉 It's Speedy's Birthday! 🎂"
    
    days = diff.days
    hours = diff.seconds // 3600
    minutes = (diff.seconds % 3600) // 60
    
    return f"🎂 Speedy's Birthday in {days}d {hours}h {minutes}m 🎉"

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    user = update.effective_user
    telegram_id = user.id
    username = user.username or user.first_name
    
    # Check for referral parameter
    referrer_id = None
    if context.args and len(context.args) > 0:
        try:
            referrer_id = int(context.args[0])
        except:
            pass
    
    # Check if user exists
    existing_user = await db.users.find_one({"telegram_id": telegram_id})
    
    if not existing_user:
        # Create new user
        user_doc = {
            "telegram_id": telegram_id,
            "username": username,
            "points": 0,
            "join_date": datetime.now(timezone.utc).isoformat(),
            "referral_count": 0,
            "streak_day": 0,
            "last_checkin": None,
            "referred_by": referrer_id,
            "join_bonus_claimed": False
        }
        await db.users.insert_one(user_doc)
        
        # Update referrer count if exists
        if referrer_id and referrer_id != telegram_id:
            await db.users.update_one(
                {"telegram_id": referrer_id},
                {"$inc": {"referral_count": 1}}
            )
            # Notify referrer
            try:
                referrer = await db.users.find_one({"telegram_id": referrer_id})
                if referrer:
                    await context.bot.send_message(
                        chat_id=referrer_id,
                        text=f"🎉 New referral! @{username} joined using your link!\n\n{get_countdown_text()}"
                    )
            except:
                pass
    
    countdown = get_countdown_text()
    
    keyboard = [
        [InlineKeyboardButton("🎮 Open HBD Speedy App", web_app=WebAppInfo(url=WEB_APP_URL))],
        [InlineKeyboardButton("📊 Leaderboard", callback_data="leaderboard")],
        [InlineKeyboardButton("👥 Referral Stats", callback_data="referral")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    welcome_text = f"{countdown}\n\n"
    welcome_text += f"🎉 Welcome to HBD Speedy Event!\n\n"
    welcome_text += f"🎂 IShowSpeed Birthday Fan Event\n"
    welcome_text += f"📅 Event: January 9-20, 2026\n\n"
    welcome_text += f"Tap the button below to start earning points!"
    
    await update.message.reply_text(welcome_text, reply_markup=reply_markup)

async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle button callbacks"""
    query = update.callback_query
    await query.answer()
    
    user = query.from_user
    telegram_id = user.id
    
    if query.data == "leaderboard":
        # Get top 10 users
        top_users = await db.users.find({}, {"_id": 0}).sort("points", -1).limit(10).to_list(10)
        
        countdown = get_countdown_text()
        leaderboard_text = f"{countdown}\n\n🏆 TOP 10 LEADERBOARD 🏆\n\n"
        
        for idx, user_data in enumerate(top_users, 1):
            emoji = "🥇" if idx == 1 else "🥈" if idx == 2 else "🥉" if idx == 3 else f"{idx}."
            leaderboard_text += f"{emoji} @{user_data['username']} - {user_data['points']} pts\n"
        
        await query.edit_message_text(leaderboard_text)
    
    elif query.data == "referral":
        user_data = await db.users.find_one({"telegram_id": telegram_id}, {"_id": 0})
        if user_data:
            referral_link = f"https://t.me/{context.bot.username}?start={telegram_id}"
            countdown = get_countdown_text()
            
            referral_text = f"{countdown}\n\n👥 YOUR REFERRAL STATS\n\n"
            referral_text += f"📊 Total Referrals: {user_data['referral_count']}\n"
            referral_text += f"🔗 Your Link:\n{referral_link}\n\n"
            referral_text += f"💰 Rewards:\n"
            referral_text += f"• 1 referral → 1000 pts\n"
            referral_text += f"• 3 referrals → 5000 pts\n"
            referral_text += f"• 5 referrals → 10000 pts\n"
            
            await query.edit_message_text(referral_text)

async def admin_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /admin command"""
    user = update.effective_user
    
    # Check if user is admin
    if user.username != ADMIN_TELEGRAM_USERNAME.replace('@', ''):
        await update.message.reply_text("⛔ You are not authorized to use admin commands.")
        return
    
    admin_text = f"{get_countdown_text()}\n\n"
    admin_text += "🔧 ADMIN COMMANDS\n\n"
    admin_text += "/stats - View statistics\n"
    admin_text += "/broadcast <message> - Send message to all users\n"
    admin_text += "/adjust @username <amount> - Adjust points\n"
    admin_text += "\n💻 Use the Admin Web Panel for full control"
    
    await update.message.reply_text(admin_text)

async def stats_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /stats command (admin only)"""
    user = update.effective_user
    
    if user.username != ADMIN_TELEGRAM_USERNAME.replace('@', ''):
        await update.message.reply_text("⛔ You are not authorized.")
        return
    
    total_users = await db.users.count_documents({})
    total_points = await db.users.aggregate([{"$group": {"_id": None, "total": {"$sum": "$points"}}}]).to_list(1)
    pending_withdrawals = await db.withdrawals.count_documents({"status": "pending"})
    
    stats_text = f"{get_countdown_text()}\n\n"
    stats_text += "📊 EVENT STATISTICS\n\n"
    stats_text += f"👥 Total Users: {total_users}\n"
    stats_text += f"💰 Total Points: {total_points[0]['total'] if total_points else 0}\n"
    stats_text += f"⏳ Pending Withdrawals: {pending_withdrawals}\n"
    
    await update.message.reply_text(stats_text)

async def broadcast_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /broadcast command (admin only)"""
    user = update.effective_user
    
    if user.username != ADMIN_TELEGRAM_USERNAME.replace('@', ''):
        await update.message.reply_text("⛔ You are not authorized.")
        return
    
    if not context.args:
        await update.message.reply_text("Usage: /broadcast <your message>")
        return
    
    message = ' '.join(context.args)
    users = await db.users.find({}, {"_id": 0, "telegram_id": 1}).limit(10000).to_list(10000)
    
    success = 0
    failed = 0
    
    broadcast_text = f"{get_countdown_text()}\n\n📢 BROADCAST\n\n{message}"
    
    for user_data in users:
        try:
            await context.bot.send_message(
                chat_id=user_data['telegram_id'],
                text=broadcast_text
            )
            success += 1
        except:
            failed += 1
    
    await update.message.reply_text(f"✅ Broadcast sent!\nSuccess: {success}\nFailed: {failed}")


def create_application():
    """Create and configure the bot application"""
    global application
    if not BOT_TOKEN:
        logger.error("No TELEGRAM_BOT_TOKEN found in environment")
        return None
    
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Add handlers
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("admin", admin_command))
    application.add_handler(CommandHandler("stats", stats_command))
    application.add_handler(CommandHandler("broadcast", broadcast_command))
    application.add_handler(CallbackQueryHandler(button_callback))
    
    return application


def get_application():
    """Get or create the application instance"""
    global application
    if application is None:
        application = create_application()
    return application


async def process_update(update_data: dict):
    """Process an incoming update from webhook"""
    app = get_application()
    if app is None:
        logger.error("Application not initialized")
        return
    
    update = Update.de_json(update_data, app.bot)
    await app.process_update(update)


def main():
    """Start the bot in polling mode (for local testing)"""
    if not BOT_TOKEN:
        logger.error("No TELEGRAM_BOT_TOKEN found in environment")
        return
    
    app = create_application()
    
    # Get bot info
    import asyncio
    async def get_bot_info():
        bot = app.bot
        bot_data = await bot.get_me()
        logger.info(f"Bot started: @{bot_data.username}")
        logger.info(f"Bot name: {bot_data.first_name}")
        logger.info(f"Bot ID: {bot_data.id}")
    
    asyncio.get_event_loop().run_until_complete(get_bot_info())
    
    # Start bot in polling mode
    logger.info("Bot started in polling mode...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == '__main__':
    main()
