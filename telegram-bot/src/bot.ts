import { Bot, Context, GrammyError } from 'grammy';
import { Menu } from '@grammyjs/menu';
import {
  getUserFoods,
  toggleFood,
  addCustomFood,
  removeFood,
  getUserRestaurants,
  toggleRestaurant,
  setRestaurantsBulk,
  ensureDefaultFoods,
  getUserAlertPreference,
  setUserAlertPreference,
  toggleUserAlertPreference,
} from './db';
import {
  CAMPUSES,
  searchTodayFoods,
  formatHitsMessage,
  searchUpcomingFoods,
  formatUpcomingHitsMessage,
  escapeHtml,
} from './unicafe';

// -----------------------------------------------------------------------------
// Checkbox Emojis & Helpers
// -----------------------------------------------------------------------------
export function getCheckboxIcon(enabled: boolean): string {
  return enabled ? '✅' : '⬜';
}

export function getAlertsMenuLabel(enabled: boolean): string {
  return `Aamuilmoitukset (klo 10): ${enabled ? 'Päällä ✅' : 'Pois ⬜'}`;
}

// -----------------------------------------------------------------------------
// 1. Foods Checkbox Menu
// -----------------------------------------------------------------------------
export const foodsMenu = new Menu('foods-menu')
  .dynamic(async (ctx, range) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    const foods = await getUserFoods(chatId);
    for (const food of foods) {
      const icon = getCheckboxIcon(food.enabled);
      range
        .text(`${icon} ${food.name}`, async (c) => {
          const newState = await toggleFood(chatId, food.name);
          await c.answerCallbackQuery({
            text: `${food.name}: ${newState ? 'Valittu' : 'Poistettu'}`,
          });
          c.menu.update();
        })
        .row();
    }
  })
  .text('+ Lisää oma ruoka', async (ctx) => {
    await ctx.reply(
      'Kirjoita komento:\n<code>/addfood &lt;ruoan nimi&gt;</code>\n\n' +
      '<i>Esimerkki:</i> <code>/addfood Lohikeitto</code>\n' +
      '<i>Esimerkki:</i> <code>/addfood Pizza</code>',
      { parse_mode: 'HTML' }
    );
  })
  .row()
  .back('« Takaisin päävalikkoon');

// -----------------------------------------------------------------------------
// 2. Restaurants Campus Menus
// -----------------------------------------------------------------------------
export const restaurantsMenu = new Menu('restaurants-menu');
const campusMenus: Menu[] = [];

for (const campus of CAMPUSES) {
  const menuId = `campus-${campus.id}`;
  const campusMenu = new Menu(menuId)
    .dynamic(async (ctx, range) => {
      const chatId = ctx.chat?.id;
      if (!chatId) return;

      const userRestos = await getUserRestaurants(chatId);
      const enabledSet = new Set(
        userRestos.filter((r) => r.enabled).map((r) => r.name.toLowerCase())
      );

      for (const restaurant of campus.restaurants) {
        const isEnabled = enabledSet.has(restaurant.toLowerCase());
        const icon = getCheckboxIcon(isEnabled);

        range
          .text(`${icon} ${restaurant}`, async (c) => {
            const newState = await toggleRestaurant(chatId, restaurant);
            await c.answerCallbackQuery({
              text: `${restaurant}: ${newState ? 'Valittu' : 'Poistettu'}`,
            });
            c.menu.update();
          })
          .row();
      }
    })
    .text('Valitse kaikki', async (ctx) => {
      const chatId = ctx.chat?.id;
      if (chatId) {
        await setRestaurantsBulk(chatId, campus.restaurants, true);
        await ctx.answerCallbackQuery('Kaikki valittu');
        ctx.menu.update();
      }
    })
    .text('Tyhjennä', async (ctx) => {
      const chatId = ctx.chat?.id;
      if (chatId) {
        await setRestaurantsBulk(chatId, campus.restaurants, false);
        await ctx.answerCallbackQuery('Valinnat tyhjennetty');
        ctx.menu.update();
      }
    })
    .row()
    .back('« Takaisin kampuksiin');

  campusMenus.push(campusMenu);
  restaurantsMenu.submenu(campus.name, menuId).row();
}

restaurantsMenu.back('« Takaisin päävalikkoon');
restaurantsMenu.register(campusMenus);

