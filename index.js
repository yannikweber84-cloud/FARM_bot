require("dotenv").config();

const express = require("express");
const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    ChannelType,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    Events,
    REST,
    Routes,
    SlashCommandBuilder,
    EmbedBuilder,
    AuditLogEvent
} = require("discord.js");

// ======================================================
// WEB SERVER – FÜR RENDER
// ======================================================

const app = express();

app.get("/", (req, res) => {
    res.status(200).send("VIBE Bot läuft! 🟢");
});

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "online",
        bot: client?.user?.tag || "starting"
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🌐 Webserver läuft auf Port ${PORT}`);
});

// ======================================================
// KONFIGURATION
// ======================================================

const TOKEN = process.env.TOKEN;

const CLIENT_ID = "1534585700408889466";
const GUILD_ID = "1537927032066019470";

// Welcome
const WELCOME_CHANNEL_ID = "1537927035794489405";

// Team
const STAFF_ROLE_ID = "1537927034842517550";
const SUPPORT_ROLE_ID = "537927035794489405";

// Support Voice
const SUPPORT_WARTE_RAUM_ID = "1537927036293615635";

// Support Log
const SUPPORT_LOG_CHANNEL_ID = "1537927036293615633";

// Server Log
// HIER DEINE LOG-CHANNEL-ID EINTRAGEN
const SERVER_LOG_CHANNEL_ID =
    process.env.SERVER_LOG_CHANNEL_ID || "1535618767915065439";

// Ticket Kategorien
const CLAN_CATEGORY_ID = "1537927037627400232";
const TEAM_CATEGORY_ID = "1537927037627400233";
const BAU_CATEGORY_ID = "1537927037916942456";

// ======================================================
// COUNTING
// ======================================================

let countingActive = false;
let countingChannelId = null;
let currentNumber = 1;
let lastUserId = null;

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
// EMBED HELPER
// ======================================================

function baseEmbed(title, color, description = "") {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp();
}

// ======================================================
// LOG CHANNEL
// ======================================================

function getLogChannel(guild) {
    if (!guild) return null;

    return guild.channels.cache.get(SERVER_LOG_CHANNEL_ID);
}

async function sendLog(guild, embed) {
    try {
        const channel = getLogChannel(guild);

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
        console.error("❌ Logging Fehler:", error);
    }
}

// ======================================================
// AUDIT LOG HELPER
// ======================================================

async function getAuditExecutor(
    guild,
    action,
    targetId,
    maxEntries = 10
) {
    try {
        const logs = await guild.fetchAuditLogs({
            limit: maxEntries,
            type: action
        });

        const entry = logs.entries.find(
            e =>
                e.target &&
                e.target.id === targetId &&
                Date.now() - e.createdTimestamp < 10000
        );

        return entry || null;

    } catch (error) {
        if (error.code !== 50013) {
            console.error("Audit-Log Fehler:", error);
        }

        return null;
    }
}

// ======================================================
// SLASH COMMANDS
// ======================================================

const commands = [

    new SlashCommandBuilder()
        .setName("ticketpanel")
        .setDescription("Erstellt das Ticket Panel")
        .toJSON(),

    new SlashCommandBuilder()
        .setName("countingstart")
        .setDescription("Startet das Counting")
        .toJSON(),

    new SlashCommandBuilder()
        .setName("countingstop")
        .setDescription("Stoppt das Counting")
        .toJSON(),

    new SlashCommandBuilder()
        .setName("logtest")
        .setDescription("Testet das Server-Logging")
        .toJSON()
];

const rest = new REST({
    version: "10"
}).setToken(TOKEN);

// ======================================================
// COMMAND REGISTRIEREN
// ======================================================

async function registerCommands() {
    try {

        console.log("⏳ Registriere Slash Commands...");

        await rest.put(
            Routes.applicationGuildCommands(
                CLIENT_ID,
                GUILD_ID
            ),
            {
                body: commands
            }
        );

        console.log("✅ Slash Commands registriert");

    } catch (error) {

        console.error(
            "❌ Fehler beim Registrieren der Commands:",
            error
        );
    }
}

// ======================================================
// READY
// ======================================================

client.once(Events.ClientReady, async () => {

    console.log("");
    console.log("====================================");
    console.log(`✅ Bot online: ${client.user.tag}`);
    console.log(`🆔 Bot ID: ${client.user.id}`);
    console.log(`🌐 Port: ${PORT}`);
    console.log(`📝 Log Channel: ${SERVER_LOG_CHANNEL_ID}`);
    console.log("====================================");
    console.log("");

    await registerCommands();

});

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

            if (interaction.isChatInputCommand()) {

                // ==============================================
                // COUNTING START
                // ==============================================

                if (
                    interaction.commandName ===
                    "countingstart"
                ) {

                    if (
                        !interaction.member.permissions.has(
                            PermissionsBitField.Flags.ManageGuild
                        )
                    ) {

                        return interaction.reply({
                            content:
                                "❌ Du benötigst die Berechtigung **Server verwalten**.",
                            ephemeral: true
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

                // ==============================================
                // COUNTING STOP
                // ==============================================

                if (
                    interaction.commandName ===
                    "countingstop"
                ) {

                    if (
                        !interaction.member.permissions.has(
                            PermissionsBitField.Flags.ManageGuild
                        )
                    ) {

                        return interaction.reply({
                            content:
                                "❌ Du benötigst die Berechtigung **Server verwalten**.",
                            ephemeral: true
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

                // ==============================================
                // LOG TEST
                // ==============================================

                if (
                    interaction.commandName ===
                    "logtest"
                ) {

                    if (
                        !interaction.member.permissions.has(
                            PermissionsBitField.Flags.Administrator
                        )
                    ) {

                        return interaction.reply({
                            content:
                                "❌ Nur Administratoren können diesen Befehl benutzen.",
                            ephemeral: true
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
                                interaction.channel.toString()
                        }
                    );

                    await sendLog(
                        interaction.guild,
                        embed
                    );

                    await interaction.reply({
                        content:
                            "✅ Test-Log wurde gesendet.",
                        ephemeral: true
                    });

                    return;
                }

                // ==============================================
                // TICKET PANEL
                // ==============================================

                if (
                    interaction.commandName ===
                    "ticketpanel"
                ) {

                    if (
                        !interaction.member.permissions.has(
                            PermissionsBitField.Flags.Administrator
                        )
                    ) {

                        return interaction.reply({
                            content:
                                "❌ Nur Administratoren können das Ticket Panel erstellen.",
                            ephemeral: true
                        });
                    }

                    const embed =
                        new EmbedBuilder()
                            .setColor("#2B2D31")
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
• 🛠 Allgemeine Hilfe
• 🏗️ Bauprojekte & Aufträge

━━━━━━━━━━━━━━━━━━

👥 **Bewerbungen & Bau-Firma**

Du möchtest Teil unseres Teams werden oder die Bau-Firma unterstützen?

Egal ob Builder, Helfer oder für ein anderes Teammitglied – erstelle einfach ein Ticket.

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
                                    emoji: "🛡️",
                                    value:
                                        "clan_bewerbung"
                                },
                                {
                                    label:
                                        "Team Bewerbung",
                                    description:
                                        "Bewirb dich für Team ",
                                    emoji: "👥",
                                    value:
                                        "team_bewerbung"
                                },
                                {
                                    label:
                                        "Bau Firma",
                                    description:
                                        "Firmenbewerbung und Aufträge",
                                    emoji: "🏗️",
                                    value:
                                        "bau_firma"
                                }
                            ]);

                    const row =
                        new ActionRowBuilder()
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

                let ticketName;
                let ticketTitle;
                let categoryID;

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

                if (
                    selected ===
                    "team_bewerbung"
                ) {

                    ticketName =
                        `bewerbung-${interaction.user.username.toLowerCase()}`;

                    ticketTitle =
                        "👥 Team/Clan Bewerbung";

                    categoryID =
                        TEAM_CATEGORY_ID;
                }

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

                const existing =
                    interaction.guild.channels.cache.find(
                        c =>
                            c.name ===
                            ticketName
                    );

                if (existing) {

                    return interaction.reply({
                        content:
                            `❌ Du hast bereits ein Ticket offen: ${existing}`,
                        ephemeral: true
                    });
                }

                const channel =
                    await interaction.guild.channels.create({

                        name: ticketName,

                        type:
                            ChannelType.GuildText,

                        parent: categoryID,

                        permissionOverwrites: [

                            {
                                id:
                                    interaction.guild.id,

                                deny: [
                                    PermissionsBitField.Flags.ViewChannel
                                ]
                            },

                            {
                                id:
                                    interaction.user.id,

                                allow: [
                                    PermissionsBitField.Flags.ViewChannel,
                                    PermissionsBitField.Flags.SendMessages,
                                    PermissionsBitField.Flags.ReadMessageHistory
                                ]
                            },

                            {
                                id:
                                    STAFF_ROLE_ID,

                                allow: [
                                    PermissionsBitField.Flags.ViewChannel,
                                    PermissionsBitField.Flags.SendMessages,
                                    PermissionsBitField.Flags.ReadMessageHistory
                                ]
                            }
                        ]
                    });

                const claimButton =
                    new ButtonBuilder()
                        .setCustomId(
                            "claim_ticket"
                        )
                        .setLabel(
                            "Ticket übernehmen"
                        )
                        .setEmoji("📌")
                        .setStyle(
                            ButtonStyle.Primary
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

                const buttonRow =
                    new ActionRowBuilder()
                        .addComponents(
                            claimButton,
                            closeButton
                        );

                const ticketEmbed =
                    new EmbedBuilder()
                        .setColor("#57F287")
                        .setTitle(
                            ticketTitle
                        )
                        .setDescription(
`Hallo ${interaction.user} 👋

