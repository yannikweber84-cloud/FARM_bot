require("dotenv").config();

const express = require("express");

const {
    Client,
    GatewayIntentBits,
    Partials,
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
// WEB SERVER – RENDER
// ======================================================

const app = express();

const PORT =
    process.env.PORT ||
    3000;

app.get(
    "/",
    (req, res) => {

        res.status(
            200
        ).send(
            "VIBE Bot läuft! 🟢"
        );

    }
);

app.get(
    "/health",
    (req, res) => {

        res.status(
            200
        ).json({

            status:
                "online",

            bot:
                client?.user?.tag ||
                "starting"

        });

    }
);

app.listen(
    PORT,
    () => {

        console.log(
            `🌐 Webserver läuft auf Port ${PORT}`
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
    "1488581484565500157";

// ======================================================
// WELCOME
// ======================================================

const WELCOME_CHANNEL_ID =
    "1488581808470757468";

// ======================================================
// STAFF
// ======================================================

const STAFF_ROLE_ID =
    "1488904093970858115";

// ======================================================
// SUPPORT ROLLE
// ======================================================

const SUPPORT_ROLE_ID =
    STAFF_ROLE_ID;

// ======================================================
// SUPPORT VOICE WARTERAUM
// ======================================================

const SUPPORT_WARTE_RAUM_ID =
    "1488584492628185293";

// ======================================================
// SUPPORT LOG
// ======================================================

const SUPPORT_LOG_CHANNEL_ID =
    "1488584310385803416";

// ======================================================
// SERVER LOG
// ======================================================

const SERVER_LOG_CHANNEL_ID =
    process.env.SERVER_LOG_CHANNEL_ID ||
    "1488584374554460372";

// ======================================================
// TICKET KATEGORIEN
// ======================================================

const CLAN_CATEGORY_ID =
    "1534287236407759040";

const TEAM_CATEGORY_ID =
    "1534287314464018655";

const BAU_CATEGORY_ID =
    "1534287374819917896";

const GIVEAWAY_CATEGORY_ID =
    "1538095441940447294";

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

            GatewayIntentBits
                .Guilds,

            GatewayIntentBits
                .GuildMembers,

            GatewayIntentBits
                .GuildVoiceStates,

            GatewayIntentBits
                .GuildMessages,

            GatewayIntentBits
                .MessageContent,

            GatewayIntentBits
                .GuildModeration

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
        value ===
            null ||
        value ===
            undefined
    ) {

        return fallback;

    }

    const text =
        String(
            value
        ).trim();

    if (!text) {

        return fallback;

    }

    return text;
}

// ======================================================
// EMBED
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

        typeof color ===
        "number"

            ? color

            : 0x5865f2

    );

    if (
        description !==
            null &&
        description !==
            undefined
    ) {

        const text =
            String(
                description
            ).trim();

        if (
            text.length >
            0
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
// ======================================================

async function sendLog(
    guild,
    embed
) {

    try {

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

        return entry ||
            null;

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
// TICKET KANAL ERKENNEN
// ======================================================

function isTicketChannel(
    channel
) {

    if (!channel) {

        return false;

    }

    return ticketData.has(
        channel.id
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
// GIVEAWAY HILFSFUNKTIONEN
// ======================================================

function parseGiveawayDuration(
    input
) {

    if (!input) {

        return null;

    }

    const value =
        String(
            input
        )

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
            multipliers[
                unit
            ]

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
        unit ===
            "sekunde" ||
        unit ===
            "sekunden"
    ) {

        multiplier =
            1000;

    }

    if (
        unit ===
            "min" ||
        unit ===
            "minute" ||
        unit ===
            "minuten"
    ) {

        multiplier =
            60 *
            1000;

    }

    if (
        unit ===
            "stunde" ||
        unit ===
            "stunden" ||
        unit ===
            "std"
    ) {

        multiplier =
            60 *
            60 *
            1000;

    }

    if (
        unit ===
            "tag" ||
        unit ===
            "tage" ||
        unit ===
            "tagen"
    ) {

        multiplier =
            24 *
            60 *
            60 *
            1000;

    }

    if (
        unit ===
            "woche" ||
        unit ===
            "wochen"
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

}// ======================================================
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
                winnerIds.length >
                    0

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
        pool.length >
            0 &&
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

    // ==================================================
    // TIMER LÖSCHEN
    // ==================================================

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

    // ==================================================
    // GEWINNER ZIEHEN
    // ==================================================

    const winners =
        pickGiveawayWinners(

            data.participants,

            data.winnerCount

        );

    data.winnerIds =
        winners;

    // ==================================================
    // SERVER LADEN
    // ==================================================

    const guild =
        client.guilds.cache.get(
            data.guildId
        );

    if (
        !guild
    ) {

        console.error(
            `❌ Giveaway Server nicht gefunden: ${data.guildId}`
        );

        return;

    }

    // ==================================================
    // CHANNEL LADEN
    // ==================================================

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

        console.error(
            `❌ Giveaway Channel nicht gefunden: ${data.channelId}`
        );

        return;

    }

    // ==================================================
    // GIVEAWAY NACHRICHT LADEN
    // ==================================================

    const message =
        await channel.messages
            .fetch(
                data.messageId
            )
            .catch(
                () => null
            );

    // ==================================================
    // BUTTON DEAKTIVIEREN
    // ==================================================

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

        const disabledRow =
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
                disabledRow
            ]

        }).catch(
            error => {

                console.error(
                    "❌ Giveaway Nachricht Update Fehler:",
                    error
                );

            }
        );

    }

    // ==================================================
    // GEWINNER NACHRICHT
    // ==================================================

    if (
        winners.length >
        0
    ) {

        await channel.send({

            content:

                "🎉 **GEWINNSPIEL BEENDET!** 🎉\n\n" +

                `🏆 ${
                    winners.length === 1
                        ? "Gewinner"
                        : "Gewinner"
                }: ${

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

        }).catch(
            error => {

                console.error(
                    "❌ Gewinner Nachricht Fehler:",
                    error
                );

            }
        );

    } else {

        await channel.send({

            content:

                "🎉 **Gewinnspiel beendet!**\n\n" +

                "Es gab leider keine gültigen Teilnehmer.\n\n" +

                `🎁 **Preis:** ${data.prize}`

        }).catch(
            error => {

                console.error(
                    "❌ Giveaway Ende Nachricht Fehler:",
                    error
                );

            }
        );

    }

    // ==================================================
    // LOG
    // ==================================================

    const logEmbed =
        baseEmbed(

            "🎁 Gewinnspiel beendet",

            0x57f287,

            "Ein Gewinnspiel wurde automatisch beendet."

        );

    logEmbed.addFields(

        {
            name:
                "🎁 Preis",

            value:
                data.prize
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
                winners.length >
                    0

                    ? winners
                        .map(
                            id =>
                                `<@${id}>`
                        )
                        .join(
                            ", "
                        )

                    : "Keine",

            inline:
                false
        }

    );

    await sendLog(
        guild,
        logEmbed
    );

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
                remaining <=
                0
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

            // Node setTimeout kann extrem lange Zeiten
            // nicht direkt verarbeiten.

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
// SLASH COMMANDS
// ======================================================

const commands = [

    // ==================================================
    // TICKET PANEL
    // ==================================================

    new SlashCommandBuilder()

        .setName(
            "ticketpanel"
        )

        .setDescription(
            "Erstellt das Ticket Panel"
        )

        .toJSON(),

    // ==================================================
    // COUNTING START
    // ==================================================

    new SlashCommandBuilder()

        .setName(
            "countingstart"
        )

        .setDescription(
            "Startet das Counting"
        )

        .toJSON(),

    // ==================================================
    // COUNTING STOP
    // ==================================================

    new SlashCommandBuilder()

        .setName(
            "countingstop"
        )

        .setDescription(
            "Stoppt das Counting"
        )

        .toJSON(),

    // ==================================================
    // LOG TEST
    // ==================================================

    new SlashCommandBuilder()

        .setName(
            "logtest"
        )

        .setDescription(
            "Testet das Server-Logging"
        )

        .toJSON(),

    // ==================================================
    // /CREATE GIVEAWAY
    // ==================================================

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
            `🎁 Giveaway Kategorie: ${GIVEAWAY_CATEGORY_ID}`
        );

        console.log(
            "===================================="
        );

        console.log("");

        await registerCommands();

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

                    // ==================================================
                    // NUR ADMIN / SERVER VERWALTEN
                    // ==================================================

                    if (
                        !isAdmin(
                            interaction.member
                        ) &&

                        !interaction.member.permissions.has(

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

                    // ==================================================
                    // MODAL ERSTELLEN
                    // ==================================================

                    const modal =
                        new ModalBuilder()

                            .setCustomId(
                                "create_giveaway_modal"
                            )

                            .setTitle(
                                "Gewinnspiel erstellen"
                            );

                    // ==================================================
                    // DAUER
                    // ==================================================

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
                            )

                            .setMaxLength(
                                50
                            );

                    // ==================================================
                    // GEWINNER ANZAHL
                    // ==================================================

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
                            )

                            .setMaxLength(
                                2
                            );

                    // ==================================================
                    // PREIS
                    // ==================================================

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
                            )

                            .setMaxLength(
                                100
                            );

                    // ==================================================
                    // BESCHREIBUNG
                    // ==================================================

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
                            )

                            .setMaxLength(
                                1000
                            );

                    // ==================================================
                    // MODAL ZEILEN
                    // ==================================================

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

                    // ==================================================
                    // MODAL ANZEIGEN
                    // ==================================================

                    await interaction.showModal(
                        modal
                    );

                    return;

                }                // ==================================================
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
                        !interaction.member.permissions.has(
                            PermissionsBitField.Flags.ManageGuild
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
                        !interaction.member.permissions.has(
                            PermissionsBitField.Flags.ManageGuild
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

Erstelle ein Ticket und beschreibe dein Anliegen so genau wie möglich, damit unser Team dir schnell und gezielt helfen kann.

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

Egal ob Builder, Helfer oder für ein anderes Teammitglied – erstelle einfach ein Ticket.

━━━━━━━━━━━━━━━━━━

🎁 **Giveaway**

Du hast Fragen zu einem Giveaway, einem Gewinn oder benötigst Hilfe bei einer Giveaway-Aktion?

Erstelle dafür ein Giveaway-Ticket.

━━━━━━━━━━━━━━━━━━

📋 **Wichtige Hinweise:**

• Beschreibe dein Anliegen genau
• Bleibe freundlich
• Erstelle nur ein Ticket pro Anliegen

━━━━━━━━━━━━━━━━━━

🚀 Vielen Dank und viel Spaß auf unserem Server!`
                            )

                            .setThumbnail(
                                client.user.displayAvatarURL()
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
                            "• `1d`\n\n" +
                            "Die Mindestdauer beträgt **10 Sekunden**.",

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

                if (
                    !interaction.channel ||
                    !interaction.channel.isTextBased()
                ) {

                    return interaction.reply({

                        content:
                            "❌ Das Gewinnspiel kann in diesem Kanal nicht erstellt werden.",

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
                    await interaction.channel.send({

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

                const logEmbed =
                    baseEmbed(

                        "🎁 Gewinnspiel erstellt",

                        0x5865f2,

                        "Ein neues Gewinnspiel wurde erstellt."

                    );

                logEmbed.addFields(

                    {

                        name:
                            "👤 Erstellt von",

                        value:
                            `${interaction.user} (${interaction.user.id})`

                    },

                    {

                        name:
                            "🎁 Preis",

                        value:
                            prize

                    },

                    {

                        name:
                            "🏆 Gewinner",

                        value:
                            `${winnerCount}`

                    },

                    {

                        name:
                            "⏰ Ende",

                        value:
                            `<t:${Math.floor(data.endAt / 1000)}:f>`

                    }

                );

                await sendLog(
                    interaction.guild,
                    logEmbed
                );

                return interaction.editReply({

                    content:
                        `✅ Das Gewinnspiel wurde erfolgreich erstellt!\n${giveawayMessage.url}`

                });

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

                if (
                    !guild
                ) {

                    return interaction.editReply({

                        content:
                            "❌ Server konnte nicht geladen werden."

                    });

                }

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
                    !member
                ) {

                    return interaction.editReply({

                        content:
                            "❌ Dein Discord-Mitglied konnte nicht geladen werden."

                    });

                }

                if (
                    !staffRole
                ) {

                    return interaction.editReply({

                        content:
                            "❌ Die Staff-Rolle konnte nicht gefunden werden."

                    });

                }

                if (
                    !category ||
                    category.type !==
                        ChannelType.GuildCategory
                ) {

                    return interaction.editReply({

                        content:
                            "❌ Die Ticket-Kategorie wurde nicht gefunden."

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
                                    guild.roles.everyone.id,

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

                const buttonRow =
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

📌 Bitte beschreibe dein Anliegen möglichst genau, damit das Team dir schnell helfen kann.

🛡️ Ein Teammitglied wird sich schnellstmöglich darum kümmern.

📌 **Ticket übernehmen:** Ein Teammitglied übernimmt das Ticket.

➡️ **Weiterleiten:** Das Ticket kann an ein anderes Teammitglied weitergeleitet werden.

🔒 **Schließen:** Das Ticket wird geschlossen.`
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
                        buttonRow
                    ]

                });

                await interaction.editReply({

                    content:
                        `✅ Dein Ticket wurde erstellt: ${channel}`

                });

                const logEmbed =
                    baseEmbed(
                        "🎫 Ticket erstellt",
                        0x57f287
                    );

                logEmbed.addFields(

                    {

                        name:
                            "Ersteller",

                        value:
                            `${member} (${member.id})`

                    },

                    {

                        name:
                            "Ticket",

                        value:
                            channel.toString()

                    },

                    {

                        name:
                            "Kategorie",

                        value:
                            config.title

                    }

                );

                await sendLog(
                    guild,
                    logEmbed
                );

                return;

            }            // ==================================================
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
                    await interaction.guild.members
                        .fetch(
                            selectedUserId
                        )
                        .catch(
                            () => null
                        );

                if (
                    !selectedMember
                ) {

                    return interaction.editReply({

                        content:
                            "❌ Das ausgewählte Teammitglied wurde nicht gefunden."

                    });

                }

                if (
                    !isStaff(
                        selectedMember
                    )
                ) {

                    return interaction.editReply({

                        content:
                            "❌ Du kannst das Ticket nur an ein Mitglied mit der Staff-Rolle weiterleiten."

                    });

                }

                const channel =
                    interaction.channel;

                const data =
                    getTicketData(
                        channel
                    );

                if (
                    !channel ||
                    !data
                ) {

                    return interaction.editReply({

                        content:
                            "❌ Die Ticket-Daten konnten nicht gefunden werden."

                    });

                }

                // ==================================================
                // ZUGRIFF GEBEN
                // ==================================================

                await channel.permissionOverwrites.edit(

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

                // ==================================================
                // WEITERLEITUNG EMBED
                // ==================================================

                const forwardEmbed =
                    new EmbedBuilder()

                        .setColor(
                            "#5865F2"
                        )

                        .setTitle(
                            "➡️ Ticket weitergeleitet"
                        )

                        .setDescription(
`Dieses Ticket wurde weitergeleitet.

👤 **Weitergeleitet von:**
${interaction.user}

🎯 **Weitergeleitet an:**
${selectedMember}

🔓 Das ausgewählte Teammitglied hat jetzt Zugriff auf dieses Ticket.`
                        )

                        .setFooter({

                            text:
                                "VIBE Ticket System"

                        })

                        .setTimestamp();

                await channel.send({

                    content:
                        `${selectedMember}`,

                    allowedMentions: {

                        users: [
                            selectedMember.id
                        ]

                    },

                    embeds: [
                        forwardEmbed
                    ]

                });

                // ==================================================
                // LOG
                // ==================================================

                const logEmbed =
                    baseEmbed(

                        "➡️ Ticket weitergeleitet",

                        0x5865f2,

                        "Ein Ticket wurde an ein anderes Teammitglied weitergeleitet."

                    );

                logEmbed.addFields(

                    {

                        name:
                            "🎫 Ticket",

                        value:
                            channel.toString()

                    },

                    {

                        name:
                            "👤 Weitergeleitet von",

                        value:
                            `${interaction.user} (${interaction.user.id})`

                    },

                    {

                        name:
                            "🎯 Weitergeleitet an",

                        value:
                            `${selectedMember} (${selectedMember.id})`

                    }

                );

                await sendLog(
                    interaction.guild,
                    logEmbed
                );

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
                // GIVEAWAY TEILNAHME
                // ==================================================

                if (
                    interaction.customId.startsWith(
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

                    // ==================================================
                    // GIVEAWAY NICHT GEFUNDEN
                    // ==================================================

                    if (
                        !data
                    ) {

                        return interaction.editReply({

                            content:
                                "❌ Dieses Gewinnspiel ist nicht mehr aktiv oder der Bot wurde zwischenzeitlich neu gestartet."

                        });

                    }

                    // ==================================================
                    // GIVEAWAY BEENDET
                    // ==================================================

                    if (
                        data.ended ||
                        Date.now() >=
                            data.endAt
                    ) {

                        await endGiveaway(
                            giveawayId
                        ).catch(
                            () => {}
                        );

                        return interaction.editReply({

                            content:
                                "❌ Dieses Gewinnspiel ist bereits beendet."

                        });

                    }

                    // ==================================================
                    // STAFF DARF NICHT TEILNEHMEN
                    // ==================================================

                    if (
                        interaction.member &&
                        (
                            interaction.member.roles.cache.has(
                                STAFF_ROLE_ID
                            ) ||
                            isAdmin(
                                interaction.member
                            )
                        )
                    ) {

                        return interaction.editReply({

                            content:
                                "❌ **Teammitglieder und Administratoren dürfen nicht an diesem Gewinnspiel teilnehmen.**"

                        });

                    }

                    // ==================================================
                    // BEREITS TEILGENOMMEN
                    // ==================================================

                    if (
                        data.participants.has(
                            interaction.user.id
                        )
                    ) {

                        return interaction.editReply({

                            content:
                                "🎉 Du nimmst bereits an diesem Gewinnspiel teil!"

                        });

                    }

                    // ==================================================
                    // TEILNEHMER HINZUFÜGEN
                    // ==================================================

                    data.participants.add(
                        interaction.user.id
                    );

                    // ==================================================
                    // TEILNEHMERZAHL AKTUALISIEREN
                    // ==================================================

                    await interaction.message.edit({

                        embeds: [

                            createGiveawayEmbed(
                                data
                            )

                        ]

                    }).catch(
                        error => {

                            console.error(
                                "❌ Giveaway Embed Update Fehler:",
                                error
                            );

                        }
                    );

                    // ==================================================
                    // BESTÄTIGUNG
                    // ==================================================

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

                    await interaction.deferReply();

                    // ==================================================
                    // STAFF PRÜFEN
                    // ==================================================

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

                    const channel =
                        interaction.channel;

                    const data =
                        getTicketData(
                            channel
                        );

                    if (
                        !channel ||
                        !data
                    ) {

                        return interaction.editReply({

                            content:
                                "❌ Die Ticket-Daten wurden nicht gefunden."

                        });

                    }

                    // ==================================================
                    // BEREITS ÜBERNOMMEN
                    // ==================================================

                    if (
                        data.claimedBy
                    ) {

                        return interaction.editReply({

                            content:
                                `❌ Dieses Ticket wurde bereits von <@${data.claimedBy}> übernommen.`

                        });

                    }

                    // ==================================================
                    // MEMBER LADEN
                    // ==================================================

                    const member =
                        await interaction.guild.members
                            .fetch(
                                interaction.user.id
                            )
                            .catch(
                                () => null
                            );

                    // ==================================================
                    // STAFF ROLLE LADEN
                    // ==================================================

                    const staffRole =
                        await interaction.guild.roles
                            .fetch(
                                STAFF_ROLE_ID
                            )
                            .catch(
                                () => null
                            );

                    if (
                        !member ||
                        !staffRole
                    ) {

                        return interaction.editReply({

                            content:
                                "❌ Teammitglied oder Staff-Rolle konnte nicht geladen werden."

                        });

                    }

                    // ==================================================
                    // CLAIM SPEICHERN
                    // ==================================================

                    data.claimedBy =
                        member.id;

                    data.forwardedTo =
                        null;

                    // ==================================================
                    // STAFF ROLLE DARF NICHT MEHR SCHREIBEN
                    // ==================================================

                    await channel.permissionOverwrites.edit(

                        staffRole.id,

                        {

                            ViewChannel:
                                true,

                            SendMessages:
                                false,

                            ReadMessageHistory:
                                true

                        }

                    );

                    // ==================================================
                    // CLAIMER DARF SCHREIBEN
                    // ==================================================

                    await channel.permissionOverwrites.edit(

                        member.id,

                        {

                            ViewChannel:
                                true,

                            SendMessages:
                                true,

                            ReadMessageHistory:
                                true

                        }

                    );

                    // ==================================================
                    // TICKET ERSTELLER DARF WEITER SCHREIBEN
                    // ==================================================

                    if (
                        data.ownerId
                    ) {

                        await channel.permissionOverwrites.edit(

                            data.ownerId,

                            {

                                ViewChannel:
                                    true,

                                SendMessages:
                                    true,

                                ReadMessageHistory:
                                    true

                            }

                        );

                    }

                    // ==================================================
                    // CLAIM BUTTON DEAKTIVIEREN
                    // ==================================================

                    const claimedButton =
                        new ButtonBuilder()

                            .setCustomId(
                                "claimed_ticket"
                            )

                            .setLabel(
                                `Übernommen von ${member.user.username}`
                            )

                            .setEmoji(
                                "✅"
                            )

                            .setStyle(
                                ButtonStyle.Success
                            )

                            .setDisabled(
                                true
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

                    const newRow =
                        new ActionRowBuilder()

                            .addComponents(

                                claimedButton,

                                forwardButton,

                                closeButton

                            );

                    await interaction.message.edit({

                        components: [
                            newRow
                        ]

                    });

                    // ==================================================
                    // CLAIM EMBED
                    // ==================================================

                    const claimEmbed =
                        baseEmbed(

                            "📌 Ticket übernommen",

                            0x5865f2,

`Der Teamler ${member} hat dieses Ticket übernommen.

🔒 Andere Teammitglieder können jetzt nicht mehr schreiben.

🛡️ Administratoren können weiterhin schreiben.

👤 Der Ticket-Ersteller kann weiterhin schreiben.

➡️ Ein anderes Teammitglied kann nur über **Weiterleiten** Zugriff zum Schreiben erhalten.`

                        );

                    await interaction.editReply({

                        embeds: [
                            claimEmbed
                        ]

                    });

                    // ==================================================
                    // LOG
                    // ==================================================

                    const logEmbed =
                        baseEmbed(

                            "📌 Ticket übernommen",

                            0x5865f2

                        );

                    logEmbed.addFields(

                        {

                            name:
                                "🎫 Ticket",

                            value:
                                channel.toString()

                        },

                        {

                            name:
                                "👤 Übernommen von",

                            value:
                                `${interaction.user} (${interaction.user.id})`

                        }

                    );

                    await sendLog(
                        interaction.guild,
                        logEmbed
                    );

                    return;

                }                // ==================================================
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

                    const channel =
                        interaction.channel;

                    const data =
                        getTicketData(
                            channel
                        );

                    if (
                        !channel ||
                        !data
                    ) {

                        return interaction.reply({

                            content:
                                "❌ Die Ticket-Daten wurden nicht gefunden.",

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }

                    // ==================================================
                    // NUR CLAIM-USER ODER ADMIN DARF WEITERLEITEN
                    // ==================================================

                    if (
                        data.claimedBy &&
                        data.claimedBy !==
                            interaction.user.id &&
                        !isAdmin(
                            interaction.member
                        )
                    ) {

                        return interaction.reply({

                            content:
                                `❌ Dieses Ticket wurde von <@${data.claimedBy}> übernommen.\nNur diese Person oder ein Administrator kann es weiterleiten.`,

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }

                    // ==================================================
                    // USER SELECT MENU
                    // ==================================================

                    const userSelect =
                        new UserSelectMenuBuilder()

                            .setCustomId(
                                "forward_ticket_user"
                            )

                            .setPlaceholder(
                                "Wähle das Teammitglied aus..."
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
                                userSelect
                            );

                    return interaction.reply({

                        content:
                            "➡️ **Ticket weiterleiten**\n\n" +
                            "Wähle unten das Teammitglied aus, an das dieses Ticket weitergeleitet werden soll.",

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

                    if (
                        !isStaff(
                            interaction.member
                        )
                    ) {

                        return interaction.reply({

                            content:
                                "❌ Nur Teammitglieder können Tickets schließen.",

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }

                    const channel =
                        interaction.channel;

                    if (
                        !channel
                    ) {

                        return interaction.reply({

                            content:
                                "❌ Ticket-Kanal wurde nicht gefunden.",

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }

                    // ==================================================
                    // SOFORT BESTÄTIGEN
                    // Verhindert Unknown Interaction
                    // ==================================================

                    await interaction.deferReply();

                    await interaction.editReply({

                        content:
                            "🔒 Ticket wird in **3 Sekunden** geschlossen..."

                    });

                    // ==================================================
                    // LOG
                    // ==================================================

                    const logEmbed =
                        baseEmbed(

                            "🔒 Ticket geschlossen",

                            0xed4245

                        );

                    logEmbed.addFields(

                        {

                            name:
                                "👤 Geschlossen von",

                            value:
                                `${interaction.user} (${interaction.user.id})`

                        },

                        {

                            name:
                                "🎫 Ticket",

                            value:
                                `#${channel.name}`

                        }

                    );

                    await sendLog(
                        interaction.guild,
                        logEmbed
                    );

                    // ==================================================
                    // NACH 3 SEKUNDEN LÖSCHEN
                    // ==================================================

                    setTimeout(

                        async () => {

                            try {

                                ticketData.delete(
                                    channel.id
                                );

                                if (
                                    channel.deletable
                                ) {

                                    await channel.delete();

                                }

                            } catch (error) {

                                console.error(
                                    "❌ Ticket Delete Fehler:",
                                    error
                                );

                            }

                        },

                        3000

                    );

                    return;

                }

            }

        } catch (error) {

            // ==================================================
            // INTERACTION ERROR
            // ==================================================

            console.error(
                "❌ Interaction Fehler:",
                error
            );

            if (
                interaction.isRepliable() &&
                !interaction.replied &&
                !interaction.deferred
            ) {

                await interaction.reply({

                    content:
                        "❌ Es ist ein Fehler aufgetreten.",

                    flags:
                        MessageFlags.Ephemeral

                }).catch(
                    () => {}
                );

            } else if (
                interaction.deferred &&
                !interaction.replied
            ) {

                await interaction.editReply({

                    content:
                        "❌ Es ist ein Fehler aufgetreten."

                }).catch(
                    () => {}
                );

            }

        }

    }
);


// ======================================================
// SUPPORT VOICE WARTERAUM
// ======================================================

client.on(
    Events.VoiceStateUpdate,
    async (oldState, newState) => {

        try {

            // ==================================================
            // NUR WENN USER IN DEN WARTERAUM KOMMT
            // ==================================================

            if (
                newState.channelId !==
                SUPPORT_WARTE_RAUM_ID
            ) {

                return;

            }

            // ==================================================
            // WAR BEREITS IM WARTERAUM
            // ==================================================

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

            // ==================================================
            // SUPPORT LOG CHANNEL
            // ==================================================

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

                console.error(
                    `❌ Support-Log-Kanal nicht gefunden: ${SUPPORT_LOG_CHANNEL_ID}`
                );

                return;

            }

            // ==================================================
            // SUPPORT ROLLE
            // ==================================================

            const staffRole =
                await guild.roles
                    .fetch(
                        SUPPORT_ROLE_ID
                    )
                    .catch(
                        () => null
                    );

            if (
                !staffRole
            ) {

                console.error(
                    `❌ Support-Rolle nicht gefunden: ${SUPPORT_ROLE_ID}`
                );

                return;

            }

            // ==================================================
            // EMBED
            // ==================================================

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
                        `<t:${Math.floor(
                            Date.now() /
                            1000
                        )}:R>`

                }

            );

            embed.setThumbnail(

                member.user.displayAvatarURL({

                    dynamic:
                        true

                })

            );

            if (
                client.user
            ) {

                embed.setFooter({

                    text:
                        "VIBE Support System",

                    iconURL:
                        client.user.displayAvatarURL()

                });

            }

            // ==================================================
            // SUPPORT ROLLE PINGEN
            // ==================================================

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

            // ==================================================
            // SERVER LOG
            // ==================================================

            const serverLog =
                baseEmbed(

                    "🎧 Support-Warteraum",

                    0x00a8ff,

                    "Neue Support-Anfrage."

                );

            serverLog.addFields(

                {

                    name:
                        "👤 Nutzer",

                    value:
                        `${member} (${member.id})`

                },

                {

                    name:
                        "📞 Kanal",

                    value:
                        newState.channel
                            ? newState.channel.toString()
                            : "Unbekannt"

                },

                {

                    name:
                        "🛡️ Staff-Rolle",

                    value:
                        `<@&${SUPPORT_ROLE_ID}>`

                }

            );

            await sendLog(
                guild,
                serverLog
            );

        } catch (error) {

            console.error(
                "❌ Voice Support Fehler:",
                error
            );

        }

    }
);// ======================================================
// COUNTING SYSTEM
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

            if (
                !/^\d+$/.test(
                    message.content
                )
            ) {
                return;
            }

            const number =
                Number(
                    message.content
                );

            // ==================================================
            // NICHT ZWEIMAL HINTEREINANDER
            // ==================================================

            if (
                message.author.id ===
                lastUserId
            ) {

                await message.reply(
                    "❌ Du kannst nicht zweimal hintereinander zählen!\n" +
                    "🔄 Neustart bei **1**."
                );

                currentNumber =
                    1;

                lastUserId =
                    null;

                return;
            }

            // ==================================================
            // RICHTIGE ZAHL
            // ==================================================

            if (
                number ===
                currentNumber
            ) {

                await message
                    .react(
                        "✅"
                    )
                    .catch(
                        () => {}
                    );

                lastUserId =
                    message.author.id;

                currentNumber++;

                if (
                    currentNumber >
                    100000
                ) {

                    await message.channel.send(
                        "🎉 **100000 erreicht!**\n" +
                        "Das Counting startet wieder bei **1**."
                    );

                    currentNumber =
                        1;

                    lastUserId =
                        null;
                }

            } else {

                // ==================================================
                // FALSCHE ZAHL
                // ==================================================

                await message.reply(
                    `❌ **Falsch!** Erwartet wurde **${currentNumber}**.\n` +
                    "🔄 Neustart bei **1**."
                );

                currentNumber =
                    1;

                lastUserId =
                    null;
            }

        } catch (error) {

            console.error(
                "❌ Counting Fehler:",
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

            // ==================================================
            // KICK
            // ==================================================

            if (
                entry
            ) {

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
                                ? entry.executor.toString()
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

            // ==================================================
            // NORMAL VERLASSEN
            // ==================================================

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

            if (
                entry
            ) {

                embed.addFields(

                    {
                        name:
                            "🛡️ Verantwortlicher Moderator",

                        value:
                            entry.executor
                                ? entry.executor.toString()
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

            if (
                entry
            ) {

                embed.addFields({

                    name:
                        "🛡️ Verantwortlicher",

                    value:
                        entry.executor
                            ? entry.executor.toString()
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
);// ======================================================
// NICKNAME + ROLLEN LOGGING
// ======================================================

client.on(
    Events.GuildMemberUpdate,
    async (before, after) => {

        try {

            // ==================================================
            // NICKNAME GEÄNDERT
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

            // ==================================================
            // ROLLEN VERGLEICHEN
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

            const roleEmbed =
                baseEmbed(
                    "👥 Rollen aktualisiert",
                    0x5865f2,
                    "Die Rollen eines Mitglieds wurden geändert."
                );

            roleEmbed.addFields({

                name:
                    "👤 Nutzer",

                value:
                    `${after} (${after.id})`

            });

            // ==================================================
            // ROLLEN HINZUGEFÜGT
            // ==================================================

            if (
                addedRoles.size >
                0
            ) {

                const addedText =
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
                        );

                roleEmbed.addFields({

                    name:
                        "✅ Hinzugefügt",

                    value:
                        addedText ||
                        "Unbekannt"

                });

            }

            // ==================================================
            // ROLLEN ENTFERNT
            // ==================================================

            if (
                removedRoles.size >
                0
            ) {

                const removedText =
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
                        );

                roleEmbed.addFields({

                    name:
                        "❌ Entfernt",

                    value:
                        removedText ||
                        "Unbekannt"

                });

            }

            if (
                entry
            ) {

                roleEmbed.addFields({

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
                roleEmbed
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

            const member =
                after.member ||
                before.member;

            if (
                !member
            ) {

                return;

            }

            // ==================================================
            // VOICE JOIN
            // ==================================================

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

            // ==================================================
            // VOICE LEAVE
            // ==================================================

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

            // ==================================================
            // VOICE MOVE
            // ==================================================

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

            // ==================================================
            // SERVER MUTE
            // ==================================================

            if (
                before.serverMute !==
                after.serverMute
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
                        member.guild,
                        AuditLogEvent.MemberUpdate,
                        member.id
                    );

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
                    member.guild,
                    embed
                );

            }

            // ==================================================
            // SERVER DEAF
            // ==================================================

            if (
                before.serverDeaf !==
                after.serverDeaf
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
                        member.guild,
                        AuditLogEvent.MemberUpdate,
                        member.id
                    );

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
                    member.guild,
                    embed
                );

            }

            // ==================================================
            // SELF MUTE
            // ==================================================

            if (
                before.selfMute !==
                after.selfMute
            ) {

                const embed =
                    baseEmbed(

                        after.selfMute
                            ? "🎙️ Nutzer hat sich stummgeschaltet"
                            : "🎙️ Nutzer ist nicht mehr stummgeschaltet",

                        0x99aab5,

                        "Der Self-Mute-Status wurde geändert."

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
                            after.channel
                                ? after.channel.toString()
                                : before.channel
                                    ? before.channel.toString()
                                    : "Keiner"
                    }

                );

                await sendLog(
                    member.guild,
                    embed
                );

            }

            // ==================================================
            // SELF DEAF
            // ==================================================

            if (
                before.selfDeaf !==
                after.selfDeaf
            ) {

                const embed =
                    baseEmbed(

                        after.selfDeaf
                            ? "🎧 Nutzer hat sich taubgeschaltet"
                            : "🎧 Nutzer ist nicht mehr taubgeschaltet",

                        0x99aab5,

                        "Der Self-Deaf-Status wurde geändert."

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
                            after.channel
                                ? after.channel.toString()
                                : before.channel
                                    ? before.channel.toString()
                                    : "Keiner"
                    }

                );

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

            let channelType =
                "Sonstiger Kanal";

            if (
                channel.type ===
                ChannelType.GuildText
            ) {

                channelType =
                    "Textkanal";

            }

            if (
                channel.type ===
                ChannelType.GuildVoice
            ) {

                channelType =
                    "Sprachkanal";

            }

            if (
                channel.type ===
                ChannelType.GuildCategory
            ) {

                channelType =
                    "Kategorie";

            }

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
                },

                {
                    name:
                        "📌 Typ",

                    value:
                        channelType
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
// CHANNEL UPDATE / BERECHTIGUNGEN
// ======================================================

client.on(
    Events.ChannelUpdate,
    async (before, after) => {

        try {

            if (
                !after.guild
            ) {

                return;

            }

            // ==================================================
            // NAME GEÄNDERT
            // ==================================================

            if (
                before.name !==
                after.name
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
                        AuditLogEvent.ChannelUpdate,
                        after.id
                    );

                const nameEmbed =
                    baseEmbed(
                        "✏️ Kanalname geändert",
                        0x5865f2,
                        "Ein Kanal wurde umbenannt."
                    );

                nameEmbed.addFields(

                    {
                        name:
                            "📁 Kanal",

                        value:
                            after.toString()
                    },

                    {
                        name:
                            "Vorher",

                        value:
                            safeText(
                                before.name
                            )
                    },

                    {
                        name:
                            "Nachher",

                        value:
                            safeText(
                                after.name
                            )
                    }

                );

                if (
                    entry
                ) {

                    nameEmbed.addFields({

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
                    nameEmbed
                );

            }

            // ==================================================
            // PERMISSION OVERWRITES GEÄNDERT
            // ==================================================

            if (
                before.permissionOverwrites &&
                after.permissionOverwrites &&
                !before.permissionOverwrites.cache.equals(
                    after.permissionOverwrites.cache
                )
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
                        AuditLogEvent.ChannelOverwriteUpdate,
                        after.id
                    );

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

        } catch (error) {

            console.error(
                "❌ Channel Update Fehler:",
                error
            );

        }

    }
);// ======================================================
// MESSAGE DELETE
// ======================================================

client.on(
    Events.MessageDelete,
    async message => {

        try {

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
// MESSAGE EDIT
// ======================================================

client.on(
    Events.MessageUpdate,
    async (before, after) => {

        try {

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
// TOKEN PRÜFEN
// ======================================================

if (
    !TOKEN
) {

    console.error("");
    console.error(
        "===================================="
    );

    console.error(
        "❌ TOKEN FEHLT!"
    );

    console.error(
        "Setze TOKEN in deiner .env Datei oder als Environment Variable auf Render."
    );

    console.error(
        "===================================="
    );

    console.error("");

    process.exit(
        1
    );

}


// ======================================================
// LOGIN
// ======================================================

console.log(
    "🔐 Bot wird eingeloggt..."
);

client.login(
    TOKEN
)

    .then(
        () => {

            console.log(
                "🔐 Login erfolgreich gestartet."
            );

        }
    )

    .catch(
        error => {

            console.error(
                "❌ Discord Login fehlgeschlagen:",
                error
            );

            process.exit(
                1
            );

        }
    );