// -----------------------------------------------------------------------------
// 3. Main Dashboard Menu
// -----------------------------------------------------------------------------
export const mainMenu = new Menu('main-menu')
  .submenu('Lemppariruoat', 'foods-menu')
  .submenu('Ravintolat', 'restaurants-menu')
  .row()
  .text('Tänään', async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    await ctx.answerCallbackQuery('Kysytään backendiltä...');
    await performLunchCheck(ctx, chatId);
  })
  .text('Kaikki ajat', async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    await ctx.answerCallbackQuery('Kysytään backendiltä...');
    await performAllTimeCheck(ctx, chatId);
  })
  .row()
  .dynamic(async (ctx, range) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    const alertsEnabled = await getUserAlertPreference(chatId);
    const label = getAlertsMenuLabel(alertsEnabled);

    range.text(label, async (c) => {
      const newState = await toggleUserAlertPreference(chatId);
      await c.answerCallbackQuery({
        text: `Aamuilmoitukset: ${newState ? 'Päällä' : 'Pois'}`,
      });
      c.menu.update();
    });
  })
  .row()
  .text('Omat valinnat', async (ctx) => {
    const chatId = ctx.chat?.id;
    if (!chatId) return;

    const foods = await getUserFoods(chatId);
    const restos = await getUserRestaurants(chatId);
    const alertsEnabled = await getUserAlertPreference(chatId);

    const activeFoods = foods.filter((f) => f.enabled).map((f) => f.name);
    const activeRestos = restos.filter((r) => r.enabled).map((r) => r.name);

    let summary = '<b>Tilauksesi:</b>\n\n';
    summary += `<b>Ruoat (${activeFoods.length}):</b>\n`;
    summary += activeFoods.length ? activeFoods.map((f) => `• ${f}`).join('\n') : '<i>Ei vielä valittuja ruokia</i>';
    summary += `\n\n<b>Ravintolat (${activeRestos.length}):</b>\n`;
    summary += activeRestos.length ? activeRestos.map((r) => `• ${r}`).join('\n') : '<i>Ei vielä valittuja ravintoloita</i>';
    summary += `\n\n<b>Aamuilmoitukset (klo 10:00):</b> ${alertsEnabled ? 'Päällä' : 'Pois päältä'}`;

    await ctx.reply(summary, { parse_mode: 'HTML' });
  });

mainMenu.register(foodsMenu);
mainMenu.register(restaurantsMenu);

// -----------------------------------------------------------------------------
// 4. Bot Factory & Commands
// -----------------------------------------------------------------------------
export const BOT_COMMANDS = [
  { command: 'start', description: 'Avaa päävalikko' },
  { command: 'foods', description: 'Valitse lempiruoat' },
  { command: 'restaurants', description: 'Valitse ravintolat' },
  { command: 'check', description: 'Tarkista tämän päivän lounas' },
  { command: 'checkall', description: 'Tarkista tulevat lounaat tai hae ruokaa' },
  { command: 'alerts', description: 'Aamuilmoitukset päälle tai pois' },
  { command: 'addfood', description: 'Lisää oma ruoka listalle' },
  { command: 'removefood', description: 'Poista ruoka listalta' },
  { command: 'help', description: 'Näytä ohjeet ja komennot' },
];

export const BOT_COMMANDS_FI = [
  { command: 'start', description: 'Avaa päävalikko' },
  { command: 'foods', description: 'Valitse lempiruoat' },
  { command: 'restaurants', description: 'Valitse ravintolat' },
  { command: 'check', description: 'Tarkista tämän päivän lounas' },
  { command: 'checkall', description: 'Tarkista tulevat lounaat tai hae ruokaa' },
  { command: 'alerts', description: 'Aamuilmoitukset päälle tai pois' },
  { command: 'addfood', description: 'Lisää oma ruoka listalle' },
  { command: 'removefood', description: 'Poista ruoka listalta' },
  { command: 'help', description: 'Näytä ohjeet ja komennot' },
];

export async function setupBotCommands(bot: Bot): Promise<void> {
  try {
    await bot.api.setMyCommands(BOT_COMMANDS);
    await bot.api.setMyCommands(BOT_COMMANDS_FI, { language_code: 'fi' });
    await bot.api.setChatMenuButton({ menu_button: { type: 'commands' } });
    console.log('Telegram bot command picker registered successfully.');
  } catch (err) {
    console.error('Failed to register Telegram bot commands:', err);
  }
}

