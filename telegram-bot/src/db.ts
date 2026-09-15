import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

export const prisma = new PrismaClient()

export const DEFAULT_FOODS = [
  'Kalapuikot',
  'Meksikolainen uunimakkara',
  'Rapeat kalapalat',
  'Kananugetit',
  'Pinaattiohukaiset',
  'Makaronilaatikko',
  'Hernekeitto',
  'Lihapullat',
  'Makaronilaatikko',
]

/**
 * Seed default food options for a user (disabled initially so user can tick what they want).
 */
export async function ensureDefaultFoods(chatId: number): Promise<void> {
  const count = await prisma.foodSubscription.count({
    where: { chatId: BigInt(chatId) },
  })

  if (count === 0) {
    await prisma.foodSubscription.createMany({
      data: DEFAULT_FOODS.map((food) => ({
        chatId: BigInt(chatId),
        foodName: food,
        enabled: false,
      })),
      skipDuplicates: true,
    })
  }
}

/**
 * Get all foods tracked by a user.
 */
export async function getUserFoods(chatId: number): Promise<{ name: string; enabled: boolean }[]> {
  const items = await prisma.foodSubscription.findMany({
    where: { chatId: BigInt(chatId) },
    orderBy: { foodName: 'asc' },
  })
  return items.map((i) => ({ name: i.foodName, enabled: i.enabled }))
}

/**
 * Toggle a food subscription on/off.
 */
export async function toggleFood(chatId: number, foodName: string): Promise<boolean> {
  const existing = await prisma.foodSubscription.findUnique({
    where: {
      chatId_foodName: {
        chatId: BigInt(chatId),
        foodName,
      },
    },
  })

  if (!existing) {
    await prisma.foodSubscription.create({
      data: {
        chatId: BigInt(chatId),
        foodName,
        enabled: true,
      },
    })
    return true
  }

  const updated = await prisma.foodSubscription.update({
    where: {
      chatId_foodName: {
        chatId: BigInt(chatId),
        foodName,
      },
    },
    data: {
      enabled: !existing.enabled,
    },
  })

  return updated.enabled
}

/**
 * Add a new custom food for a user and enable it.
 */
export async function addCustomFood(chatId: number, foodName: string): Promise<void> {
  const trimmed = foodName.trim()
  if (!trimmed) return

  await prisma.foodSubscription.upsert({
    where: {
      chatId_foodName: {
        chatId: BigInt(chatId),
        foodName: trimmed,
      },
    },
    create: {
      chatId: BigInt(chatId),
      foodName: trimmed,
      enabled: true,
    },
    update: {
      enabled: true,
    },
  })
}

/**
 * Remove a food from user's tracking list.
 */
export async function removeFood(chatId: number, foodName: string): Promise<void> {
  await prisma.foodSubscription.deleteMany({
    where: {
      chatId: BigInt(chatId),
      foodName,
    },
  })
}

/**
 * Get all restaurants selected by a user.
 */
export async function getUserRestaurants(
  chatId: number
): Promise<{ name: string; enabled: boolean }[]> {
  const items = await prisma.restaurantSubscription.findMany({
    where: { chatId: BigInt(chatId) },
    orderBy: { restaurantName: 'asc' },
  })
  return items.map((i) => ({ name: i.restaurantName, enabled: i.enabled }))
}

/**
 * Toggle a restaurant on/off.
 */
export async function toggleRestaurant(chatId: number, restaurantName: string): Promise<boolean> {
  const existing = await prisma.restaurantSubscription.findUnique({
    where: {
      chatId_restaurantName: {
        chatId: BigInt(chatId),
        restaurantName,
      },
    },
  })

  if (!existing) {
    await prisma.restaurantSubscription.create({
      data: {
        chatId: BigInt(chatId),
        restaurantName,
        enabled: true,
      },
    })
    return true
  }

  const updated = await prisma.restaurantSubscription.update({
    where: {
      chatId_restaurantName: {
        chatId: BigInt(chatId),
        restaurantName,
      },
    },
    data: {
      enabled: !existing.enabled,
    },
  })

  return updated.enabled
}

/**
 * Set multiple restaurants enabled or disabled at once.
 */
export async function setRestaurantsBulk(
  chatId: number,
  restaurants: string[],
  enabled: boolean
): Promise<void> {
  for (const restaurantName of restaurants) {
    await prisma.restaurantSubscription.upsert({
      where: {
        chatId_restaurantName: {
          chatId: BigInt(chatId),
          restaurantName,
        },
      },
      create: {
        chatId: BigInt(chatId),
        restaurantName,
        enabled,
      },
      update: {
        enabled,
      },
    })
  }
}

/**
 * Get the user's alert notification preference (defaults to true if unset).
 */
export async function getUserAlertPreference(chatId: number): Promise<boolean> {
  const pref = await prisma.userPreference.findUnique({
    where: { chatId: BigInt(chatId) },
  })
  return pref ? pref.alertsEnabled : true
}

/**
 * Set the user's alert notification preference.
 */
export async function setUserAlertPreference(
  chatId: number,
  alertsEnabled: boolean
): Promise<boolean> {
  const pref = await prisma.userPreference.upsert({
    where: { chatId: BigInt(chatId) },
    create: {
      chatId: BigInt(chatId),
      alertsEnabled,
    },
    update: {
      alertsEnabled,
    },
  })
  return pref.alertsEnabled
}

/**
 * Toggle the user's alert notification preference.
 */
export async function toggleUserAlertPreference(chatId: number): Promise<boolean> {
  const current = await getUserAlertPreference(chatId)
  return setUserAlertPreference(chatId, !current)
}

export interface Subscriber {
  chatId: number
  foods: string[]
  restaurants: string[]
}

/**
 * Get all users and their active (enabled) foods and restaurants,
 * excluding users who have opted out of morning alerts.
 */
export async function getAllSubscribers(): Promise<Subscriber[]> {
  const disabledPrefs = await prisma.userPreference.findMany({
    where: { alertsEnabled: false },
    select: { chatId: true },
  })
  const disabledChatIds = new Set(disabledPrefs.map((p) => Number(p.chatId)))

  const activeFoods = await prisma.foodSubscription.findMany({
    where: { enabled: true },
  })

  const activeRestos = await prisma.restaurantSubscription.findMany({
    where: { enabled: true },
  })

  const chatMap = new Map<number, { foods: string[]; restaurants: string[] }>()

  for (const f of activeFoods) {
    const id = Number(f.chatId)
    if (disabledChatIds.has(id)) continue
    if (!chatMap.has(id)) {
      chatMap.set(id, { foods: [], restaurants: [] })
    }
    chatMap.get(id)!.foods.push(f.foodName)
  }

  for (const r of activeRestos) {
    const id = Number(r.chatId)
    if (disabledChatIds.has(id)) continue
    if (!chatMap.has(id)) {
      chatMap.set(id, { foods: [], restaurants: [] })
    }
    chatMap.get(id)!.restaurants.push(r.restaurantName)
  }

  const subscribers: Subscriber[] = []
  for (const [chatId, data] of chatMap.entries()) {
    subscribers.push({
      chatId,
      foods: data.foods,
      restaurants: data.restaurants,
    })
  }

  return subscribers
}
