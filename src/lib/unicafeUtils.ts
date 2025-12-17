import type { UnicafeRestaurants } from '../types/unicafeTypes';
import { fetchMenu } from './fetchUnicafeMenu';

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

const checkIfDateIsPast = (dateString: string): boolean => {
  const today = new Date();

  const formattedDateString = dateString
    .split(' ')
    .slice(1)
    .join(' ')
    .slice(0, -1);
  const dateParts = formattedDateString.split('.');
  const day = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]) - 1; // subtract 1 because months are 0-indexed
  const dateToCheck = new Date(today.getFullYear(), month, day);

  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  return dateToCheck < startOfToday;
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

  // const datesWhenFoodIsAvailableSliced = datesWhenFoodIsAvailable.map((date) =>
  //   // format date to "DD.MM"
  //   date.split(' ').slice(1).join(' ').slice(0, -1)
  // );

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
