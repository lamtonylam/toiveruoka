import type { UnicafeRestaurants } from '../types/unicafeTypes';

export const checkIfFoodIsInWeekOfRestaurant = (
  searchedFood: string,
  restaurantName: string,
  response: UnicafeRestaurants
) => {
  const datesWhenFoodIsAvailable: string[] = [];

  const restaurantData = response.find(
    (restaurant) => restaurant.title === restaurantName
  );

  const weeklyMenus = restaurantData?.menuData?.menus;

  weeklyMenus?.forEach((dailyMenu) => {
    const date = dailyMenu.date;
    dailyMenu.data.forEach((foodItem) => {
      if (foodItem.name.includes(searchedFood)) {
        datesWhenFoodIsAvailable.push(date);
      }
    });
  });

  return datesWhenFoodIsAvailable.map((date) =>
    // format date to "DD.MM"
    date.split(' ').slice(1).join(' ').slice(0, -1)
  );
};
