𝚖𝟺𝚢𝚘𝚞
m4you0905
+1
•
𝐅𝐚𝐫𝐦𝐌𝐂.𝐝𝐞 | 𝐒𝐮𝐩

Fxlix
 [God†],  — 13:49
Warum ?
𝚖𝟺𝚢𝚘𝚞 [FMC],  — 14:04
weil da einfach so sit
𝚖𝟺𝚢𝚘𝚞 [FMC],  — 15:06
habe keine lust mehr auf die logs lasse das jetzt erstmal mit willkommens rolle

sag mir mal ein anderes syystem was ich versuche zu machen
Fxlix
 hat einen Anruf gestartet, der 9 Minuten gedauert hat. — 15:20
𝚖𝟺𝚢𝚘𝚞
 hat einen Anruf gestartet, der 4 Minuten gedauert hat. — 15:30
𝚖𝟺𝚢𝚘𝚞
 hat einen Anruf gestartet, der 7 Minuten gedauert hat. — 15:35
𝚖𝟺𝚢𝚘𝚞
 hat einen Anruf gestartet, der 2 Minuten gedauert hat. — 15:43
𝚖𝟺𝚢𝚘𝚞 [FMC],  — 15:43
brauche kurz deine hilfe bitte
felix
bitte
antowrte
antworte
Fxlix
 hat einen Anruf gestartet, der eine Stunde gedauert hat. — 15:53
Fxlix
 [God†],  — 16:07
require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,

message.txt
16 kB
Fxlix
 [God†],  — 16:16
require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,

message.txt
16 kB
@𝚖𝟺𝚢𝚘𝚞  ??
𝚖𝟺𝚢𝚘𝚞 [FMC],  — 16:18
MTUwOTU2NjE0MzA1MTA3MTU3OA.GQO2Z.y-biJdd239v9eEuPN0cVjPBT63BJE4ftpDEcM
Fxlix
 [God†],  — 16:29
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

const TOKEN = client.login(TOKEN);;
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
... (247 Zeilen verbleibend)

message.txt
11 kB
𝚖𝟺𝚢𝚘𝚞 [FMC],  — 16:32
const rest = new REST({ version: '10' }).setToken(TOKEN);

client.once(...)
client.login(TOKEN);

const client = new Client(...)
MTUwOTU2NjE0MzA1MTA3MTU3OA.GQO2Z.y-biJdd239v9eEuPN0cVjPBT63BJE4ftpDEcM
𝚖𝟺𝚢𝚘𝚞 [FMC],  — 16:54
mach es selebr mit shell der sagt dir was flasch istt und so
habe keine lust
mehr muss jetzt englisch machen
Fxlix
 [God†],  — 18:29
Egal brd wir benutzen einfach Powerbot
𝚖𝟺𝚢𝚘𝚞 [FMC],  — 18:29
Nein
Dann mache ich das fertig
Wir benutzen den nd
Fxlix
 [God†],  — 18:29
Call ?
𝚖𝟺𝚢𝚘𝚞
 hat einen Anruf gestartet, der 11 Minuten gedauert hat. — 18:30
Fxlix
 hat einen Anruf gestartet, der 24 Minuten gedauert hat. — 18:46
Fxlix
 [God†],  — 18:57
Bild
𝚖𝟺𝚢𝚘𝚞
 hat einen Anruf gestartet, der 23 Minuten gedauert hat. — 19:10
Fxlix
 hat einen Anruf gestartet, der 3 Minuten gedauert hat. — 19:42
Fxlix
 [God†],  — 19:46
Ich habe Dray noch nie gehört
also seine Stimme
𝚖𝟺𝚢𝚘𝚞 [FMC],  — 19:46
echt nd
 [FMC], 
Fxlix
 [God†],  — 19:46
Ja
noch nie
𝚖𝟺𝚢𝚘𝚞 [FMC],  — 19:55
ohoh
yannikinsta
Fxlix
 [God†],  — 19:55
Ganz schnell Mute und vanish diggi
haha
𝚖𝟺𝚢𝚘𝚞 [FMC],  — 19:56
ohohohoho
Fxlix
 [God†],  — 20:29
s
s
s
s
Warum zum fick hört man deine dc sounds im hintergrund
s
s
s
s
s
ss
s
s
𝚖𝟺𝚢𝚘𝚞 [FMC],  — 20:30
?
Fxlix
 [God†],  — 20:30
s
s
s
s
s
s
s
s
s
#s
asüpdfoik
Fxlix
 [God†],  — 21:38
Machste eig am Bot weiter ?
𝚖𝟺𝚢𝚘𝚞 [FMC],  — 21:38
grade nd ne
Fxlix
 [God†],  — 21:53
.
𝚖𝟺𝚢𝚘𝚞 [FMC],  — 21:54
was los
𝚖𝟺𝚢𝚘𝚞
 hat einen Anruf gestartet, der 16 Minuten gedauert hat. — 22:01
𝚖𝟺𝚢𝚘𝚞 [FMC],  — 22:06
MTUwOTU2NjE0MzA1MTA3MTU3OA.GQO2Z.y-biJdd239v9eEuPN0cVjPBT63BJE4ftpDEcM
Fxlix
 [God†],  — 22:07
sd
Bild
𝚖𝟺𝚢𝚘𝚞 [FMC],  — 22:15
BLEIB DOCH TRIN
Fxlix
 [God†],  — 22:15
kann nicht
𝚖𝟺𝚢𝚘𝚞 [FMC],  — 22:15
MTUwOTU2NjE0MzA1MTA3MTU3OA.GQO2Z.y-biJdd239v9eEuPN0cVjPBT63BJE4ftpDEcM
𝚖𝟺𝚢𝚘𝚞
 hat einen Anruf gestartet. — 22:28
﻿
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

const TOKEN = client.login(TOKEN);;
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
                .setFooter({
                    text: 'FARMMC.de Support System'
                });

            const menu = new StringSelectMenuBuilder()
                .setCustomId('ticket_menu')
                .setPlaceholder('Wähle eine Kategorie aus um ein Ticket zu öffnen')
                .addOptions([
                    {
                        label: 'Clan Bewerbung',
                        description: 'Bewirb dich mit deinem Clan',
                        emoji: '🛡',
                        value: 'clan_bewerbung'
                    },
                    {
                        label: 'Team Bewerbung',
                        description: 'Bewirb dich für das Team',
                        emoji: '👥',
                        value: 'team_bewerbung'
                    },
                    {
                        label: 'Allgemeiner Support',
                        description: 'Hilfe und Support',
                        emoji: '🏗',
                        value: 'allgemein'
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

            if (selected === "Allgemeiner Support") {
                ticketName = `Allg-${interaction.user.username}`;
                ticketTitle = "🏗 Allgemeiner Support";
            }

            // Prüfen ob Ticket schon existiert

            const existing = interaction.guild.channels.cache.find(
                c => c.name === ticketName.toLowerCase()
            );

            if (existing) {
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

    if (interaction.isButton()) {

        // ====================================
        // TICKET ÜBERNEHMEN
        // ====================================

        if (interaction.customId === 'claim_ticket') {

            // Prüfen ob Staff

            if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
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

        if (interaction.customId === 'close_ticket') {

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
