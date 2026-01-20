import type { UnicafeRestaurants } from '../types/unicafeTypes';
import { checkIfDateIsPast, getAllergensFromMenuItem } from './unicafe.utils';
import { getRestaurant } from './restaurants';

export const checkIfFoodIsInWeekOfRestaurant = (
  searchedFood: string,
  restaurantName: string,
  response: UnicafeRestaurants
) => {
  const datesWhenFoodIsAvailable: string[] = [];
  const foodNames: string[] = [];

  const restaurantData = response.find(
    (restaurant) => restaurant.title === restaurantName
  );

  const weeklyMenus = restaurantData?.menuData?.menus;

  weeklyMenus?.forEach((dailyMenu) => {
    const date = dailyMenu.date;
    dailyMenu.data.forEach((foodItem) => {
      if (foodItem.name.toLowerCase().includes(searchedFood.toLowerCase())) {
        if (checkIfDateIsPast(date)) {
          return;
        }
        datesWhenFoodIsAvailable.push(date);
        foodNames.push(foodItem.name);
      }
    });
  });

  return [datesWhenFoodIsAvailable, foodNames];
};

export const checkFoodInAllRestaurants = (
  searchedFood: string,
  response: UnicafeRestaurants
) => {
  const foodAvailability: {
    [restaurantName: string]: [
      dateString: string,
      food: string,
      allergens: string,
    ][];
  } = {};

  const restaurants = getRestaurant();

  restaurants.forEach((restaurantName) => {
    const [dates, foodNames] = checkIfFoodIsInWeekOfRestaurant(
      searchedFood,
      restaurantName,
      response
    );
    if (dates.length > 0) {
      foodAvailability[restaurantName] = dates.map((date, index) => [
        date,
        foodNames[index],
        getAllergensFromMenuItem(
          foodNames[index],
          response,
          restaurantName
        ).join(', '),
      ]);
    }
  });

  return foodAvailability;
};
