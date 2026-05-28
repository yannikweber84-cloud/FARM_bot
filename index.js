require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    ChannelType,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    Events,
    REST,
    Routes,
    SlashCommandBuilder,
    EmbedBuilder
} = require('discord.js');

// =======================
// CONFIG
// =======================

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID || "1509566143051071578";
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID || "1508899899222134835";

// =======================
// CLIENT
// =======================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ]
});

// =======================
// SLASH COMMAND
// =======================

const commands = [
    new SlashCommandBuilder()
        .setName('ticketpanel')
        .setDescription('Erstellt das Ticket Panel')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log("🔄 Registriere Slash Commands...");

        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );

        console.log("✅ Slash Commands registriert.");
    } catch (error) {
        console.error("❌ Command Fehler:", error);
    }
})();

// =======================
// READY
// =======================

client.once(Events.ClientReady, (c) => {
    console.log(`✅ Bot online als ${c.user.tag}`);
});

// =======================
// INTERACTIONS
// =======================

client.on(Events.InteractionCreate, async interaction => {

    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === 'ticketpanel') {

            const embed = new EmbedBuilder()
                .setColor('#2B2D31')
                .setTitle('🎫 Allgemeiner Support')
                .setDescription('Ticket System gestartet');

            const menu = new StringSelectMenuBuilder()
                .setCustomId('ticket_menu')
                .setPlaceholder('Kategorie wählen')
                .addOptions([
                    {
                        label: 'Clan Bewerbung',
                        value: 'clan_bewerbung',
                        emoji: '🛡'
                    }
                ]);

            const row = new ActionRowBuilder().addComponents(menu);

            await interaction.reply({
                embeds: [embed],
                components: [row]
            });
        }
    }

    if (interaction.isStringSelectMenu()) {

        if (interaction.customId === 'ticket_menu') {

            const ticketName = `ticket-${interaction.user.id}`; // 🔥 besser als username

            const channel = await interaction.guild.channels.create({
                name: ticketName,
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
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory
                        ]
                    },
                    {
                        id: STAFF_ROLE_ID,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory
                        ]
                    }
                ]
            });

            await interaction.reply({
                content: `✅ Ticket erstellt: ${channel}`,
                ephemeral: true
            });
        }
    }
});

// =======================
// ERROR HANDLING (Render wichtig)
// =======================

process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

// =======================
// LOGIN
// =======================

client.login(TOKEN);