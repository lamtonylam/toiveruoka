import { UnicafeRestaurants } from '../types/unicafeTypes';
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

export const getAllergensFromMenuItem = (
  foodName: string,
  unicafeResponse: UnicafeRestaurants
): string[] => {
  const restaurants = getRestaurant();

  const allergens: string[] = [];

  restaurants.forEach((restaurantName) => {
    const restaurantData = unicafeResponse.find(
      (restaurant) => restaurant.title === restaurantName
    );

    const weeklyMenus = restaurantData?.menuData?.menus;

    weeklyMenus?.forEach((dailyMenu) => {
      dailyMenu.data.forEach((foodItem) => {
        if (foodItem.name.toLowerCase() === foodName.toLowerCase()) {
          const itemAllergens = foodItem.meta.allergens;
          if (itemAllergens) {
            itemAllergens.forEach((allergen) => {
              if (!allergens.includes(allergen)) {
                allergens.push(allergen);
              }
            });
          }
        }
      });
    });
  });

  return allergens;
};
