require("dotenv").config();

const express = require("express");
const {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionsBitField,
  ChannelType,
  SlashCommandBuilder,
  MessageFlags,
  REST,
  Routes,
  UserSelectMenuBuilder,
  AuditLogEvent
} = require("discord.js");

// ======================================================
// RENDER HEALTH SERVER
// ======================================================

const app = express();
const PORT = process.env.PORT || 3000;

function isFeatureEnabled() {
  return true;
}

app.get("/", (req, res) => {
  res.status(200).send("VIBE Bot ist online.");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "online",
    service: "VIBE Bot"
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Health-Webserver läuft auf Port ${PORT}`);
});

// ======================================================
// KONFIGURATION
// ======================================================

const TOKEN = process.env.TOKEN;

const CLIENT_ID =
  "1534585700408889466";

const GUILD_ID =
  "1540814913222746112";

// ======================================================
// WELCOME
// ======================================================

const WELCOME_CHANNEL_ID =
  "1540814913755156532";

// ======================================================
// STAFF
// ======================================================

const STAFF_ROLE_ID =
  "1540814913243586708";

// ======================================================
// SUPPORT
// ======================================================

const SUPPORT_ROLE_ID =
  STAFF_ROLE_ID;

const SUPPORT_WARTE_RAUM_ID =
  "1540814913985970306";

const SUPPORT_LOG_CHANNEL_ID =
  "1540814913985970305";

// ======================================================
// SERVER LOG
// ======================================================

// WENN DIE ID NICHT STIMMT:
// HIER DIE RICHTIGE LOG-CHANNEL-ID EINTRAGEN.

const SERVER_LOG_CHANNEL_ID =
  process.env.SERVER_LOG_CHANNEL_ID ||
  "1540814913985970304";

// ======================================================
// REGELWERK
// ======================================================

const RULES_CHANNEL_ID =
  "1534317962012393706";

// ======================================================
// TEAM ROLLEN NACHRICHTEN
// ======================================================

const TEAM_ROLE_MESSAGE_CHANNEL_ID =
  "1540814913755156540";

const CO_ANFUEHRER_ROLE_ID =
  "1540814913264680961";

const CLAN_MANAGER_ROLE_ID =
  "1540814913264680960";

const ADMIN_ROLE_ID =
  "1540814913251836013";

const DEV_ROLE_ID =
  "1540814913251836012";

const TEST_ADMIN_ROLE_ID =
  "1540814913251836011";

const MOD_ROLE_ID =
  "1540814913251836009";

const SUP_LEITUNG_ROLE_ID =
  "1540814913251836007";

const SUP_ROLE_ID =
  "1540814913251836006";

const BUILDER_LEITUNG_ROLE_ID =
  "HIER_BUILDER_LEITUNG_ROLE_ID";

const BUILDER_ROLE_ID =
  "1540814913243586710";

const FARMERLEITUNG_ROLE_ID =
  "1540814913243586709";

const FARMER_ROLE_ID =
  "1540814913243586702";

const TEAM_ROLE_CONFIG = [
  {
    id: CO_ANFUEHRER_ROLE_ID,
    name: "Co - Anführer",
    placeText: "beim **VIBE Clan**"
  },
  {
    id: CLAN_MANAGER_ROLE_ID,
    name: "Clan Manager",
    placeText: "beim **VIBE Clan**"
  },
  {
    id: ADMIN_ROLE_ID,
    name: "Admin",
    placeText: "beim **VIBE Clan**"
  },
  {
    id: DEV_ROLE_ID,
    name: "Dev",
    placeText: "beim **VIBE Clan**"
  },
  {
    id: TEST_ADMIN_ROLE_ID,
    name: "test Admin",
    placeText: "beim **VIBE Clan**"
  },
  {
    id: MOD_ROLE_ID,
    name: "Mod",
    placeText: "beim **VIBE Clan**"
  },
  {
    id: SUP_LEITUNG_ROLE_ID,
    name: "Sup leitung",
    placeText: "beim **VIBE Clan**"
  },
  {
    id: SUP_ROLE_ID,
    name: "Sup",
    placeText: "beim **VIBE Clan**"
  },
  {
    id: BUILDER_LEITUNG_ROLE_ID,
    name: "Builder leitung",
    placeText: "bei der **VIBE Baufirma**"
  },
  {
    id: BUILDER_ROLE_ID,
    name: "Builder",
    placeText: "bei der **VIBE Baufirma**"
  },
  {
    id: FARMERLEITUNG_ROLE_ID,
    name: "Farmerleitung",
    placeText: "beim **VIBE Clan**"
  },
  {
    id: FARMER_ROLE_ID,
    name: "Farmer",
    placeText: "beim **VIBE Clan**"
  }
];

// ======================================================
// TICKET KATEGORIEN
// ======================================================

const CLAN_CATEGORY_ID =
  "1540814914719977547";

const TEAM_CATEGORY_ID =
  "1540814914719977548";

const BAU_CATEGORY_ID =
  "1540814914719977549";

const GIVEAWAY_CATEGORY_ID =
  "1540814914719977551";

// ======================================================
// STATUS / DATEN
// ======================================================

let countingActive = false;
let countingChannelId = null;
let currentNumber = 1;
let lastUserId = null;

const ticketData =
  new Map();

const giveawayData =
  new Map();

const giveawayTimers =
  new Map();

const pendingTeamRoleUpdates =
  new Map();

// ======================================================
// DISCORD CLIENT
// ======================================================

const client =
  new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildModeration
    ]
  });

// ======================================================
// HELPER
// ======================================================

function safeText(
  value,
  fallback = "Unbekannt"
) {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  const text =
    String(value).trim();

  return text || fallback;
}

function baseEmbed(
  title,
  color = 0x5865f2,
  description = null
) {
  const embed =
    new EmbedBuilder()
      .setTitle(
        safeText(
          title,
          "VIBE Server Log"
        )
      )
      .setColor(
        typeof color === "number"
          ? color
          : 0x5865f2
      )
      .setTimestamp();

  if (
    description !== null &&
    description !== undefined &&
    String(description).trim()
  ) {
    embed.setDescription(
      String(description).trim()
    );
  }

  return embed;
}

function isAdmin(
  member
) {
  return (
    !!member &&
    member.permissions.has(
      PermissionsBitField
        .Flags
        .Administrator
    )
  );
}

function isStaff(
  member
) {
  return (
    !!member &&
    (
      member.roles.cache.has(
        STAFF_ROLE_ID
      ) ||
      isAdmin(member)
    )
  );
}

function getTicketData(
  channel
) {
  return channel
    ? ticketData.get(
        channel.id
      ) || null
    : null;
}

// ======================================================
// LOG CHANNEL DIREKT ÜBER ID LADEN
// ======================================================

async function getLogChannel() {
  const channel =
    client.channels.cache.get(
      SERVER_LOG_CHANNEL_ID
    ) ||
    await client.channels
      .fetch(
        SERVER_LOG_CHANNEL_ID
      )
      .catch(
        error => {
          console.error(
            "❌ Log-Channel Fetch Fehler:",
            error
          );

          return null;
        }
      );

  if (
    !channel ||
    !channel.isTextBased() ||
    typeof channel.send !==
      "function"
  ) {
    return null;
  }

  return channel;
}

async function sendLog(
  guild,
  embed
) {
  try {
    if (
      !isFeatureEnabled(
        "serverLogs"
      ) ||
      !guild ||
      !embed
    ) {
      return;
    }

    const channel =
      await getLogChannel();

    if (!channel) {
      console.log(
        `⚠️ Log-Kanal nicht gefunden: ${SERVER_LOG_CHANNEL_ID}`
      );

      return;
    }

    await channel.send({
      embeds: [
        embed
      ]
    });
  } catch (error) {
    console.error(
      "❌ Logging Fehler:",
      error
    );
  }
}

// ======================================================
// AUDIT LOG
// ======================================================

async function getAuditExecutor(
  guild,
  action,
  targetId,
  maxEntries = 10
) {
  try {
    if (!guild) {
      return null;
    }

    const logs =
      await guild.fetchAuditLogs({
        limit: maxEntries,
        type: action
      });

    return (
      logs.entries.find(
        entry =>
          entry.target?.id ===
            targetId &&
          Date.now() -
            entry.createdTimestamp <
            10000
      ) ||
      null
    );
  } catch (error) {
    if (
      error.code !==
      50013
    ) {
      console.error(
        "❌ Audit-Log Fehler:",
        error
      );
    }

    return null;
  }
}

// ======================================================
// GIVEAWAY DAUER
// ======================================================

function parseGiveawayDuration(
  input
) {
  if (!input) {
    return null;
  }

  const value =
    String(input)
      .trim()
      .toLowerCase()
      .replace(
        ",",
        "."
      );

  const compact =
    value.replace(
      /\s+/g,
      ""
    );

  const shortMatch =
    compact.match(
      /^(\d+(?:\.\d+)?)(s|m|h|d|w)$/i
    );

  if (shortMatch) {
    const amount =
      Number(
        shortMatch[1]
      );

    const multipliers = {
      s: 1000,
      m: 60000,
      h: 3600000,
      d: 86400000,
      w: 604800000
    };

    return Math.floor(
      amount *
      multipliers[
        shortMatch[2]
          .toLowerCase()
      ]
    );
  }

  const longMatch =
    value.match(
      /^(\d+(?:\.\d+)?)\s*(sekunde|sekunden|min|minute|minuten|stunde|stunden|std|tag|tage|tagen|woche|wochen)$/i
    );

  if (!longMatch) {
    return null;
  }

  const amount =
    Number(
      longMatch[1]
    );

  const unit =
    longMatch[2]
      .toLowerCase();

  let multiplier =
    null;

  if (
    [
      "sekunde",
      "sekunden"
    ].includes(unit)
  ) {
    multiplier = 1000;
  }

  if (
    [
      "min",
      "minute",
      "minuten"
    ].includes(unit)
  ) {
    multiplier = 60000;
  }

  if (
    [
      "stunde",
      "stunden",
      "std"
    ].includes(unit)
  ) {
    multiplier = 3600000;
  }

  if (
    [
      "tag",
      "tage",
      "tagen"
    ].includes(unit)
  ) {
    multiplier = 86400000;
  }

  if (
    [
      "woche",
      "wochen"
    ].includes(unit)
  ) {
    multiplier = 604800000;
  }

  return multiplier
    ? Math.floor(
        amount *
        multiplier
      )
    : null;
}

// ======================================================
// GIVEAWAY EMBED
// ======================================================

function createGiveawayEmbed(
  data,
  ended = false,
  winnerIds = []
) {
  const endUnix =
    Math.floor(
      data.endAt /
      1000
    );

  const embed =
    new EmbedBuilder()
      .setColor(
        ended
          ? "#57F287"
          : "#5865F2"
      )
      .setTitle(
        `🎁 ${data.prize}`
      )
      .setDescription(
        data.description ||
        "Viel Glück an alle Teilnehmer! 🍀"
      )
      .addFields(
        {
          name:
            "⏰ Ende",

          value:
            ended
              ? `Beendet <t:${endUnix}:R>`
              : `<t:${endUnix}:R>\n<t:${endUnix}:f>`,

          inline:
            false
        },
        {
          name:
            "👤 Veranstaltet von",

          value:
            `<@${data.hostId}>`,

          inline:
            true
        },
        {
          name:
            "🎟️ Teilnehmer",

          value:
            `${data.participants.size}`,

          inline:
            true
        },
        {
          name:
            "🏆 Gewinner",

          value:
            `${data.winnerCount}`,

          inline:
            true
        }
      )
      .setTimestamp(
        data.createdAt
      )
      .setFooter({
        text:
          ended
            ? "Gewinnspiel beendet"
            : "Klicke unten auf 🎉 Teilnehmen!"
      });

  if (ended) {
    embed.addFields({
      name:
        "🎉 Ergebnis",

      value:
        winnerIds.length
          ? winnerIds
              .map(
                id =>
                  `<@${id}>`
              )
              .join(
                ", "
              )
          : "Keine gültigen Teilnehmer."
    });
  }

  return embed;
}

function pickGiveawayWinners(
  participants,
  count
) {
  const pool =
    [
      ...participants
    ];

  const winners =
    [];

  while (
    pool.length &&
    winners.length <
      count
  ) {
    const index =
      Math.floor(
        Math.random() *
        pool.length
      );

    winners.push(
      pool.splice(
        index,
        1
      )[0]
    );
  }

  return winners;
}

async function endGiveaway(
  giveawayId
) {
  const data =
    giveawayData.get(
      giveawayId
    );

  if (
    !data ||
    data.ended
  ) {
    return;
  }

  data.ended =
    true;

  const timer =
    giveawayTimers.get(
      giveawayId
    );

  if (timer) {
    clearTimeout(timer);
  }

  giveawayTimers.delete(
    giveawayId
  );

  const winners =
    pickGiveawayWinners(
      data.participants,
      data.winnerCount
    );

  data.winnerIds =
    winners;

  const guild =
    client.guilds.cache.get(
      data.guildId
    );

  if (!guild) {
    return;
  }

  const channel =
    await guild.channels
      .fetch(
        data.channelId
      )
      .catch(
        () => null
      );

  if (
    !channel ||
    !channel.isTextBased()
  ) {
    return;
  }

  const message =
    await channel.messages
      .fetch(
        data.messageId
      )
      .catch(
        () => null
      );

  if (message) {
    const button =
      new ButtonBuilder()
        .setCustomId(
          `giveaway_join_${giveawayId}`
        )
        .setLabel(
          "Gewinnspiel beendet"
        )
        .setEmoji(
          "🎉"
        )
        .setStyle(
          ButtonStyle.Secondary
        )
        .setDisabled(
          true
        );

    await message
      .edit({
        embeds: [
          createGiveawayEmbed(
            data,
            true,
            winners
          )
        ],
        components: [
          new ActionRowBuilder()
            .addComponents(
              button
            )
        ]
      })
      .catch(
        () => {}
      );
  }

  if (
    winners.length
  ) {
    await channel.send({
      content:
        "🎉 **GEWINNSPIEL BEENDET!** 🎉\n\n" +
        `🏆 Gewinner: ${
          winners
            .map(
              id =>
                `<@${id}>`
            )
            .join(
              ", "
            )
        }\n\n` +
        `🎁 **Preis:** ${data.prize}\n\n` +
        "Herzlichen Glückwunsch! 🎊",

      allowedMentions: {
        users:
          winners
      }
    });
  } else {
    await channel.send({
      content:
        "🎉 **Gewinnspiel beendet!**\n\n" +
        "Es gab leider keine gültigen Teilnehmer.\n\n" +
        `🎁 **Preis:** ${data.prize}`
    });
  }
}

function scheduleGiveawayEnd(
  giveawayId
) {
  const scheduleNext =
    () => {
      const data =
        giveawayData.get(
          giveawayId
        );

      if (
        !data ||
        data.ended
      ) {
        return;
      }

      const remaining =
        data.endAt -
        Date.now();

      if (
        remaining <=
        0
      ) {
        endGiveaway(
          giveawayId
        ).catch(
          error =>
            console.error(
              "❌ Giveaway End Fehler:",
              error
            )
        );

        return;
      }

      const timer =
        setTimeout(
          scheduleNext,
          Math.min(
            remaining,
            2_000_000_000
          )
        );

      giveawayTimers.set(
        giveawayId,
        timer
      );
    };

  scheduleNext();
}

// ======================================================
// REGELWERK
// ======================================================

const RULES_EMBED_TITLE =
  "📜 VIBE Clan x Shop Regelwerk";

const RULES_TEXT =
`**Willkommen bei VIBE – halb Clan, halb Business. Heißt: wir zocken zusammen, aber hier wird auch gehandelt** 💸
**Wenn du nur Chaos suchst → falscher Ort. Wenn du Cash + Community willst → bleib 👀**

**1. 🧠 Respekt benutzen (wirklich jetzt)**
**Kein unnötiges Geflame, kein dummes Rumgehate. Kunden werden nicht vergrault und Member auch nicht. Wer sich benimmt wie ein kompletter Clown, fliegt 🤡**

**2. 💸 Scam = sofort Game Over**
**Egal ob Clanmate oder Kunde – wer versucht abzuziehen, ist instant raus. Kein “Bro war Spaß” – wir sind kein Flohmarkt für Betrüger.**

**3. 🛒 Shop = sauber & fair**
**Preise bleiben fair, keine random Abzocke. Wenn du im Namen vom Clan handelst, dann ordentlich. Wir wollen Ruf, nicht Reports.**

**4. ⏳ Aktiv sein oder Platz machen**
**Wenn du inaktiv bist, bist du basically Deko. Sei online oder sag Bescheid – wir brauchen Member, keine Möbel 🪑💀**

**5. 🤝 Clan > dein Solo Grind**
**Ja, Geld ist nice – aber Clan geht vor. Unterstütz Member, hilf im Shop und spiel nicht nur deinen eigenen Film.**

**6. 💥 Kein unnötiger Stress mit Kunden/Clans**
**Kunden anpöbeln oder random Beef starten = maximal lost. Wenn’s Probleme gibt → ruhig klären oder Leitung regelt das.**

**7. 📜 Serverregeln gelten – immer noch**
**Alles, was gegen Serverregeln geht, geht auch gegen uns. Wer Stress macht, fliegt. Easy.**

**8. 👑 Leitung macht die Ansagen**
**Du kannst labern, aber die Leitung entscheidet. Wenn dir das nicht passt… ja gut, dann weißt du ja wo die Tür ist bro 🚪**

**9. 📈 Ruf = alles**
**Wir bauen hier was auf. Wenn du den Clan oder Shop schlecht dastehen lässt, bist du schneller raus als dein Kontostand nach nem Fehlkauf.**

⚠️ **Wichtig:**
**Die <@&1488901640521252864> <@&1488901953202294854> können das Regelwerk jederzeit ändern, erweitern oder komplett umbauen – also bleib up to date und tu nicht überrascht 😏**

\`Die Clan - Teamler haben ihr eigenes Regelwerk, sie sind also aus diesem Regelwerk ausgenommen\`

**MfG**
<@&1488902497987727380>

*Stand: 24.08.2026*
<@&1488906111389274202> **bitte mit ✅ antworten**`;

function createRulesEmbed() {
  return (
    new EmbedBuilder()
      .setColor(
        "#2B2D31"
      )
      .setTitle(
        RULES_EMBED_TITLE
      )
      .setDescription(
        RULES_TEXT
      )
  );
}

// ======================================================
// REGELWERK SENDEN / AKTUALISIEREN
// ======================================================

async function sendOrUpdateRules() {
  try {
    const channel =
      client.channels.cache.get(
        RULES_CHANNEL_ID
      ) ||
      await client.channels
        .fetch(
          RULES_CHANNEL_ID
        )
        .catch(
          error => {
            console.error(
              "❌ Regelwerk-Channel Fetch Fehler:",
              error
            );

            return null;
          }
        );

    if (
      !channel ||
      !channel.isTextBased() ||
      typeof channel.send !==
        "function"
    ) {
      console.log(
        `⚠️ Regelwerk-Channel nicht gefunden: ${RULES_CHANNEL_ID}`
      );

      return;
    }

    let existingMessage =
      null;

    const pinnedMessages =
      await channel.messages
        .fetchPinned()
        .catch(
          () => null
        );

    if (
      pinnedMessages
    ) {
      existingMessage =
        pinnedMessages.find(
          message =>
            message.author?.id ===
              client.user.id &&
            message.embeds.some(
              embed =>
                embed.title ===
                RULES_EMBED_TITLE
            )
        ) ||
        null;
    }

    if (
      !existingMessage
    ) {
      const recentMessages =
        await channel.messages
          .fetch({
            limit: 100
          })
          .catch(
            () => null
          );

      if (
        recentMessages
      ) {
        existingMessage =
          recentMessages.find(
            message =>
              message.author?.id ===
                client.user.id &&
              message.embeds.some(
                embed =>
                  embed.title ===
                  RULES_EMBED_TITLE
              )
          ) ||
          null;
      }
    }

    const payload = {
      content:
        "@everyone",

      allowedMentions: {
        parse: [
          "everyone"
        ]
      },

      embeds: [
        createRulesEmbed()
      ]
    };

    if (
      existingMessage
    ) {
      await existingMessage.edit(
        payload
      );

      await existingMessage
        .react(
          "✅"
        )
        .catch(
          () => {}
        );

      if (
        !existingMessage.pinned
      ) {
        await existingMessage
          .pin(
            "VIBE Clan x Shop Regelwerk"
          )
          .catch(
            () => {}
          );
      }

      console.log(
        `✅ Regelwerk wurde aktualisiert: ${RULES_CHANNEL_ID}`
      );

      return;
    }

    const rulesMessage =
      await channel.send(
        payload
      );

    await rulesMessage
      .react(
        "✅"
      )
      .catch(
        () => {}
      );

    await rulesMessage
      .pin(
        "VIBE Clan x Shop Regelwerk"
      )
      .catch(
        () => {}
      );

    console.log(
      `✅ Regelwerk wurde gesendet: ${RULES_CHANNEL_ID}`
    );
  } catch (error) {
    console.error(
      "❌ Regelwerk Fehler:",
      error
    );
  }
}

// ======================================================
// SLASH COMMANDS
// ======================================================

const commands = [
  new SlashCommandBuilder()
    .setName(
      "ticketpanel"
    )
    .setDescription(
      "Erstellt das Ticket Panel"
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName(
      "countingstart"
    )
    .setDescription(
      "Startet das Counting"
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName(
      "countingstop"
    )
    .setDescription(
      "Stoppt das Counting"
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName(
      "logtest"
    )
    .setDescription(
      "Testet das Server-Logging"
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName(
      "clear"
    )
    .setDescription(
      "Löscht Nachrichten aus diesem Channel"
    )
    .addIntegerOption(
      option =>
        option
          .setName(
            "nummer"
          )
          .setDescription(
            "Wie viele Nachrichten sollen gelöscht werden?"
          )
          .setRequired(
            true
          )
          .setMinValue(
            1
          )
          .setMaxValue(
            1000
          )
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName(
      "create"
    )
    .setDescription(
      "Erstellt Inhalte auf dem Server"
    )
    .addSubcommand(
      subcommand =>
        subcommand
          .setName(
            "giveaway"
          )
          .setDescription(
            "Erstellt ein Gewinnspiel"
          )
    )
    .toJSON()
];

const rest =
  new REST({
    version:
      "10"
  }).setToken(
    TOKEN
  );

async function registerCommands() {
  try {
    console.log(
      "⏳ Registriere Slash Commands..."
    );

    await rest.put(
      Routes.applicationGuildCommands(
        CLIENT_ID,
        GUILD_ID
      ),
      {
        body:
          commands
      }
    );

    console.log(
      "✅ Slash Commands registriert"
    );
  } catch (error) {
    console.error(
      "❌ Fehler beim Registrieren:",
      error
    );
  }
}

// ======================================================
// READY
// ======================================================

client.once(
  Events.ClientReady,
  async () => {
    console.log(
      "===================================="
    );

    console.log(
      `✅ Bot online: ${client.user.tag}`
    );

    console.log(
      `🆔 Bot ID: ${client.user.id}`
    );

    console.log(
      `🌐 Port: ${PORT}`
    );

    console.log(
      `📝 Server Log: ${SERVER_LOG_CHANNEL_ID}`
    );

    console.log(
      `🛡️ Staff Rolle: ${STAFF_ROLE_ID}`
    );

    console.log(
      `🎧 Support Rolle: ${SUPPORT_ROLE_ID}`
    );

    console.log(
      "===================================="
    );

    await registerCommands();

    await sendOrUpdateRules();
  }
);

// ======================================================
// BOT LOGIN
// ======================================================

if (!TOKEN) {
  console.error(
    "❌ TOKEN fehlt bei Render Environment!"
  );

  process.exit(1);
}

console.log(
  "🔐 Bot wird eingeloggt..."
);

client.login(
  TOKEN
).catch(
  error => {
    console.error(
      "❌ Discord Login Fehler:",
      error
    );
  }
);

// ======================================================
// INTERACTIONS
// ======================================================

client.on(
  Events.InteractionCreate,
  async interaction => {
    try {

      // ==================================================
      // SLASH COMMANDS
      // ==================================================

      if (
        interaction.isChatInputCommand()
      ) {

        // ==================================================
        // /CREATE GIVEAWAY
        // ==================================================

        if (
          interaction.commandName ===
            "create" &&
          interaction.options
            .getSubcommand() ===
            "giveaway"
        ) {

          if (
            !isAdmin(
              interaction.member
            ) &&
            !interaction.member
              .permissions
              .has(
                PermissionsBitField
                  .Flags
                  .ManageGuild
              )
          ) {
            return interaction.reply({
              content:
                "❌ Du benötigst die Berechtigung **Server verwalten**, um ein Gewinnspiel zu erstellen.",

              flags:
                MessageFlags.Ephemeral
            });
          }

          const modal =
            new ModalBuilder()
              .setCustomId(
                "create_giveaway_modal"
              )
              .setTitle(
                "Gewinnspiel erstellen"
              );

          const durationInput =
            new TextInputBuilder()
              .setCustomId(
                "giveaway_duration"
              )
              .setLabel(
                "Dauer"
              )
              .setPlaceholder(
                "z. B. 10 Minuten, 2 Stunden oder 1 Tag"
              )
              .setStyle(
                TextInputStyle.Short
              )
              .setRequired(
                true
              );

          const winnersInput =
            new TextInputBuilder()
              .setCustomId(
                "giveaway_winners"
              )
              .setLabel(
                "Anzahl der Gewinner"
              )
              .setPlaceholder(
                "z. B. 1"
              )
              .setStyle(
                TextInputStyle.Short
              )
              .setRequired(
                true
              );

          const prizeInput =
            new TextInputBuilder()
              .setCustomId(
                "giveaway_prize"
              )
              .setLabel(
                "Preis"
              )
              .setPlaceholder(
                "Was kann man gewinnen?"
              )
              .setStyle(
                TextInputStyle.Short
              )
              .setRequired(
                true
              );

          const descriptionInput =
            new TextInputBuilder()
              .setCustomId(
                "giveaway_description"
              )
              .setLabel(
                "Beschreibung"
              )
              .setPlaceholder(
                "Optional: Weitere Informationen"
              )
              .setStyle(
                TextInputStyle.Paragraph
              )
              .setRequired(
                false
              );

          modal.addComponents(
            new ActionRowBuilder()
              .addComponents(
                durationInput
              ),

            new ActionRowBuilder()
              .addComponents(
                winnersInput
              ),

            new ActionRowBuilder()
              .addComponents(
                prizeInput
              ),

            new ActionRowBuilder()
              .addComponents(
                descriptionInput
              )
          );

          await interaction.showModal(
            modal
          );

          return;
        }

        // ==================================================
        // COUNTING START
        // ==================================================

        if (
          interaction.commandName ===
          "countingstart"
        ) {

          if (
            !isAdmin(
              interaction.member
            ) &&
            !interaction.member
              .permissions
              .has(
                PermissionsBitField
                  .Flags
                  .ManageGuild
              )
          ) {
            return interaction.reply({
              content:
                "❌ Du benötigst die Berechtigung **Server verwalten**.",

              flags:
                MessageFlags.Ephemeral
            });
          }

          countingActive =
            true;

          countingChannelId =
            interaction.channelId;

          currentNumber =
            1;

          lastUserId =
            null;

          return interaction.reply({
            content:
              "🎉 **Counting gestartet!**\n\n" +
              "📍 Dieser Channel ist jetzt der Counting-Channel.\n" +
              "🔢 Erste Zahl: **1**"
          });
        }

        // ==================================================
        // COUNTING STOP
        // ==================================================

        if (
          interaction.commandName ===
          "countingstop"
        ) {

          if (
            !isAdmin(
              interaction.member
            ) &&
            !interaction.member
              .permissions
              .has(
                PermissionsBitField
                  .Flags
                  .ManageGuild
              )
          ) {
            return interaction.reply({
              content:
                "❌ Du benötigst die Berechtigung **Server verwalten**.",

              flags:
                MessageFlags.Ephemeral
            });
          }

          countingActive =
            false;

          countingChannelId =
            null;

          currentNumber =
            1;

          lastUserId =
            null;

          return interaction.reply({
            content:
              "🛑 **Counting wurde gestoppt.**"
          });
        }

        // ==================================================
        // LOG TEST
        // ==================================================

        if (
          interaction.commandName ===
          "logtest"
        ) {

          if (
            !isAdmin(
              interaction.member
            )
          ) {
            return interaction.reply({
              content:
                "❌ Nur Administratoren können diesen Befehl benutzen.",

              flags:
                MessageFlags.Ephemeral
            });
          }

          const embed =
            baseEmbed(
              "🧪 Logging Test",
              0x5865f2,
              "Das Server-Logging funktioniert."
            );

          embed.addFields(
            {
              name:
                "Ausgeführt von",

              value:
                `${interaction.user} (${interaction.user.id})`
            },
            {
              name:
                "Channel",

              value:
                interaction.channel
                  ?.toString() ||
                "Unbekannt"
            }
          );

          await sendLog(
            interaction.guild,
            embed
          );

          return interaction.reply({
            content:
              "✅ Test-Log wurde gesendet.",

            flags:
              MessageFlags.Ephemeral
          });
        }

        // ==================================================
        // CLEAR
        // ==================================================

        if (
          interaction.commandName ===
          "clear"
        ) {

          if (
            !interaction.member
              .permissions
              .has(
                PermissionsBitField
                  .Flags
                  .ManageMessages
              ) &&
            !isAdmin(
              interaction.member
            )
          ) {
            return interaction.reply({
              content:
                "❌ Du benötigst die Berechtigung **Nachrichten verwalten**.",

              flags:
                MessageFlags.Ephemeral
            });
          }

          const amount =
            interaction.options
              .getInteger(
                "nummer",
                true
              );

          const channel =
            interaction.channel;

          if (
            !channel ||
            !channel.isTextBased() ||
            typeof channel.bulkDelete !==
              "function"
          ) {
            return interaction.reply({
              content:
                "❌ In diesem Channel können keine Nachrichten gelöscht werden.",

              flags:
                MessageFlags.Ephemeral
            });
          }

          await interaction.deferReply({
            flags:
              MessageFlags.Ephemeral
          });

          let remaining =
            amount;

          let deletedTotal =
            0;

          try {
            while (
              remaining >
              0
            ) {
              const batchSize =
                Math.min(
                  remaining,
                  100
                );

              const deleted =
                await channel
                  .bulkDelete(
                    batchSize,
                    true
                  );

              const deletedCount =
                deleted.size;

              deletedTotal +=
                deletedCount;

              remaining -=
                deletedCount;

              if (
                !deletedCount ||
                deletedCount <
                  batchSize
              ) {
                break;
              }

              if (
                remaining >
                0
              ) {
                await new Promise(
                  resolve =>
                    setTimeout(
                      resolve,
                      500
                    )
                );
              }
            }

            await interaction.editReply({
              content:
                `🧹 **${deletedTotal} Nachrichten wurden gelöscht.**` +
                (
                  deletedTotal <
                  amount
                    ? "\n⚠️ Einige Nachrichten konnten nicht gelöscht werden, z. B. weil sie älter als 14 Tage sind."
                    : ""
                )
            });

            const embed =
              baseEmbed(
                "🧹 Nachrichten gelöscht",
                0xed4245
              );

            embed.addFields(
              {
                name:
                  "👤 Ausgeführt von",

                value:
                  `${interaction.user} (${interaction.user.id})`
              },
              {
                name:
                  "📍 Channel",

                value:
                  channel.toString()
              },
              {
                name:
                  "🗑️ Gelöscht",

                value:
                  `${deletedTotal} Nachrichten`
              },
              {
                name:
                  "🔢 Angefordert",

                value:
                  `${amount} Nachrichten`
              }
            );

            await sendLog(
              interaction.guild,
              embed
            );

          } catch (error) {
            console.error(
              "❌ Clear Fehler:",
              error
            );

            await interaction
              .editReply({
                content:
                  "❌ Beim Löschen der Nachrichten ist ein Fehler aufgetreten."
              })
              .catch(
                () => {}
              );
          }

          return;
        }

        // ==================================================
        // TICKET PANEL
        // ==================================================

        if (
          interaction.commandName ===
          "ticketpanel"
        ) {

          if (
            !isAdmin(
              interaction.member
            )
          ) {
            return interaction.reply({
              content:
                "❌ Nur Administratoren können das Ticket Panel erstellen.",

              flags:
                MessageFlags.Ephemeral
            });
          }

          const embed =
            new EmbedBuilder()
              .setColor(
                "#2B2D31"
              )
              .setTitle(
                "🎫 Allgemeiner Support"
              )
              .setDescription(
`Du hast ein Problem, eine Frage oder benötigst Hilfe auf unserem Server?

Dann bist du hier genau richtig!

Erstelle ein Ticket und beschreibe dein Anliegen so genau wie möglich.

━━━━━━━━━━━━━━━━━━

📌 **Wobei wir helfen können:**

• ❓ Fragen rund um den Server
• 🐛 Probleme & Bugs
• 🚨 Spieler melden
• 🛠️ Allgemeine Hilfe
• 🏗️ Bauprojekte & Aufträge
• 🎁 Giveaway Anliegen

━━━━━━━━━━━━━━━━━━

👥 **Bewerbungen & Bau-Firma**

Du möchtest Teil unseres Teams werden oder die Bau-Firma unterstützen?

Erstelle einfach ein Ticket.

━━━━━━━━━━━━━━━━━━

📋 **Wichtige Hinweise:**

• Beschreibe dein Anliegen genau
• Bleibe freundlich
• Erstelle nur ein Ticket pro Anliegen

━━━━━━━━━━━━━━━━━━

🚀 Vielen Dank und viel Spaß auf unserem Server!`
              )
              .setThumbnail(
                client.user
                  .displayAvatarURL()
              )
              .setFooter({
                text:
                  "VIBE Support System"
              });

          const menu =
            new StringSelectMenuBuilder()
              .setCustomId(
                "ticket_menu"
              )
              .setPlaceholder(
                "Wähle eine Kategorie aus"
              )
              .addOptions([
                {
                  label:
                    "Allgemeiner Support",

                  description:
                    "Hilfe und Anliegen",

                  emoji:
                    "🛡️",

                  value:
                    "clan_bewerbung"
                },
                {
                  label:
                    "Team Bewerbung",

                  description:
                    "Bewirb dich für das Team",

                  emoji:
                    "👥",

                  value:
                    "team_bewerbung"
                },
                {
                  label:
                    "Bau Firma",

                  description:
                    "Firmenbewerbung und Aufträge",

                  emoji:
                    "🏗️",

                  value:
                    "bau_firma"
                },
                {
                  label:
                    "Giveaway",

                  description:
                    "Fragen und Hilfe zu Giveaways",

                  emoji:
                    "🎁",

                  value:
                    "giveaway"
                }
              ]);

          return interaction.reply({
            embeds: [
              embed
            ],

            components: [
              new ActionRowBuilder()
                .addComponents(
                  menu
                )
            ]
          });
        }

        return;
      }

      // ==================================================
      // GIVEAWAY MODAL
      // ==================================================

      if (
        interaction.isModalSubmit() &&
        interaction.customId ===
          "create_giveaway_modal"
      ) {

        const durationText =
          interaction.fields
            .getTextInputValue(
              "giveaway_duration"
            )
            .trim();

        const winnersText =
          interaction.fields
            .getTextInputValue(
              "giveaway_winners"
            )
            .trim();

        const prize =
          interaction.fields
            .getTextInputValue(
              "giveaway_prize"
            )
            .trim();

        const description =
          interaction.fields
            .getTextInputValue(
              "giveaway_description"
            )
            .trim();

        const duration =
          parseGiveawayDuration(
            durationText
          );

        const winnerCount =
          Number.parseInt(
            winnersText,
            10
          );

        if (
          !duration ||
          duration <
            10000
        ) {
          return interaction.reply({
            content:
              "❌ Ungültige Dauer.\n\n" +
              "Beispiele:\n" +
              "• `10 Minuten`\n" +
              "• `2 Stunden`\n" +
              "• `1 Tag`\n" +
              "• `30m`\n" +
              "• `2h`\n" +
              "• `1d`",

            flags:
              MessageFlags.Ephemeral
          });
        }

        if (
          !Number.isInteger(
            winnerCount
          ) ||
          winnerCount <
            1 ||
          winnerCount >
            20
        ) {
          return interaction.reply({
            content:
              "❌ Die Anzahl der Gewinner muss zwischen **1 und 20** liegen.",

            flags:
              MessageFlags.Ephemeral
          });
        }

        if (!prize) {
          return interaction.reply({
            content:
              "❌ Bitte gib einen Preis an.",

            flags:
              MessageFlags.Ephemeral
          });
        }

        await interaction.deferReply({
          flags:
            MessageFlags.Ephemeral
        });

        const giveawayId =
          `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

        const data = {
          id:
            giveawayId,

          guildId:
            interaction.guildId,

          channelId:
            interaction.channelId,

          messageId:
            null,

          hostId:
            interaction.user.id,

          prize,

          description,

          winnerCount,

          participants:
            new Set(),

          createdAt:
            Date.now(),

          endAt:
            Date.now() +
            duration,

          ended:
            false,

          winnerIds:
            []
        };

        const joinButton =
          new ButtonBuilder()
            .setCustomId(
              `giveaway_join_${giveawayId}`
            )
            .setLabel(
              "Teilnehmen"
            )
            .setEmoji(
              "🎉"
            )
            .setStyle(
              ButtonStyle.Primary
            );

        const giveawayMessage =
          await interaction.channel.send({
            embeds: [
              createGiveawayEmbed(
                data
              )
            ],

            components: [
              new ActionRowBuilder()
                .addComponents(
                  joinButton
                )
            ]
          });

        data.messageId =
          giveawayMessage.id;

        giveawayData.set(
          giveawayId,
          data
        );

        scheduleGiveawayEnd(
          giveawayId
        );

        await interaction.editReply({
          content:
            `✅ Das Gewinnspiel wurde erfolgreich erstellt!\n${giveawayMessage.url}`
        });

        return;
      }

      // ==================================================
      // TICKET SELECT MENU
      // ==================================================

      if (
        interaction.isStringSelectMenu() &&
        interaction.customId ===
          "ticket_menu"
      ) {

        await interaction.deferReply({
          flags:
            MessageFlags.Ephemeral
        });

        const selected =
          interaction.values[0];

        const config = {
          clan_bewerbung: {
            name:
              `support-${interaction.user.username.toLowerCase()}`,

            title:
              "🛡️ Allgemeiner Support",

            categoryId:
              CLAN_CATEGORY_ID
          },

          team_bewerbung: {
            name:
              `bewerbung-${interaction.user.username.toLowerCase()}`,

            title:
              "👥 Team Bewerbung",

            categoryId:
              TEAM_CATEGORY_ID
          },

          bau_firma: {
            name:
              `bau-${interaction.user.username.toLowerCase()}`,

            title:
              "🏗️ Bau Firma",

            categoryId:
              BAU_CATEGORY_ID
          },

          giveaway: {
            name:
              `giveaway-${interaction.user.username.toLowerCase()}`,

            title:
              "🎁 Giveaway",

            categoryId:
              GIVEAWAY_CATEGORY_ID
          }
        }[selected];

        if (!config) {
          return interaction.editReply({
            content:
              "❌ Ungültige Ticket-Kategorie."
          });
        }

        const guild =
          interaction.guild;

        const existing =
          guild.channels.cache.find(
            channel =>
              channel.type ===
                ChannelType.GuildText &&
              channel.name ===
                config.name
          );

        if (existing) {
          return interaction.editReply({
            content:
              `❌ Du hast bereits ein Ticket offen: ${existing}`
          });
        }

        const member =
          await guild.members
            .fetch(
              interaction.user.id
            )
            .catch(
              () => null
            );

        const staffRole =
          await guild.roles
            .fetch(
              STAFF_ROLE_ID
            )
            .catch(
              () => null
            );

        const category =
          await guild.channels
            .fetch(
              config.categoryId
            )
            .catch(
              () => null
            );

        if (
          !member ||
          !staffRole ||
          !category
        ) {
          return interaction.editReply({
            content:
              "❌ Ticket konnte nicht erstellt werden. Prüfe Rollen und Kategorien."
          });
        }

        const channel =
          await guild.channels.create({
            name:
              config.name,

            type:
              ChannelType.GuildText,

            parent:
              category.id,

            permissionOverwrites: [
              {
                id:
                  guild.roles
                    .everyone
                    .id,

                deny: [
                  PermissionsBitField
                    .Flags
                    .ViewChannel
                ]
              },
              {
                id:
                  member.id,

                allow: [
                  PermissionsBitField
                    .Flags
                    .ViewChannel,

                  PermissionsBitField
                    .Flags
                    .SendMessages,

                  PermissionsBitField
                    .Flags
                    .ReadMessageHistory
                ]
              },
              {
                id:
                  staffRole.id,

                allow: [
                  PermissionsBitField
                    .Flags
                    .ViewChannel,

                  PermissionsBitField
                    .Flags
                    .SendMessages,

                  PermissionsBitField
                    .Flags
                    .ReadMessageHistory
                ]
              }
            ]
          });

        ticketData.set(
          channel.id,
          {
            ownerId:
              member.id,

            claimedBy:
              null,

            forwardedTo:
              null
          }
        );

        const row =
          new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId(
                  "claim_ticket"
                )
                .setLabel(
                  "Ticket übernehmen"
                )
                .setEmoji(
                  "📌"
                )
                .setStyle(
                  ButtonStyle.Primary
                ),

              new ButtonBuilder()
                .setCustomId(
                  "forward_ticket"
                )
                .setLabel(
                  "Weiterleiten"
                )
                .setEmoji(
                  "➡️"
                )
                .setStyle(
                  ButtonStyle.Secondary
                ),

              new ButtonBuilder()
                .setCustomId(
                  "close_ticket"
                )
                .setLabel(
                  "Ticket schließen"
                )
                .setEmoji(
                  "🔒"
                )
                .setStyle(
                  ButtonStyle.Danger
                )
            );

        const ticketEmbed =
          new EmbedBuilder()
            .setColor(
              "#57F287"
            )
            .setTitle(
              config.title
            )
            .setDescription(
`Hallo ${member} 👋

Dein Ticket wurde erfolgreich erstellt.

📌 Bitte beschreibe dein Anliegen möglichst genau.

🛡️ Ein Teammitglied wird sich schnellstmöglich darum kümmern.

📌 **Ticket übernehmen:** Teammitglied übernimmt das Ticket.
➡️ **Weiterleiten:** Ticket an anderes Teammitglied weiterleiten.
🔒 **Schließen:** Ticket schließen.`
            )
            .setFooter({
              text:
                "VIBE Ticket System"
            })
            .setTimestamp();

        await channel.send({
          content:
            `<@&${STAFF_ROLE_ID}>`,

          allowedMentions: {
            roles: [
              STAFF_ROLE_ID
            ]
          },

          embeds: [
            ticketEmbed
          ],

          components: [
            row
          ]
        });

        await interaction.editReply({
          content:
            `✅ Dein Ticket wurde erstellt: ${channel}`
        });

        return;
      }

      // ==================================================
      // FORWARD USER SELECT
      // ==================================================

      if (
        interaction.isUserSelectMenu() &&
        interaction.customId ===
          "forward_ticket_user"
      ) {

        await interaction.deferReply({
          flags:
            MessageFlags.Ephemeral
        });

        if (
          !isStaff(
            interaction.member
          )
        ) {
          return interaction.editReply({
            content:
              "❌ Nur Teammitglieder können Tickets weiterleiten."
          });
        }

        const selectedMember =
          await interaction.guild
            .members
            .fetch(
              interaction.values[0]
            )
            .catch(
              () => null
            );

        if (
          !selectedMember ||
          !isStaff(
            selectedMember
          )
        ) {
          return interaction.editReply({
            content:
              "❌ Bitte wähle ein gültiges Teammitglied."
          });
        }

        const data =
          getTicketData(
            interaction.channel
          );

        if (!data) {
          return interaction.editReply({
            content:
              "❌ Ticket-Daten nicht gefunden."
          });
        }

        await interaction.channel
          .permissionOverwrites
          .edit(
            selectedMember.id,
            {
              ViewChannel:
                true,

              SendMessages:
                true,

              ReadMessageHistory:
                true
            }
          );

        data.forwardedTo =
          selectedMember.id;

        await interaction.channel.send({
          content:
            `${selectedMember}`,

          embeds: [
            new EmbedBuilder()
              .setColor(
                "#5865F2"
              )
              .setTitle(
                "➡️ Ticket weitergeleitet"
              )
              .setDescription(
`Dieses Ticket wurde weitergeleitet.

👤 **Von:** ${interaction.user}

🎯 **An:** ${selectedMember}`
              )
              .setTimestamp()
          ]
        });

        return interaction.editReply({
          content:
            `✅ Ticket wurde an ${selectedMember} weitergeleitet.`
        });
      }

      // ==================================================
      // BUTTONS
      // ==================================================

      if (
        interaction.isButton()
      ) {

        // ==================================================
        // GIVEAWAY JOIN
        // ==================================================

        if (
          interaction.customId
            .startsWith(
              "giveaway_join_"
            )
        ) {

          await interaction.deferReply({
            flags:
              MessageFlags.Ephemeral
          });

          const giveawayId =
            interaction.customId
              .replace(
                "giveaway_join_",
                ""
              );

          const data =
            giveawayData.get(
              giveawayId
            );

          if (!data) {
            return interaction.editReply({
              content:
                "❌ Dieses Gewinnspiel ist nicht mehr aktiv."
            });
          }

          if (
            data.ended ||
            Date.now() >=
              data.endAt
          ) {
            return interaction.editReply({
              content:
                "❌ Dieses Gewinnspiel ist bereits beendet."
            });
          }

          if (
            interaction.member &&
            (
              interaction.member
                .roles
                .cache
                .has(
                  STAFF_ROLE_ID
                ) ||
              isAdmin(
                interaction.member
              )
            )
          ) {
            return interaction.editReply({
              content:
                "❌ Teammitglieder und Administratoren dürfen nicht teilnehmen."
            });
          }

          if (
            data.participants
              .has(
                interaction.user.id
              )
          ) {
            return interaction.editReply({
              content:
                "🎉 Du nimmst bereits am Gewinnspiel teil!"
            });
          }

          data.participants.add(
            interaction.user.id
          );

          await interaction.message
            .edit({
              embeds: [
                createGiveawayEmbed(
                  data
                )
              ]
            })
            .catch(
              () => {}
            );

          return interaction.editReply({
            content:
              "🎉 **Du machst jetzt beim Gewinnspiel mit!**\n\n🍀 Viel Glück!"
          });
        }

        // ==================================================
        // CLAIM TICKET
        // ==================================================

        if (
          interaction.customId ===
          "claim_ticket"
        ) {

          await interaction.deferReply({
            flags:
              MessageFlags.Ephemeral
          });

          if (
            !isStaff(
              interaction.member
            )
          ) {
            return interaction.editReply({
              content:
                "❌ Nur Teammitglieder können Tickets übernehmen."
            });
          }

          const data =
            getTicketData(
              interaction.channel
            );

          if (!data) {
            return interaction.editReply({
              content:
                "❌ Ticket-Daten wurden nicht gefunden."
            });
          }

          if (
            data.claimedBy
          ) {
            return interaction.editReply({
              content:
                `❌ Dieses Ticket wurde bereits von <@${data.claimedBy}> übernommen.`
            });
          }

          data.claimedBy =
            interaction.user.id;

          await interaction.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(
                  "#57F287"
                )
                .setTitle(
                  "📌 Ticket übernommen"
                )
                .setDescription(
                  `Das Ticket wurde von ${interaction.user} übernommen.`
                )
                .setTimestamp()
            ]
          });

          return interaction.editReply({
            content:
              "✅ Du hast das Ticket übernommen."
          });
        }

        // ==================================================
        // FORWARD TICKET
        // ==================================================

        if (
          interaction.customId ===
          "forward_ticket"
        ) {

          if (
            !isStaff(
              interaction.member
            )
          ) {
            return interaction.reply({
              content:
                "❌ Nur Teammitglieder können Tickets weiterleiten.",

              flags:
                MessageFlags.Ephemeral
            });
          }

          const select =
            new UserSelectMenuBuilder()
              .setCustomId(
                "forward_ticket_user"
              )
              .setPlaceholder(
                "Teammitglied auswählen"
              )
              .setMinValues(
                1
              )
              .setMaxValues(
                1
              );

          return interaction.reply({
            content:
              "➡️ Wähle das Teammitglied aus:",

            components: [
              new ActionRowBuilder()
                .addComponents(
                  select
                )
            ],

            flags:
              MessageFlags.Ephemeral
          });
        }

        // ==================================================
        // CLOSE TICKET
        // ==================================================

        if (
          interaction.customId ===
          "close_ticket"
        ) {

          const data =
            getTicketData(
              interaction.channel
            );

          if (!data) {
            return interaction.reply({
              content:
                "❌ Ticket-Daten wurden nicht gefunden.",

              flags:
                MessageFlags.Ephemeral
            });
          }

          const canClose =
            interaction.user.id ===
              data.ownerId ||
            isStaff(
              interaction.member
            ) ||
            isAdmin(
              interaction.member
            );

          if (!canClose) {
            return interaction.reply({
              content:
                "❌ Du darfst dieses Ticket nicht schließen.",

              flags:
                MessageFlags.Ephemeral
            });
          }

          await interaction.reply({
            content:
              "🔒 Ticket wird geschlossen..."
          });

          const channel =
            interaction.channel;

          ticketData.delete(
            channel.id
          );

          setTimeout(
            () =>
              channel
                .delete(
                  `Ticket geschlossen von ${interaction.user.tag}`
                )
                .catch(
                  error =>
                    console.error(
                      "❌ Ticket löschen Fehler:",
                      error
                    )
                ),
            2000
          );

          return;
        }
      }

    } catch (error) {
      console.error(
        "❌ Interaction Fehler:",
        error
      );

      try {
        if (
          interaction.deferred ||
          interaction.replied
        ) {
          await interaction
            .editReply({
              content:
                "❌ Es ist ein Fehler aufgetreten."
            })
            .catch(
              () => {}
            );
        } else {
          await interaction.reply({
            content:
              "❌ Es ist ein Fehler aufgetreten.",

            flags:
              MessageFlags.Ephemeral
          });
        }
      } catch {}
    }
  }
);

// ======================================================
// COUNTING
// ======================================================

client.on(
  Events.MessageCreate,
  async message => {
    try {
      if (
        message.author.bot ||
        !countingActive ||
        message.channel.id !==
          countingChannelId
      ) {
        return;
      }

      const number =
        Number(
          message.content.trim()
        );

      if (
        !Number.isInteger(
          number
        )
      ) {
        await message
          .delete()
          .catch(
            () => {}
          );

        return;
      }

      if (
        message.author.id ===
        lastUserId
      ) {
        await message
          .delete()
          .catch(
            () => {}
          );

        await message.channel.send(
          `❌ ${message.author}, du darfst nicht zweimal hintereinander zählen!`
        );

        currentNumber =
          1;

        lastUserId =
          null;

        return;
      }

      if (
        number !==
        currentNumber
      ) {
        await message.channel.send(
          `❌ ${message.author} hat die falsche Zahl geschrieben!\n\n` +
          "🔄 Counting wurde zurückgesetzt.\n" +
          "🔢 Start wieder bei **1**."
        );

        currentNumber =
          1;

        lastUserId =
          null;

        return;
      }

      lastUserId =
        message.author.id;

      currentNumber++;

      await message
        .react(
          "✅"
        )
        .catch(
          () => {}
        );

    } catch (error) {
      console.error(
        "❌ Counting Fehler:",
        error
      );
    }
  }
);

// ======================================================
// SUPPORT VOICE + VOICE LOGS
// ======================================================

client.on(
  Events.VoiceStateUpdate,
  async (
    oldState,
    newState
  ) => {
    try {
      const member =
        newState.member ||
        oldState.member;

      if (!member) {
        return;
      }

      // ==================================================
      // SUPPORT WARTERAUM
      // ==================================================

      if (
        newState.channelId ===
          SUPPORT_WARTE_RAUM_ID &&
        oldState.channelId !==
          SUPPORT_WARTE_RAUM_ID
      ) {

        const supportLog =
          await client.channels
            .fetch(
              SUPPORT_LOG_CHANNEL_ID
            )
            .catch(
              () => null
            );

        if (
          supportLog
            ?.isTextBased()
        ) {

          const embed =
            baseEmbed(
              "🎧 Neue Support-Anfrage",
              0x00a8ff,
              "Ein Spieler wartet im Support-Warteraum."
            );

          embed.setThumbnail(
            member.user
              .displayAvatarURL()
          );

          embed.addFields(
            {
              name:
                "👤 Spieler",

              value:
                `${member} (${member.id})`
            },
            {
              name:
                "📞 Warteraum",

              value:
                newState.channel
                  ?.toString() ||
                "Unbekannt"
            },
            {
              name:
                "⏰ Zeit",

              value:
                `<t:${Math.floor(Date.now() / 1000)}:R>`
            }
          );

          await supportLog.send({
            content:
              `<@&${SUPPORT_ROLE_ID}>`,

            allowedMentions: {
              roles: [
                SUPPORT_ROLE_ID
              ]
            },

            embeds: [
              embed
            ]
          });
        }
      }

      // ==================================================
      // NORMALE VOICE LOGS
      // ==================================================

      if (
        oldState.channelId ===
        newState.channelId
      ) {
        return;
      }

      if (
        !oldState.channelId &&
        newState.channelId
      ) {
        const embed =
          baseEmbed(
            "🔊 Voice beigetreten",
            0x57f287
          );

        embed.addFields(
          {
            name:
              "👤 Nutzer",

            value:
              `${member} (${member.id})`
          },
          {
            name:
              "🎧 Channel",

            value:
              newState.channel
                ?.toString() ||
              "Unbekannt"
          }
        );

        await sendLog(
          newState.guild,
          embed
        );

        return;
      }

      if (
        oldState.channelId &&
        !newState.channelId
      ) {
        const embed =
          baseEmbed(
            "🔇 Voice verlassen",
            0xed4245
          );

        embed.addFields(
          {
            name:
              "👤 Nutzer",

            value:
              `${member} (${member.id})`
          },
          {
            name:
              "🎧 Channel",

            value:
              oldState.channel
                ?.toString() ||
              "Unbekannt"
          }
        );

        await sendLog(
          oldState.guild,
          embed
        );

        return;
      }

      if (
        oldState.channelId &&
        newState.channelId
      ) {
        const embed =
          baseEmbed(
            "🔁 Voice Channel gewechselt",
            0x5865f2
          );

        embed.addFields(
          {
            name:
              "👤 Nutzer",

            value:
              `${member} (${member.id})`
          },
          {
            name:
              "⬅️ Von",

            value:
              oldState.channel
                ?.toString() ||
              "Unbekannt"
          },
          {
            name:
              "➡️ Nach",

            value:
              newState.channel
                ?.toString() ||
              "Unbekannt"
          }
        );

        await sendLog(
          newState.guild,
          embed
        );
      }

    } catch (error) {
      console.error(
        "❌ Voice Fehler:",
        error
      );
    }
  }
);

// ======================================================
// MEMBER JOIN / WELCOME
// ======================================================

client.on(
  Events.GuildMemberAdd,
  async member => {
    try {

      const welcomeChannel =
        await member.guild
          .channels
          .fetch(
            WELCOME_CHANNEL_ID
          )
          .catch(
            () => null
          );

      if (
        welcomeChannel
          ?.isTextBased()
      ) {

        const welcomeEmbed =
          new EmbedBuilder()
            .setColor(
              "#FEE75C"
            )
            .setTitle(
              "⚡ Willkommen ⚡"
            )
            .setDescription(
`${member} ist dem Server beigetreten!

👤 **User:**
${member.user.tag}

🆔 **User ID:**
${member.id}

👥 **Mitglieder:**
${member.guild.memberCount}`
            )
            .setThumbnail(
              member.user
                .displayAvatarURL()
            )
            .setTimestamp()
            .setFooter({
              text:
                "VIBE Community"
            });

        await welcomeChannel.send({
          embeds: [
            welcomeEmbed
          ]
        });
      }

      const days =
        Math.floor(
          (
            Date.now() -
            member.user
              .createdTimestamp
          ) /
          86400000
        );

      const logEmbed =
        baseEmbed(
          "🟢 Mitglied beigetreten",
          0x57f287,
          "Ein neues Mitglied ist dem Server beigetreten."
        );

      logEmbed.setThumbnail(
        member.displayAvatarURL()
      );

      logEmbed.addFields(
        {
          name:
            "👤 Nutzer",

          value:
            `${member} (${member.user.tag})`
        },
        {
          name:
            "⏲️ Kontoalter",

          value:
            `${days} Tage`,

          inline:
            true
        },
        {
          name:
            "👥 Mitglieder",

          value:
            `${member.guild.memberCount}`,

          inline:
            true
        }
      );

      logEmbed.setFooter({
        text:
          `ID: ${member.id}`
      });

      await sendLog(
        member.guild,
        logEmbed
      );

    } catch (error) {
      console.error(
        "❌ Member Join Fehler:",
        error
      );
    }
  }
);

// ======================================================
// MEMBER LEAVE / KICK
// ======================================================

client.on(
  Events.GuildMemberRemove,
  async member => {
    try {

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            1000
          )
      );

      const entry =
        await getAuditExecutor(
          member.guild,
          AuditLogEvent.MemberKick,
          member.id
        );

      if (entry) {

        const embed =
          baseEmbed(
            "🥾 Mitglied gekickt",
            0xfaa61a,
            "Ein Mitglied wurde vom Server gekickt."
          );

        embed.addFields(
          {
            name:
              "👤 Nutzer",

            value:
              `${member.user.tag} (${member.id})`
          },
          {
            name:
              "🛡️ Verantwortlicher Moderator",

            value:
              entry.executor
                ? `${entry.executor} (${entry.executor.id})`
                : "Unbekannt"
          },
          {
            name:
              "📄 Grund",

            value:
              safeText(
                entry.reason,
                "Kein Grund angegeben"
              )
          }
        );

        await sendLog(
          member.guild,
          embed
        );

        return;
      }

      const embed =
        baseEmbed(
          "🔴 Mitglied hat den Server verlassen",
          0xed4245,
          "Ein Mitglied hat den Server verlassen."
        );

      embed.addFields({
        name:
          "👤 Nutzer",

        value:
          `${member.user.tag} (${member.id})`
      });

      embed.setFooter({
        text:
          `Aktuelle Memberanzahl: ${member.guild.memberCount}`
      });

      await sendLog(
        member.guild,
        embed
      );

    } catch (error) {
      console.error(
        "❌ Leave/Kick Fehler:",
        error
      );
    }
  }
);

// ======================================================
// BAN
// ======================================================

client.on(
  Events.GuildBanAdd,
  async ban => {
    try {

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            1000
          )
      );

      const entry =
        await getAuditExecutor(
          ban.guild,
          AuditLogEvent.MemberBanAdd,
          ban.user.id
        );

      const embed =
        baseEmbed(
          "⛔ Mitglied gebannt",
          0x992d22,
          "Ein Mitglied wurde gebannt."
        );

      embed.addFields({
        name:
          "👤 Nutzer",

        value:
          `${ban.user.tag} (${ban.user.id})`
      });

      if (entry) {
        embed.addFields(
          {
            name:
              "🛡️ Verantwortlicher Moderator",

            value:
              entry.executor
                ? `${entry.executor} (${entry.executor.id})`
                : "Unbekannt"
          },
          {
            name:
              "📄 Grund",

            value:
              safeText(
                entry.reason,
                "Kein Grund angegeben"
              )
          }
        );
      }

      await sendLog(
        ban.guild,
        embed
      );

    } catch (error) {
      console.error(
        "❌ Ban Log Fehler:",
        error
      );
    }
  }
);

// ======================================================
// UNBAN
// ======================================================

client.on(
  Events.GuildBanRemove,
  async ban => {
    try {

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            1000
          )
      );

      const entry =
        await getAuditExecutor(
          ban.guild,
          AuditLogEvent.MemberBanRemove,
          ban.user.id
        );

      const embed =
        baseEmbed(
          "✅ Mitglied entbannt",
          0x57f287,
          "Ein Mitglied wurde entbannt."
        );

      embed.addFields({
        name:
          "👤 Nutzer",

        value:
          `${ban.user.tag} (${ban.user.id})`
      });

      if (entry) {
        embed.addFields({
          name:
            "🛡️ Verantwortlicher",

          value:
            entry.executor
              ? `${entry.executor} (${entry.executor.id})`
              : "Unbekannt"
        });
      }

      await sendLog(
        ban.guild,
        embed
      );

    } catch (error) {
      console.error(
        "❌ Unban Log Fehler:",
        error
      );
    }
  }
);

// ======================================================
// TEAM ROLLEN
// ======================================================

function getTrackedTeamRoleIds(
  member
) {
  const roleIds =
    new Set();

  for (
    const roleConfig
    of TEAM_ROLE_CONFIG
  ) {
    if (
      member.roles.cache.has(
        roleConfig.id
      )
    ) {
      roleIds.add(
        roleConfig.id
      );
    }
  }

  return roleIds;
}

function setsEqual(
  first,
  second
) {
  if (
    first.size !==
    second.size
  ) {
    return false;
  }

  for (
    const value
    of first
  ) {
    if (
      !second.has(
        value
      )
    ) {
      return false;
    }
  }

  return true;
}

function getPrimaryTeamRole(
  roleIds
) {
  return (
    TEAM_ROLE_CONFIG.find(
      role =>
        roleIds.has(
          role.id
        )
    ) ||
    null
  );
}

async function sendTeamRoleMessage(
  guild,
  memberId,
  type,
  roleConfig = null
) {
  try {

    const channel =
      guild.channels.cache.get(
        TEAM_ROLE_MESSAGE_CHANNEL_ID
      ) ||
      await guild.channels
        .fetch(
          TEAM_ROLE_MESSAGE_CHANNEL_ID
        )
        .catch(
          () => null
        );

    if (
      !channel
        ?.isTextBased()
    ) {
      console.log(
        `⚠️ Team-Nachrichten-Channel nicht gefunden: ${TEAM_ROLE_MESSAGE_CHANNEL_ID}`
      );

      return;
    }

    let content =
      "";

    if (
      type ===
        "welcome" &&
      roleConfig
    ) {
      content =
`🎉 **Willkommen im Team!**

<@${memberId}> ist ab sofort <@&${roleConfig.id}> ${roleConfig.placeText}.

Wir freuen uns, dich im Team zu haben und wünschen dir viel Erfolg und vor allem viel Spaß bei deinen neuen Aufgaben! 🤝`;
    }

    else if (
      type ===
        "position" &&
      roleConfig
    ) {
      content =
`🔄 **Neue Position!**

<@${memberId}> übernimmt ab sofort die Position <@&${roleConfig.id}> ${roleConfig.placeText}.

Wir wünschen dir viel Erfolg und vor allem viel Spaß bei deinen neuen Aufgaben! 🤝`;
    }

    else if (
      type ===
      "leave"
    ) {
      content =
`👋 **Danke für deine Zeit!**

<@${memberId}> verlässt ab sofort das Team des **VIBE Clans**.

Wir bedanken uns für die gemeinsame Zeit und wünschen dir für deinen weiteren Weg alles Gute und viel Erfolg! 🤝`;
    }

    if (content) {
      await channel.send({
        content,

        allowedMentions: {
          users: [
            memberId
          ],

          roles: []
        }
      });
    }

  } catch (error) {
    console.error(
      "❌ Team-Rollen-Nachricht Fehler:",
      error
    );
  }
}

// ======================================================
// TEAM ROLLEN UPDATE
// FIX GEGEN DOPPELTE NACHRICHTEN
// ======================================================

async function processTeamRoleUpdate(
  key
) {

  const update =
    pendingTeamRoleUpdates.get(
      key
    );

  if (!update) {
    return;
  }

  pendingTeamRoleUpdates.delete(
    key
  );

  const {
    beforeRoleIds,
    afterRoleIds
  } = update;

  if (
    setsEqual(
      beforeRoleIds,
      afterRoleIds
    )
  ) {
    return;
  }

  const addedRoleIds =
    new Set(
      [
        ...afterRoleIds
      ].filter(
        id =>
          !beforeRoleIds.has(
            id
          )
      )
    );

  // ERSTE TEAM-ROLLE

  if (
    beforeRoleIds.size ===
      0 &&
    afterRoleIds.size >
      0
  ) {

    const roleConfig =
      getPrimaryTeamRole(
        addedRoleIds.size
          ? addedRoleIds
          : afterRoleIds
      );

    if (roleConfig) {
      await sendTeamRoleMessage(
        update.guild,
        update.memberId,
        "welcome",
        roleConfig
      );
    }

    return;
  }

  // ALLE TEAM-ROLLEN ENTFERNT

  if (
    beforeRoleIds.size >
      0 &&
    afterRoleIds.size ===
      0
  ) {

    await sendTeamRoleMessage(
      update.guild,
      update.memberId,
      "leave"
    );

    return;
  }

  // NUR WENN NEUE ROLLE HINZUKOMMT
  // ALTE ROLLE ENTFERNEN = KEINE EXTRA NACHRICHT

  if (
    addedRoleIds.size >
    0
  ) {

    const roleConfig =
      getPrimaryTeamRole(
        addedRoleIds
      );

    if (roleConfig) {
      await sendTeamRoleMessage(
        update.guild,
        update.memberId,
        "position",
        roleConfig
      );
    }
  }
}

client.on(
  Events.GuildMemberUpdate,
  (
    before,
    after
  ) => {

    const beforeRoleIds =
      getTrackedTeamRoleIds(
        before
      );

    const afterRoleIds =
      getTrackedTeamRoleIds(
        after
      );

    if (
      setsEqual(
        beforeRoleIds,
        afterRoleIds
      )
    ) {
      return;
    }

    const key =
      `${after.guild.id}:${after.id}`;

    const existing =
      pendingTeamRoleUpdates.get(
        key
      );

    if (existing) {
      clearTimeout(
        existing.timer
      );

      existing.afterRoleIds =
        afterRoleIds;

      existing.guild =
        after.guild;

      existing.memberId =
        after.id;

      existing.timer =
        setTimeout(
          () =>
            processTeamRoleUpdate(
              key
            ),
          1500
        );

      return;
    }

    const update = {
      guild:
        after.guild,

      memberId:
        after.id,

      beforeRoleIds,

      afterRoleIds,

      timer:
        null
    };

    update.timer =
      setTimeout(
        () =>
          processTeamRoleUpdate(
            key
          ),
        1500
      );

    pendingTeamRoleUpdates.set(
      key,
      update
    );
  }
);

// ======================================================
// MEMBER UPDATE LOGS
// ======================================================

client.on(
  Events.GuildMemberUpdate,
  async (
    before,
    after
  ) => {
    try {

      // ==================================================
      // NICKNAME
      // ==================================================

      if (
        before.nickname !==
        after.nickname
      ) {

        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              1000
            )
        );

        const entry =
          await getAuditExecutor(
            after.guild,
            AuditLogEvent.MemberUpdate,
            after.id
          );

        const embed =
          baseEmbed(
            "✏️ Nickname geändert",
            0x5865f2,
            "Der Nickname eines Mitglieds wurde geändert."
          );

        embed.addFields(
          {
            name:
              "👤 Nutzer",

            value:
              `${after} (${after.id})`
          },
          {
            name:
              "📝 Vorher",

            value:
              safeText(
                before.nickname,
                before.user.username
              )
          },
          {
            name:
              "📝 Nachher",

            value:
              safeText(
                after.nickname,
                after.user.username
              )
          }
        );

        if (entry) {
          embed.addFields({
            name:
              "🛡️ Verantwortlicher",

            value:
              entry.executor
                ? `${entry.executor} (${entry.executor.id})`
                : "Unbekannt"
          });
        }

        await sendLog(
          after.guild,
          embed
        );
      }

      // ==================================================
      // ROLLEN
      // ==================================================

      const beforeRoles =
        new Set(
          before.roles.cache.map(
            role =>
              role.id
          )
        );

      const afterRoles =
        new Set(
          after.roles.cache.map(
            role =>
              role.id
          )
        );

      const addedRoles =
        after.roles.cache.filter(
          role =>
            !beforeRoles.has(
              role.id
            )
        );

      const removedRoles =
        before.roles.cache.filter(
          role =>
            !afterRoles.has(
              role.id
            )
        );

      if (
        !addedRoles.size &&
        !removedRoles.size
      ) {
        return;
      }

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            1000
          )
      );

      const entry =
        await getAuditExecutor(
          after.guild,
          AuditLogEvent.MemberRoleUpdate,
          after.id
        );

      const embed =
        baseEmbed(
          "👥 Rollen aktualisiert",
          0x5865f2,
          "Die Rollen eines Mitglieds wurden geändert."
        );

      embed.addFields({
        name:
          "👤 Nutzer",

        value:
          `${after} (${after.id})`
      });

      if (
        addedRoles.size
      ) {
        embed.addFields({
          name:
            "✅ Hinzugefügt",

          value:
            addedRoles
              .map(
                role =>
                  role.toString()
              )
              .join(
                "\n"
              )
              .substring(
                0,
                1024
              )
        });
      }

      if (
        removedRoles.size
      ) {
        embed.addFields({
          name:
            "❌ Entfernt",

          value:
            removedRoles
              .map(
                role =>
                  role.toString()
              )
              .join(
                "\n"
              )
              .substring(
                0,
                1024
              )
        });
      }

      if (entry) {
        embed.addFields({
          name:
            "🛡️ Verantwortlicher",

          value:
            entry.executor
              ? `${entry.executor} (${entry.executor.id})`
              : "Unbekannt"
        });
      }

      await sendLog(
        after.guild,
        embed
      );

    } catch (error) {
      console.error(
        "❌ Member Update Fehler:",
        error
      );
    }
  }
);

// ======================================================
// CHANNEL CREATE
// ======================================================

client.on(
  Events.ChannelCreate,
  async channel => {
    try {

      if (!channel.guild) {
        return;
      }

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            500
          )
      );

      const entry =
        await getAuditExecutor(
          channel.guild,
          AuditLogEvent.ChannelCreate,
          channel.id
        );

      const embed =
        baseEmbed(
          "➕ Kanal erstellt",
          0x57f287,
          "Ein Kanal wurde erstellt."
        );

      embed.addFields(
        {
          name:
            "📁 Kanal",

          value:
            channel.toString()
        },
        {
          name:
            "🆔 ID",

          value:
            channel.id
        }
      );

      if (
        entry
          ?.executor
      ) {
        embed.addFields({
          name:
            "🛡️ Erstellt von",

          value:
            `${entry.executor} (${entry.executor.id})`
        });
      }

      await sendLog(
        channel.guild,
        embed
      );

    } catch (error) {
      console.error(
        "❌ Channel Create Fehler:",
        error
      );
    }
  }
);

// ======================================================
// CHANNEL DELETE
// ======================================================

client.on(
  Events.ChannelDelete,
  async channel => {
    try {

      if (!channel.guild) {
        return;
      }

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            500
          )
      );

      const entry =
        await getAuditExecutor(
          channel.guild,
          AuditLogEvent.ChannelDelete,
          channel.id
        );

      const embed =
        baseEmbed(
          "➖ Kanal gelöscht",
          0xed4245,
          "Ein Kanal wurde gelöscht."
        );

      embed.addFields(
        {
          name:
            "📁 Name",

          value:
            safeText(
              channel.name
            )
        },
        {
          name:
            "🆔 ID",

          value:
            channel.id
        }
      );

      if (
        entry
          ?.executor
      ) {
        embed.addFields({
          name:
            "🛡️ Gelöscht von",

          value:
            `${entry.executor} (${entry.executor.id})`
        });
      }

      await sendLog(
        channel.guild,
        embed
      );

    } catch (error) {
      console.error(
        "❌ Channel Delete Fehler:",
        error
      );
    }
  }
);

// ======================================================
// CHANNEL UPDATE
// ======================================================

client.on(
  Events.ChannelUpdate,
  async (
    before,
    after
  ) => {
    try {

      if (!after.guild) {
        return;
      }

      if (
        before.name !==
        after.name
      ) {

        const embed =
          baseEmbed(
            "✏️ Kanalname geändert",
            0x5865f2,
            "Ein Kanal wurde umbenannt."
          );

        embed.addFields(
          {
            name:
              "📁 Kanal",

            value:
              after.toString()
          },
          {
            name:
              "📝 Vorher",

            value:
              safeText(
                before.name
              )
          },
          {
            name:
              "📝 Nachher",

            value:
              safeText(
                after.name
              )
          }
        );

        await sendLog(
          after.guild,
          embed
        );
      }

      if (
        before.permissionOverwrites &&
        after.permissionOverwrites &&
        !before.permissionOverwrites
          .cache
          .equals(
            after.permissionOverwrites
              .cache
          )
      ) {

        const embed =
          baseEmbed(
            "🔐 Kanal-Berechtigungen aktualisiert",
            0x5865f2,
            "Die Berechtigungen eines Kanals wurden geändert."
          );

        embed.addFields({
          name:
            "📁 Kanal",

          value:
            after.toString()
        });

        await sendLog(
          after.guild,
          embed
        );
      }

    } catch (error) {
      console.error(
        "❌ Channel Update Fehler:",
        error
      );
    }
  }
);

// ======================================================
// ROLE CREATE
// ======================================================

client.on(
  Events.GuildRoleCreate,
  async role => {
    try {

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            500
          )
      );

      const entry =
        await getAuditExecutor(
          role.guild,
          AuditLogEvent.RoleCreate,
          role.id
        );

      const embed =
        baseEmbed(
          "➕ Rolle erstellt",
          0x57f287
        );

      embed.addFields({
        name:
          "🎭 Rolle",

        value:
          `${role} (${role.id})`
      });

      if (
        entry
          ?.executor
      ) {
        embed.addFields({
          name:
            "🛡️ Erstellt von",

          value:
            `${entry.executor} (${entry.executor.id})`
        });
      }

      await sendLog(
        role.guild,
        embed
      );

    } catch (error) {
      console.error(
        "❌ Role Create Log Fehler:",
        error
      );
    }
  }
);

// ======================================================
// ROLE DELETE
// ======================================================

client.on(
  Events.GuildRoleDelete,
  async role => {
    try {

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            500
          )
      );

      const entry =
        await getAuditExecutor(
          role.guild,
          AuditLogEvent.RoleDelete,
          role.id
        );

      const embed =
        baseEmbed(
          "➖ Rolle gelöscht",
          0xed4245
        );

      embed.addFields(
        {
          name:
            "🎭 Rollenname",

          value:
            safeText(
              role.name
            )
        },
        {
          name:
            "🆔 Rollen ID",

          value:
            role.id
        }
      );

      if (
        entry
          ?.executor
      ) {
        embed.addFields({
          name:
            "🛡️ Gelöscht von",

          value:
            `${entry.executor} (${entry.executor.id})`
        });
      }

      await sendLog(
        role.guild,
        embed
      );

    } catch (error) {
      console.error(
        "❌ Role Delete Log Fehler:",
        error
      );
    }
  }
);

// ======================================================
// ROLE UPDATE
// ======================================================

client.on(
  Events.GuildRoleUpdate,
  async (
    oldRole,
    newRole
  ) => {
    try {

      const changes =
        [];

      if (
        oldRole.name !==
        newRole.name
      ) {
        changes.push(
          `**Name:** ${oldRole.name} → ${newRole.name}`
        );
      }

      if (
        oldRole.hexColor !==
        newRole.hexColor
      ) {
        changes.push(
          `**Farbe:** ${oldRole.hexColor} → ${newRole.hexColor}`
        );
      }

      if (
        oldRole.hoist !==
        newRole.hoist
      ) {
        changes.push(
          `**Separat angezeigt:** ${oldRole.hoist} → ${newRole.hoist}`
        );
      }

      if (
        oldRole.mentionable !==
        newRole.mentionable
      ) {
        changes.push(
          `**Erwähnbar:** ${oldRole.mentionable} → ${newRole.mentionable}`
        );
      }

      if (
        !changes.length
      ) {
        return;
      }

      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            500
          )
      );

      const entry =
        await getAuditExecutor(
          newRole.guild,
          AuditLogEvent.RoleUpdate,
          newRole.id
        );

      const embed =
        baseEmbed(
          "🔧 Rolle bearbeitet",
          0x5865f2
        );

      embed.addFields(
        {
          name:
            "🎭 Rolle",

          value:
            `${newRole} (${newRole.id})`
        },
        {
          name:
            "📝 Änderungen",

          value:
            changes
              .join(
                "\n"
              )
              .slice(
                0,
                1024
              )
        }
      );

      if (
        entry
          ?.executor
      ) {
        embed.addFields({
          name:
            "🛡️ Bearbeitet von",

          value:
            `${entry.executor} (${entry.executor.id})`
        });
      }

      await sendLog(
        newRole.guild,
        embed
      );

    } catch (error) {
      console.error(
        "❌ Role Update Log Fehler:",
        error
      );
    }
  }
);

// ======================================================
// MESSAGE DELETE
// ======================================================

client.on(
  Events.MessageDelete,
  async message => {
    try {

      if (
        !message.guild ||
        message.author?.id ===
          client.user?.id
      ) {
        return;
      }

      const content =
        message.content
          ? message.content.substring(
              0,
              1000
            )
          : "*(Kein Textinhalt / Embed / Anhang)*";

      const embed =
        baseEmbed(
          "🗑️ Nachricht gelöscht",
          0xed4245,
          "Eine Nachricht wurde gelöscht."
        );

      embed.addFields(
        {
          name:
            "👤 Autor",

          value:
            message.author
              ? `${message.author} (${message.author.id})`
              : "Unbekannt"
        },
        {
          name:
            "📍 Kanal",

          value:
            message.channel
              ?.toString() ||
            "Unbekannt"
        },
        {
          name:
            "💬 Inhalt",

          value:
            safeText(
              content,
              "*(Kein Inhalt)*"
            ).substring(
              0,
              1024
            )
        }
      );

      await sendLog(
        message.guild,
        embed
      );

    } catch (error) {
      console.error(
        "❌ Message Delete Logging Fehler:",
        error
      );
    }
  }
);

// ======================================================
// MESSAGE EDIT
// ======================================================

client.on(
  Events.MessageUpdate,
  async (
    before,
    after
  ) => {
    try {

      if (
        !before.guild ||
        before.author?.bot ||
        before.content ===
          after.content
      ) {
        return;
      }

      const embed =
        baseEmbed(
          "✏️ Nachricht bearbeitet",
          0xfee75c,
          "Eine Nachricht wurde bearbeitet."
        );

      embed.addFields(
        {
          name:
            "👤 Autor",

          value:
            before.author
              ? `${before.author} (${before.author.id})`
              : "Unbekannt"
        },
        {
          name:
            "📍 Kanal",

          value:
            before.channel
              ?.toString() ||
            "Unbekannt"
        },
        {
          name:
            "📝 Vorher",

          value:
            safeText(
              before.content,
              "*(leer)*"
            ).substring(
              0,
              1024
            )
        },
        {
          name:
            "📝 Nachher",

          value:
            safeText(
              after.content,
              "*(leer)*"
            ).substring(
              0,
              1024
            )
        }
      );

      if (
        after.url
      ) {
        embed.addFields({
          name:
            "🔗 Nachricht",

          value:
            `[Zur Nachricht](${after.url})`
        });
      }

      await sendLog(
        before.guild,
        embed
      );

    } catch (error) {
      console.error(
        "❌ Message Edit Logging Fehler:",
        error
      );
    }
  }
);

// ======================================================
// FEHLER LOGS
// ======================================================

client.on(
  Events.Error,
  error => {
    console.error(
      "❌ Discord Client Fehler:",
      error
    );
  }
);

client.on(
  Events.Warn,
  warning => {
    console.warn(
      "⚠️ Discord Warnung:",
      warning
    );
  }
);

process.on(
  "unhandledRejection",
  error => {
    console.error(
      "❌ Unhandled Promise Rejection:",
      error
    );
  }
);

process.on(
  "uncaughtException",
  error => {
    console.error(
      "❌ Uncaught Exception:",
      error
    );
  }
);

// ======================================================
// START
// ======================================================

console.log(
  "✅ VIBE Bot Systeme geladen."
);

console.log(
  "✅ Team-Rollen-Nachrichten System geladen."
);