export function createBot(token: string): Bot {
  const bot = new Bot(token);

  // Global error handler so handler errors do not crash the bot
  bot.catch((err) => {
    console.error(`Error in bot update handler:`, err.error);
  });

  bot.use(mainMenu);

  bot.command('start', async (ctx) => {
    if (ctx.chat?.id) {
      await ensureDefaultFoods(ctx.chat.id);
    }

    const text =
      '<b>Tervetuloa Toiveruoka-bottiin!</b>\n\n' +
      'Tilaa ilmoitukset lempiruoistasi Unicafessa:\n' +
      '1. Valitse lempiruokasi (ruksaa boksit)\n' +
      '2. Valitse suosikkiravintolasi (ruksaa boksit)\n' +
      '3. Joka aamu klo <b>10:00</b> botti tarkistaa listat ja ilmoittaa jos toiveruokaasi on tarjolla!\n' +
      '   (Voit kytkeä aamuilmoituksen päälle tai pois milloin vain päävalikosta tai komennolla /alerts)\n\n' +
      'Voit myös tarkistaa tulevat lounaat milloin vain komennolla <code>/checkall</code> tai hakea tiettyä ruokaa <code>/checkall &lt;ruoka&gt;</code>.\n\n' +
      'Aloita alta valitsemalla lempiruoat ja ravintolat:';

    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: mainMenu });
  });

  bot.command('foods', async (ctx) => {
    if (ctx.chat?.id) {
      await ensureDefaultFoods(ctx.chat.id);
    }
    await ctx.reply('<b>Valitse lempiruokasi (klikkaa vaihtaaksesi):</b>', {
      parse_mode: 'HTML',
      reply_markup: foodsMenu,
    });
  });

  bot.command('restaurants', async (ctx) => {
    await ctx.reply('<b>Valitse ravintolasi:</b>', {
      parse_mode: 'HTML',
      reply_markup: restaurantsMenu,
    });
  });

  bot.command(['alerts', 'tilaus'], async (ctx) => {
    if (!ctx.chat?.id) return;
    const arg = ctx.match?.trim().toLowerCase();

    if (arg === 'on' || arg === 'paalla' || arg === 'päällä' || arg === 'enable' || arg === '1' || arg === 'true') {
      await setUserAlertPreference(ctx.chat.id, true);
      await ctx.reply('Aamuilmoitukset (klo 10:00): <b>Päällä</b>', { parse_mode: 'HTML' });
    } else if (arg === 'off' || arg === 'pois' || arg === 'disable' || arg === '0' || arg === 'false') {
      await setUserAlertPreference(ctx.chat.id, false);
      await ctx.reply('Aamuilmoitukset (klo 10:00): <b>Pois päältä</b>', { parse_mode: 'HTML' });
    } else {
      const newState = await toggleUserAlertPreference(ctx.chat.id);
      await ctx.reply(
        `Aamuilmoitukset (klo 10:00) ovat nyt: <b>${newState ? 'Päällä' : 'Pois päältä'}</b>\n\n` +
        'Voit asettaa tilan myös suoraan:\n<code>/alerts on</code> tai <code>/alerts off</code>',
        { parse_mode: 'HTML' }
      );
    }
  });

  bot.command('subscribe', async (ctx) => {
    if (!ctx.chat?.id) return;
    await setUserAlertPreference(ctx.chat.id, true);
    await ctx.reply('Aamuilmoitukset (klo 10:00): <b>Päällä</b>', { parse_mode: 'HTML' });
  });

  bot.command('unsubscribe', async (ctx) => {
    if (!ctx.chat?.id) return;
    await setUserAlertPreference(ctx.chat.id, false);
    await ctx.reply('Aamuilmoitukset (klo 10:00): <b>Pois päältä</b>', { parse_mode: 'HTML' });
  });

  bot.command('check', async (ctx) => {
    if (ctx.chat?.id) {
      await performLunchCheck(ctx, ctx.chat.id);
    }
  });

  bot.command(['checkall', 'alltime', 'search'], async (ctx) => {
    if (ctx.chat?.id) {
      await performAllTimeCheck(ctx, ctx.chat.id, ctx.match);
    }
  });

  bot.command('addfood', async (ctx) => {
    const food = ctx.match?.trim();
    if (!food) {
      await ctx.reply('Anna ruoan nimi: <code>/addfood Lohikeitto</code>', { parse_mode: 'HTML' });
      return;
    }
    if (ctx.chat?.id) {
      await addCustomFood(ctx.chat.id, food);
      await ctx.reply(`Lisätty <b>${food}</b> listallesi!`, { parse_mode: 'HTML' });
    }
  });

  bot.command('removefood', async (ctx) => {
    const food = ctx.match?.trim();
    if (!food) {
      await ctx.reply('Anna poistettavan ruoan nimi: <code>/removefood Kalapuikot</code>', { parse_mode: 'HTML' });
      return;
    }
    if (ctx.chat?.id) {
      await removeFood(ctx.chat.id, food);
      await ctx.reply(`Poistettu <b>${food}</b> listaltasi.`, { parse_mode: 'HTML' });
    }
  });

  bot.command('help', async (ctx) => {
    const text =
      '<b>Toiveruoka Bot komennot:</b>\n\n' +
      '/start - Päävalikko\n' +
      '/foods - Valitse lempiruoat\n' +
      '/restaurants - Valitse ravintolat\n' +
      '/check - Tarkista tämän päivän tilanne heti\n' +
      '/checkall [ruoka] - Tarkista kaikki tulevat päivät tai hae ruokaa\n' +
      '/alerts [on/off] - Kytke aamuilmoitukset (klo 10:00) päälle tai pois\n' +
      '/addfood &lt;nimi&gt; - Lisää oma ruoka listalle\n' +
      '/removefood &lt;nimi&gt; - Poista ruoka listalta\n' +
      '/help - Apua\n\n' +
      'Voit käyttää myös <code>/alltime</code> tai <code>/search</code> ruokien etsimiseen.\n' +
      'Joka aamu klo 10:00 botti tarkistaa päivän lounaat ja ilmoittaa toiveruoista tilaajille!';
    await ctx.reply(text, { parse_mode: 'HTML' });
  });

  return bot;
}

