/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { checkIfDateIsPast } from './unicafe.utils';
import { getAllergensFromFoodItem } from './unicafe.utils';
import { MenuItem } from '../types/unicafeTypes';

const baseDate = new Date(Date.UTC(2025, 0, 1, 12, 0, 0));

describe('checkIfDateIsPast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(baseDate);
  });

  it('returns true for a date before today', () => {
    expect(checkIfDateIsPast('Ti 31.12.')).toBe(true);
  });

  it('returns false for today', () => {
    expect(checkIfDateIsPast('Ke 1.1.')).toBe(false);
  });

  it('return true for today with DD.MM format', () => {
    expect(checkIfDateIsPast('Ke 01.01.')).toBe(false);
  });

  it('returns false for a future date', () => {
    expect(checkIfDateIsPast('To 2.1.')).toBe(false);
  });

  it('returns false for a future date with DD.MM format', () => {
    expect(checkIfDateIsPast('To 02.01.')).toBe(false);
  });
});

describe('getAllergensFromFoodItem', () => {
  it('returns an empty array when foodItem has no meta property', () => {
    const foodItem: MenuItem = {
      name: 'Food Item',
      ingredients: 'ingredient1, ingredient2',
      nutrition: 'nutrition info',
      meta: {},
      price: { value: {}, name: 'price' },
    };

    expect(getAllergensFromFoodItem(foodItem)).toEqual([]);
  });

  it('returns an empty array when meta[1] is undefined', () => {
    const foodItem: MenuItem = {
      name: 'Food Item',
      ingredients: 'ingredient1, ingredient2',
      nutrition: 'nutrition info',
      meta: { 0: ['dietary'] },
      price: { value: {}, name: 'price' },
    };

    expect(getAllergensFromFoodItem(foodItem)).toEqual([]);
  });

  it('returns an empty array when meta[1] is not an array', () => {
    const foodItem: MenuItem = {
      name: 'Food Item',
      ingredients: 'ingredient1, ingredient2',
      nutrition: 'nutrition info',
      meta: { 1: 'not an array' as any },
      price: { value: {}, name: 'price' },
    };

    expect(getAllergensFromFoodItem(foodItem)).toEqual([]);
  });

  it('returns allergens from meta[1]', () => {
    const foodItem: MenuItem = {
      name: 'Food Item',
      ingredients: 'ingredient1, ingredient2',
      nutrition: 'nutrition info',
      meta: { 1: ['pähkinät', 'liha'] },
      price: { value: {}, name: 'price' },
    };

    expect(getAllergensFromFoodItem(foodItem)).toEqual(['pähkinät', 'liha']);
  });

  it('returns unique allergens without duplicates', () => {
    const foodItem: MenuItem = {
      name: 'Food Item',
      ingredients: 'ingredient1, ingredient2',
      nutrition: 'nutrition info',
      meta: { 1: ['liha', 'pähkinät', 'liha', 'maito'] },
      price: { value: {}, name: 'price' },
    };

    expect(getAllergensFromFoodItem(foodItem)).toEqual([
      'liha',
      'pähkinät',
      'maito',
    ]);
  });

  it('returns allergens from meta[1] even when other meta properties exist', () => {
    const foodItem: MenuItem = {
      name: 'Food Item',
      ingredients: 'ingredient1, ingredient2',
      nutrition: 'nutrition info',
      meta: {
        0: ['Veg', 'KELA'],
        1: ['soijapavut', 'pähkinät'],
        2: ['Ilmastovalinta'],
      },
      price: { value: {}, name: 'price' },
    };

    expect(getAllergensFromFoodItem(foodItem)).toEqual([
      'soijapavut',
      'pähkinät',
    ]);
  });

  it('returns an empty array when meta[1] is an empty array', () => {
    const foodItem: MenuItem = {
      name: 'Food Item',
      ingredients: 'ingredient1, ingredient2',
      nutrition: 'nutrition info',
      meta: { 1: [] },
      price: { value: {}, name: 'price' },
    };

    expect(getAllergensFromFoodItem(foodItem)).toEqual([]);
  });
});
