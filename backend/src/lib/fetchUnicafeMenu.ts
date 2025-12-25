import type { UnicafeRestaurants } from "../types/unicafeTypes";

const apiUrl = "https://unicafe.fi/wp-json/swiss/v1/restaurants/?lang=fi";

export const fetchMenu = async () => {
    const response = await fetch(apiUrl);
    const data: UnicafeRestaurants =
        (await response.json()) as UnicafeRestaurants;
    return data;
};