Dein Ticket wurde erfolgreich erstellt.

📌 Bitte beschreibe dein Anliegen möglichst genau, damit das Team dir schnell helfen kann.

🛡️ Ein Teammitglied wird sich schnellstmöglich darum kümmern.`
                        )
                        .setFooter({
                            text:
                                "VIBE Ticket System"
                        })
                        .setTimestamp();

                await channel.send({

                    content:
                        `<@&${STAFF_ROLE_ID}>`,

                    embeds: [
                        ticketEmbed
                    ],

                    components: [
                        buttonRow
                    ]
                });

                await interaction.reply({

                    content:
                        `✅ Dein Ticket wurde erstellt: ${channel}`,

                    ephemeral: true
                });

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
                    interaction.guild,
                    logEmbed
                );

                return;
            }

            // ==================================================
            // BUTTONS
            // ==================================================

            if (interaction.isButton()) {

                // ==============================================
                // CLAIM
                // ==============================================

                if (
                    interaction.customId ===
                    "claim_ticket"
                ) {

                    if (
                        !interaction.member.roles.cache.has(
                            STAFF_ROLE_ID
                        )
                    ) {

                        return interaction.reply({
                            content:
                                "❌ Nur Teammitglieder können Tickets übernehmen.",
                            ephemeral: true
                        });
                    }

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
                                closeButton
                            );

                    await interaction.message.edit({
                        components: [
                            newRow
                        ]
                    });

                    const claimEmbed =
                        new EmbedBuilder()
                            .setColor("#5865F2")
                            .setDescription(
`📌 **Ticket übernommen**

