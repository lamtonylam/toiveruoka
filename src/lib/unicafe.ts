import type { UnicafeRestaurants } from '../types/unicafeTypes';
import { fetchMenu } from './fetchUnicafeMenu';
import { checkIfDateIsPast } from './unicafe.utils';

const getRestaurant = () => {
  const viikkiRestaurants = [
    'Tähkä',
    'Infokeskus alakerta',
    'Viikuna',
    'Infokeskus',
    'Biokeskus',
  ];
  const keskustaRestaurants = [
    'Myöhä Café & Bar',
    'Kaivopiha',
    'Kaisa-talo',
    'Soc&Kom',
    'Rotunda',
    'Porthania',
    'Topelias',
    'Olivia',
    'Metsätalo',
    'Cafe Portaali',
  ];

  const kumpulaRestaurants = ['Physicum', 'Exactum', 'Chemicum'];

  const meilahtiRestaurants = ['Meilahti'];

  const restaurants = [
    ...viikkiRestaurants,
    ...keskustaRestaurants,
    ...kumpulaRestaurants,
    ...meilahtiRestaurants,
  ];

  return restaurants;
};

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
      if (foodItem.name.includes(searchedFood)) {
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
    [restaurantName: string]: [dateString: string, food: string][];
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
      ]);
    }
  });

  return foodAvailability;
};

void (async () => {
  console.log(checkFoodInAllRestaurants('kebab', await fetchMenu()));
})();
