import NodeCache from 'node-cache';
import type { UnicafeRestaurants } from '../types/unicafeTypes';

const apiUrl = 'https://unicafe.fi/wp-json/swiss/v1/restaurants/?lang=fi';
const cache = new NodeCache({ stdTTL: 300 }); // 300 seconds = 5 minutes
const CACHE_KEY = 'menu';

export const fetchMenu = async () => {
  // Check if data is in cache
  const cachedData = cache.get<UnicafeRestaurants>(CACHE_KEY);
  if (cachedData) {
    return cachedData;
  }

  // Fetch fresh data
  const response = await fetch(apiUrl);
  const data: UnicafeRestaurants =
    (await response.json()) as UnicafeRestaurants;

  // Store in cache
  cache.set(CACHE_KEY, data);

  return data;
};
