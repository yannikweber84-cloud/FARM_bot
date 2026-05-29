require("dotenv").config();

const express = require("express"); // ✅ NEU

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
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

// =======================
// EXPRESS (RENDER FIX)
// =======================

const app = express();

app.get("/", (req, res) => {
    res.send("Bot ist online");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🌐 Webserver läuft auf Port ${PORT}`);
});

// =======================
// CONFIG
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
    console.log(`✅ Bot online: ${client.user.tag}`);
});

// =======================
// INTERACTIONS
// =======================

client.on(Events.InteractionCreate, async interaction => {

    // PANEL
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
                .setThumbnail(client.user.displayAvatarURL())
                .setFooter({ text: 'FARMMC.de Support System' });

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
                        value: 'allgemeiner_support',
                        emoji: '🏗'
                    }
                ]);

            return interaction.reply({
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(menu)]
            });
        }
    }

    // SELECT MENU
    if (interaction.isStringSelectMenu()) {

        const selected = interaction.values[0];

        const modal = new ModalBuilder()
            .setCustomId(`ticket_modal_${selected}`)
            .setTitle('Ticket Infos');

        const input1 = new TextInputBuilder()
            .setCustomId('mc_name')
            .setLabel('Minecraft Name')
            .setStyle(TextInputStyle.Short);

        const input2 = new TextInputBuilder()
            .setCustomId('problem')
            .setLabel('Anliegen')
            .setStyle(TextInputStyle.Paragraph);

        modal.addComponents(
            new ActionRowBuilder().addComponents(input1),
            new ActionRowBuilder().addComponents(input2)
        );

        await interaction.showModal(modal);
    }

    // MODAL
    if (interaction.isModalSubmit()) {

        const selected = interaction.customId.replace('ticket_modal_', '');

        let name = "";
        let title = "";

        if (selected === "clan_bewerbung") {
            name = `clan-${interaction.user.username}`;
            title = "Clan Bewerbung";
        }

        if (selected === "team_bewerbung") {
            name = `team-${interaction.user.username}`;
            title = "Team Bewerbung";
        }

        if (selected === "allgemeiner_support") {
            name = `support-${interaction.user.username}`;
            title = "Support";
        }

        const channel = await interaction.guild.channels.create({
            name: name.toLowerCase(),
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                },
                {
                    id: STAFF_ROLE_ID,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                }
            ]
        });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Close')
                .setStyle(ButtonStyle.Danger)
        );

        await channel.send({
            content: `<@&${STAFF_ROLE_ID}>`,
            embeds: [
                new EmbedBuilder()
                    .setTitle(title)
                    .setDescription(`Ticket von ${interaction.user}`)
                    .setColor('#57F287')
            ],
            components: [row]
        });

        await interaction.reply({
            content: `Ticket erstellt: ${channel}`,
            ephemeral: true
        });
    }

    // BUTTON
    if (interaction.isButton()) {

        if (interaction.customId === 'close_ticket') {
            await interaction.reply({ content: 'Ticket wird geschlossen...' });

            setTimeout(() => {
                interaction.channel.delete().catch(() => {});
            }, 3000);
        }
    }
});

client.login(TOKEN);
