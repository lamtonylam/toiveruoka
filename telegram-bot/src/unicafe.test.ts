import {
  isToday,
  searchTodayFoods,
  formatHitsMessage,
  getBackendUrl,
  searchUpcomingFoods,
  formatUpcomingHitsMessage,
} from './unicafe';

describe('Backend API search helper', () => {
  it('identifies today date string', () => {
    const target = new Date(2026, 8, 12); // 12.9.
    expect(isToday('La 12.09.', target)).toBe(true);
    expect(isToday('Ma 12.9.', target)).toBe(true);
    expect(isToday('Ke 15.09.', target)).toBe(false);
  });

  it('normalizes backend URL with or without trailing slash', () => {
    const originalEnv = process.env.BACKEND_URL;
    try {
      process.env.BACKEND_URL = 'http://backend:3000/';
      expect(getBackendUrl()).toBe('http://backend:3000');

      process.env.BACKEND_URL = 'http://backend:3000///';
      expect(getBackendUrl()).toBe('http://backend:3000');

      process.env.BACKEND_URL = 'http://backend:3000';
      expect(getBackendUrl()).toBe('http://backend:3000');

      process.env.BACKEND_URL = '  http://localhost:3000/  ';
      expect(getBackendUrl()).toBe('http://localhost:3000');
    } finally {
      process.env.BACKEND_URL = originalEnv;
    }
  });

  it('finds matching foods for today in selected restaurants using backend format', async () => {
    // Mock backend response: { [resto]: [ [date, foodName, allergens], ... ] }
    const mockFetcher = async (food: string): Promise<Record<string, [string, string, string][]>> => {
      if (food === 'kalapalat') {
        return {
          Exactum: [
            ['Ma 15.09.', 'Rapeat kalapalat ja perunamuusi', 'kala, maito'],
          ],
          Kaivopiha: [
            ['Ti 16.09.', 'Rapeat kalapalat', 'kala'],
          ],
        };
      }
      return {};
    };

    const target = new Date(2026, 8, 15);
    // User subscribes to kalapalat and frequents only Exactum
    const hits = await searchTodayFoods(['kalapalat'], ['Exactum'], target, mockFetcher);

    expect(hits.length).toBe(1);
    expect(hits[0].restaurantName).toBe('Exactum');
    expect(hits[0].dishName).toBe('Rapeat kalapalat ja perunamuusi');
    expect(hits[0].allergens).toBe('kala, maito');
  });

  it('formats hits message nicely', () => {
    const msg = formatHitsMessage([
      {
        foodKeyword: 'kalapalat',
        restaurantName: 'Exactum',
        dishName: 'Rapeat kalapalat',
        allergens: 'G, L',
      },
    ]);

    expect(msg).toContain('Exactum');
    expect(msg).toContain('Rapeat kalapalat');
    expect(msg).toContain('(G, L)');
  });

  it('finds all upcoming matching foods across selected restaurants', async () => {
    const mockFetcher = async (food: string): Promise<Record<string, [string, string, string][]>> => {
      if (food === 'pizza') {
        return {
          Exactum: [
            ['Ma 15.09.', 'Pizza Margherita', 'G, VL'],
            ['Ke 17.09.', 'Pizza Bolognese', 'G, L'],
          ],
          Kaivopiha: [
            ['Ti 16.09.', 'Pizza Pepperoni', 'G, L'],
          ],
          Chemicum: [
            ['To 18.09.', 'Pizza Quattro Formaggi', 'G, L'],
          ],
        };
      }
      return {};
    };

    // Filter to Exactum and Kaivopiha only
    const hits = await searchUpcomingFoods(['pizza'], ['Exactum', 'Kaivopiha'], mockFetcher);

    expect(hits.length).toBe(3);
    expect(hits.map((h) => h.dishName)).toEqual([
      'Pizza Margherita',
      'Pizza Bolognese',
      'Pizza Pepperoni',
    ]);
  });

  it('searches all restaurants when no restaurant filter is specified', async () => {
    const mockFetcher = async (food: string): Promise<Record<string, [string, string, string][]>> => {
      if (food === 'keitto') {
        return {
          Exactum: [['Ma 15.09.', 'Lohikeitto', 'kala, maito']],
          Chemicum: [['Ti 16.09.', 'Hernekeitto', 'M']],
        };
      }
      return {};
    };

    const hits = await searchUpcomingFoods(['keitto'], undefined, mockFetcher);
    expect(hits.length).toBe(2);
    expect(hits[0].restaurantName).toBe('Exactum');
    expect(hits[1].restaurantName).toBe('Chemicum');
  });

  it('deduplicates identical food items from multiple matching keywords', async () => {
    const mockFetcher = async (food: string): Promise<Record<string, [string, string, string][]>> => {
      // Both 'kala' and 'kalapuikot' match the exact same dish
      return {
        Chemicum: [['Ma 15.09.', 'Rapeat kalapuikot', 'kala']],
      };
    };

    const hits = await searchUpcomingFoods(['kala', 'kalapuikot'], ['Chemicum'], mockFetcher);
    expect(hits.length).toBe(1);
    expect(hits[0].dishName).toBe('Rapeat kalapuikot');
  });

  it('formats upcoming hits message grouped by restaurant', () => {
    const hits = [
      {
        foodKeyword: 'kalapuikot',
        restaurantName: 'Chemicum',
        date: 'Ma 15.09.',
        dishName: 'Kalapuikot ja muusi',
        allergens: 'kala, L',
      },
      {
        foodKeyword: 'pizza',
        restaurantName: 'Exactum',
        date: 'Ti 16.09.',
        dishName: 'Pizza Margherita',
        allergens: '',
      },
    ];

    const formatted = formatUpcomingHitsMessage(hits);
    expect(formatted).toContain('<b>Chemicum</b>');
    expect(formatted).toContain('• <b>Ma 15.09.</b>: Kalapuikot ja muusi <i>(kala, L)</i>');
    expect(formatted).toContain('<b>Exactum</b>');
    expect(formatted).toContain('• <b>Ti 16.09.</b>: Pizza Margherita');
    expect(formatted).toContain('Hyvää ruokahalua!');
  });

  it('returns empty message when no upcoming hits are found', () => {
    const formatted = formatUpcomingHitsMessage([], 'Title', 'Ei mitään tulevaa');
    expect(formatted).toBe('Ei mitään tulevaa');
  });

  it('orders upcoming dishes chronologically under each restaurant', () => {
    const hits = [
      {
        foodKeyword: 'makaroni',
        restaurantName: 'Chemicum',
        date: 'To 17.09.',
        dishName: 'Makaronilaatikko',
        allergens: '',
      },
      {
        foodKeyword: 'tofu',
        restaurantName: 'Chemicum',
        date: 'Ma 14.09.',
        dishName: 'Tofu Palak',
        allergens: '',
      },
    ];

    const formatted = formatUpcomingHitsMessage(hits);
    const maIndex = formatted.indexOf('Ma 14.09.');
    const toIndex = formatted.indexOf('To 17.09.');
    expect(maIndex).toBeLessThan(toIndex);
  });
});

