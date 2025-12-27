## Unicafe food finder
Finds where and when your favorite food is available at Unicafe restaurants.

### Live docs
- API: https://unaribackend.ynot.fi/
- Production: https://unaribackend.ynot.fi/docs

### Quick start (local)
1) Prerequisite: Node.js 18+ (for built-in `fetch`).
2) Install dependencies: `npm install`
3) Start the API locally: `npm run start`
4) Open Swagger UI: http://localhost:3000/docs

### API
- Base URL (local): http://localhost:3000
- `GET /?food=<string>` (required query `food`)
	- Returns where and when the dish is available this week.
	- 400 if `food` is missing. 500 if the upstream menu fetch fails.

### Scripts
- `npm run start` — start the API
- `npm run lint` — lint TypeScript sources
- `npm run tsc` — type-check the project
