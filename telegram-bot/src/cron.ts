import cron from 'node-cron'
import { Bot } from 'grammy'
import { getAllSubscribers } from './db'
import { searchTodayFoods, formatHitsMessage, fetchFoodFromBackend } from './unicafe'

/**
 * Runs the daily check and sends Telegram alerts to subscribers who have matching foods today.
 */
export async function runDailyMorningAlerts(bot: Bot): Promise<number> {
  console.log("[Cron] Checking today's lunch menus for subscribers via backend API...")
  let sentCount = 0

  try {
    const subscribers = await getAllSubscribers()

    // Cache backend responses during this run so identical food queries across users are fetched only once
    const foodCache = new Map<string, Record<string, [string, string, string][]>>()
    const cachedFetcher = async (food: string) => {
      const lower = food.toLowerCase()
      if (!foodCache.has(lower)) {
        foodCache.set(lower, await fetchFoodFromBackend(food))
      }
      return foodCache.get(lower)!
    }

    for (const sub of subscribers) {
      if (sub.foods.length === 0 || sub.restaurants.length === 0) continue

      const hits = await searchTodayFoods(sub.foods, sub.restaurants, new Date(), cachedFetcher)
      if (hits.length === 0) continue

      const msg = formatHitsMessage(hits, '<b>Hyvää huomenta! Tänään on toiveruokaa tarjolla:</b>')

      try {
        await bot.api.sendMessage(sub.chatId, msg, { parse_mode: 'HTML' })
        sentCount++
      } catch (err) {
        console.error(`[Cron] Could not send message to ${sub.chatId}:`, err)
      }
    }
  } catch (err) {
    console.error('[Cron] Error during daily run:', err)
  }

  console.log(`[Cron] Morning check complete. Sent ${sentCount} alert(s).`)
  return sentCount
}

/**
 * Starts the 10:00 morning cron job (Europe/Helsinki timezone).
 */
export function startCronJob(bot: Bot) {
  const schedule = process.env.CRON_SCHEDULE || '0 10 * * *'
  const timezone = process.env.TIMEZONE || 'Europe/Helsinki'

  console.log(`[Cron] Scheduled at '${schedule}' in timezone '${timezone}'`)

  cron.schedule(
    schedule,
    () => {
      void runDailyMorningAlerts(bot)
    },
    { timezone }
  )
}
