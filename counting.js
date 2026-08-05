const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.TOKEN;
const clientId = "1509566143051071578";

let countingActive = false;
let currentNumber = 1;
let lastUserId = null;

// Slash Command registrieren
const commands = [
    new SlashCommandBuilder()
        .setName('countingstart')
        .setDescription('Startet das Counting')
        .toJSON()
];

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands }
        );
        console.log('Slash Commands registriert.');
    } catch (error) {
        console.error(error);
    }
})();

client.once('ready', () => {
    console.log(`${client.user.tag} ist online!`);
});

// Slash Command
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'countingstart') {
        countingActive = true;
        currentNumber = 1;
        lastUserId = null;

        await interaction.reply(
            '🎉 Counting gestartet! Beginn bei **1**.'
        );
    }
});

// Nachrichten überwachen
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!countingActive) return;

    if (!/^\d+$/.test(message.content)) return;

    const number = parseInt(message.content);

    // Gleicher User zweimal hintereinander
    if (message.author.id === lastUserId) {
        await message.channel.send(
            '❌ Das war falsch bro! Das Counting beginnt von neu mit: **1**'
        );

        currentNumber = 1;
        lastUserId = null;
        return;
    }

    // Richtige Zahl
    if (number === currentNumber) {
        await message.react('✅');

        lastUserId = message.author.id;
        currentNumber++;
    } else {
        await message.channel.send(
            '❌ Das war falsch bro! Das Counting beginnt von neu mit: **1**'
        );

        currentNumber = 1;
        lastUserId = null;
    }
});

client.login(token);