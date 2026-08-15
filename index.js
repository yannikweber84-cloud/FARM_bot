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
    Routes
} = require('discord.js');

// ======================================================
// WEB SERVER – RENDER
// ======================================================

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.status(200).send("VIBE Bot läuft! 🟢");
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "online",
        bot: client?.user?.tag || "starting"
    });
});

app.listen(PORT, () => {
    console.log(`🌐 Webserver läuft auf Port ${PORT}`);
});

// ======================================================
// KONFIGURATION
// ======================================================

const TOKEN = process.env.TOKEN;

const CLIENT_ID = "1534585700408889466";
const GUILD_ID = "1537927032066019470";

// ======================================================
// WELCOME
// ======================================================

const WELCOME_CHANNEL_ID =
    "1537927035794489405";

// ======================================================
// STAFF
// ======================================================

const STAFF_ROLE_ID =
    "1537927034842517550";

// ======================================================
// SUPPORT ROLLE
// ======================================================

const SUPPORT_ROLE_ID =
    STAFF_ROLE_ID;

// ======================================================
// SUPPORT VOICE WARTERAUM
// ======================================================

const SUPPORT_WARTE_RAUM_ID =
    "1537927036293615635";

// ======================================================
// SUPPORT LOG
// ======================================================

const SUPPORT_LOG_CHANNEL_ID =
    "1537927036293615633";

// ======================================================
// SERVER LOG
// ======================================================

const SERVER_LOG_CHANNEL_ID =
    process.env.SERVER_LOG_CHANNEL_ID ||
    "1537927036293615634";

// ======================================================
// TICKET KATEGORIEN
// ======================================================

const CLAN_CATEGORY_ID =
    "1537927037627400232";

const TEAM_CATEGORY_ID =
    "1537927037627400233";

const BAU_CATEGORY_ID =
    "1537927037916942456";

const GIVEAWAY_CATEGORY_ID =
    "1538095441940447294";

// ======================================================
// COUNTING
// ======================================================

let countingActive = false;
let countingChannelId = null;
let currentNumber = 1;
let lastUserId = null;

// ======================================================
// TICKET DATEN
// ======================================================
//
// Wir speichern hier, wer ein Ticket erstellt und
// wer es übernommen hat.
//
// Dadurch wissen wir später genau, wer schreiben darf.
//

const ticketData = new Map();

// Beispiel:
//
// ticketData.set(channel.id, {
//     ownerId: "123",
//     claimedBy: null,
//     forwardedTo: null
// });

// ======================================================
// DISCORD CLIENT
// ======================================================

