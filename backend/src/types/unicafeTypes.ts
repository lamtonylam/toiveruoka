export interface VisitingHoursItem {
  label: string;
  hours: string;
  closedException?: boolean;
  exception?: boolean;
}

export interface VisitingHoursSection {
  name: string | null;
  items: VisitingHoursItem[];
}

export interface VisitingHours {
  business?: VisitingHoursSection;
  breakfast?: VisitingHoursSection | boolean;
  bistro?: VisitingHoursSection | boolean;
  lounas?: VisitingHoursSection | boolean;
}

export interface PriceValue {
  [key: string]: string;
}

export interface Price {
  value: PriceValue | PriceValue[];
  name: string;
}

export interface Nutrition {
  [key: string]: string;
}

export interface MenuMeta {
  dietaryLabels?: string[]; // Dietary labels (e.g., "G", "KELA", "Veg")
  allergens?: string[]; // Allergens/Ingredients (e.g., "soijapavut")
  otherInfo?: string[]; // Other info (e.g., "Ilmastovalinta")
}

export interface MenuItem {
  name: string;
  ingredients: string;
  nutrition: string;
  meta: MenuMeta;
  price: Price;
}

export interface MenuDay {
  date: string;
  message: string | null;
  data: MenuItem[];
}

export interface MenuData {
  email: string | null;
  phone: string | null;
  address: string;
  feedback_address: string;
  description: string;
  visitingHours: VisitingHours;
  menus: MenuDay[];
  id: number;
  name: string;
  areacode: number;
}

export interface LocationItem {
  id: number;
  name: string;
}

export interface Restaurant {
  id: number;
  title: string;
  slug: string;
  permalink: string;
  location: LocationItem[];
  address: string;
  visitingHours: string;
  blocksHtml: string;
  menuData: MenuData;
}

export type UnicafeRestaurants = Restaurant[];
