export interface Campus {
  id: string
  name: string
  emoji: string
  restaurants: string[]
}

export const CAMPUSES: Campus[] = [
  {
    id: 'kumpula',
    name: 'Kumpula',
    emoji: '',
    restaurants: ['Exactum', 'Physicum', 'Chemicum'],
  },
  {
    id: 'keskusta',
    name: 'Keskusta',
    emoji: '',
    restaurants: [
      'Kaivopiha',
      'Porthania',
      'Kaisa-talo',
      'Metsätalo',
      'Olivia',
      'Topelias',
      'Soc&Kom',
      'Rotunda',
      'Myöhä Café & Bar',
      'Cafe Portaali',
    ],
  },
  {
    id: 'viikki',
    name: 'Viikki',
    emoji: '',
    restaurants: ['Viikuna', 'Biokeskus', 'Infokeskus', 'Infokeskus alakerta', 'Tähkä'],
  },
  {
    id: 'meilahti',
    name: 'Meilahti',
    emoji: '',
    restaurants: ['Meilahti'],
  },
]

export function getBackendUrl(): string {
  const rawUrl = process.env.BACKEND_URL || 'http://backend:3000'
  return rawUrl.trim().replace(/\/+$/, '')
}

/**
 * Checks if a date string like "Ma 12.09." matches today's date.
 */
export function isToday(dateStr: string, targetDate = new Date()): boolean {
  const match = dateStr.match(/(\d+)\.(\d+)\./)
  if (!match) return false

  const day = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)

  return day === targetDate.getDate() && month === targetDate.getMonth() + 1
}

export interface FoodHit {
  foodKeyword: string
  restaurantName: string
  dishName: string
  allergens: string
}

/**
 * Call backend API: GET /?food=<name>
 * Returns { [restaurantName]: [date, dishName, allergens][] }
 */
export async function fetchFoodFromBackend(
  food: string
): Promise<Record<string, [string, string, string][]>> {
  const url = `${getBackendUrl()}/?food=${encodeURIComponent(food)}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Backend API returned error: ${res.status}`)
  }
  return res.json() as Promise<Record<string, [string, string, string][]>>
}

/**
 * Checks today's lunch for the user's subscribed foods at frequented restaurants using the backend API.
 */
export async function searchTodayFoods(
  subscribedFoods: string[],
  frequentedRestaurants: string[],
  targetDate = new Date(),
  fetcher = fetchFoodFromBackend
): Promise<FoodHit[]> {
  const hits: FoodHit[] = []
  if (subscribedFoods.length === 0 || frequentedRestaurants.length === 0) return hits

  const allowedRestos = new Set(frequentedRestaurants.map((r) => r.toLowerCase()))

  const promises = subscribedFoods.map(async (food) => {
    try {
      const data = await fetcher(food)
      for (const [restoName, items] of Object.entries(data)) {
        if (!allowedRestos.has(restoName.toLowerCase())) continue

        for (const [dateStr, dishName, allergens] of items) {
          if (isToday(dateStr, targetDate)) {
            hits.push({
              foodKeyword: food,
              restaurantName: restoName,
              dishName,
              allergens: allergens || '',
            })
          }
        }
      }
    } catch (err) {
      console.error(`Failed to fetch food '${food}' from backend API:`, err)
    }
  })

  await Promise.all(promises)
  return hits
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Format matching food hits into a clean Telegram HTML message.
 */
export function formatHitsMessage(hits: FoodHit[], title = '<b>Toiveruoka Alert:</b>'): string {
  if (hits.length === 0) {
    return 'Ei toiveruokia tänään valituissa ravintoloissasi.'
  }

  let text = `${title}\n\n`
  for (const hit of hits) {
    const alg = hit.allergens ? ` (${escapeHtml(hit.allergens)})` : ''
    text += `• <b>${escapeHtml(hit.restaurantName)}</b>: ${escapeHtml(hit.dishName)}${alg}\n`
  }
  text += '\nHyvää ruokahalua!'
  return text
}

export interface FoodUpcomingHit {
  foodKeyword: string
  restaurantName: string
  date: string
  dishName: string
  allergens: string
}

/**
 * Checks all upcoming menu dates for the specified foods at specified (or all) restaurants using the backend API.
 */
export async function searchUpcomingFoods(
  foods: string[],
  frequentedRestaurants?: string[],
  fetcher = fetchFoodFromBackend
): Promise<FoodUpcomingHit[]> {
  const hits: FoodUpcomingHit[] = []
  if (foods.length === 0) return hits

  const allowedRestos =
    frequentedRestaurants && frequentedRestaurants.length > 0
      ? new Set(frequentedRestaurants.map((r) => r.toLowerCase()))
      : null

  const seen = new Set<string>()

  const promises = foods.map(async (food) => {
    try {
      const data = await fetcher(food)
      for (const [restoName, items] of Object.entries(data)) {
        if (allowedRestos && !allowedRestos.has(restoName.toLowerCase())) continue

        for (const [dateStr, dishName, allergens] of items) {
          const dedupeKey = `${restoName}::${dateStr}::${dishName}`.toLowerCase()
          if (seen.has(dedupeKey)) continue
          seen.add(dedupeKey)

          hits.push({
            foodKeyword: food,
            restaurantName: restoName,
            date: dateStr,
            dishName,
            allergens: allergens || '',
          })
        }
      }
    } catch (err) {
      console.error(`Failed to fetch food '${food}' from backend API:`, err)
    }
  })

  await Promise.all(promises)
  return hits
}

export function parseDateOrder(dateStr: string): number {
  const match = dateStr.match(/(\d+)\.(\d+)\./)
  if (!match) return 0
  const day = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)
  return month * 100 + day
}

/**
 * Format matching upcoming food hits into a clean Telegram HTML message grouped by restaurant.
 */
export function formatUpcomingHitsMessage(
  hits: FoodUpcomingHit[],
  title = '<b>Kaikki tulevat toiveruoat:</b>',
  emptyMessage = 'Ei tulevia toiveruokia valituissa ravintoloissasi.'
): string {
  if (hits.length === 0) {
    return emptyMessage
  }

  // Group by restaurantName
  const byRestaurant = new Map<string, FoodUpcomingHit[]>()
  for (const hit of hits) {
    if (!byRestaurant.has(hit.restaurantName)) {
      byRestaurant.set(hit.restaurantName, [])
    }
    byRestaurant.get(hit.restaurantName)!.push(hit)
  }

  // Sort restaurants alphabetically
  const sortedRestos = Array.from(byRestaurant.keys()).sort((a, b) => a.localeCompare(b))

  let text = `${title}\n\n`

  const sections: string[] = []
  for (const resto of sortedRestos) {
    const items = byRestaurant.get(resto)!
    items.sort((a, b) => parseDateOrder(a.date) - parseDateOrder(b.date))
    let section = `<b>${escapeHtml(resto)}</b>\n`
    for (const item of items) {
      const alg = item.allergens ? ` <i>(${escapeHtml(item.allergens)})</i>` : ''
      section += `• <b>${escapeHtml(item.date)}</b>: ${escapeHtml(item.dishName)}${alg}\n`
    }
    sections.push(section.trimEnd())
  }

  text += sections.join('\n\n')
  text += '\n\nHyvää ruokahalua!'
  return text
}
