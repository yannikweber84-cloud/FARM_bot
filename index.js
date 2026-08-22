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
// KLEINER WEB SERVER NUR FÜR RENDER / HEALTHCHECK
// KEINE ADMIN-WEBSEITE, KEIN LOGIN
// ======================================================

const app = express();
const PORT = process.env.PORT || 3000;

// Alle Bot-Funktionen sind dauerhaft aktiv.
function isFeatureEnabled() {
    return true;
}

app.get(
    "/",
    (req, res) => {
        res.status(200).send("VIBE Bot ist online.");
    }
);

app.get(
    "/health",
    (req, res) => {
        res.status(200).json({
            status: "online",
            service: "VIBE Bot"
        });
    }
);

app.listen(
    PORT,
    () => {
        console.log(
            `🌐 Health-Webserver läuft auf Port ${PORT}`
        );
    }
);

// ======================================================
// KONFIGURATION
// ======================================================

const TOKEN =
    process.env.TOKEN;

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

const SERVER_LOG_CHANNEL_ID =
    process.env.SERVER_LOG_CHANNEL_ID ||
    "1540814913985970304";

// ======================================================
// TEAM-ROLLEN NACHRICHTEN
// HIER DIE ECHTEN DISCORD-IDs EINTRAGEN
// ======================================================

// Channel, in den die Team-Nachrichten gesendet werden:
const TEAM_ROLE_MESSAGE_CHANNEL_ID =
    "1540814913755156540";

// Rollen:
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

// Reihenfolge = Priorität, falls ein Mitglied mehrere Team-Rollen hat.
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
// COUNTING
// ======================================================

let countingActive =
    false;

let countingChannelId =
    null;

let currentNumber =
    1;

let lastUserId =
    null;

// ======================================================
// TICKET DATEN
// ======================================================

const ticketData =
    new Map();

// ======================================================
// GIVEAWAY DATEN
// ======================================================

const giveawayData =
    new Map();

const giveawayTimers =
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
// SICHERER TEXT
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

    if (!text) {

        return fallback;

    }

    return text;

}

// ======================================================
// BASIS EMBED
// ======================================================

function baseEmbed(
    title,
    color = 0x5865f2,
    description = null
) {

    const embed =
        new EmbedBuilder();

    embed.setTitle(

        safeText(
            title,
            "VIBE Server Log"
        )

    );

    embed.setColor(

        typeof color === "number"
            ? color
            : 0x5865f2

    );

    if (
        description !== null &&
        description !== undefined
    ) {

        const text =
            String(
                description
            ).trim();

        if (
            text.length > 0
        ) {

            embed.setDescription(
                text
            );

        }

    }

    embed.setTimestamp();

    return embed;

}

// ======================================================
// LOG CHANNEL
// ======================================================

function getLogChannel(
    guild
) {

    if (!guild) {

        return null;

    }

    const channel =
        guild.channels.cache.get(
            SERVER_LOG_CHANNEL_ID
        );

    if (!channel) {

        return null;

    }

    if (
        !channel.isTextBased()
    ) {

        return null;

    }

    return channel;

}

// ======================================================
// LOG SENDEN
// SERVER-LOGGING
// ======================================================

async function sendLog(
    guild,
    embed
) {

    try {

        if (
            !isFeatureEnabled(
                "serverLogs"
            )
        ) {

            return;

        }

        if (
            !guild ||
            !embed
        ) {

            return;

        }

        const channel =
            getLogChannel(
                guild
            );

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

                limit:
                    maxEntries,

                type:
                    action

            });

        const entry =
            logs.entries.find(

                entry => {

                    if (
                        !entry.target ||
                        !entry.target.id
                    ) {

                        return false;

                    }

                    return (

                        entry.target.id ===
                            targetId &&

                        Date.now() -
                            entry.createdTimestamp <
                            10000

                    );

                }

            );

        return entry || null;

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
// ADMIN PRÜFEN
// ======================================================

function isAdmin(
    member
) {

    if (!member) {

        return false;

    }

    return member.permissions.has(

        PermissionsBitField
            .Flags
            .Administrator

    );

}

