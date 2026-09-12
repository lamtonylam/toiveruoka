import { jest } from '@jest/globals';
import {
  BOT_COMMANDS,
  BOT_COMMANDS_FI,
  BOT_COMMANDS_EN,
  setupBotCommands,
  replySplitMessage,
} from './bot';
import { Bot, Context } from 'grammy';

describe('Bot Commands Configuration', () => {
  const telegramCommandRegex = /^[a-z0-9_]{1,32}$/;

  it('validates default bot commands conform to Telegram rules', () => {
    expect(BOT_COMMANDS.length).toBeGreaterThan(0);
    for (const cmd of BOT_COMMANDS) {
      expect(cmd.command).toMatch(telegramCommandRegex);
      expect(cmd.description.length).toBeGreaterThanOrEqual(1);
      expect(cmd.description.length).toBeLessThanOrEqual(256);
    }
  });

  it('validates Finnish bot commands conform to Telegram rules', () => {
    expect(BOT_COMMANDS_FI.length).toBe(BOT_COMMANDS.length);
    for (const cmd of BOT_COMMANDS_FI) {
      expect(cmd.command).toMatch(telegramCommandRegex);
      expect(cmd.description.length).toBeGreaterThanOrEqual(1);
      expect(cmd.description.length).toBeLessThanOrEqual(256);
    }
  });

  it('validates English bot commands conform to Telegram rules', () => {
    expect(BOT_COMMANDS_EN.length).toBe(BOT_COMMANDS.length);
    for (const cmd of BOT_COMMANDS_EN) {
      expect(cmd.command).toMatch(telegramCommandRegex);
      expect(cmd.description.length).toBeGreaterThanOrEqual(1);
      expect(cmd.description.length).toBeLessThanOrEqual(256);
    }
  });

  it('contains all core commands in the command picker', () => {
    const expected = ['start', 'foods', 'restaurants', 'check', 'checkall', 'alerts', 'addfood', 'removefood', 'help'];
    const actual = BOT_COMMANDS.map((c) => c.command);
    expect(actual).toEqual(expected);
  });

  it('calls setMyCommands and setChatMenuButton on setupBotCommands', async () => {
    const setMyCommandsMock = jest.fn<() => Promise<boolean>>().mockResolvedValue(true);
    const setChatMenuButtonMock = jest.fn<() => Promise<boolean>>().mockResolvedValue(true);

    const fakeBot = {
      api: {
        setMyCommands: setMyCommandsMock,
        setChatMenuButton: setChatMenuButtonMock,
      },
    } as unknown as Bot;

    await setupBotCommands(fakeBot);

    expect(setMyCommandsMock).toHaveBeenCalledTimes(3);
    expect(setMyCommandsMock).toHaveBeenCalledWith(BOT_COMMANDS);
    expect(setMyCommandsMock).toHaveBeenCalledWith(BOT_COMMANDS_FI, { language_code: 'fi' });
    expect(setMyCommandsMock).toHaveBeenCalledWith(BOT_COMMANDS_EN, { language_code: 'en' });
    expect(setChatMenuButtonMock).toHaveBeenCalledWith({ menu_button: { type: 'commands' } });
  });
});

describe('replySplitMessage', () => {
  it('sends single message when content is within limit', async () => {
    const replyMock = jest.fn<any>().mockResolvedValue({});
    const fakeCtx = { reply: replyMock } as unknown as Context;

    await replySplitMessage(fakeCtx, 'Hello world');
    expect(replyMock).toHaveBeenCalledTimes(1);
    expect(replyMock).toHaveBeenCalledWith('Hello world', { parse_mode: 'HTML' });
  });

  it('splits long content exceeding 4000 characters into multiple messages', async () => {
    const replyMock = jest.fn<any>().mockResolvedValue({});
    const fakeCtx = { reply: replyMock } as unknown as Context;

    const block1 = 'A'.repeat(2500);
    const block2 = 'B'.repeat(2500);
    const longMessage = `${block1}\n\n${block2}`;

    await replySplitMessage(fakeCtx, longMessage);
    expect(replyMock).toHaveBeenCalledTimes(2);
    expect(replyMock).toHaveBeenNthCalledWith(1, block1, { parse_mode: 'HTML' });
    expect(replyMock).toHaveBeenNthCalledWith(2, block2, { parse_mode: 'HTML' });
  });
});

import {
  prisma,
  getUserAlertPreference,
  setUserAlertPreference,
  toggleUserAlertPreference,
  getAllSubscribers,
} from './db';

describe('Alert Preferences & Subscriber Filtering', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('getUserAlertPreference defaults to true when no row exists', async () => {
    jest.spyOn(prisma.userPreference, 'findUnique').mockResolvedValue(null as any);

    const pref = await getUserAlertPreference(123456);
    expect(pref).toBe(true);
    expect(prisma.userPreference.findUnique).toHaveBeenCalledWith({
      where: { chatId: BigInt(123456) },
    });
  });

  it('getUserAlertPreference returns false when preference is disabled', async () => {
    jest.spyOn(prisma.userPreference, 'findUnique').mockResolvedValue({
      chatId: BigInt(123456),
      alertsEnabled: false,
    } as any);

    const pref = await getUserAlertPreference(123456);
    expect(pref).toBe(false);
  });

  it('setUserAlertPreference upserts and returns state', async () => {
    jest.spyOn(prisma.userPreference, 'upsert').mockResolvedValue({
      chatId: BigInt(123456),
      alertsEnabled: false,
    } as any);

    const res = await setUserAlertPreference(123456, false);
    expect(res).toBe(false);
    expect(prisma.userPreference.upsert).toHaveBeenCalledWith({
      where: { chatId: BigInt(123456) },
      create: { chatId: BigInt(123456), alertsEnabled: false },
      update: { alertsEnabled: false },
    });
  });

  it('toggleUserAlertPreference toggles boolean value', async () => {
    jest.spyOn(prisma.userPreference, 'findUnique').mockResolvedValue({
      chatId: BigInt(123456),
      alertsEnabled: true,
    } as any);
    jest.spyOn(prisma.userPreference, 'upsert').mockResolvedValue({
      chatId: BigInt(123456),
      alertsEnabled: false,
    } as any);

    const newState = await toggleUserAlertPreference(123456);
    expect(newState).toBe(false);
  });

  it('getAllSubscribers excludes users who have opted out of alerts', async () => {
    // User 100 has opted out (alertsEnabled: false)
    // User 200 has alerts enabled
    jest.spyOn(prisma.userPreference, 'findMany').mockResolvedValue([
      { chatId: BigInt(100), alertsEnabled: false },
    ] as any);

    jest.spyOn(prisma.foodSubscription, 'findMany').mockResolvedValue([
      { chatId: BigInt(100), foodName: 'Lohikeitto', enabled: true },
      { chatId: BigInt(200), foodName: 'Pizza', enabled: true },
    ] as any);

    jest.spyOn(prisma.restaurantSubscription, 'findMany').mockResolvedValue([
      { chatId: BigInt(100), restaurantName: 'Exactum', enabled: true },
      { chatId: BigInt(200), restaurantName: 'Chemicum', enabled: true },
    ] as any);

    const subscribers = await getAllSubscribers();

    expect(subscribers.length).toBe(1);
    expect(subscribers[0].chatId).toBe(200);
    expect(subscribers[0].foods).toEqual(['Pizza']);
    expect(subscribers[0].restaurants).toEqual(['Chemicum']);
  });
});



