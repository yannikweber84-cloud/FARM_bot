require("dotenv").config();

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
// BOT DATEN
// =======================

const TOKEN = process.env.TOKEN; // ✅ FIX
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
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );

        console.log("✅ Slash Commands registriert.");

    } catch (error) {
        console.error(error);
    }
})();

// =======================
// READY
// =======================

client.once(Events.ClientReady, () => {
    console.log(`✅ ${client.user.tag} ist online.`);
});

// =======================
// INTERACTIONS
// =======================

client.on(Events.InteractionCreate, async interaction => {

    // /ticketpanel
    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === 'ticketpanel') {

            const embed = new EmbedBuilder()
                .setColor('#2B2D31')
                .setTitle('🎫 Allgemeiner Support')
                .setDescription(`Wähle eine Kategorie aus.`)
                .setThumbnail(client.user.displayAvatarURL());

            const menu = new StringSelectMenuBuilder()
                .setCustomId('ticket_menu')
                .setPlaceholder('Kategorie wählen')
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
                        value: 'allgemein_support', // ✅ FIX
                        emoji: '🏗'
                    }
                ]);

            const row = new ActionRowBuilder().addComponents(menu);

            await interaction.reply({
                embeds: [embed],
                components: [row]
            });
        }
    }

    // DROPDOWN
    if (interaction.isStringSelectMenu()) {

        if (interaction.customId === 'ticket_menu') {

            const selected = interaction.values[0];

            let ticketName = "";
            let ticketTitle = "";

            const safeUser = interaction.user.username
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "-");

            if (selected === "clan_bewerbung") {
                ticketName = `clan-${safeUser}`;
                ticketTitle = "🛡 Clan Bewerbung";
            }

            if (selected === "team_bewerbung") {
                ticketName = `team-${safeUser}`;
                ticketTitle = "👥 Team Bewerbung";
            }

            if (selected === "allgemein_support") { // ✅ FIX
                ticketName = `support-${safeUser}`;
                ticketTitle = "🏗 Allgemeiner Support";
            }

            // ❗ Schutz gegen leere Namen
            if (!ticketName) {
                return interaction.reply({
                    content: "❌ Fehler: Ticket konnte nicht erstellt werden.",
                    ephemeral: true
                });
            }

            const existing = interaction.guild.channels.cache.find(
                c => c.name === ticketName
            );

            if (existing) {
                return interaction.reply({
                    content: `❌ Du hast bereits ein Ticket offen: ${existing}`,
                    ephemeral: true
                });
            }

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

            const claimButton = new ButtonBuilder()
                .setCustomId('claim_ticket')
                .setLabel('Ticket übernehmen')
                .setEmoji('📌')
                .setStyle(ButtonStyle.Primary);

            const closeButton = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Ticket schließen')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Danger);

            const rowButtons = new ActionRowBuilder()
                .addComponents(claimButton, closeButton);

            const ticketEmbed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle(ticketTitle)
                .setDescription(`Hallo ${interaction.user} 👋`)
                .setTimestamp();

            await channel.send({
                content: `<@&${STAFF_ROLE_ID}>`,
                embeds: [ticketEmbed],
                components: [rowButtons]
            });

            await interaction.reply({
                content: `✅ Ticket erstellt: ${channel}`,
                ephemeral: true
            });
        }
    }

    // BUTTONS
    if (interaction.isButton()) {

        if (interaction.customId === 'claim_ticket') {

            if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
                return interaction.reply({
                    content: '❌ Nur Teammitglieder können Tickets übernehmen.',
                    ephemeral: true
                });
            }

            const claimedButton = new ButtonBuilder()
                .setCustomId('claimed_ticket')
                .setLabel(`Übernommen`)
                .setStyle(ButtonStyle.Success)
                .setDisabled(true);

            const closeButton = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Ticket schließen')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Danger);

            await interaction.message.edit({
                components: [
                    new ActionRowBuilder().addComponents(claimedButton, closeButton)
                ]
            });

            await interaction.reply({
                content: `📌 Ticket übernommen von ${interaction.user}`,
                ephemeral: false
            });
        }

        if (interaction.customId === 'close_ticket') {

            await interaction.reply({
                content: '🔒 Ticket wird geschlossen...',
                ephemeral: false
            });

            setTimeout(() => {
                interaction.channel.delete().catch(() => {});
            }, 3000);
        }
    }
});

client.login(TOKEN);
