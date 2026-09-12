import dotenv from 'dotenv';
import { prisma } from './db';
import { createBot, setupBotCommands } from './bot';
import { startCronJob } from './cron';

dotenv.config();

async function main() {
  console.log('--- Toiveruoka Telegram Bot Starting ---');

  // 1. Connect to PostgreSQL via Prisma
  try {
    await prisma.$connect();
    console.log('Connected to PostgreSQL via Prisma.');
  } catch (err) {
    console.warn('Could not connect to PostgreSQL immediately:', err);
  }

  // 2. Validate bot token
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token === 'your_telegram_bot_token_here') {
    console.warn('\nTELEGRAM_BOT_TOKEN is not configured in .env');
    console.warn('Add your bot token from @BotFather into telegram-bot/.env\n');
    // Keep alive in development container
    setInterval(() => {}, 1000 * 60 * 60);
    return;
  }

  // 3. Create bot and start 10:00 morning cron
  const bot = createBot(token);
  startCronJob(bot);

  // 4. Register command picker and menu button in Telegram
  await setupBotCommands(bot);

  // Handle graceful shutdown
  const stopBot = async () => {
    console.log('\nShutting down gracefully...');
    bot.stop();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.once('SIGINT', stopBot);
  process.once('SIGTERM', stopBot);

  console.log('Bot is running and listening for Telegram updates...');
  await bot.start();
}

main().catch(console.error);
