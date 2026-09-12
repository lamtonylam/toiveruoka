## Unicafe food finder
Finds where and when your favorite food is available in Unicafe restaurants.

### Production
https://unari.ynot.fi

### Project structure
- 'backend/' — express API
- 'frontend/' — vite
- 'telegram-bot/' — telegram bot with interactive food & restaurant subscriptions and daily 10:00 morning alert cron job

### Development with Docker

Start development environment using Docker Compose:

```bash
# Start with logs in foreground
docker compose -f docker-compose-dev.yml up --build

# Start in background (detached)
docker compose -f docker-compose-dev.yml up -d --build

# Stop containers
docker compose -f docker-compose-dev.yml down
```

### Data source
- Menus: https://unicafe.fi/wp-json/swiss/v1/restaurants/?lang=fi

### Telegram Bot Setup
1. Copy `telegram-bot/.env.example` to `telegram-bot/.env`:
   ```bash
   cp telegram-bot/.env.example telegram-bot/.env
   ```
2. Set your `TELEGRAM_BOT_TOKEN` from [@BotFather](https://t.me/BotFather) and your PostgreSQL `DATABASE_URL` (in docker-compose-dev, PostgreSQL runs automatically on `postgres:5432`).
3. Start the bot and stack:
   ```bash
   docker compose -f docker-compose-dev.yml up --build
   ```