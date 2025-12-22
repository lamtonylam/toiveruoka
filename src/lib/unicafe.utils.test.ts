import { checkIfDateIsPast } from './unicafe.utils';

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
