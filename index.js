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
const CLIENT_ID = "1535618942867996713";
const GUILD_ID = "1535618766723874988";
const WELCOME_CHANNEL_ID = "1535618767705473145";
const STAFF_ROLE_ID = "1535618767172804702";
const SUPPORT_WARTE_RAUM_ID = "1535618767915065441";

const SUPPORT_LOG_CHANNEL_ID = "1535618767915065439";

const SUPPORT_ROLE_ID = "1535618767172804702";

let countingActive = false;
let countingChannelId = null;
let currentNumber = 1;
let lastUserId = null;

// =======================
// TICKET KATEGORIEN
// =======================

const CLAN_CATEGORY_ID = "1535618768858906702";
const TEAM_CATEGORY_ID = "1535618768858906703";
const BAU_CATEGORY_ID = "1535618768858906704";


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});


// =======================
// SLASH COMMANDS
// =======================

const commands = [
    new SlashCommandBuilder()
        .setName('ticketpanel')
        .setDescription('Erstellt das Ticket Panel')
        .toJSON(),

    new SlashCommandBuilder()
        .setName("countingstart")
        .setDescription("Startet das Counting")
        .toJSON()
];


const rest = new REST({ version: '10' }).setToken(TOKEN);


(async () => {
    try {

        await rest.put(
            Routes.applicationGuildCommands(
                CLIENT_ID,
                GUILD_ID
            ),
            { body: commands }
        );

        console.log("✅ Commands registriert");

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


   if (interaction.commandName === "countingstart") {

    countingActive = true;
    countingChannelId = interaction.channelId;
    currentNumber = 1;
    lastUserId = null;

    await interaction.reply(
        "🎉 Das Counting wurde hier gestartet! Erste Zahl ist **1**."
    );

    return;
}



    if (interaction.commandName === 'ticketpanel') {


            const embed = new EmbedBuilder()
                .setColor('#2B2D31')
                .setTitle('🎫 Allgemeiner Support')
                .setDescription(`
Du hast ein Problem, eine Frage oder benötigst Hilfe auf unserem Server?
Dann bist du hier genau richtig!

Erstelle ein Ticket und beschreibe dein Anliegen so genau wie möglich, damit unser Team dir schnell und gezielt helfen kann.

━━━━━━━━━━━━━━━━━━

📌 **Wobei wir helfen können:**

• ❓ Fragen rund um den Server
• 🐛 Probleme & Bugs
• 🚨 Spieler melden
• 🛠 Allgemeine Hilfe & Unterstützung
• 🏗️ Bauprojekte & Aufträge

━━━━━━━━━━━━━━━━━━

👥 **Bewerbungen & Bau-Firma**

Du möchtest Teil unseres Teams werden oder die Bau-Firma unterstützen? 🏗️

Egal ob als Builder, Helfer oder für ein anderes Teammitglied – erstelle einfach ein Ticket und sende uns deine Bewerbung.

━━━━━━━━━━━━━━━━━━

📋 **Wichtige Hinweise:**

• Beschreibe dein Anliegen genau
• Bleibe freundlich und respektvoll
• Erstelle nur ein Ticket pro Anliegen

━━━━━━━━━━━━━━━━━━

🚀 Vielen Dank und viel Spaß auf unserem Server!

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
                        label: 'Allgemeiner Support',
                        description: 'Hilfe und Anliegen',
                        emoji: '🛡',
                        value: 'clan_bewerbung'
                    },

                    {
                        label: 'Team/Clan Bewerbung',
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

    ticketName = `support-${interaction.user.username.toLowerCase()}`;
    ticketTitle = "🛡 Allgemeiner Support";
    categoryID = CLAN_CATEGORY_ID;

}


if (selected === "team_bewerbung") {

    ticketName = `bewerbung-${interaction.user.username.toLowerCase()}`;
    ticketTitle = "👥 Team/Clan Bewerbung";
    categoryID = TEAM_CATEGORY_ID;

}


if (selected === "bau_firma") {

    ticketName = `bau-${interaction.user.username.toLowerCase()}`;
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


// =======================
// VOICE SUPPORT WARTERAUM
// =======================

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {

    try {

        if (
            newState.channelId === SUPPORT_WARTE_RAUM_ID &&
            oldState.channelId !== SUPPORT_WARTE_RAUM_ID
        ) {


            const logChannel = newState.guild.channels.cache.get(
                SUPPORT_LOG_CHANNEL_ID
            );


            if (!logChannel) return;


            const embed = new EmbedBuilder()

                .setColor("#00A8FF")

                .setTitle("🎧 Neue Support-Anfrage")

                .setDescription(`
👤 **Spieler**

${newState.member}


📞 **Warteraum**

${newState.channel}


⏰ **Zeit**

<t:${Math.floor(Date.now()/1000)}:R>


━━━━━━━━━━━━━━

🛡️ Support-Team wird benötigt!
                `)

                .setThumbnail(
                    newState.member.user.displayAvatarURL({
                        dynamic:true
                    })
                )

                .setFooter({
                    text:"VIBE Support System",
                    iconURL:client.user.displayAvatarURL()
                })

                .setTimestamp();



            await logChannel.send({

                content:`<@&${SUPPORT_ROLE_ID}>`,

                embeds:[embed]

            });


        }


    } catch(error) {

        console.error("Voice Fehler:", error);

    }

});


// =========================
// COUNTING SYSTEM
// =========================


// =========================
// COUNTING SYSTEM
// =========================

client.on("messageCreate", async (message) => {

    if (message.author.bot) return;

    // Counting ist nicht aktiv
    if (!countingActive) return;

    // NUR im Channel zählen, in dem /countingstart benutzt wurde
    if (message.channel.id !== countingChannelId) return;

    // Nur Zahlen erlauben
    if (!/^\d+$/.test(message.content)) return;

    const number = Number(message.content);

    // Gleicher User darf nicht zweimal hintereinander zählen
    if (message.author.id === lastUserId) {

        await message.reply(
            "❌ Du kannst nicht zweimal hintereinander zählen! Neustart bei **1**."
        );

        currentNumber = 1;
        lastUserId = null;

        return;
    }

    // Richtige Zahl
    if (number === currentNumber) {

        await message.react("✅");

        lastUserId = message.author.id;
        currentNumber++;

        // 100000 erreicht
        if (currentNumber > 100000) {

            await message.channel.send(
                "🎉 **100000 erreicht!** Das Counting startet wieder bei **1**."
            );

            currentNumber = 1;
            lastUserId = null;
        }

    } else {

        // Falsche Zahl
        await message.reply(
            `❌ Falsch! Erwartet wurde **${currentNumber}**. Neustart bei **1**.`
        );

        currentNumber = 1;
        lastUserId = null;
    }
});


// =========================
// JOIN SYSTEM
// =========================

client.on(Events.GuildMemberAdd, async (member) => {

    try {


        const channel = member.guild.channels.cache.get(
            WELCOME_CHANNEL_ID
        );


        if (!channel) return;



        const embed = new EmbedBuilder()

            .setColor("Yellow")

            .setTitle("⚡️ Willkommen ⚡️")

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

            .setTimestamp();



        await channel.send({
            embeds: [embed]
        });



    } catch (err) {

        console.error("Join Fehler:", err);

    }

});


// =========================
// LOGIN
// =========================

client.login(TOKEN);
