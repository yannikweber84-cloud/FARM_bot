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

    // ====================================
    // /ticketpanel
    // ====================================

     if (interaction.isChatInputCommand()) {

         (interaction.commandName === 'ticketpanel') {

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
                .setFooter({
                    text: 'FARMMC.de Support System'
                });

            const menu = new StringSelectMenuBuilder()
                .setCustomId('ticket_menu')
                .setPlaceholder('Wähle eine Kategorie aus um ein Ticket zu öffnen')
                .addOptions([
                 
                    
                     (selected === "clan_bewerbung") {
    ticketName = `clan-${interaction.user.username}`;
    ticketTitle = "🛡 Clan Bewerbung";
}

 (selected === "team_bewerbung") {
    ticketName = `team-${interaction.user.username}`;
    ticketTitle = "👥 Team Bewerbung";
}

 (selected === "allgemeiner_support") {
    ticketName = `support-${interaction.user.username}`;
    ticketTitle = "🏗 Allgemeiner Support";
}
                ]);

            const row = new ActionRowBuilder().addComponents(menu);

            await interaction.reply({
                embeds: [embed],
                components: [row]
            });
        }
    }

    // ====================================
    // DROPDOWN MENÜ
    // ====================================

     (interaction.isStringSelectMenu()) {

         (interaction.customId === 'ticket_menu') {

            const selected = interaction.values[0];

            let ticketName = "";
            let ticketTitle = "";

            .addOptions([
     (selected === "clan_bewerbung") 
                ticketName = `clan-${interaction.user.username}`;
                ticketTitle = "🛡 Clan Bewerbung";
            }

             (selected === "team_bewerbung") {
                ticketName = `team-${interaction.user.username}`;
                ticketTitle = "👥 Team Bewerbung";
            }

           (selected === "allgemeiner_support") {
    ticketName = `support-${interaction.user.username}`;
    ticketTitle = "🏗 Allgemeiner Support";
}
            }

            // Prüfen ob Ticket schon existiert

            const existing = interaction.guild.channels.cache.find(
                c => c.name === ticketName.toLowerCase()
            );

             (existing) {
                return interaction.reply({
                    content: `❌ Du hast bereits ein Ticket offen: ${existing}`,
                    ephemeral: true
                });
            }

            // Ticket erstellen

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

            // =======================
            // BUTTONS
            // =======================

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

            const buttonRow = new ActionRowBuilder()
                .addComponents(claimButton, closeButton);

            // =======================
            // TICKET EMBED
            // =======================

            const ticketEmbed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle(ticketTitle)
                .setDescription(`
Hallo ${interaction.user} 👋

Dein Ticket wurde erfolgreich erstellt.

📌 Bitte beschreibe dein Anliegen möglichst genau, damit das Team dir schnell helfen kann.
                `)
                .setFooter({
                    text: 'FARM Clan Ticket System'
                })
                .setTimestamp();

            await channel.send({
                content: `<@&${STAFF_ROLE_ID}>`,
                embeds: [ticketEmbed],
                components: [buttonRow]
            });

            await interaction.reply({
                content: `✅ Dein Ticket wurde erstellt: ${channel}`,
                ephemeral: true
            });
        }
    }

    // ====================================
    // BUTTONS
    // ====================================

     (interaction.isButton()) {

        // ====================================
        // TICKET ÜBERNEHMEN
        // ====================================

         (interaction.customId === 'claim_ticket') {

            // Prüfen ob Staff

             (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
                return interaction.reply({
                    content: '❌ Nur Teammitglieder können Tickets übernehmen.',
                    ephemeral: true
                });
            }

            // Neue Buttons

            const claimedButton = new ButtonBuilder()
                .setCustomId('claimed_ticket')
                .setLabel(`Übernommen von ${interaction.user.username}`)
                .setEmoji('✅')
                .setStyle(ButtonStyle.Success)
                .setDisabled(true);

            const closeButton = new ButtonBuilder()
                .setCustomId('close_ticket')
                .setLabel('Ticket schließen')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Danger);

            const newRow = new ActionRowBuilder()
                .addComponents(claimedButton, closeButton);

            // Nachricht bearbeiten

            await interaction.message.edit({
                components: [newRow]
            });

            // Claim Nachricht

            const claimEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setDescription(`
📌 Der Teamler ${interaction.user} hat das Ticket übernommen.

Er wird sich zeitnah um dich kümmern!
                `)
                .setTimestamp();

            await interaction.reply({
                embeds: [claimEmbed]
            });
        }

        // ====================================
        // TICKET SCHLIESSEN
        // ====================================

         (interaction.customId === 'close_ticket') {

            await interaction.reply({
                content: '🔒 Ticket wird in 3 Sekunden geschlossen...',
                ephemeral: false
            });

            setTimeout(() => {
                interaction.channel.delete().catch(console.error);
            }, 3000);
        }
    }
});

client.login(TOKEN);
