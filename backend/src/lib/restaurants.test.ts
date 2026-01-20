import { getRestaurant } from './restaurants';

describe('getRestaurant', () => {
  it('should return an array of restaurants', () => {
    const result = getRestaurant();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should include all viikki restaurants', () => {
    const result = getRestaurant();
    expect(result).toContain('Tähkä');
    expect(result).toContain('Infokeskus alakerta');
    expect(result).toContain('Viikuna');
    expect(result).toContain('Infokeskus');
    expect(result).toContain('Biokeskus');
  });

  it('should include all keskusta restaurants', () => {
    const result = getRestaurant();
    expect(result).toContain('Myöhä Café & Bar');
    expect(result).toContain('Kaivopiha');
    expect(result).toContain('Kaisa-talo');
    expect(result).toContain('Soc&Kom');
    expect(result).toContain('Rotunda');
    expect(result).toContain('Porthania');
    expect(result).toContain('Topelias');
    expect(result).toContain('Olivia');
    expect(result).toContain('Metsätalo');
    expect(result).toContain('Cafe Portaali');
  });

  it('should include all kumpula restaurants', () => {
    const result = getRestaurant();
    expect(result).toContain('Physicum');
    expect(result).toContain('Exactum');
    expect(result).toContain('Chemicum');
  });

  it('should include meilahti restaurant', () => {
    const result = getRestaurant();
    expect(result).toContain('Meilahti');
  });

  it('should return 19 restaurants', () => {
    const result = getRestaurant();
    expect(result).toHaveLength(19);
  });
});