Der Teamler ${interaction.user} hat dieses Ticket übernommen.

Er wird sich zeitnah um dein Anliegen kümmern!`
                            )
                            .setTimestamp();

                    await interaction.reply({
                        embeds: [
                            claimEmbed
                        ]
                    });

                    return;
                }

                // ==============================================
                // CLOSE
                // ==============================================

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
                            name: "Geschlossen von",
                            value:
                                `${interaction.user} (${interaction.user.id})`
                        },
                        {
                            name: "Ticket",
                            value:
                                `#${channel.name}`
                        }
                    );

                    await sendLog(
                        interaction.guild,
                        logEmbed
                    );

                    setTimeout(
                        async () => {

                            try {
                                await channel.delete();
                            } catch (error) {
                                console.error(
                                    "Ticket Delete Fehler:",
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
                    ephemeral: true
                }).catch(() => {});
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
                newState.channelId ===
                    SUPPORT_WARTE_RAUM_ID &&
                oldState.channelId !==
                    SUPPORT_WARTE_RAUM_ID
            ) {

                const logChannel =
                    newState.guild.channels.cache.get(
                        SUPPORT_LOG_CHANNEL_ID
                    );

                if (!logChannel) return;

                const embed =
                    new EmbedBuilder()

                        .setColor("#00A8FF")

                        .setTitle(
                            "🎧 Neue Support-Anfrage"
                        )

                        .setDescription(
`👤 **Spieler**

${newState.member}

📞 **Warteraum**

${newState.channel}

⏰ **Zeit**

<t:${Math.floor(
    Date.now() / 1000
)}:R>

━━━━━━━━━━━━━━

🛡️ **Support-Team wird benötigt!**`
                        )

                        .setThumbnail(
                            newState.member.user.displayAvatarURL({
                                dynamic: true
                            })
                        )

                        .setFooter({
                            text:
                                "VIBE Support System",
                            iconURL:
                                client.user.displayAvatarURL()
                        })

                        .setTimestamp();

                await logChannel.send({

                    content:
                        `<@&${SUPPORT_ROLE_ID}>`,

                    embeds: [
                        embed
                    ]
                });

                const serverLog =
                    baseEmbed(
                        "🎧 Support-Warteraum",
                        0x00a8ff
                    );

                serverLog.addFields(
                    {
                        name: "Nutzer",
                        value:
                            `${newState.member} (${newState.member.id})`
                    },
                    {
                        name: "Kanal",
                        value:
                            newState.channel.toString()
                    }
                );

                await sendLog(
                    newState.guild,
                    serverLog
                );
            }

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

            if (message.author.bot)
                return;

            if (!countingActive)
                return;

            if (
                message.channel.id !==
                countingChannelId
            )
                return;

            if (
                !/^\d+$/.test(
                    message.content
                )
            )
                return;

            const number =
                Number(message.content);

            // Derselbe User darf nicht
            // zweimal hintereinander zählen.

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
                number === currentNumber
            ) {

                await message.react("✅");

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
                "Counting Fehler:",
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

            if (!channel)
                return;

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
                "Join Fehler:",
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
                0x57f287
            );

        embed.setThumbnail(
            member.displayAvatarURL()
        );

        embed.addFields(
            {
                name: "👤 Nutzer",
                value:
                    `${member} (${member.user.tag})`,
                inline: false
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
    }
);

