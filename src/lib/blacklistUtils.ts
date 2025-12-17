// blacklist dict to exclude certain matches for searched food
export const blacklistDict: Record<string, string[]> = {
  kala: ['kreikkalainen', 'ranskalaiset'],
};

export const checkBlacklist = (
  searchedFood: string,
  foodName: string
): boolean => {
  const excludedFoodNames = blacklistDict[searchedFood];
  if (!excludedFoodNames) {
    return false;
  }

  for (const item of excludedFoodNames) {
    if (foodName.toLowerCase().includes(item.toLowerCase())) {
      return true;
    }
  }

  return false;
};