const client = new Client({

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
        typeof color === "number"
            ? color
            : 0x5865f2
    );

    if (
        description !== null &&
        description !== undefined
    ) {

        const text =
            String(description).trim();

        if (text.length > 0) {

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

function getLogChannel(guild) {

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

    if (!channel.isTextBased()) {
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

        if (!guild || !embed) {
            return;
        }

        const channel =
            getLogChannel(guild);

        if (!channel) {

            console.log(
                `⚠️ Log-Kanal nicht gefunden: ${SERVER_LOG_CHANNEL_ID}`
            );

            return;
        }

        await channel.send({
            embeds: [embed]
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
                        entry.target.id === targetId &&
                        Date.now() -
                            entry.createdTimestamp <
                            10000
                    );

                }
            );

        return entry || null;

    } catch (error) {

        if (
            error.code !== 50013
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

function isAdmin(member) {

    if (!member) {
        return false;
    }

    return member.permissions.has(
        PermissionsBitField.Flags.Administrator
    );
}

// ======================================================
// STAFF PRÜFEN
// ======================================================

function isStaff(member) {

    if (!member) {
        return false;
    }

    return (
        member.roles.cache.has(
            STAFF_ROLE_ID
        ) ||
        isAdmin(member)
    );
}

// ======================================================
// TICKET KANAL ERKENNEN
// ======================================================

function isTicketChannel(channel) {

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

function getTicketData(channel) {

    if (!channel) {
        return null;
    }

    return ticketData.get(
        channel.id
    ) || null;
}

// ======================================================
// SLASH COMMANDS
// ======================================================

const commands = [

    new SlashCommandBuilder()

        .setName("ticketpanel")

        .setDescription(
            "Erstellt das Ticket Panel"
        )

        .toJSON(),

    new SlashCommandBuilder()

        .setName("countingstart")

        .setDescription(
            "Startet das Counting"
        )

        .toJSON(),

    new SlashCommandBuilder()

        .setName("countingstop")

        .setDescription(
            "Stoppt das Counting"
        )

        .toJSON(),

    new SlashCommandBuilder()

        .setName("logtest")

        .setDescription(
            "Testet das Server-Logging"
        )

        .toJSON()

];

// ======================================================
// REST
// ======================================================

const rest =
    new REST({
        version: "10"
    }).setToken(TOKEN);

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
                body: commands
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

                            flags: 64

                        });

                    }

                    countingActive = true;

                    countingChannelId =
                        interaction.channelId;

                    currentNumber = 1;

                    lastUserId = null;

                    await interaction.reply(
                        "🎉 **Counting gestartet!**\n\n" +
                        "📍 Dieser Channel ist jetzt der Counting-Channel.\n" +
                        "🔢 Erste Zahl: **1**"
                    );

                    return;
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

                            flags: 64

                        });

                    }

                    countingActive = false;

                    countingChannelId = null;

                    currentNumber = 1;

                    lastUserId = null;

                    await interaction.reply(
                        "🛑 **Counting wurde gestoppt.**"
                    );

                    return;
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

                            flags: 64

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

                    await interaction.reply({

                        content:
                            "✅ Test-Log wurde gesendet.",

                        flags: 64

                    });

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

                            flags: 64

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

                    await interaction.reply({

                        embeds: [
                            embed
                        ],

                        components: [
                            row
                        ]

                    });

                    return;
                }
            }

            // ==================================================
            // TICKET SELECT MENU
            // ==================================================

            if (
                interaction.isStringSelectMenu() &&
                interaction.customId ===
                    "ticket_menu"
            ) {

                const selected =
                    interaction.values[0];

                let ticketName = null;
                let ticketTitle = null;
                let categoryID = null;

                // ==================================================
                // SUPPORT
                // ==================================================

                if (
                    selected ===
                    "clan_bewerbung"
                ) {

                    ticketName =
                        `support-${interaction.user.username.toLowerCase()}`;

                    ticketTitle =
                        "🛡️ Allgemeiner Support";

                    categoryID =
                        CLAN_CATEGORY_ID;

                }

                // ==================================================
                // TEAM
                // ==================================================

                if (
                    selected ===
                    "team_bewerbung"
                ) {

                    ticketName =
                        `bewerbung-${interaction.user.username.toLowerCase()}`;

                    ticketTitle =
                        "👥 Team Bewerbung";

                    categoryID =
                        TEAM_CATEGORY_ID;

                }

                // ==================================================
                // BAU
                // ==================================================

                if (
                    selected ===
                    "bau_firma"
                ) {

                    ticketName =
                        `bau-${interaction.user.username.toLowerCase()}`;

                    ticketTitle =
                        "🏗️ Bau Firma";

                    categoryID =
                        BAU_CATEGORY_ID;

                }

                // ==================================================
                // GIVEAWAY
                // ==================================================

                if (
                    selected ===
                    "giveaway"
                ) {

                    ticketName =
                        `giveaway-${interaction.user.username.toLowerCase()}`;

                    ticketTitle =
                        "🎁 Giveaway";

                    categoryID =
                        GIVEAWAY_CATEGORY_ID;

                }

                if (
                    !ticketName ||
                    !ticketTitle ||
                    !categoryID
                ) {

                    return interaction.reply({

                        content:
                            "❌ Ungültige Ticket-Kategorie.",

                        flags: 64

                    });

                }

                // ==================================================
                // TICKET EXISTIERT BEREITS?
                // ==================================================

                const existing =
                    interaction.guild.channels.cache.find(
                        channel =>
                            channel.name ===
                            ticketName
                    );

                if (existing) {

                    return interaction.reply({

                        content:
                            `❌ Du hast bereits ein Ticket offen: ${existing}`,

                        flags: 64

                    });

                }

                // ==================================================
                // WICHTIG:
                // ROLLE UND MEMBER AKTIV AUS DISCORD LADEN
                //
                // Das behebt:
                //
                // InvalidType:
                // Supplied parameter is not a cached User or Role
                // ==================================================

                const guild =
                    interaction.guild;

                const member =
                    await guild.members
                        .fetch(interaction.user.id)
                        .catch(
                            () => null
                        );

                if (!member) {

                    return interaction.reply({

                        content:
                            "❌ Dein Discord-Mitglied konnte nicht geladen werden. Bitte versuche es erneut.",

                        flags: 64

                    });

                }

                const staffRole =
                    await guild.roles
                        .fetch(STAFF_ROLE_ID)
                        .catch(
                            () => null
                        );

                if (!staffRole) {

                    return interaction.reply({

                        content:
                            "❌ Die Staff-Rolle konnte nicht gefunden werden. Bitte überprüfe die STAFF_ROLE_ID.",

                        flags: 64

                    });

                }

                const everyoneRole =
                    guild.roles.everyone;

                if (!everyoneRole) {

                    return interaction.reply({

                        content:
                            "❌ Die @everyone-Rolle konnte nicht geladen werden.",

                        flags: 64

                    });

                }

                // ==================================================
                // TICKET ERSTELLEN
                // ==================================================

                const channel =
                    await guild.channels.create({

                        name:
                            ticketName,

                        type:
                            ChannelType.GuildText,

                        parent:
                            categoryID,

                        permissionOverwrites: [

                            // @everyone darf NICHT sehen
                            {
                                id:
                                    everyoneRole.id,

                                deny: [

                                    PermissionsBitField.Flags.ViewChannel

                                ]

                            },

                            // Ticket-Ersteller
                            {
                                id:
                                    member.id,

                                allow: [

                                    PermissionsBitField.Flags.ViewChannel,

                                    PermissionsBitField.Flags.SendMessages,

                                    PermissionsBitField.Flags.ReadMessageHistory

                                ]

                            },

                            // Staff darf Ticket sehen
                            // Schreiben wird später beim Claim
                            // eingeschränkt.
                            {
                                id:
                                    staffRole.id,

                                allow: [

                                    PermissionsBitField.Flags.ViewChannel,

                                    PermissionsBitField.Flags.ReadMessageHistory

                                ]

                            }

                        ]

                    });

                // ==================================================
                // TICKET DATEN SPEICHERN
                // ==================================================

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

                // ==================================================
                // BUTTON – CLAIM
                // ==================================================

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

                // ==================================================
                // BUTTON – FORWARD
                // ==================================================

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

                // ==================================================
                // BUTTON – CLOSE
                // ==================================================

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

                // ==================================================
                // TICKET EMBED
                // ==================================================

                const ticketEmbed =
                    new EmbedBuilder()

                        .setColor(
                            "#57F287"
                        )

                        .setTitle(
                            ticketTitle
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

                // ==================================================
                // TICKET SENDEN
                // ==================================================

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

                // ==================================================
                // ANTWORT
                // ==================================================

                await interaction.reply({

                    content:
                        `✅ Dein Ticket wurde erstellt: ${channel}`,

                    flags: 64

                });

                // ==================================================
                // TICKET LOG
                // ==================================================

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
                            ticketTitle
                    }

                );

                await sendLog(
                    guild,
                    logEmbed
                );

                return;
            }

            // ==================================================
            // USER SELECT – WEITERLEITEN
            // ==================================================

            if (
                interaction.isUserSelectMenu() &&
                interaction.customId ===
                    "forward_ticket_user"
            ) {

                // SOFORT antworten
                // verhindert "hat nicht rechtzeitig reagiert"

                await interaction.deferReply({
                    flags: 64
                });

                const member =
                    interaction.member;

                // ==================================================
                // STAFF PRÜFEN
                // ==================================================

                if (
                    !isStaff(member)
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
                        .fetch(selectedUserId)
                        .catch(
                            () => null
                        );

                if (!selectedMember) {

                    return interaction.editReply({

                        content:
                            "❌ Das ausgewählte Teammitglied wurde nicht gefunden."

                    });

                }

                // ==================================================
                // PRÜFEN OB TEAMLER
                // ==================================================

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

                if (!channel) {

                    return interaction.editReply({

                        content:
                            "❌ Der Ticket-Kanal wurde nicht gefunden."

                    });

                }

                const data =
                    getTicketData(
                        channel
                    );

                if (!data) {

                    return interaction.editReply({

                        content:
                            "❌ Die Ticket-Daten konnten nicht gefunden werden."

                    });

                }

                // ==================================================
                // ZUGRIFF FÜR NEUES TEAMMITGLIED
                // ==================================================

                await channel.permissionOverwrites.edit(

                    selectedMember.id,

                    {

                        ViewChannel: true,

                        SendMessages: true,

                        ReadMessageHistory: true

                    }

                );

                // ==================================================
                // WEITERLEITUNG SPEICHERN
                // ==================================================

                data.forwardedTo =
                    selectedMember.id;

                // ==================================================
                // AUSWAHLMENÜ LÖSCHEN
                // ==================================================

                await interaction.message
                    .delete()
                    .catch(
                        () => {}
                    );

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
                // SERVER LOG
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

                await interaction.editReply({

                    content:
                        `✅ Ticket wurde an ${selectedMember} weitergeleitet.`

                });

                return;
            }

            // ==================================================
            // BUTTONS
            // ==================================================

            if (
                interaction.isButton()
            ) {

                // ==================================================
                // CLAIM
                // ==================================================

                if (
                    interaction.customId ===
                    "claim_ticket"
                ) {

                    const member =
                        interaction.member;

                    // Nur Staff
                    if (
                        !isStaff(member)
                    ) {

                        return interaction.reply({

                            content:
                                "❌ Nur Teammitglieder können Tickets übernehmen.",

                            flags: 64

                        });

                    }

                    const channel =
                        interaction.channel;

                    if (!channel) {

                        return interaction.reply({

                            content:
                                "❌ Ticket-Kanal nicht gefunden.",

                            flags: 64

                        });

                    }

                    const data =
                        getTicketData(
                            channel
                        );

                    if (!data) {

                        return interaction.reply({

                            content:
                                "❌ Die Ticket-Daten wurden nicht gefunden.",

                            flags: 64

                        });

                    }

                    // ==================================================
                    // BEREITS ÜBERNOMMEN
                    // ==================================================

                    if (
                        data.claimedBy
                    ) {

                        return interaction.reply({

                            content:
                                `❌ Dieses Ticket wurde bereits von <@${data.claimedBy}> übernommen.`,

                            flags: 64

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
                    // STAFF-ROLLE:
                    // KEIN SCHREIBRECHT MEHR
                    //
                    // Admins können trotzdem schreiben,
                    // weil Administrator die Sperre umgeht.
                    // ==================================================

                    const staffRole =
                        await interaction.guild.roles
                            .fetch(STAFF_ROLE_ID)
                            .catch(
                                () => null
                            );

                    if (staffRole) {

                        await channel.permissionOverwrites.edit(

                            staffRole.id,

                            {

                                ViewChannel: true,

                                SendMessages: false,

                                ReadMessageHistory: true

                            }

                        );

                    }

                    // ==================================================
                    // CLAIMER DARF SCHREIBEN
                    // ==================================================

                    await channel.permissionOverwrites.edit(

                        member.id,

                        {

                            ViewChannel: true,

                            SendMessages: true,

                            ReadMessageHistory: true

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

                                ViewChannel: true,

                                SendMessages: true,

                                ReadMessageHistory: true

                            }

                        );

                    }

                    // ==================================================
                    // BUTTON AKTUALISIEREN
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

                    await interaction.reply({

                        embeds: [
                            claimEmbed
                        ]

                    });

                    return;
                }

                // ==================================================
                // FORWARD BUTTON
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

                            flags: 64

                        });

                    }

                    // ==================================================
                    // USER SELECT
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

                    await interaction.reply({

                        content:
                            "➡️ **Ticket weiterleiten**\n\nWähle unten das Teammitglied aus, an das dieses Ticket weitergeleitet werden soll.",

                        components: [
                            row
                        ],

                        flags: 64

                    });

                    return;
                }

                // ==================================================
                // CLOSE
                // ==================================================

                if (
                    interaction.customId ===
                    "close_ticket"
                ) {

                    const member =
                        interaction.member;

                    if (
                        !isStaff(member)
                    ) {

                        return interaction.reply({

                            content:
                                "❌ Nur Teammitglieder können Tickets schließen.",

                            flags: 64

                        });

                    }

                    const channel =
                        interaction.channel;

                    await interaction.reply({

                        content:
                            "🔒 Ticket wird in **3 Sekunden** geschlossen..."

                    });

                    const logEmbed =
                        baseEmbed(
                            "🔒 Ticket geschlossen",
                            0xed4245
                        );

                    logEmbed.addFields(

                        {

                            name:
                                "Geschlossen von",

                            value:
                                `${interaction.user} (${interaction.user.id})`

                        },

                        {

                            name:
                                "Ticket",

                            value:
                                channel
                                    ? `#${channel.name}`
                                    : "Unbekannt"

                        }

                    );

                    await sendLog(
                        interaction.guild,
                        logEmbed
                    );

                    setTimeout(
                        async () => {

                            try {

                                if (
                                    channel &&
                                    channel.deletable
                                ) {

                                    ticketData.delete(
                                        channel.id
                                    );

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

                    flags: 64

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

            if (!guild || !member) {
                return;
            }

            const logChannel =
                guild.channels.cache.get(
                    SUPPORT_LOG_CHANNEL_ID
                );

            if (!logChannel) {

                console.error(
                    `❌ Support-Log-Kanal nicht gefunden: ${SUPPORT_LOG_CHANNEL_ID}`
                );

                return;
            }

            if (
                !logChannel.isTextBased()
            ) {

                console.error(
                    "❌ Support-Log-Kanal ist kein Textkanal."
                );

                return;
            }

            const staffRole =
                await guild.roles
                    .fetch(SUPPORT_ROLE_ID)
                    .catch(
                        () => null
                    );

            if (!staffRole) {

                console.error(
                    `❌ Staff-Rolle nicht gefunden: ${SUPPORT_ROLE_ID}`
                );

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
                        `<t:${Math.floor(
                            Date.now() / 1000
                        )}:R>`

                }

            );

            embed.setThumbnail(
                member.user.displayAvatarURL({
                    dynamic: true
                })
            );

            embed.setFooter({

                text:
                    "VIBE Support System",

                iconURL:
                    client.user.displayAvatarURL()

            });

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

            const serverLog =
                baseEmbed(
                    "🎧 Support-Warteraum",
                    0x00a8ff,
                    "Neue Support-Anfrage."
                );

            serverLog.addFields(

                {

                    name:
                        "Nutzer",

                    value:
                        `${member} (${member.id})`

                },

                {

                    name:
                        "Kanal",

                    value:
                        newState.channel
                            ? newState.channel.toString()
                            : "Unbekannt"

                },

                {

                    name:
                        "Staff-Rolle",

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
// INTERACTIONS
// ======================================================

client.on(Events.InteractionCreate, async interaction => {

    try {

        // ==================================================
        // SLASH COMMANDS
        // ==================================================

        if (interaction.isChatInputCommand()) {

            // ==================================================
            // COUNTING START
            // ==================================================

            if (interaction.commandName === "countingstart") {

                if (
                    !interaction.member.permissions.has(
                        PermissionsBitField.Flags.ManageGuild
                    )
                ) {

                    return interaction.reply({
                        content:
                            "❌ Du benötigst die Berechtigung **Server verwalten**.",
                        flags: MessageFlags.Ephemeral
                    });

                }

                countingActive = true;
                countingChannelId = interaction.channelId;
                currentNumber = 1;
                lastUserId = null;

                await interaction.reply(
                    "🎉 **Counting gestartet!**\n\n" +
                    "📍 Dieser Channel ist jetzt der Counting-Channel.\n" +
                    "🔢 Erste Zahl: **1**"
                );

                return;
            }

            // ==================================================
            // COUNTING STOP
            // ==================================================

            if (interaction.commandName === "countingstop") {

                if (
                    !interaction.member.permissions.has(
                        PermissionsBitField.Flags.ManageGuild
                    )
                ) {

                    return interaction.reply({
                        content:
                            "❌ Du benötigst die Berechtigung **Server verwalten**.",
                        flags: MessageFlags.Ephemeral
                    });

                }

                countingActive = false;
                countingChannelId = null;
                currentNumber = 1;
                lastUserId = null;

                await interaction.reply(
                    "🛑 **Counting wurde gestoppt.**"
                );

                return;
            }

            // ==================================================
            // LOG TEST
            // ==================================================

            if (interaction.commandName === "logtest") {

                if (
                    !interaction.member.permissions.has(
                        PermissionsBitField.Flags.Administrator
                    )
                ) {

                    return interaction.reply({
                        content:
                            "❌ Nur Administratoren können diesen Befehl benutzen.",
                        flags: MessageFlags.Ephemeral
                    });

                }

                const embed = baseEmbed(
                    "🧪 Logging Test",
                    0x5865f2,
                    "Das Server-Logging funktioniert."
                );

                embed.addFields(
                    {
                        name: "Ausgeführt von",
                        value:
                            `${interaction.user} (${interaction.user.id})`
                    },
                    {
                        name: "Channel",
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

                await interaction.reply({
                    content:
                        "✅ Test-Log wurde gesendet.",
                    flags: MessageFlags.Ephemeral
                });

                return;
            }

            // ==================================================
            // TICKET PANEL
            // ==================================================

            if (interaction.commandName === "ticketpanel") {

                if (
                    !interaction.member.permissions.has(
                        PermissionsBitField.Flags.Administrator
                    )
                ) {

                    return interaction.reply({
                        content:
                            "❌ Nur Administratoren können das Ticket Panel erstellen.",
                        flags: MessageFlags.Ephemeral
                    });

                }

                const embed = new EmbedBuilder()
                    .setColor("#2B2D31")
                    .setTitle("🎫 Allgemeiner Support")
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
                        text: "VIBE Support System"
                    });

                const menu = new StringSelectMenuBuilder()
                    .setCustomId("ticket_menu")
                    .setPlaceholder(
                        "Wähle eine Kategorie aus"
                    )
                    .addOptions([
                        {
                            label: "Allgemeiner Support",
                            description:
                                "Hilfe und Anliegen",
                            emoji: "🛡️",
                            value: "clan_bewerbung"
                        },
                        {
                            label: "Team Bewerbung",
                            description:
                                "Bewirb dich für das Team",
                            emoji: "👥",
                            value: "team_bewerbung"
                        },
                        {
                            label: "Bau Firma",
                            description:
                                "Firmenbewerbung und Aufträge",
                            emoji: "🏗️",
                            value: "bau_firma"
                        },
                        {
                            label: "Giveaway",
                            description:
                                "Fragen und Hilfe zu Giveaways",
                            emoji: "🎁",
                            value: "giveaway"
                        }
                    ]);

                const row = new ActionRowBuilder()
                    .addComponents(menu);

                await interaction.reply({
                    embeds: [embed],
                    components: [row]
                });

                return;
            }
        }

        // ==================================================
        // TICKET SELECT MENU
        // ==================================================

        if (
            interaction.isStringSelectMenu() &&
            interaction.customId === "ticket_menu"
        ) {

            const selected =
                interaction.values[0];

            let ticketName = null;
            let ticketTitle = null;
            let categoryID = null;

            // ==================================================
            // SUPPORT
            // ==================================================

            if (selected === "clan_bewerbung") {

                ticketName =
                    `support-${interaction.user.username.toLowerCase()}`;

                ticketTitle =
                    "🛡️ Allgemeiner Support";

                categoryID =
                    CLAN_CATEGORY_ID;
            }

            // ==================================================
            // TEAM
            // ==================================================

            if (selected === "team_bewerbung") {

                ticketName =
                    `bewerbung-${interaction.user.username.toLowerCase()}`;

                ticketTitle =
                    "👥 Team Bewerbung";

                categoryID =
                    TEAM_CATEGORY_ID;
            }

            // ==================================================
            // BAU
            // ==================================================

            if (selected === "bau_firma") {

                ticketName =
                    `bau-${interaction.user.username.toLowerCase()}`;

                ticketTitle =
                    "🏗️ Bau Firma";

                categoryID =
                    BAU_CATEGORY_ID;
            }

            // ==================================================
            // GIVEAWAY
            // ==================================================

            if (selected === "giveaway") {

                ticketName =
                    `giveaway-${interaction.user.username.toLowerCase()}`;

                ticketTitle =
                    "🎁 Giveaway";

                categoryID =
                    GIVEAWAY_CATEGORY_ID;
            }

            if (
                !ticketName ||
                !ticketTitle ||
                !categoryID
            ) {

                return interaction.reply({
                    content:
                        "❌ Ungültige Ticket-Kategorie.",
                    flags: MessageFlags.Ephemeral
                });

            }

            // ==================================================
            // GIVEAWAY KATEGORIE PRÜFEN
            // ==================================================

            if (
                selected === "giveaway" &&
                (
                    !GIVEAWAY_CATEGORY_ID ||
                    GIVEAWAY_CATEGORY_ID ===
                        "HIER_GIVEAWAY_KATEGORIE_ID_EINTRAGEN"
                )
            ) {

                return interaction.reply({
                    content:
                        "❌ Die Giveaway-Kategorie wurde noch nicht eingerichtet.",
                    flags: MessageFlags.Ephemeral
                });

            }

            // ==================================================
            // USER + ROLE SICHER LADEN
            // ==================================================

            const guild =
                interaction.guild;

            const member =
                await guild.members
                    .fetch(interaction.user.id)
                    .catch(() => null);

            if (!member) {

                return interaction.reply({
                    content:
                        "❌ Dein Discord-Mitglied konnte nicht geladen werden.",
                    flags: MessageFlags.Ephemeral
                });

            }

            const staffRole =
                await guild.roles.fetch(STAFF_ROLE_ID)
                    .catch(() => null);

            if (!staffRole) {

                console.error(
                    `❌ Staff-Rolle nicht gefunden: ${STAFF_ROLE_ID}`
                );

                return interaction.reply({
                    content:
                        "❌ Die Staff-Rolle konnte nicht gefunden werden.",
                    flags: MessageFlags.Ephemeral
                });

            }

            // ==================================================
            // KATEGORIE SICHER LADEN
            // ==================================================

            const category =
                await guild.channels
                    .fetch(categoryID)
                    .catch(() => null);

            if (!category) {

                console.error(
                    `❌ Ticket-Kategorie nicht gefunden: ${categoryID}`
                );

                return interaction.reply({
                    content:
                        "❌ Die Ticket-Kategorie wurde nicht gefunden.",
                    flags: MessageFlags.Ephemeral
                });

            }

            // ==================================================
            // EXISTIERENDES TICKET
            // ==================================================

            const existing =
                guild.channels.cache.find(
                    channel =>
                        channel.name === ticketName
                );

            if (existing) {

                return interaction.reply({
                    content:
                        `❌ Du hast bereits ein Ticket offen: ${existing}`,
                    flags: MessageFlags.Ephemeral
                });

            }

            // ==================================================
            // TICKET ERSTELLEN
            //
            // WICHTIG:
            // Hier werden echte GuildMember/Role Objekte
            // verwendet. Dadurch verschwindet der
            // "Supplied parameter is not a cached User or Role"
            // Fehler.
            // ==================================================

            const channel =
                await guild.channels.create({

                    name: ticketName,

                    type: ChannelType.GuildText,

                    parent: category.id,

                    permissionOverwrites: [

                        {
                            id: guild.roles.everyone,
                            deny: [
                                PermissionsBitField.Flags.ViewChannel
                            ]
                        },

                        {
                            id: member,
                            allow: [
                                PermissionsBitField.Flags.ViewChannel,
                                PermissionsBitField.Flags.SendMessages,
                                PermissionsBitField.Flags.ReadMessageHistory
                            ]
                        },

                        {
                            id: staffRole,
                            allow: [
                                PermissionsBitField.Flags.ViewChannel,
                                PermissionsBitField.Flags.SendMessages,
                                PermissionsBitField.Flags.ReadMessageHistory
                            ]
                        }

                    ]

                });

            // ==================================================
            // CLAIM BUTTON
            // ==================================================

            const claimButton =
                new ButtonBuilder()
                    .setCustomId("claim_ticket")
                    .setLabel("Ticket übernehmen")
                    .setEmoji("📌")
                    .setStyle(ButtonStyle.Primary);

            // ==================================================
            // FORWARD BUTTON
            // ==================================================

            const forwardButton =
                new ButtonBuilder()
                    .setCustomId("forward_ticket")
                    .setLabel("Weiterleiten")
                    .setEmoji("➡️")
                    .setStyle(ButtonStyle.Secondary);

            // ==================================================
            // CLOSE BUTTON
            // ==================================================

            const closeButton =
                new ButtonBuilder()
                    .setCustomId("close_ticket")
                    .setLabel("Ticket schließen")
                    .setEmoji("🔒")
                    .setStyle(ButtonStyle.Danger);

            const buttonRow =
                new ActionRowBuilder()
                    .addComponents(
                        claimButton,
                        forwardButton,
                        closeButton
                    );

            // ==================================================
            // TICKET EMBED
            // ==================================================

            const ticketEmbed =
                new EmbedBuilder()
                    .setColor("#57F287")
                    .setTitle(ticketTitle)
                    .setDescription(
`Hallo ${interaction.user} 👋

Dein Ticket wurde erfolgreich erstellt.

📌 Bitte beschreibe dein Anliegen möglichst genau, damit das Team dir schnell helfen kann.

🛡️ Ein Teammitglied wird sich schnellstmöglich darum kümmern.

📌 **Ticket übernehmen:**
Wenn ein Teammitglied das Ticket übernimmt, können normale Teammitglieder nicht mehr schreiben.

➡️ **Weiterleiten:**
Mit "Weiterleiten" kann das Ticket an ein anderes Teammitglied übergeben werden.`
                    )
                    .setFooter({
                        text: "VIBE Ticket System"
                    })
                    .setTimestamp();

            // ==================================================
            // TICKET SENDEN
            // ==================================================

            await channel.send({

                content:
                    `<@&${staffRole.id}>`,

                allowedMentions: {
                    roles: [
                        staffRole.id
                    ]
                },

                embeds: [
                    ticketEmbed
                ],

                components: [
                    buttonRow
                ]

            });

            // ==================================================
            // ANTWORT
            // ==================================================

            await interaction.reply({

                content:
                    `✅ Dein Ticket wurde erstellt: ${channel}`,

                flags: MessageFlags.Ephemeral

            });

            // ==================================================
            // LOG
            // ==================================================

            const logEmbed =
                baseEmbed(
                    "🎫 Ticket erstellt",
                    0x57f287
                );

            logEmbed.addFields(
                {
                    name: "Ersteller",
                    value:
                        `${interaction.user} (${interaction.user.id})`
                },
                {
                    name: "Ticket",
                    value:
                        channel.toString()
                },
                {
                    name: "Kategorie",
                    value:
                        ticketTitle
                }
            );

            await sendLog(
                guild,
                logEmbed
            );

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

            // ==================================================
            // STAFF PRÜFEN
            // ==================================================

            if (
                !interaction.member.roles.cache.has(
                    STAFF_ROLE_ID
                )
            ) {

                return interaction.reply({
                    content:
                        "❌ Nur Teammitglieder können Tickets weiterleiten.",
                    flags: MessageFlags.Ephemeral
                });

            }

            const selectedUserId =
                interaction.values[0];

            const selectedMember =
                await interaction.guild.members
                    .fetch(selectedUserId)
                    .catch(() => null);

            if (!selectedMember) {

                return interaction.reply({
                    content:
                        "❌ Das ausgewählte Teammitglied wurde nicht gefunden.",
                    flags: MessageFlags.Ephemeral
                });

            }

            // ==================================================
            // STAFF ROLLE PRÜFEN
            // ==================================================

            if (
                !selectedMember.roles.cache.has(
                    STAFF_ROLE_ID
                )
            ) {

                return interaction.reply({
                    content:
                        "❌ Du kannst das Ticket nur an ein Mitglied mit der Staff-Rolle weiterleiten.",
                    flags: MessageFlags.Ephemeral
                });

            }

            const channel =
                interaction.channel;

            if (!channel) {

                return interaction.reply({
                    content:
                        "❌ Der Ticket-Kanal wurde nicht gefunden.",
                    flags: MessageFlags.Ephemeral
                });

            }

            // ==================================================
            // USER EXPLIZIT ZUGRIFF GEBEN
            // ==================================================

            await channel.permissionOverwrites.edit(

                selectedMember,

                {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true
                }

            );

            // ==================================================
            // AUSWAHLMENÜ LÖSCHEN
            // ==================================================

            await interaction.message
                .delete()
                .catch(() => {});

            // ==================================================
            // WEITERLEITUNGS EMBED
            // ==================================================

            const forwardEmbed =
                new EmbedBuilder()
                    .setColor("#5865F2")
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
                    name: "🎫 Ticket",
                    value:
                        channel.toString()
                },
                {
                    name: "👤 Weitergeleitet von",
                    value:
                        `${interaction.user} (${interaction.user.id})`
                },
                {
                    name: "🎯 Weitergeleitet an",
                    value:
                        `${selectedMember} (${selectedMember.id})`
                }
            );

            await sendLog(
                interaction.guild,
                logEmbed
            );

            return;
        }

        // ==================================================
        // BUTTONS
        // ==================================================

        if (interaction.isButton()) {

            // ==================================================
            // CLAIM
            // ==================================================

            if (
                interaction.customId ===
                "claim_ticket"
            ) {

                // ==================================================
                // STAFF PRÜFEN
                // ==================================================

                if (
                    !interaction.member.roles.cache.has(
                        STAFF_ROLE_ID
                    )
                ) {

                    return interaction.reply({
                        content:
                            "❌ Nur Teammitglieder können Tickets übernehmen.",
                        flags: MessageFlags.Ephemeral
                    });

                }

                const channel =
                    interaction.channel;

                if (!channel) {

                    return interaction.reply({
                        content:
                            "❌ Ticket-Kanal nicht gefunden.",
                        flags: MessageFlags.Ephemeral
                    });

                }

                // ==================================================
                // CLAIMER SICHER LADEN
                // ==================================================

                const claimer =
                    await interaction.guild.members
                        .fetch(interaction.user.id)
                        .catch(() => null);

                if (!claimer) {

                    return interaction.reply({
                        content:
                            "❌ Dein Mitglied konnte nicht geladen werden.",
                        flags: MessageFlags.Ephemeral
                    });

                }

                // ==================================================
                // STAFF ROLE SICHER LADEN
                // ==================================================

                const staffRole =
                    await interaction.guild.roles
                        .fetch(STAFF_ROLE_ID)
                        .catch(() => null);

                if (!staffRole) {

                    return interaction.reply({
                        content:
                            "❌ Staff-Rolle nicht gefunden.",
                        flags: MessageFlags.Ephemeral
                    });

                }

                // ==================================================
                // WICHTIG:
                //
                // NACH CLAIM:
                //
                // STAFF ROLLE:
                // ViewChannel = JA
                // SendMessages = NEIN
                //
                // CLAIMER:
                // ViewChannel = JA
                // SendMessages = JA
                //
                // ADMINISTRATOREN:
                // KÖNNEN WEITERHIN SCHREIBEN
                // ==================================================

                await channel.permissionOverwrites.edit(

                    staffRole,

                    {
                        ViewChannel: true,
                        SendMessages: false,
                        ReadMessageHistory: true
                    }

                );

                await channel.permissionOverwrites.edit(

                    claimer,

                    {
                        ViewChannel: true,
                        SendMessages: true,
                        ReadMessageHistory: true
                    }

                );

                // ==================================================
                // CLAIM BUTTON DEAKTIVIEREN
                // ==================================================

                const claimedButton =
                    new ButtonBuilder()
                        .setCustomId(
                            "claimed_ticket"
                        )
                        .setLabel(
                            `Übernommen von ${interaction.user.username}`
                        )
                        .setEmoji("✅")
                        .setStyle(
                            ButtonStyle.Success
                        )
                        .setDisabled(true);

                const forwardButton =
                    new ButtonBuilder()
                        .setCustomId(
                            "forward_ticket"
                        )
                        .setLabel(
                            "Weiterleiten"
                        )
                        .setEmoji("➡️")
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
                        .setEmoji("🔒")
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
                        `Das Ticket wurde von ${interaction.user} übernommen.

🔒 **Normale Teammitglieder können jetzt nicht mehr schreiben.**

👤 **Zuständig:**
${interaction.user}

🛡️ **Administratoren können weiterhin eingreifen.**

➡️ Wenn das Ticket an einen anderen Teamler gehen soll, benutze **Weiterleiten**.`
                    );

                await interaction.reply({

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
                        name: "🎫 Ticket",
                        value:
                            channel.toString()
                    },
                    {
                        name: "👤 Übernommen von",
                        value:
                            `${interaction.user} (${interaction.user.id})`
                    },
                    {
                        name: "🔒 Status",
                        value:
                            "Nur der zuständige Teamler kann schreiben. Administratoren können weiterhin schreiben."
                    }
                );

                await sendLog(
                    interaction.guild,
                    logEmbed
                );

                return;
            }

            // ==================================================
            // FORWARD
            // ==================================================

            if (
                interaction.customId ===
                "forward_ticket"
            ) {

                if (
                    !interaction.member.roles.cache.has(
                        STAFF_ROLE_ID
                    )
                ) {

                    return interaction.reply({
                        content:
                            "❌ Nur Teammitglieder können Tickets weiterleiten.",
                        flags: MessageFlags.Ephemeral
                    });

                }

                // ==================================================
                // USER SELECT
                // ==================================================

                const userSelect =
                    new UserSelectMenuBuilder()
                        .setCustomId(
                            "forward_ticket_user"
                        )
                        .setPlaceholder(
                            "Wähle das Teammitglied aus..."
                        )
                        .setMinValues(1)
                        .setMaxValues(1);

                const row =
                    new ActionRowBuilder()
                        .addComponents(
                            userSelect
                        );

                await interaction.reply({

                    content:
                        "➡️ **Ticket weiterleiten**\n\n" +
                        "Wähle unten das Teammitglied aus, an das dieses Ticket weitergeleitet werden soll.",

                    components: [
                        row
                    ],

                    flags:
                        MessageFlags.Ephemeral

                });

                return;
            }

            // ==================================================
            // CLOSE
            // ==================================================

            if (
                interaction.customId ===
                "close_ticket"
            ) {

                const channel =
                    interaction.channel;

                await interaction.reply({

                    content:
                        "🔒 Ticket wird in **3 Sekunden** geschlossen..."

                });

                const logEmbed =
                    baseEmbed(
                        "🔒 Ticket geschlossen",
                        0xed4245
                    );

                logEmbed.addFields(
                    {
                        name:
                            "Geschlossen von",
                        value:
                            `${interaction.user} (${interaction.user.id})`
                    },
                    {
                        name:
                            "Ticket",
                        value:
                            channel
                                ? `#${channel.name}`
                                : "Unbekannt"
                    }
                );

                await sendLog(
                    interaction.guild,
                    logEmbed
                );

                setTimeout(
                    async () => {

                        try {

                            if (
                                channel &&
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

            }).catch(() => {});

        }
    }
});


// ======================================================
// SUPPORT VOICE WARTERAUM
// ======================================================

client.on(
    Events.VoiceStateUpdate,
    async (oldState, newState) => {

        try {

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

            if (!guild || !member) {
                return;
            }

            const logChannel =
                guild.channels.cache.get(
                    SUPPORT_LOG_CHANNEL_ID
                );

            if (!logChannel) {

                console.error(
                    `❌ Support-Log-Kanal nicht gefunden: ${SUPPORT_LOG_CHANNEL_ID}`
                );

                return;
            }

            if (!logChannel.isTextBased()) {

                console.error(
                    "❌ Support-Log-Kanal ist kein Textkanal."
                );

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
                    name: "👤 Spieler",
                    value:
                        `${member} (${member.id})`
                },
                {
                    name: "📞 Warteraum",
                    value:
                        newState.channel
                            ? newState.channel.toString()
                            : "Unbekannt"
                },
                {
                    name: "⏰ Zeit",
                    value:
                        `<t:${Math.floor(Date.now() / 1000)}:R>`
                }
            );

            embed.setThumbnail(
                member.user.displayAvatarURL({
                    dynamic: true
                })
            );

            embed.setFooter({
                text:
                    "VIBE Support System",
                iconURL:
                    client.user.displayAvatarURL()
            });

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

            const serverLog =
                baseEmbed(
                    "🎧 Support-Warteraum",
                    0x00a8ff,
                    "Neue Support-Anfrage."
                );

            serverLog.addFields(
                {
                    name: "Nutzer",
                    value:
                        `${member} (${member.id})`
                },
                {
                    name: "Kanal",
                    value:
                        newState.channel
                            ? newState.channel.toString()
                            : "Unbekannt"
                },
                {
                    name: "Staff-Rolle",
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
);


// ======================================================
// COUNTING SYSTEM
// ======================================================

client.on(
    Events.MessageCreate,
    async message => {

        try {

            if (message.author.bot) {
                return;
            }

            if (!countingActive) {
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
                Number(message.content);

            if (
                message.author.id ===
                lastUserId
            ) {

                await message.reply(
                    "❌ Du kannst nicht zweimal hintereinander zählen!\n" +
                    "🔄 Neustart bei **1**."
                );

                currentNumber = 1;
                lastUserId = null;

                return;
            }

            if (
                number ===
                currentNumber
            ) {

                await message.react("✅")
                    .catch(() => {});

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

                    currentNumber = 1;
                    lastUserId = null;

                }

            } else {

                await message.reply(
                    `❌ **Falsch!** Erwartet wurde **${currentNumber}**.\n` +
                    `🔄 Neustart bei **1**.`
                );

                currentNumber = 1;
                lastUserId = null;

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

            if (!channel) {
                return;
            }

            const embed =
                new EmbedBuilder()
                    .setColor("#FEE75C")
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
                    accountAge / 86400000
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
                    name: "👤 Nutzer",
                    value:
                        `${member} (${member.user.tag})`
                },
                {
                    name: "⏲️ Kontoalter",
                    value:
                        `${days} Tage`,
                    inline: true
                },
                {
                    name: "👥 Mitglieder",
                    value:
                        `${member.guild.memberCount}`,
                    inline: true
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

            } else {

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
            }

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

            if (entry) {

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
);


// ======================================================
// NICKNAME + ROLLEN
// ======================================================

client.on(
    Events.GuildMemberUpdate,
    async (before, after) => {

        try {

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
                            "Vorher",
                        value:
                            safeText(
                                before.nickname,
                                before.user.username
                            )
                    },
                    {
                        name:
                            "Nachher",
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
                                ? entry.executor.toString()
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
                        role => role.id
                    )
                );

            const afterRoles =
                new Set(
                    after.roles.cache.map(
                        role => role.id
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
                            .join(", ")
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
                            .join(", ")
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
                            ? entry.executor.toString()
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

            const member =
                after.member ||
                before.member;

            if (!member) {
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
                            member.toString(),
                        inline: true
                    },
                    {
                        name:
                            "🔊 Kanal",
                        value:
                            after.channel
                                ? after.channel.toString()
                                : "Unbekannt",
                        inline: true
                    }
                );

                await sendLog(
                    member.guild,
                    embed
                );

            } else if (
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
                            member.toString(),
                        inline: true
                    },
                    {
                        name:
                            "🔊 Kanal",
                        value:
                            before.channel
                                ? before.channel.toString()
                                : "Unbekannt",
                        inline: true
                    }
                );

                await sendLog(
                    member.guild,
                    embed
                );

            } else if (
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
                            member.toString()
                    },
                    {
                        name:
                            "Von",
                        value:
                            before.channel.toString(),
                        inline: true
                    },
                    {
                        name:
                            "Zu",
                        value:
                            after.channel.toString(),
                        inline: true
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
                        member.toString()
                });

                if (entry) {

                    embed.addFields({
                        name:
                            "🛡️ Verantwortlicher Moderator",
                        value:
                            entry.executor
                                ? entry.executor.toString()
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
                        member.toString()
                });

                if (entry) {

                    embed.addFields({
                        name:
                            "🛡️ Verantwortlicher Moderator",
                        value:
                            entry.executor
                                ? entry.executor.toString()
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
                            ? "🎙️ Nutzer hat sich selbst stummgeschaltet"
                            : "🎙️ Nutzer ist nicht mehr stummgeschaltet",
                        0x99aab5,
                        "Der Nutzer hat seinen Self-Mute-Status geändert."
                    );

                embed.addFields(
                    {
                        name:
                            "👤 Nutzer",
                        value:
                            member.toString()
                    },
                    {
                        name:
                            "🔊 Kanal",
                        value:
                            after.channel
                                ? after.channel.toString()
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
                            ? "🎧 Nutzer hat sich selbst taubgeschaltet"
                            : "🎧 Nutzer ist nicht mehr taubgeschaltet",
                        0x99aab5,
                        "Der Nutzer hat seinen Self-Deaf-Status geändert."
                    );

                embed.addFields(
                    {
                        name:
                            "👤 Nutzer",
                        value:
                            member.toString()
                    },
                    {
                        name:
                            "🔊 Kanal",
                        value:
                            after.channel
                                ? after.channel.toString()
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

            if (!channel.guild) {
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
                },
                {
                    name:
                        "Typ",
                    value:
                        channel.type ===
                        ChannelType.GuildText
                            ? "Textkanal"
                            : channel.type ===
                              ChannelType.GuildVoice
                                ? "Sprachkanal"
                                : "Sonstiger Kanal"
                }
            );

            if (entry) {

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

            if (entry) {

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
// CHANNEL UPDATE / PERMISSIONS
// ======================================================

client.on(
    Events.ChannelUpdate,
    async (before, after) => {

        try {

            if (
                before.permissionOverwrites.cache.equals(
                    after.permissionOverwrites.cache
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

            if (entry) {

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
                after.guild,
                embed
            );

        } catch (error) {

            console.error(
                "❌ Channel Update Fehler:",
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

            if (!message.guild) {
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

            if (!before.guild) {
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
                        "Vorher",
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
                        "Nachher",
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

            if (after.url) {

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
// WARN
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
// UNHANDLED REJECTION
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

if (!TOKEN) {

    console.error("");

    console.error(
        "===================================="
    );

    console.error(
        "❌ TOKEN FEHLT!"
    );

    console.error(
        "Setze TOKEN in deiner .env Datei."
    );

    console.error(
        "===================================="
    );

    console.error("");

    process.exit(1);
}


// ======================================================
// LOGIN
// ======================================================

console.log(
    "🔐 Bot wird eingeloggt..."
);

client.login(TOKEN)

    .then(() => {

        console.log(
            "🔐 Login erfolgreich gestartet."
        );

    })

    .catch(error => {

        console.error(
            "❌ Discord Login fehlgeschlagen:",
            error
        );

        process.exit(1);

    });