// ======================================================
// MEMBER LEAVE / KICK
// ======================================================

client.on(
    Events.GuildMemberRemove,
    async member => {

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
                    0xfaa61a
                );

            embed.addFields(
                {
                    name: "👤 Nutzer",
                    value:
                        `${member.user.tag} (${member.id})`
                },
                {
                    name:
                        "🛡️ Verantwortlicher Moderator",
                    value:
                        `${entry.executor}`
                },
                {
                    name: "📄 Grund",
                    value:
                        entry.reason ||
                        "Kein Grund angegeben"
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
                    0xed4245
                );

            embed.addFields(
                {
                    name: "👤 Nutzer",
                    value:
                        `${member.user.tag} (${member.id})`
                }
            );

            embed.setFooter({
                text:
                    `Aktuelle Memberanzahl: ${member.guild.memberCount}`
            });

            await sendLog(
                member.guild,
                embed
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
                0x992d22
            );

        embed.addFields(
            {
                name: "👤 Nutzer",
                value:
                    `${ban.user.tag} (${ban.user.id})`
            }
        );

        if (entry) {

            embed.addFields(
                {
                    name:
                        "🛡️ Verantwortlicher Moderator",
                    value:
                        `${entry.executor}`
                },
                {
                    name: "📄 Grund",
                    value:
                        entry.reason ||
                        "Kein Grund angegeben"
                }
            );
        }

        await sendLog(
            ban.guild,
            embed
        );
    }
);

// ======================================================
// UNBAN
// ======================================================

client.on(
    Events.GuildBanRemove,
    async ban => {

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
                0x57f287
            );

        embed.addFields(
            {
                name: "👤 Nutzer",
                value:
                    `${ban.user.tag} (${ban.user.id})`
            }
        );

        if (entry) {

            embed.addFields(
                {
                    name:
                        "🛡️ Verantwortlicher Moderator",
                    value:
                        `${entry.executor}`
                }
            );
        }

        await sendLog(
            ban.guild,
            embed
        );
    }
);

// ======================================================
// NICKNAME + ROLLEN
// ======================================================

