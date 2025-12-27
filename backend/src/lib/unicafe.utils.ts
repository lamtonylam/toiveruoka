import { UnicafeRestaurants, MenuDay, MenuItem } from '../types/unicafeTypes';
import { getRestaurant } from './restaurants';

export const checkIfDateIsPast = (dateString: string): boolean => {
  const today = new Date();

  const formattedDateString = dateString
    .split(' ')
    .slice(1)
    .join(' ')
    .slice(0, -1);
  const dateParts = formattedDateString.split('.');
  const day = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]) - 1; // subtract 1 because months are 0-indexed

  // handle year transition
  const currentMonth = today.getMonth();
  let year = today.getFullYear();
  // if the current month is January and the month to check is December, it's last year
  if (currentMonth === 0 && month === 11) {
    year = today.getFullYear() - 1;
  } else if (currentMonth === 11 && month === 0) {
    year = today.getFullYear() + 1;
  }

  const dateToCheck = new Date(year, month, day);

  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  return dateToCheck < startOfToday;
};

export const getAllergensFromFoodItem = (foodItem: MenuItem): string[] => {
  const itemAllergens: string[] | undefined = foodItem.meta?.[1];

  if (Array.isArray(itemAllergens)) {
    return Array.from(new Set(itemAllergens));
  }

  return [];
};

const extractAllergensFromWeeklyMenus = (
  weeklyMenus: MenuDay[],
  foodName: string
): string[] => {
  const allergens: string[] = [];
  weeklyMenus.forEach((dailyMenu) => {
    dailyMenu.data.forEach((foodItem: MenuItem) => {
      if (foodItem.name.toLowerCase() === foodName.toLowerCase()) {
        allergens.push(...getAllergensFromFoodItem(foodItem));
      }
    });
  });
  return allergens;
};

const getRestaurantData = (
  unicafeResponse: UnicafeRestaurants,
  restaurantName: string
) => {
  return unicafeResponse.find(
    (restaurant) => restaurant.title === restaurantName
  );
};

export const getAllergensFromMenuItem = (
  foodName: string,
  unicafeResponse: UnicafeRestaurants
): string[] => {
  const restaurants = getRestaurant();
  const allergens: string[] = [];

  restaurants.forEach((restaurantName) => {
    const restaurantData = getRestaurantData(unicafeResponse, restaurantName);
    const weeklyMenus = restaurantData?.menuData?.menus;
    if (weeklyMenus) {
      allergens.push(...extractAllergensFromWeeklyMenus(weeklyMenus, foodName));
    }
  });

  return allergens;
};
