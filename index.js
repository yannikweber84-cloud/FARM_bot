require("dotenv").config();

const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("Bot läuft!");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🌐 Server läuft auf Port ${PORT}`);
});


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
const CLIENT_ID = "1534286416945614889";
const STAFF_ROLE_ID = "1488904093970858115";


// =======================
// TICKET KATEGORIEN
// =======================

const CLAN_CATEGORY_ID = "1534287236407759040";
const TEAM_CATEGORY_ID = "1534287314464018655";
const BAU_CATEGORY_ID = "1534287374819917896";


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


    if (interaction.isChatInputCommand()) {


        if (interaction.commandName === 'ticketpanel') {


            const embed = new EmbedBuilder()
                .setColor('#2B2D31')
                .setTitle('🎫 Allgemeiner Support')
                .setDescription(`
Willkommen im Support-Bereich unseres Servers! 👋

Du hast ein Problem, eine Frage oder benötigst Hilfe?
Dann bist du hier genau richtig! Unser Team steht dir jederzeit zur Verfügung und hilft dir gerne bei deinen Anliegen weiter.

Erstelle einfach ein Ticket und beschreibe dein Anliegen so genau wie möglich. Je mehr Informationen du uns gibst, desto schneller können wir dir helfen und eine passende Lösung finden.

━━━━━━━━━━━━━━━━━━

📌 Wobei wir dir helfen können:

• ❓ Fragen rund um den Server
• 🐛 Probleme, Bugs & Fehlermeldungen
• 🚨 Spieler melden oder Regelverstöße melden
• 🛠 Allgemeine Hilfe und Unterstützung
• 🏗️ Fragen zu Bauprojekten und Aufträgen
• 💬 Sonstige Anliegen rund um den Server

━━━━━━━━━━━━━━━━━━

👥 Bewerbungen & Bau-Firma

Du möchtest Teil unseres Teams werden oder unsere Bau-Firma unterstützen? 🏗️

Egal ob als Builder, Helfer oder in einem anderen Bereich – wir freuen uns über deine Bewerbung!

Erstelle ein Ticket und teile uns folgende Informationen mit:

• Deinen Namen / Minecraft-Namen
• Deine bisherigen Erfahrungen
• Deine Stärken und Fähigkeiten
• Warum du unserem Team beitreten möchtest

━━━━━━━━━━━━━━━━━━

📋 Wichtige Hinweise:

• Erstelle nur ein Ticket, wenn du wirklich ein Anliegen hast.
• Beschreibe dein Problem so genau wie möglich.
• Bleibe freundlich und respektvoll gegenüber unserem Team.
• Habe etwas Geduld – wir bearbeiten dein Ticket schnellstmöglich.

━━━━━━━━━━━━━━━━━━

Vielen Dank für deine Unterstützung und viel Spaß auf unserem Server!
                `)
                .setThumbnail(client.user.displayAvatarURL())
                .setFooter({
                    text: 'VIBE Support System'
                });


            const menu = new StringSelectMenuBuilder()
                .setCustomId('ticket_menu')
                .setPlaceholder('Wähle eine Kategorie aus')
                .addOptions([

                    {
                        label: ' Allgemeiner Support',
                        description: 'Hilfe und Anliegen',
                        emoji: '🛡',
                        value: 'clan_bewerbung'
                    },

                    {
                        label: ' Team/Clan Bewerbung',
                        description: 'Bewirb dich für Team oder Clan',
                        emoji: '👥',
                        value: 'team_bewerbung'
                    },

                    {
                        label: ' Bau Firma',
                        description: 'Firmenbewerbung und Aufträge',
                        emoji: '🏗',
                        value: 'bau_firma'
                    }

                ]);


            const row = new ActionRowBuilder()
                .addComponents(menu);


            await interaction.reply({
                embeds: [embed],
                components: [row]
            });

        }
    }



    if (interaction.isStringSelectMenu()) {


        if (interaction.customId === 'ticket_menu') {


            const selected = interaction.values[0];


            let ticketName = "";
            let ticketTitle = "";
            let categoryID = null;



  if (selected === "clan_bewerbung") {

    ticketName = `💬support-${interaction.user.username.toLowerCase()}`;
    ticketTitle = "🛡 Allgemeiner Support";
    categoryID = CLAN_CATEGORY_ID;

}


if (selected === "team_bewerbung") {

    ticketName = `📝bewerbung-${interaction.user.username.toLowerCase()}`;
    ticketTitle = "👥 Team/Clan Bewerbung";
    categoryID = TEAM_CATEGORY_ID;

}


if (selected === "bau_firma") {

    ticketName = `🧱 bau-${interaction.user.username.toLowerCase()}`;
    ticketTitle = "🏗 Bau Firma";
    categoryID = BAU_CATEGORY_ID;

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

                name: ticketName,

                type: ChannelType.GuildText,

                parent: categoryID,


                permissionOverwrites: [
                                        {
                        id: interaction.guild.id,
                        deny: [
                            PermissionsBitField.Flags.ViewChannel
                        ]
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
                .addComponents(
                    claimButton,
                    closeButton
                );



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
                    text: 'VIBE Ticket System'
                })

                .setTimestamp();



            await channel.send({

                content: `<@&${STAFF_ROLE_ID}>`,

                embeds: [
                    ticketEmbed
                ],

                components: [
                    buttonRow
                ]

            });



            await interaction.reply({

                content: `✅ Dein Ticket wurde erstellt: ${channel}`,

                ephemeral: true

            });

        }

    }



    // =======================
    // BUTTONS
    // =======================


    if (interaction.isButton()) {



        // Ticket übernehmen

        if (interaction.customId === 'claim_ticket') {



            if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {

                return interaction.reply({

                    content: '❌ Nur Teammitglieder können Tickets übernehmen.',

                    ephemeral: true

                });

            }



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

                .addComponents(
                    claimedButton,
                    closeButton
                );



            await interaction.message.edit({

                components: [
                    newRow
                ]

            });



            const claimEmbed = new EmbedBuilder()

                .setColor('#5865F2')

                .setDescription(`

📌 Der Teamler ${interaction.user} hat das Ticket übernommen.

Er wird sich zeitnah um dich kümmern!

                `)

                .setTimestamp();



            await interaction.reply({

                embeds: [
                    claimEmbed
                ]

            });

        }



        // Ticket schließen


        if (interaction.customId === 'close_ticket') {



            await interaction.reply({

                content: '🔒 Ticket wird in 3 Sekunden geschlossen...',

                ephemeral: false

            });



            setTimeout(() => {

                interaction.channel.delete()
                    .catch(console.error);

            }, 3000);


        }


    }


});



client.login(TOKEN);