client.on(
    Events.GuildMemberUpdate,
    async (before, after) => {

        // ==============================================
        // NICKNAME
        // ==============================================

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
                    0x5865f2
                );

            embed.addFields(
                {
                    name: "👤 Nutzer",
                    value:
                        `${after} (${after.id})`
                },
                {
                    name: "Vorher",
                    value:
                        before.nickname ||
                        before.user.username
                },
                {
                    name: "Nachher",
                    value:
                        after.nickname ||
                        after.user.username
                }
            );

            if (entry) {

                embed.addFields(
                    {
                        name:
                            "🛡️ Verantwortlicher",
                        value:
                            entry.executor.toString()
                    }
                );
            }

            await sendLog(
                after.guild,
                embed
            );
        }

        // ==============================================
        // ROLLEN
        // ==============================================

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
                0x5865f2
            );

        embed.addFields({
            name: "👤 Nutzer",
            value:
                `${after} (${after.id})`
        });

        if (addedRoles.size > 0) {

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
            });
        }

        if (removedRoles.size > 0) {

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
            });
        }

        if (entry) {

            embed.addFields({
                name:
                    "🛡️ Verantwortlicher",
                value:
                    entry.executor.toString()
            });
        }

        await sendLog(
            after.guild,
            embed
        );
    }
);

// ======================================================
// VOICE LOGGING
// ======================================================

