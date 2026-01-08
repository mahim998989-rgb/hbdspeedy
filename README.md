# HBD Speedy - Telegram Mini Web App

Fan-made birthday event bot for IShowSpeed fans (unofficial, not affiliated).

## System Components

### 1. **Telegram Bot**
- `/start` - Opens Mini Web App
- Referral link tracking
- Join bonus system
- Admin commands
- Real-time notifications

### 2. **Telegram Mini Web App** (Frontend)
- Mobile-first design
- Live countdown timer
- User dashboard with points
- Daily check-in system
- Task completion
- Referral program
- Tap for Fun (video player)
- Withdrawal requests
- Leaderboard

### 3. **Backend API** (FastAPI)
- User authentication (Telegram login)
- Points management
- Task system (dynamic, admin-controlled)
- Referral tracking with milestones
- Withdrawal system
- Admin endpoints

### 4. **Admin Web Panel**
- Secure login (username + password)
- User management
- Points adjustment
- Task management (add/edit/delete)
- Withdrawal approval/rejection
- Event settings (background image, tap assets)
- Statistics dashboard

### 5. **Database** (MongoDB)
Collections:
- `users` - User profiles and points
- `tasks` - Dynamic task list
- `task_completions` - Completion tracking
- `withdrawals` - Withdrawal requests
- `referral_milestones` - Referral rewards
- `admin_settings` - Event configuration

## Features

### Join Bonus System
- Jan 9: 1200 points
- Each next day: -100 points
- Minimum: 100 points
- One-time claim

### Referral System
- Unique referral link per user
- Milestones:
  - 1 referral → 1000 points
  - 3 referrals → 5000 points
  - 5 referrals → 10000 points
- Anti-duplicate protection

### Daily Check-in
- Day 1: 100 points
- Each consecutive day: points double
- Missing a day resets streak
- Ends January 20

### Task System
- Admin can add unlimited tasks
- Types: Group join, Channel join, Link visit, Custom
- One-time completion per user
- Dynamic reward points

### Tap for Fun
- Click image to play video WITH SOUND
- Unlimited taps
- NO points rewarded (just for fun)
- Admin can update image and video

### Withdrawal System
- Users submit withdrawal requests
- Admin reviews and approves/rejects
- User gets Telegram notification
- Status: pending / approved / rejected

## Access

### User Access
- **Web App**: https://fanmade-speedy-bot.preview.emergentagent.com
- **Telegram Bot**: Search for your bot on Telegram (use /start)

### Admin Access
- **Admin Panel**: https://fanmade-speedy-bot.preview.emergentagent.com/admin/login
- **Username**: Noone55550
- **Password**: mahim200m

## Bot Configuration

**Bot Token**: Set in `/app/backend/.env`
```
TELEGRAM_BOT_TOKEN="8512300118:AAGuudVwWeHd0pvF_M0uECkjki-d4o8KnX8"
```

**Admin Telegram**: @Noone55550

## API Endpoints

### Public
- `GET /api/countdown` - Get countdown data
- `POST /api/auth/telegram` - Telegram authentication
- `GET /api/settings` - Get event settings

### User (requires auth)
- `GET /api/user/profile` - Get user profile
- `POST /api/user/claim-join-bonus` - Claim join bonus
- `POST /api/user/checkin` - Daily check-in
- `GET /api/user/referral-stats` - Get referral stats
- `POST /api/user/claim-referral-reward` - Claim referral reward
- `GET /api/tasks/list` - Get tasks
- `POST /api/tasks/complete` - Complete task
- `POST /api/withdrawal/request` - Request withdrawal
- `GET /api/withdrawal/my-requests` - Get my withdrawals
- `GET /api/leaderboard` - Get leaderboard

### Admin (requires admin auth)
- `POST /api/admin/login` - Admin login
- `GET /api/admin/stats` - Get statistics
- `GET /api/admin/users` - Get all users
- `POST /api/admin/adjust-points` - Adjust user points
- `GET /api/admin/withdrawals` - Get all withdrawals
- `POST /api/admin/withdrawal/{id}/approve` - Approve withdrawal
- `POST /api/admin/withdrawal/{id}/reject` - Reject withdrawal
- `GET /api/admin/tasks` - Get all tasks
- `POST /api/admin/tasks` - Create task
- `DELETE /api/admin/tasks/{id}` - Delete task
- `PUT /api/admin/settings` - Update settings

## Event Timeline

- **Start**: January 9, 2026
- **End**: January 20, 2026
- **Birthday**: January 21, 2026

## Security

- JWT authentication
- Admin password protection
- Anti-fake referral logic
- One-time rewards
- Rate limiting ready
- Secure MongoDB queries

## Disclaimer

⚠️ This is a fan-made event. Points are not real money.

## Support

For issues or questions, contact the admin through Telegram: @Noone55550
