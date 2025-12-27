export const getRestaurant = () => {
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