client.on(
    Events.VoiceStateUpdate,
    async (before, after) => {

        const member =
            after.member ||
            before.member;

        if (!member)
            return;

        // ==============================================
        // JOIN
        // ==============================================

        if (
            !before.channel &&
            after.channel
        ) {

            const embed =
                baseEmbed(
                    "🔊 Sprachkanal beigetreten",
                    0x1abc9c
                );

            embed.addFields(
                {
                    name: "👤 Nutzer",
                    value:
                        member.toString(),
                    inline: true
                },
                {
                    name: "🔊 Kanal",
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

        // ==============================================
        // LEAVE
        // ==============================================

        else if (
            before.channel &&
            !after.channel
        ) {

            const embed =
                baseEmbed(
                    "🔇 Sprachkanal verlassen",
                    0x2f3136
                );

            embed.addFields(
                {
                    name: "👤 Nutzer",
                    value:
                        member.toString(),
                    inline: true
                },
                {
                    name: "🔊 Kanal",
                    value:
                        before.channel.toString(),
                    inline: true
                }
            );

            await sendLog(
                member.guild,
                embed
            );
        }

        // ==============================================
        // MOVE
        // ==============================================

        else if (
            before.channel &&
            after.channel &&
            before.channel.id !==
                after.channel.id
        ) {

            const embed =
                baseEmbed(
                    "🔁 Sprachkanal gewechselt",
                    0x1abc9c
                );

            embed.addFields(
                {
                    name: "👤 Nutzer",
                    value:
                        member.toString()
                },
                {
                    name: "Von",
                    value:
                        before.channel.toString(),
                    inline: true
                },
                {
                    name: "Zu",
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

        // ==============================================
        // SERVER MUTE
        // ==============================================

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
                        : 0x57f287
                );

            embed.addFields({
                name: "👤 Nutzer",
                value:
                    member.toString()
            });

            if (entry) {

                embed.addFields({
                    name:
                        "🛡️ Verantwortlicher Moderator",
                    value:
                        entry.executor.toString()
                });
            }

            await sendLog(
                member.guild,
                embed
            );
        }

        // ==============================================
        // SERVER DEAF
        // ==============================================

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
                        : 0x57f287
                );

            embed.addFields({
                name: "👤 Nutzer",
                value:
                    member.toString()
            });

            if (entry) {

                embed.addFields({
                    name:
                        "🛡️ Verantwortlicher Moderator",
                    value:
                        entry.executor.toString()
                });
            }

            await sendLog(
                member.guild,
                embed
            );
        }

        // ==============================================
        // SELF MUTE
        // ==============================================

        if (
            before.selfMute !==
            after.selfMute
        ) {

            const embed =
                baseEmbed(
                    after.selfMute
                        ? "🎙️ Nutzer hat sich selbst stummgeschaltet"
                        : "🎙️ Nutzer ist nicht mehr stummgeschaltet",
                    0x99aab5
                );

            embed.addFields(
                {
                    name: "👤 Nutzer",
                    value:
                        member.toString()
                },
                {
                    name: "🔊 Kanal",
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

        // ==============================================
        // SELF DEAF
        // ==============================================

        if (
            before.selfDeaf !==
            after.selfDeaf
        ) {

            const embed =
                baseEmbed(
                    after.selfDeaf
                        ? "🎧 Nutzer hat sich selbst taubgeschaltet"
                        : "🎧 Nutzer ist nicht mehr taubgeschaltet",
                    0x99aab5
                );

            embed.addFields(
                {
                    name: "👤 Nutzer",
                    value:
                        member.toString()
                },
                {
                    name: "🔊 Kanal",
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
    }
);

// ======================================================
// CHANNEL CREATE
// ======================================================

client.on(
    Events.ChannelCreate,
    async channel => {

        if (!channel.guild)
            return;

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
                0x57f287
            );

        embed.addFields(
            {
                name: "📁 Kanal",
                value:
                    channel.toString()
            },
            {
                name: "🆔 ID",
                value:
                    channel.id
            },
            {
                name: "Typ",
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
                    entry.executor.toString()
            });
        }

        await sendLog(
            channel.guild,
            embed
        );
    }
);

// ======================================================
// CHANNEL DELETE
// ======================================================

client.on(
    Events.ChannelDelete,
    async channel => {

        if (!channel.guild)
            return;

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
                0xed4245
            );

        embed.addFields(
            {
                name: "📁 Kanal",
                value:
                    `#${channel.name}`
            },
            {
                name: "🆔 ID",
                value:
                    channel.id
            }
        );

        if (entry) {

            embed.addFields({
                name:
                    "🛡️ Verantwortlicher",
                value:
                    entry.executor.toString()
            });
        }

        await sendLog(
            channel.guild,
            embed
        );
    }
);

// ======================================================
// CHANNEL UPDATE / PERMISSIONS
// ======================================================

client.on(
    Events.ChannelUpdate,
    async (before, after) => {

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
                0x5865f2
            );

        embed.addFields({
            name: "📁 Kanal",
            value:
                after.toString()
        });

        if (entry) {

            embed.addFields({
                name:
                    "🛡️ Verantwortlicher",
                value:
                    entry.executor.toString()
            });
        }

        await sendLog(
            after.guild,
            embed
        );
    }
);

// ======================================================
// MESSAGE DELETE
// ======================================================

client.on(
    Events.MessageDelete,
    async message => {

        if (!message.guild)
            return;

        if (
            message.author &&
            message.author.id ===
                client.user.id
        ) {
            return;
        }

        const embed =
            baseEmbed(
                "🗑️ Nachricht gelöscht",
                0xed4245
            );

        embed.addFields(
            {
                name: "👤 Autor",
                value:
                    message.author
                        ? `${message.author} (${message.author.id})`
                        : "Unbekannt"
            },
            {
                name: "📍 Kanal",
                value:
                    message.channel
                        ? message.channel.toString()
                        : "Unbekannt"
            },
            {
                name: "💬 Inhalt",
                value:
                    message.content
                        ? message.content.substring(
                              0,
                              1000
                          )
                        : "*(Kein Textinhalt / Embed / Anhang)*"
            }
        );

        await sendLog(
            message.guild,
            embed
        );
    }
);

// ======================================================
// MESSAGE EDIT
// ======================================================

client.on(
    Events.MessageUpdate,
    async (before, after) => {

        if (!before.guild)
            return;

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
                0xfee75c
            );

        embed.addFields(
            {
                name: "👤 Autor",
                value:
                    before.author
                        ? `${before.author} (${before.author.id})`
                        : "Unbekannt"
            },
            {
                name: "📍 Kanal",
                value:
                    before.channel.toString()
            },
            {
                name: "Vorher",
                value:
                    before.content
                        ? before.content.substring(
                              0,
                              1000
                          )
                        : "*(leer)*"
            },
            {
                name: "Nachher",
                value:
                    after.content
                        ? after.content.substring(
                              0,
                              1000
                          )
                        : "*(leer)*"
            }
        );

        if (after.url) {

            embed.addFields({
                name: "🔗 Nachricht",
                value:
                    `[Zur Nachricht](${after.url})`
            });
        }

        await sendLog(
            before.guild,
            embed
        );
    }
);

// ======================================================
// FEHLER
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
// TOKEN PRÜFEN
// ======================================================

if (!TOKEN) {

    console.error(
        "❌ TOKEN fehlt!"
    );

    console.error(
        "Setze TOKEN in deiner .env Datei."
    );

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
