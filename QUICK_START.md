# HBD Speedy - Quick Start Guide

## Getting Started

### For Users

1. **Open Telegram** and search for `@hbdspeedy_io_bot`

2. **Send /start** to the bot

3. **Click "Open HBD Speedy App"** to launch the Mini Web App

4. **Claim your Join Bonus** (decreases by 100 points each day after Jan 9)

5. **Earn Points**:
   - Daily Check-in (doubles each day!)
   - Complete Tasks
   - Refer friends
   - Tap for Fun (no points, just entertainment)

6. **Request Withdrawal** when you're ready

### For Admins

1. **Access Admin Panel**: https://fanmade-speedy-bot.preview.emergentagent.com/admin/login

2. **Login**:
   - Username: `Noone55550`
   - Password: `mahim200m`

3. **Manage Event**:
   - View statistics (Dashboard)
   - Manage users and adjust points (Users)
   - Create/delete tasks (Tasks)
   - Approve/reject withdrawals (Withdrawals)
   - Update images and videos (Settings)

## Bot Commands

### User Commands
- `/start` - Start bot and open Web App

### Admin Commands (via Telegram)
- `/admin` - Show admin commands
- `/stats` - View statistics
- `/broadcast <message>` - Send message to all users

## Features Overview

### 1. Join Bonus
- Starts at 1200 points on Jan 9
- Decreases by 100 each day
- Minimum 100 points
- Claim once in the Web App

### 2. Daily Check-in
- Day 1: 100 pts
- Day 2: 200 pts
- Day 3: 400 pts
- Points double each consecutive day
- Reset if you miss a day

### 3. Referral System
- Share your unique link
- Earn rewards at milestones:
  - 1 referral = 1,000 pts
  - 3 referrals = 5,000 pts
  - 5 referrals = 10,000 pts

### 4. Tasks
- Admin creates tasks dynamically
- Types: Group join, Channel join, Link visit, Custom
- Complete once for points
- Check Web App for active tasks

### 5. Tap for Fun
- Click Speedy's image
- Watch video with sound
- Unlimited taps
- NO POINTS (just for fun!)

### 6. Withdrawals
- Submit request in Web App
- Admin reviews via Admin Panel
- Get notified on Telegram
- Status: Pending → Approved/Rejected

## Technical Details

### Telegram Bot
- **Bot Username**: @hbdspeedy_io_bot
- **Bot ID**: 8512300118
- Running 24/7 via supervisor

### Web App
- **URL**: https://fanmade-speedy-bot.preview.emergentagent.com
- Mobile-optimized
- Real-time countdown
- Instant updates

### Admin Panel
- **URL**: https://fanmade-speedy-bot.preview.emergentagent.com/admin/login
- Desktop-optimized
- Full CRUD operations
- Statistics dashboard

### Database
- MongoDB (local)
- Collections: users, tasks, withdrawals, etc.
- Automatic backups

## Event Schedule

- **Event Period**: Jan 9-20, 2026
- **Countdown Target**: Jan 21, 2026 (Speedy's Birthday!)
- **Check-in Period**: Jan 9-20, 2026

## Important Notes

⚠️ **Disclaimer**: This is a fan-made event. Points are not real money.

🔒 **Security**: 
- JWT authentication
- Admin password protection
- Anti-duplicate rewards
- Secure API endpoints

🎯 **Fair Play**:
- One-time join bonus
- One-time task completion
- Referral validation
- Streak reset on missed days

## Support

**Admin Contact**: @Noone55550 on Telegram

## Quick Links

- Bot: https://t.me/hbdspeedy_io_bot
- Web App: https://fanmade-speedy-bot.preview.emergentagent.com
- Admin Panel: https://fanmade-speedy-bot.preview.emergentagent.com/admin/login
