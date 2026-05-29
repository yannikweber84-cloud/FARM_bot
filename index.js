require("dotenv").config();

const express = require("express");
const app = express();

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
    EmbedBuilder
} = require('discord.js');

// =======================
// RENDER WEB SERVER
// =======================

app.get("/", (req, res) => {
    res.send("Bot läuft ✔");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Server läuft auf Port ${PORT}`);
});

// =======================
// BOT CONFIG
// =======================

const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1509566143051071578";
const STAFF_ROLE_ID = "1508899899222134835";

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// =======================
// SLASH COMMAND
// =======================

const commands = [
    new SlashCommandBuilder()
        .setName('ticketpanel')
        .setDescription('Erstellt das Ticket Panel')
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );
        console.log("✅ Slash Command registriert");
    } catch (err) {
        console.error(err);
    }
})();

// =======================
// READY
// =======================

client.once(Events.ClientReady, () => {
    console.log(`✅ Online: ${client.user.tag}`);
});

// =======================
// INTERACTIONS
// =======================

client.on(Events.InteractionCreate, async interaction => {

    // =======================
    // PANEL
    // =======================

    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === 'ticketpanel') {

            const embed = new EmbedBuilder()
                .setColor('#2B2D31')
                .setTitle('🎫 Allgemeiner Support')
                .setDescription(`
Du hast ein Problem, eine Frage oder benötigst Hilfe auf dem Server? Dann bist du hier genau richtig!

Erstelle ein Ticket und beschreibe dein Anliegen so genau wie möglich, damit wir dir schnell und effektiv helfen können.

━━━━━━━━━━━━━━━━━━

📌 **Wobei wir dir helfen können:**

• Fragen zum Server  
• Probleme / Bugs  
• Spieler melden  
• Allgemeine Hilfe  
• Sonstige Anliegen

━━━━━━━━━━━━━━━━━━

👥 **Bewerbungen & Allgemeiner Support**

Du möchtest dich bewerben oder um allgemeinen Support bitten?  
Dann wähle unten die passende Kategorie aus.

━━━━━━━━━━━━━━━━━━
                `)
                .setFooter({ text: "FARM Ticket System" });

            const menu = new StringSelectMenuBuilder()
                .setCustomId('ticket_menu')
                .setPlaceholder('Kategorie auswählen')
                .addOptions([
                    {
                        label: 'Clan Bewerbung',
                        value: 'clan_bewerbung',
                        emoji: '🛡'
                    },
                    {
                        label: 'Team Bewerbung',
                        value: 'team_bewerbung',
                        emoji: '👥'
                    },
                    {
                        label: 'Allgemeiner Support',
                        value: 'support',
                        emoji: '🏗'
                    }
                ]);

            return interaction.reply({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(menu)]
            });
        }
    }

    // =======================
    // SELECT MENU
    // =======================

    if (interaction.isStringSelectMenu()) {

        if (interaction.customId === 'ticket_menu') {

            const selected = interaction.values[0];

            let ticketName = "";
            let ticketTitle = "";

            if (selected === "clan_bewerbung") {
                ticketName = `clan-${interaction.user.username}`;
                ticketTitle = "🛡 Clan Bewerbung";
            }

            if (selected === "team_bewerbung") {
                ticketName = `team-${interaction.user.username}`;
                ticketTitle = "👥 Team Bewerbung";
            }

            if (selected === "support") {
                ticketName = `support-${interaction.user.username}`;
                ticketTitle = "🏗 Allgemeiner Support";
            }

            const existing = interaction.guild.channels.cache.find(
                c => c.name === ticketName.toLowerCase()
            );

            if (existing) {
                return interaction.reply({
                    content: `❌ Du hast bereits ein Ticket offen: ${existing}`,
                    ephemeral: true
                });
            }

            const channel = await interaction.guild.channels.create({
                name: ticketName.toLowerCase(),
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages
                        ]
                    },
                    {
                        id: STAFF_ROLE_ID,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages
                        ]
                    }
                ]
            });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('claim_ticket')
                    .setLabel('Claim')
                    .setStyle(ButtonStyle.Primary),

                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Close')
                    .setStyle(ButtonStyle.Danger)
            );

            const embed = new EmbedBuilder()
                .setTitle(ticketTitle)
                .setDescription("Ticket erstellt. Bitte beschreibe dein Anliegen.")
                .setColor("#57F287");

            await channel.send({
                content: `<@&${STAFF_ROLE_ID}>`,
                embeds: [embed],
                components: [row]
            });

            return interaction.reply({
                content: `✅ Ticket erstellt: ${channel}`,
                ephemeral: true
            });
        }
    }

    // =======================
    // BUTTONS
    // =======================

    if (interaction.isButton()) {

        if (interaction.customId === 'claim_ticket') {

            if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
                return interaction.reply({
                    content: "❌ Kein Zugriff",
                    ephemeral: true
                });
            }

            return interaction.reply({
                content: `📌 Ticket übernommen von ${interaction.user}`
            });
        }

        if (interaction.customId === 'close_ticket') {

            await interaction.reply({
                content: "🔒 Ticket wird geschlossen..."
            });

            setTimeout(() => {
                interaction.channel.delete().catch(() => {});
            }, 3000);
        }
    }
});

client.login(TOKEN);
