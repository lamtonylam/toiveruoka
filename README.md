## Unicafe food finder
Finds where and when your favorite food is available in Unicafe restaurants.

### Production
https://unari.ynot.fi

### Project structure
- 'backend/' — express API
- 'frontend/' — vite

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