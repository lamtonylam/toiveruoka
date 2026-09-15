import dotenv from 'dotenv'
import { prisma } from './db'
import { createBot, setupBotCommands, startBotWithRetry } from './bot'
import { startCronJob } from './cron'

dotenv.config()

async function main() {
  console.log('--- Toiveruoka Telegram Bot Starting ---')

  // 1. Connect to PostgreSQL via Prisma
  try {
    await prisma.$connect()
    console.log('Connected to PostgreSQL via Prisma.')
  } catch (err) {
    console.warn('Could not connect to PostgreSQL immediately:', err)
  }

  // 2. Validate bot token
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token || token === 'your_telegram_bot_token_here') {
    console.warn('\nTELEGRAM_BOT_TOKEN is not configured in .env')
    console.warn('Add your bot token from @BotFather into telegram-bot/.env\n')
    // Keep alive in development container
    setInterval(() => {}, 1000 * 60 * 60)
    return
  }

  // 3. Create bot and start 10:00 morning cron
  const bot = createBot(token)
  startCronJob(bot)

  // 4. Register command picker and menu button in Telegram
  await setupBotCommands(bot)

  // 5. Handle graceful shutdown
  const shutdownController = new AbortController()
  let isShuttingDown = false

  const stopBot = async () => {
    if (isShuttingDown) return
    isShuttingDown = true
    console.log('\nShutting down gracefully...')
    shutdownController.abort()
    try {
      await bot.stop()
    } catch {
      // Ignore if bot was not actively polling
    }
    await prisma.$disconnect()
    process.exit(0)
  }
  process.once('SIGINT', () => {
    stopBot().catch(() => {})
  })
  process.once('SIGTERM', () => {
    stopBot().catch(() => {})
  })

  // 6. Start bot with auto-restart on 409 Conflict
  await startBotWithRetry(bot, { signal: shutdownController.signal })
}

main().catch((err) => {
  console.error('Fatal error during bot execution:', err)
  process.exit(1)
})