// ======================================================
// STAFF PRÜFEN
// ======================================================

function isStaff(
    member
) {

    if (!member) {

        return false;

    }

    return (

        member.roles.cache.has(
            STAFF_ROLE_ID
        ) ||

        isAdmin(
            member
        )

    );

}

// ======================================================
// TICKET INFO
// ======================================================

function getTicketData(
    channel
) {

    if (!channel) {

        return null;

    }

    return (

        ticketData.get(
            channel.id
        ) ||

        null

    );

}

// ======================================================
// GIVEAWAY DAUER UMWANDELN
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

    if (
        shortMatch
    ) {

        const amount =
            Number(
                shortMatch[1]
            );

        const unit =
            shortMatch[2]
                .toLowerCase();

        const multipliers = {

            s:
                1000,

            m:
                60 *
                1000,

            h:
                60 *
                60 *
                1000,

            d:
                24 *
                60 *
                60 *
                1000,

            w:
                7 *
                24 *
                60 *
                60 *
                1000

        };

        return Math.floor(

            amount *
            multipliers[unit]

        );

    }

    const longMatch =
        value.match(

            /^(\d+(?:\.\d+)?)\s*(sekunde|sekunden|min|minute|minuten|stunde|stunden|std|tag|tage|tagen|woche|wochen)$/i

        );

    if (
        !longMatch
    ) {

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
        unit === "sekunde" ||
        unit === "sekunden"
    ) {

        multiplier =
            1000;

    }

    if (
        unit === "min" ||
        unit === "minute" ||
        unit === "minuten"
    ) {

        multiplier =
            60 *
            1000;

    }

    if (
        unit === "stunde" ||
        unit === "stunden" ||
        unit === "std"
    ) {

        multiplier =
            60 *
            60 *
            1000;

    }

    if (
        unit === "tag" ||
        unit === "tage" ||
        unit === "tagen"
    ) {

        multiplier =
            24 *
            60 *
            60 *
            1000;

    }

    if (
        unit === "woche" ||
        unit === "wochen"
    ) {

        multiplier =
            7 *
            24 *
            60 *
            60 *
            1000;

    }

    if (
        !multiplier
    ) {

        return null;

    }

    return Math.floor(

        amount *
        multiplier

    );

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

    if (
        ended
    ) {

        embed.addFields({

            name:
                "🎉 Ergebnis",

            value:

                winnerIds.length > 0

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

// ======================================================
// GEWINNER ZIEHEN
// ======================================================

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
        pool.length > 0 &&
        winners.length < count
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

// ======================================================
// REST
// ======================================================

const rest =
    new REST({

        version:
            "10"

    }).setToken(
        TOKEN
    );

// ======================================================
// COMMANDS REGISTRIEREN
// ======================================================

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

        return true;

    } catch (error) {

        console.error(
            "❌ Fehler beim Registrieren:",
            error
        );

        return false;

    }

}

// ======================================================
// BOT READY
// ======================================================

client.once(

    Events.ClientReady,

    async () => {

        console.log("");

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

        console.log("");

        await registerCommands();

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
                        !isFeatureEnabled(
                            "giveaways"
                        )
                    ) {

                        return interaction.reply({

                            content:
                                "❌ Das Giveaway-System ist derzeit deaktiviert.",

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }

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
                        !isFeatureEnabled(
                            "counting"                        )
                    ) {

                        return interaction.reply({

                            content:
                                "❌ Das Counting-System ist derzeit deaktiviert.",

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }

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
                        !isFeatureEnabled(
                            "serverLogs"
                        )
                    ) {

                        return interaction.reply({

                            content:
                                "❌ Das Logging ist derzeit deaktiviert.",

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }

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
                                    ? interaction.channel.toString()
                                    : "Unbekannt"

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
                // /CLEAR
                // ==================================================

                if (
                    interaction.commandName ===
                    "clear"
                ) {

                    if (
                        !isFeatureEnabled(
                            "clear"
                        )
                    ) {

                        return interaction.reply({

                            content:
                                "❌ `/clear` ist derzeit deaktiviert.",

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }

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

                    try {

                        let remaining =
                            amount;

                        let deletedTotal =
                            0;

                        while (
                            remaining > 0
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
                                deletedCount === 0 ||
                                deletedCount <
                                    batchSize
                            ) {

                                break;

                            }

                            if (
                                remaining > 0
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

                        const logEmbed =
                            baseEmbed(

                                "🧹 Nachrichten gelöscht",

                                0xed4245

                            );

                        logEmbed.addFields(

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
                            logEmbed
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
                        !isFeatureEnabled(
                            "tickets"
                        )
                    ) {

                        return interaction.reply({

                            content:
                                "❌ Das Ticket-System ist derzeit deaktiviert.",

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }

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

                    const row =
                        new ActionRowBuilder()

                            .addComponents(
                                menu
                            );

                    return interaction.reply({

                        embeds: [
                            embed
                        ],

                        components: [
                            row
                        ]

                    });

                }

                return;

            }

            // ==================================================
            // GIVEAWAY MODAL ABGESENDET
            // ==================================================

            if (
                interaction.isModalSubmit() &&
                interaction.customId ===
                    "create_giveaway_modal"
            ) {

                if (
                    !isFeatureEnabled(
                        "giveaways"
                    )
                ) {

                    return interaction.reply({

                        content:
                            "❌ Das Giveaway-System ist deaktiviert.",

                        flags:
                            MessageFlags.Ephemeral

                    });

                }

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
                    winnerCount < 1 ||
                    winnerCount > 20
                ) {

                    return interaction.reply({

                        content:
                            "❌ Die Anzahl der Gewinner muss zwischen **1 und 20** liegen.",

                        flags:
                            MessageFlags.Ephemeral

                    });

                }

                if (
                    !prize
                ) {

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

                    prize:
                        prize,

                    description:
                        description,

                    winnerCount:
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

                const row =
                    new ActionRowBuilder()

                        .addComponents(
                            joinButton
                        );

                const giveawayMessage =
                    await interaction.channel
                        .send({

                            embeds: [

                                createGiveawayEmbed(
                                    data
                                )

                            ],

                            components: [
                                row
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

                if (
                    !isFeatureEnabled(
                        "tickets"
                    )
                ) {

                    return interaction.reply({

                        content:
                            "❌ Das Ticket-System ist deaktiviert.",

                        flags:
                            MessageFlags.Ephemeral

                    });

                }

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

                if (
                    !config
                ) {

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

                if (
                    existing
                ) {

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
                                        .everyone.id,

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

                const claimButton =
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
                        );

                const forwardButton =
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
                        );

                const closeButton =
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
                        );

                const row =
                    new ActionRowBuilder()

                        .addComponents(

                            claimButton,

                            forwardButton,

                            closeButton

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

                const selectedUserId =
                    interaction.values[0];

                const selectedMember =
                    await interaction.guild
                        .members
                        .fetch(
                            selectedUserId
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

                const channel =
                    interaction.channel;

                const data =
                    getTicketData(
                        channel
                    );

                if (
                    !data
                ) {

                    return interaction.editReply({

                        content:
                            "❌ Ticket-Daten nicht gefunden."

                    });

                }

                await channel
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

                await channel.send({

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
            // ==================================================            // ==================================================

            if (
                interaction.isButton()
            ) {

                // ==================================================
                // GIVEAWAY TEILNAHME
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

                    if (
                        !isFeatureEnabled(
                            "giveaways"
                        )
                    ) {

                        return interaction.editReply({

                            content:
                                "❌ Das Giveaway-System ist deaktiviert."

                        });

                    }

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

                    if (
                        !data
                    ) {

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

                    if (
                        !data
                    ) {

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

                    const row =
                        new ActionRowBuilder()

                            .addComponents(
                                select
                            );

                    return interaction.reply({

                        content:
                            "➡️ Wähle das Teammitglied aus:",

                        components: [
                            row
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

                    if (
                        !data
                    ) {

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

                    if (
                        !canClose
                    ) {

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
                        async () => {

                            await channel
                                .delete(
                                    `Ticket geschlossen von ${interaction.user.tag}`
                                )
                                .catch(
                                    error => {

                                        console.error(
                                            "❌ Ticket löschen Fehler:",
                                            error
                                        );

                                    }
                                );

                        },
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
// COUNTING NACHRICHTEN
// ======================================================

client.on(
    Events.MessageCreate,
    async message => {

        try {

            if (
                message.author.bot
            ) {

                return;

            }

            if (
                !isFeatureEnabled(
                    "counting"
                )
            ) {

                return;

            }

            if (
                !countingActive
            ) {

                return;

            }

            if (
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
                    `🔄 Counting wurde zurückgesetzt.\n` +
                    `🔢 Start wieder bei **1**.`

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

            await message.react(
                "✅"
            ).catch(
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
// GIVEAWAY BEENDEN
// ======================================================

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

    if (
        timer
    ) {

        clearTimeout(
            timer
        );

        giveawayTimers.delete(
            giveawayId
        );

    }

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

    if (
        !guild
    ) {

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

    if (
        message
    ) {

        const disabledButton =
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

        const row =
            new ActionRowBuilder()

                .addComponents(
                    disabledButton
                );

        await message.edit({

            embeds: [

                createGiveawayEmbed(
                    data,
                    true,
                    winners
                )

            ],

            components: [
                row
            ]

        }).catch(
            () => {}
        );

    }

    if (
        winners.length > 0
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
                    winners            }

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

// ======================================================
// GIVEAWAY TIMER
// ======================================================

function scheduleGiveawayEnd(
    giveawayId
) {

    const data =
        giveawayData.get(
            giveawayId
        );

    if (
        !data
    ) {

        return;

    }

    const scheduleNext =
        () => {

            const current =
                giveawayData.get(
                    giveawayId
                );

            if (
                !current ||
                current.ended
            ) {

                return;

            }

            const remaining =
                current.endAt -
                Date.now();

            if (
                remaining <= 0
            ) {

                endGiveaway(
                    giveawayId
                ).catch(
                    error => {

                        console.error(
                            "❌ Giveaway End Fehler:",
                            error
                        );

                    }
                );

                return;

            }

            const wait =
                Math.min(
                    remaining,
                    2_000_000_000
                );

            const timer =
                setTimeout(
                    scheduleNext,
                    wait
                );

            giveawayTimers.set(
                giveawayId,
                timer
            );

        };

    scheduleNext();

}

// ======================================================
// SUPPORT VOICE WARTERAUM
// ======================================================

client.on(
    Events.VoiceStateUpdate,
    async (oldState, newState) => {

        try {

            if (
                !isFeatureEnabled(
                    "supportVoice"
                )
            ) {
                return;
            }

            if (
                newState.channelId !==
                SUPPORT_WARTE_RAUM_ID
            ) {
                return;
            }

            if (
                oldState.channelId ===
                SUPPORT_WARTE_RAUM_ID
            ) {
                return;
            }

            const guild =
                newState.guild;

            const member =
                newState.member;

            if (
                !guild ||
                !member
            ) {
                return;
            }

            const logChannel =
                await guild.channels
                    .fetch(
                        SUPPORT_LOG_CHANNEL_ID
                    )
                    .catch(
                        () => null
                    );

            if (
                !logChannel ||
                !logChannel.isTextBased()
            ) {
                return;
            }

            const embed =
                baseEmbed(
                    "🎧 Neue Support-Anfrage",
                    0x00a8ff,
                    "Ein Spieler wartet im Support-Warteraum."
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
                            ? newState.channel.toString()
                            : "Unbekannt"
                },
                {
                    name:
                        "⏰ Zeit",

                    value:
                        `<t:${Math.floor(Date.now() / 1000)}:R>`
                }
            );

            embed.setThumbnail(
                member.user.displayAvatarURL({
                    dynamic: true
                })
            );

            await logChannel.send({
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

            await sendLog(
                guild,
                embed
            );

        } catch (error) {

            console.error(
                "❌ Voice Support Fehler:",
                error
            );

        }

    }
);

// ======================================================
// WELCOME SYSTEM
// ======================================================

client.on(
    Events.GuildMemberAdd,
    async member => {

        try {

            if (
                !isFeatureEnabled(
                    "welcome"
                )
            ) {
                return;
            }

            const channel =
                member.guild.channels.cache.get(
                    WELCOME_CHANNEL_ID
                );

            if (
                !channel ||
                !channel.isTextBased()
            ) {
                return;
            }

            const embed =
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
                        member.user.displayAvatarURL({
                            dynamic: true
                        })
                    )

                    .setTimestamp()

                    .setFooter({
                        text:
                            "VIBE Community"
                    });

            await channel.send({
                embeds: [
                    embed
                ]
            });

        } catch (error) {

            console.error(
                "❌ Welcome Fehler:",
                error
            );

        }

    }
);

// ======================================================
// MEMBER JOIN LOG
// ======================================================

client.on(
    Events.GuildMemberAdd,
    async member => {

        try {

            if (
                !isFeatureEnabled(
                    "memberLogs"
                )
            ) {
                return;
            }

            const accountAge =
                Date.now() -
                member.user.createdTimestamp;

            const days =
                Math.floor(
                    accountAge /
                    86400000
                );

            const embed =
                baseEmbed(
                    "🟢 Mitglied beigetreten",
                    0x57f287,
                    "Ein neues Mitglied ist dem Server beigetreten."
                );

            embed.setThumbnail(
                member.displayAvatarURL()
            );

            embed.addFields(
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

            embed.setFooter({
                text:
                    `ID: ${member.id}`
            });

            await sendLog(
                member.guild,
                embed
            );

        } catch (error) {

            console.error(
                "❌ Join Log Fehler:",
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

            if (
                !isFeatureEnabled(
                    "memberLogs"
                ) &&
                !isFeatureEnabled(
                    "moderationLogs"
                )
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
                    member.guild,
                    AuditLogEvent.MemberKick,
                    member.id
                );

            if (
                entry
            ) {

                if (
                    !isFeatureEnabled(
                        "moderationLogs"
                    )
                ) {
                    return;
                }

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

            if (
                !isFeatureEnabled(
                    "memberLogs"
                )
            ) {
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

            if (
                !isFeatureEnabled(
                    "moderationLogs"
                )
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

            if (
                entry
            ) {

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

            if (
                !isFeatureEnabled(
                    "moderationLogs"
                )
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

            if (
                entry
            ) {

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
// TEAM-ROLLEN: WILLKOMMEN / POSITION / VERLASSEN
// ======================================================

const pendingTeamRoleUpdates =
    new Map();

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
            !channel ||
            !channel.isTextBased()
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

        } else if (
            type ===
            "position" &&
            roleConfig
        ) {

            content =
`🔄 **Neue Position!**

<@${memberId}> übernimmt ab sofort die Position <@&${roleConfig.id}> ${roleConfig.placeText}.

Wir wünschen dir viel Erfolg und vor allem viel Spaß bei deinen neuen Aufgaben! 🤝`;

        } else if (
            type ===
            "leave"
        ) {

            content =
`👋 **Danke für deine Zeit!**

<@${memberId}> verlässt ab sofort das Team des **VIBE Clans**.

Wir bedanken uns für die gemeinsame Zeit und wünschen dir für deinen weiteren Weg alles Gute und viel Erfolg! 🤝`;

        }

        if (
            !content
        ) {
            return;
        }

        await channel.send({
            content,
            allowedMentions: {
                users: [
                    memberId
                ],
                roles: []
            }
        });

    } catch (error) {

        console.error(
            "❌ Team-Rollen-Nachricht Fehler:",
            error
        );

    }

}

async function processTeamRoleUpdate(
    key
) {

    const update =
        pendingTeamRoleUpdates.get(
            key
        );

    if (
        !update
    ) {
        return;
    }

    pendingTeamRoleUpdates.delete(
        key
    );

    const beforeRoleIds =
        update.beforeRoleIds;

    const afterRoleIds =
        update.afterRoleIds;

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

    const removedRoleIds =
        new Set(
            [
                ...beforeRoleIds
            ].filter(
                id =>
                    !afterRoleIds.has(
                        id
                    )
            )
        );

    if (
        beforeRoleIds.size === 0 &&
        afterRoleIds.size > 0
    ) {

        const roleConfig =
            getPrimaryTeamRole(
                addedRoleIds.size > 0
                    ? addedRoleIds
                    : afterRoleIds
            );

        await sendTeamRoleMessage(
            update.guild,
            update.memberId,
            "welcome",
            roleConfig
        );

        return;

    }

    if (
        beforeRoleIds.size > 0 &&
        afterRoleIds.size === 0
    ) {

        await sendTeamRoleMessage(
            update.guild,
            update.memberId,
            "leave"
        );

        return;

    }

    if (
        addedRoleIds.size > 0 ||
        removedRoleIds.size > 0
    ) {

        const roleConfig =
            getPrimaryTeamRole(
                addedRoleIds.size > 0
                    ? addedRoleIds
                    : afterRoleIds
            );

        if (
            roleConfig
        ) {

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
    (before, after) => {

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

        if (
            existing
        ) {

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
                    () => {
                        processTeamRoleUpdate(
                            key
                        );
                    },
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
                () => {
                    processTeamRoleUpdate(
                        key
                    );
                },
                1500
            );

        pendingTeamRoleUpdates.set(
            key,
            update
        );

    }
);

// ======================================================
// NICKNAME + ROLLEN LOGGING
// ======================================================

client.on(
    Events.GuildMemberUpdate,
    async (before, after) => {

        try {

            if (
                !isFeatureEnabled(
                    "memberLogs"
                )
            ) {
                return;
            }

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

                if (
                    entry
                ) {

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
                addedRoles.size === 0 &&
                removedRoles.size === 0
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
                addedRoles.size > 0
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
                            .join("\n")
                            .substring(
                                0,
                                1024
                            )
                });

            }

            if (
                removedRoles.size > 0
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
                            .join("\n")
                            .substring(
                                0,
                                1024
                            )
                });

            }

            if (
                entry
            ) {

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
// VOICE LOGGING
// ======================================================

client.on(
    Events.VoiceStateUpdate,
    async (before, after) => {

        try {

            if (
                !isFeatureEnabled(
                    "voiceLogs"
                )
            ) {
                return;
            }

            const member =
                after.member ||
                before.member;

            if (
                !member
            ) {
                return;
            }

            if (
                !before.channel &&
                after.channel
            ) {

                const embed =
                    baseEmbed(
                        "🔊 Sprachkanal beigetreten",
                        0x1abc9c,
                        "Ein Mitglied ist einem Sprachkanal beigetreten."
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
                            "🔊 Kanal",

                        value:
                            after.channel.toString()
                    }
                );

                await sendLog(
                    member.guild,
                    embed
                );

            }

            else if (
                before.channel &&
                !after.channel
            ) {

                const embed =
                    baseEmbed(
                        "🔇 Sprachkanal verlassen",
                        0x2f3136,
                        "Ein Mitglied hat einen Sprachkanal verlassen."
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
                            "🔊 Kanal",

                        value:
                            before.channel.toString()
                    }
                );

                await sendLog(
                    member.guild,
                    embed
                );

            }

            else if (
                before.channel &&
                after.channel &&
                before.channel.id !==
                after.channel.id
            ) {

                const embed =
                    baseEmbed(
                        "🔁 Sprachkanal gewechselt",
                        0x1abc9c,
                        "Ein Mitglied hat den Sprachkanal gewechselt."
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
                            before.channel.toString()
                    },
                    {
                        name:
                            "➡️ Zu",

                        value:
                            after.channel.toString()
                    }
                );

                await sendLog(
                    member.guild,
                    embed
                );

            }

            if (
                before.serverMute !==
                after.serverMute
            ) {

                const embed =
                    baseEmbed(
                        after.serverMute
                            ? "🔇 Server-Stummschaltung aktiviert"
                            : "🔊 Server-Stummschaltung aufgehoben",

                        after.serverMute
                            ? 0xed4245
                            : 0x57f287,

                        "Der Server-Mute-Status wurde geändert."
                    );

                embed.addFields({
                    name:
                        "👤 Nutzer",

                    value:
                        `${member} (${member.id})`
                });

                await sendLog(
                    member.guild,
                    embed
                );

            }

            if (
                before.serverDeaf !==
                after.serverDeaf
            ) {

                const embed =
                    baseEmbed(
                        after.serverDeaf
                            ? "🔕 Server-Taubschaltung aktiviert"
                            : "🔔 Server-Taubschaltung aufgehoben",

                        after.serverDeaf
                            ? 0xed4245
                            : 0x57f287,

                        "Der Server-Deaf-Status wurde geändert."
                    );

                embed.addFields({
                    name:
                        "👤 Nutzer",

                    value:
                        `${member} (${member.id})`
                });

                await sendLog(
                    member.guild,
                    embed
                );

            }

        } catch (error) {

            console.error(
                "❌ Voice Logging Fehler:",
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

            if (
                !isFeatureEnabled(
                    "channelLogs"
                )
            ) {
                return;
            }

            if (
                !channel.guild
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
                    channel.guild,
                    AuditLogEvent.ChannelCreate,
                    channel.id
                );

            const embed =
                baseEmbed(
                    "🏠 Kanal erstellt",
                    0x57f287,
                    "Ein neuer Kanal wurde erstellt."
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
            ) {

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

            if (
                !isFeatureEnabled(
                    "channelLogs"
                )
            ) {
                return;
            }

            if (
                !channel.guild
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
                    channel.guild,
                    AuditLogEvent.ChannelDelete,
                    channel.id
                );

            const embed =
                baseEmbed(
                    "🗑️ Kanal gelöscht",
                    0xed4245,
                    "Ein Kanal wurde gelöscht."
                );

            embed.addFields(
                {
                    name:
                        "📁 Kanal",

                    value:
                        `#${safeText(
                            channel.name,
                            "Unbekannt"
                        )}`
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
            ) {

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
    async (before, after) => {

        try {

            if (
                !isFeatureEnabled(
                    "channelLogs"
                )
            ) {
                return;
            }

            if (
                !after.guild
            ) {
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
                !before.permissionOverwrites.cache.equals(
                    after.permissionOverwrites.cache
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
// MESSAGE DELETE LOG
// ======================================================

client.on(
    Events.MessageDelete,
    async message => {

        try {

            if (
                !isFeatureEnabled(
                    "messageLogs"
                )
            ) {
                return;
            }

            if (
                !message.guild
            ) {
                return;
            }

            if (
                message.author &&
                client.user &&
                message.author.id ===
                client.user.id
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
                            ? message.channel.toString()
                            : "Unbekannt"
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
// MESSAGE EDIT LOG
// ======================================================

client.on(
    Events.MessageUpdate,
    async (before, after) => {

        try {

            if (
                !isFeatureEnabled(
                    "messageLogs"
                )
            ) {
                return;
            }

            if (
                !before.guild
            ) {
                return;
            }

            if (
                before.author &&
                before.author.bot
            ) {
                return;
            }

            if (
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
                            ? before.channel.toString()
                            : "Unbekannt"
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
// DISCORD CLIENT ERROR
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

// ======================================================
// DISCORD WARN
// ======================================================

client.on(
    Events.Warn,
    warning => {

        console.warn(
            "⚠️ Discord Warnung:",
            warning
        );

    }
);

// ======================================================
// UNHANDLED PROMISE REJECTION
// ======================================================

process.on(
    "unhandledRejection",
    error => {

        console.error(
            "❌ Unhandled Promise Rejection:",
            error
        );

    }
);

// ======================================================
// UNCAUGHT EXCEPTION
// ======================================================

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
// START MELDUNG
// ======================================================

console.log(
    "✅ VIBE Bot Systeme geladen."
);

console.log(
    "✅ Team-Rollen-Nachrichten System geladen."
);