export async function replySplitMessage(ctx: Context, fullText: string): Promise<void> {
  const MAX_LENGTH = 4000;
  if (fullText.length <= MAX_LENGTH) {
    await ctx.reply(fullText, { parse_mode: 'HTML' });
    return;
  }

  const sections = fullText.split('\n\n');
  let currentChunk = '';

  for (const section of sections) {
    if (currentChunk.length + section.length + 2 > MAX_LENGTH) {
      if (currentChunk.trim().length > 0) {
        await ctx.reply(currentChunk.trim(), { parse_mode: 'HTML' });
        currentChunk = '';
      }
      if (section.length > MAX_LENGTH) {
        const lines = section.split('\n');
        for (const line of lines) {
          if (currentChunk.length + line.length + 1 > MAX_LENGTH) {
            await ctx.reply(currentChunk.trim(), { parse_mode: 'HTML' });
            currentChunk = '';
          }
          currentChunk += (currentChunk ? '\n' : '') + line;
        }
      } else {
        currentChunk = section;
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + section;
    }
  }

  if (currentChunk.trim().length > 0) {
    await ctx.reply(currentChunk.trim(), { parse_mode: 'HTML' });
  }
}

export async function performLunchCheck(ctx: Context, chatId: number): Promise<void> {
  const foods = await getUserFoods(chatId);
  const restos = await getUserRestaurants(chatId);

  const activeFoods = foods.filter((f) => f.enabled).map((f) => f.name);
  const activeRestos = restos.filter((r) => r.enabled).map((r) => r.name);

  if (activeFoods.length === 0) {
    await ctx.reply('Et ole valinnut vielä yhtään ruokaa! Avaa /foods ja valitse mieleisesi.');
    return;
  }
  if (activeRestos.length === 0) {
    await ctx.reply('Et ole valinnut vielä yhtään ravintolaa! Avaa /restaurants ja valitse suosikkisi.');
    return;
  }

  try {
    const hits = await searchTodayFoods(activeFoods, activeRestos);
    const msg = formatHitsMessage(hits, '<b>Tämän päivän lounashitit:</b>');
    await ctx.reply(msg, { parse_mode: 'HTML' });
  } catch {
    await ctx.reply('Menujen haku backend-rajapinnasta epäonnistui. Yritä hetken kuluttua uudelleen.');
  }
}

export async function performAllTimeCheck(
  ctx: Context,
  chatId: number,
  searchQuery?: string
): Promise<void> {
  const query = searchQuery?.trim();
  const restos = await getUserRestaurants(chatId);
  const activeRestos = restos.filter((r) => r.enabled).map((r) => r.name);

  if (activeRestos.length === 0) {
    await ctx.reply(
      'Et ole valinnut vielä yhtään ravintolaa! Avaa /restaurants ja valitse suosikkisi.',
      { parse_mode: 'HTML' }
    );
    return;
  }

  // If a specific food query is supplied (e.g. /checkall <ruoka>)
  if (query) {
    try {
      const hits = await searchUpcomingFoods([query], activeRestos);
      const title = `<b>Tulokset ruoalle "${escapeHtml(query)}" valituissa ravintoloissasi:</b>`;
      const emptyMsg = `Ei tulevia tarjoiluita ruoalle "<b>${escapeHtml(query)}</b>" valituissa ravintoloissasi.`;
      const msg = formatUpcomingHitsMessage(hits, title, emptyMsg);
      await replySplitMessage(ctx, msg);
    } catch {
      await ctx.reply('Menujen haku backend-rajapinnasta epäonnistui. Yritä hetken kuluttua uudelleen.');
    }
    return;
  }

  // Otherwise, check all user's subscribed favorite foods
  const foods = await getUserFoods(chatId);
  const activeFoods = foods.filter((f) => f.enabled).map((f) => f.name);

  if (activeFoods.length === 0) {
    await ctx.reply(
      'Et ole valinnut vielä yhtään ruokaa! Avaa /foods ja valitse mieleisesi, tai hae suoraan komennolla:\n<code>/checkall &lt;ruoan nimi&gt;</code>',
      { parse_mode: 'HTML' }
    );
    return;
  }

  try {
    const hits = await searchUpcomingFoods(activeFoods, activeRestos);
    const title = '<b>Kaikki tulevat toiveruoat valituissa ravintoloissasi:</b>';
    const emptyMsg = 'Ei tulevia toiveruokia valituissa ravintoloissasi.';
    const msg = formatUpcomingHitsMessage(hits, title, emptyMsg);
    await replySplitMessage(ctx, msg);
  } catch {
    await ctx.reply('Menujen haku backend-rajapinnasta epäonnistui. Yritä hetken kuluttua uudelleen.');
  }
}

// -----------------------------------------------------------------------------
// 5. Bot Runner with Auto-Restart on 409 Conflict
// -----------------------------------------------------------------------------
export interface BotRunnerOptions {
  initialRetryDelayMs?: number;
  maxRetryDelayMs?: number;
  backoffFactor?: number;
  signal?: AbortSignal;
  onConflict?: (err: unknown, delayMs: number) => void;
}

/**
 * Starts the bot with automatic polling restarts if a 409 Conflict error occurs.
 * Telegram throws 409 Conflict when another getUpdates connection is opened with the same token
 * (for example, if the same bot token is run locally while production is also running).
 */
export async function startBotWithRetry(
  bot: Bot,
  options?: BotRunnerOptions
): Promise<void> {
  const initialDelay = options?.initialRetryDelayMs ?? 5000;
  const maxDelay = options?.maxRetryDelayMs ?? 30000;
  const backoffFactor = options?.backoffFactor ?? 1.5;
  const signal = options?.signal;

  let currentDelay = initialDelay;

  while (!signal?.aborted) {
    try {
      console.log('Bot is running and listening for Telegram updates...');
      await bot.start({
        onStart: () => {
          // Reset retry delay once polling has successfully started
          currentDelay = initialDelay;
        },
      });
      // Normal exit when bot.stop() is called
      break;
    } catch (err: any) {
      if (signal?.aborted) break;

      const isConflict =
        (err instanceof GrammyError && err.error_code === 409) ||
        err?.error_code === 409 ||
        (typeof err?.description === 'string' && err.description.includes('Conflict')) ||
        (typeof err?.message === 'string' && err.message.includes('409'));

      if (isConflict) {
        if (options?.onConflict) {
          options.onConflict(err, currentDelay);
        } else {
          console.warn(
            '\n[Bot] Conflict (409): getUpdates terminated by another instance running with the same token.'
          );
          console.warn(
            '[Bot] Note: Telegram only allows ONE running bot instance per token.'
          );
          console.warn(
            `[Bot] Restarting bot in ${(currentDelay / 1000).toFixed(1)}s... (Ensure local dev or duplicate instances are stopped)\n`
          );
        }

        // Wait with abort signal support
        await new Promise<void>((resolve) => {
          if (signal?.aborted) return resolve();
          const timer = setTimeout(() => {
            signal?.removeEventListener('abort', onAbort);
            resolve();
          }, currentDelay);
          const onAbort = () => {
            clearTimeout(timer);
            signal?.removeEventListener('abort', onAbort);
            resolve();
          };
          signal?.addEventListener('abort', onAbort);
        });

        currentDelay = Math.min(Math.round(currentDelay * backoffFactor), maxDelay);
        continue;
      }

      // Rethrow any non-conflict error (e.g. 401 Unauthorized or uncaught exception)
      throw err;
    }
  }
}

