require("dotenv").config();
const express = require("express");
const {
Client,
GatewayIntentBits,
Events,
EmbedBuilder,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle,
StringSelectMenuBuilder,
ModalBuilder,
TextInputBuilder,
TextInputStyle,
PermissionsBitField,
ChannelType,
SlashCommandBuilder,
MessageFlags,
REST,
Routes,
UserSelectMenuBuilder,
AuditLogEvent
} = require("discord.js");

// ======================================================
// KLEINER WEB SERVER NUR FÜR RENDER / HEALTHCHECK
// ======================================================

const app = express();
const PORT = process.env.PORT || 3000;

function isFeatureEnabled() {
return true;
}

app.get("/", (req, res) => {
res.status(200).send("VIBE Bot ist online.");
});

app.get("/health", (req, res) => {
res.status(200).json({
status: "online",
service: "VIBE Bot"
});
});

app.listen(PORT, () => {
console.log(`🌐 Health-Webserver läuft auf Port ${PORT}`);
});

// ======================================================
// KONFIGURATION
// ======================================================

const TOKEN = process.env.TOKEN;

const CLIENT_ID =
"1534585700408889466";

const GUILD_ID =
"1542137235867041912";

// ======================================================
// WELCOME
// ======================================================

const WELCOME_CHANNEL_ID =
"1542137236500381757";

// ======================================================
// AUTO-ROLLE BEIM SERVER-BEITRITT
// HIER DIE ROLLEN-ID EINTRAGEN, DIE JEDER NEUE USER BEKOMMT
// ======================================================

const AUTO_ROLE_ID =
"1542137235900735505";

// ======================================================
// STAFF
// ======================================================

const STAFF_ROLE_ID =
"1542137235917250619";

// ======================================================
// SUPPORT
// ======================================================

const SUPPORT_ROLE_ID =
STAFF_ROLE_ID;

const SUPPORT_WARTE_RAUM_ID =
"1542137236718362702";

const SUPPORT_LOG_CHANNEL_ID =
"1542137236718362701";

// ======================================================
// TICKET TRANSCRIPT / TICKET LOG
// ======================================================

const TICKET_TRANSCRIPT_CHANNEL_ID =
process.env.TICKET_TRANSCRIPT_CHANNEL_ID ||
"1542146310197612575";

// ======================================================
// SERVER LOG
// ======================================================

const SERVER_LOG_CHANNEL_ID =
process.env.SERVER_LOG_CHANNEL_ID ||
"1542137236718362700";

// ======================================================
// TEAM-ROLLEN NACHRICHTEN
// ======================================================

const TEAM_ROLE_MESSAGE_CHANNEL_ID =
"1542137236500381765";

const CO_ANFUEHRER_ROLE_ID =
"1542137235942412413";

const CLAN_MANAGER_ROLE_ID =
"1542137235942412412";

const ADMIN_ROLE_ID =
"1542137235934158857";

const DEV_ROLE_ID =
"1542137235934158856";

const TEST_ADMIN_ROLE_ID =
"1542137235934158855";

const MOD_ROLE_ID =
"1542137235934158853";

const SUP_LEITUNG_ROLE_ID =
"1542137235934158851";

const SUP_ROLE_ID =
"1542137235934158850";

const BUILDER_LEITUNG_ROLE_ID =
"1542137235934158848";

const BUILDER_ROLE_ID =
"1542137235917250614";

const FARMERLEITUNG_ROLE_ID =
"1542137235917250620";

const FARMER_ROLE_ID =
"1542137235917250612";

const TEAM_ROLE_CONFIG = [
{
id: CO_ANFUEHRER_ROLE_ID,
name: "Co - Anführer",
placeText: "beim **VIBE Clan**"
},
{
id: CLAN_MANAGER_ROLE_ID,
name: "Clan Manager",
placeText: "beim **VIBE Clan**"
},
{
id: ADMIN_ROLE_ID,
name: "Admin",
placeText: "beim **VIBE Clan**"
},
{
id: DEV_ROLE_ID,
name: "Dev",
placeText: "beim **VIBE Clan**"
},
{
id: TEST_ADMIN_ROLE_ID,
name: "test Admin",
placeText: "beim **VIBE Clan**"
},
{
id: MOD_ROLE_ID,
name: "Mod",
placeText: "beim **VIBE Clan**"
},
{
id: SUP_LEITUNG_ROLE_ID,
name: "Sup leitung",
placeText: "beim **VIBE Clan**"
},
{
id: SUP_ROLE_ID,
name: "Sup",
placeText: "beim **VIBE Clan**"
},
{
id: BUILDER_LEITUNG_ROLE_ID,
name: "Builder leitung",
placeText: "bei der **VIBE Baufirma**"
},
{
id: BUILDER_ROLE_ID,
name: "Builder",
placeText: "bei der **VIBE Baufirma**"
},
{
id: FARMERLEITUNG_ROLE_ID,
name: "Farmerleitung",
placeText: "beim **VIBE Clan**"
},
{
id: FARMER_ROLE_ID,
name: "Farmer",
placeText: "beim **VIBE Clan**"
}
];

// ======================================================
// TICKET KATEGORIEN
// ======================================================

const CLAN_CATEGORY_ID =
"1542137237997887523";

const TEAM_CATEGORY_ID =
"1542137237997887525";

const BAU_CATEGORY_ID =
"1542137237997887526";

const GIVEAWAY_CATEGORY_ID =
"1542137237997887527";

// ======================================================
// TICKET DATEN
// ======================================================

const ticketData =
new Map();

// ======================================================
// GIVEAWAY DATEN
// ======================================================

const giveawayData =
new Map();

const giveawayTimers =
new Map();

// ======================================================
// DISCORD CLIENT
// ======================================================

const client =
new Client({
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
// SICHERER TEXT
// ======================================================

function safeText(
value,
fallback = "Unbekannt"
) {

if (
value === null ||
value === undefined
) {
return fallback;
}

const text =
String(value).trim();

if (!text) {
return fallback;
}

return text;
}

// ======================================================
// BERECHTIGUNGS-NAMEN FÜR LOGS
// ======================================================

const PERMISSION_NAMES_DE = {
Administrator: "Administrator",
ViewAuditLog: "Audit-Log anzeigen",
ManageGuild: "Server verwalten",
ManageRoles: "Rollen verwalten",
ManageChannels: "Kanäle verwalten",
KickMembers: "Mitglieder kicken",
BanMembers: "Mitglieder bannen",
ManageMessages: "Nachrichten verwalten",
MentionEveryone: "@everyone / @here / Rollen erwähnen",
ManageNicknames: "Nicknames verwalten",
ChangeNickname: "Nickname ändern",
ViewChannel: "Kanal ansehen",
SendMessages: "Nachrichten senden",
SendMessagesInThreads: "Nachrichten in Threads senden",
CreatePublicThreads: "Öffentliche Threads erstellen",
CreatePrivateThreads: "Private Threads erstellen",
ManageThreads: "Threads verwalten",
EmbedLinks: "Links einbetten",
AttachFiles: "Dateien anhängen",
ReadMessageHistory: "Nachrichtenverlauf lesen",
AddReactions: "Reaktionen hinzufügen",
UseExternalEmojis: "Externe Emojis verwenden",
UseExternalStickers: "Externe Sticker verwenden",
Connect: "Sprachkanal verbinden",
Speak: "Sprechen",
MuteMembers: "Mitglieder stummschalten",
DeafenMembers: "Mitglieder taubschalten",
MoveMembers: "Mitglieder verschieben",
UseVAD: "Sprachaktivität verwenden",
PrioritySpeaker: "Prioritätssprecher",
Stream: "Video / Bildschirm teilen",
ManageWebhooks: "Webhooks verwalten",
ManageEvents: "Events verwalten",
CreateEvents: "Events erstellen",
ModerateMembers: "Mitglieder Timeout geben",
ViewCreatorMonetizationAnalytics: "Monetarisierungs-Analysen anzeigen",
UseApplicationCommands: "Anwendungsbefehle verwenden",
UseEmbeddedActivities: "Aktivitäten verwenden",
UseSoundboard: "Soundboard verwenden",
UseExternalSounds: "Externe Sounds verwenden",
SendVoiceMessages: "Sprachnachrichten senden",
CreateGuildExpressions: "Server-Ausdrücke erstellen",
ManageGuildExpressions: "Server-Ausdrücke verwalten"
};

function getPermissionDisplayName(name) {
return PERMISSION_NAMES_DE[name] || name;
}

function getPermissionChanges(beforeRole, afterRole) {

const added = [];
const removed = [];

for (const [name, bit] of Object.entries(PermissionsBitField.Flags)) {

const hadBefore =
beforeRole.permissions.has(bit);

const hasAfter =
afterRole.permissions.has(bit);

if (!hadBefore && hasAfter) {
added.push(
getPermissionDisplayName(name)
);
}

if (hadBefore && !hasAfter) {
removed.push(
getPermissionDisplayName(name)
);
}

}

return {
added,
removed
};
}

// ======================================================
// /SAY ROLLEN-MARKIERUNGEN
// ======================================================

function escapeRegExp(value) {
return String(value).replace(
/[.*+?^${}()|[\]\\]/g,
"\\$&"
);
}

function resolveSayRoleMentions(
guild,
text
) {

if (!guild) {

return {
content: text,
roleIds: []
};

}

let content =
String(text);

const roleIds =
new Set();

const roles =
[
...guild.roles.cache.values()
]
.filter(
role =>
role.id !== guild.id
)
.sort(
(a, b) =>
b.name.length -
a.name.length
);

for (
const role
of roles
) {

if (
role.name ===
"@everyone"
) {
continue;
}

const roleName =
escapeRegExp(
role.name
);

const regex =
new RegExp(
`(^|[\\s(\\[{])@${roleName}(?=$|[\\s.,!?;:)\\]}])`,
"gi"
);

let found =
false;

content =
content.replace(
regex,
(match, prefix) => {

found =
true;

return `${prefix}<@&${role.id}>`;

}
);

if (found) {
roleIds.add(
role.id
);
}

}

const rawRoleMentionRegex =
/<@&(\d{17,20})>/g;

let rawMatch;

while (
(
rawMatch =
rawRoleMentionRegex.exec(
content
)
) !== null
) {

if (
guild.roles.cache.has(
rawMatch[1]
) &&
rawMatch[1] !== guild.id
) {

roleIds.add(
rawMatch[1]
);

}

}

return {
content,

roleIds: [
...roleIds
]
};

}

// ======================================================
// BASIS EMBED
// ======================================================

function baseEmbed(
title,
color = 0x5865f2,
description = null
) {

const embed =
new EmbedBuilder();

embed.setTitle(
safeText(
title,
"VIBE Server Log"
)
);

embed.setColor(
typeof color === "number"
? color
: 0x5865f2
);

if (
description !== null &&
description !== undefined
) {

const text =
String(description).trim();

if (
text.length > 0
) {
embed.setDescription(text);
}

}

embed.setTimestamp();

return embed;
}

// ======================================================
// LOG CHANNEL
// ======================================================

function getLogChannel(guild) {

if (!guild) {
return null;
}

const channel =
guild.channels.cache.get(
SERVER_LOG_CHANNEL_ID
);

if (!channel) {
return null;
}

if (!channel.isTextBased()) {
return null;
}

return channel;
}

// ======================================================
// LOG SENDEN
// ======================================================

async function sendLog(
guild,
embed
) {

try {

if (
!isFeatureEnabled("serverLogs")
) {
return;
}

if (
!guild ||
!embed
) {
return;
}

const channel =
getLogChannel(guild);

if (!channel) {

console.log(
`⚠️ Log-Kanal nicht gefunden: ${SERVER_LOG_CHANNEL_ID}`
);

return;
}

await channel.send({
embeds: [
embed
]
});

} catch (error) {

console.error(
"❌ Logging Fehler:",
error
);

}

}

// ======================================================
// AUDIT LOG
// ======================================================

async function getAuditExecutor(
guild,
action,
targetId,
maxEntries = 10
) {

try {

if (!guild) {
return null;
}

const logs =
await guild.fetchAuditLogs({
limit:
maxEntries,

type:
action
});

const entry =
logs.entries.find(
entry => {

if (
!entry.target ||
!entry.target.id
) {
return false;
}

return (
entry.target.id ===
targetId &&
Date.now() -
entry.createdTimestamp <
10000
);

}
);

return entry || null;

} catch (error) {

if (
error.code !==
50013
) {

console.error(
"❌ Audit-Log Fehler:",
error
);

}

return null;

}

}

// ======================================================
// ADMIN PRÜFEN
// ======================================================

function isAdmin(member) {

if (!member) {
return false;
}

return member.permissions.has(
PermissionsBitField
.Flags
.Administrator
);

}

// ======================================================
// STAFF PRÜFEN
// ======================================================

function isStaff(member) {

if (!member) {
return false;
}

return (
member.roles.cache.has(
STAFF_ROLE_ID
) ||
isAdmin(member)
);

}

// ======================================================
// TICKET INFO
// ======================================================

function getTicketData(channel) {

if (!channel) {
return null;
}

return (
ticketData.get(
channel.id
) ||
null
);

}

// ======================================================
// TICKET STAFF PRÜFEN
// ======================================================

function isTicketStaff(member) {

if (
!member ||
!member.roles ||
!member.roles.cache
) {
return false;
}

return member.roles.cache.has(
STAFF_ROLE_ID
);

}

// ======================================================
// TICKET TRANSCRIPT
// ======================================================

async function fetchAllTicketMessages(
channel
) {

const messages =
[];

let beforeId =
null;

while (true) {

const options = {
limit:
100
};

if (beforeId) {

options.before =
beforeId;

}

const batch =
await channel.messages.fetch(
options
);

if (
batch.size ===
0
) {
break;
}

messages.push(
...batch.values()
);

const oldest =
batch.last();

beforeId =
oldest
? oldest.id
: null;

if (
batch.size < 100 ||
!beforeId
) {
break;
}

}

messages.sort(
(a, b) =>
a.createdTimestamp -
b.createdTimestamp
);

return messages;

}

function formatTicketMessage(
message
) {

const timestamp =
new Date(
message.createdTimestamp
).toLocaleString(
"de-DE",
{
timeZone:
"Europe/Berlin"
}
);

const author =
message.author
? `${message.author.tag} (${message.author.id})`
: "Unbekannter Nutzer";

const parts =
[];

const content =
message.content
? message.content.trim()
: "";

if (content) {
parts.push(
content
);
}

if (
message.attachments &&
message.attachments.size > 0
) {

for (
const attachment
of message.attachments.values()
) {

parts.push(
`[Anhang: ${attachment.name || "Datei"}] ${attachment.url}`
);

}

}

if (
message.embeds &&
message.embeds.length > 0
) {

for (
const embed
of message.embeds
) {

const embedParts =
[];

if (embed.title) {
embedParts.push(
`Titel: ${embed.title}`
);
}

if (embed.description) {
embedParts.push(
`Beschreibung: ${embed.description}`
);
}

if (embed.url) {
embedParts.push(
`URL: ${embed.url}`
);
}

parts.push(
`[Embed${embedParts.length ? ` | ${embedParts.join(" | ")}` : ""}]`
);

}

}

if (
parts.length === 0
) {

parts.push(
"[Keine Textnachricht]"
);

}

const body =
parts
.join("\n")
.replace(
/\r/g,
""
);

return `[${timestamp}] ${author}\n${body}\n`;

}

// ======================================================
// TRANSCRIPT ERSTELLEN
// ======================================================

async function createTicketTranscript(
channel,
data,
reason,
requestedById,
confirmedById
) {

const messages =
await fetchAllTicketMessages(
channel
);

const header = [
"======================================================",
"VIBE TICKET TRANSCRIPT",
"======================================================",
`Ticket: #${channel.name}`,
`Channel-ID: ${channel.id}`,
`Ticket-Ersteller: ${data && data.ownerId ? data.ownerId : "Unbekannt"}`,
`Kategorie: ${data && data.categoryTitle ? data.categoryTitle : "Unbekannt"}`,
`Übernommen von: ${data && data.claimedBy ? data.claimedBy : "Niemand"}`,
`Weitergeleitet an: ${data && data.forwardedTo ? data.forwardedTo : "Niemand"}`,
`Schließung angefragt von: ${requestedById || "Unbekannt"}`,
`Schließung bestätigt von: ${confirmedById || "Unbekannt"}`,
`Grund: ${reason || "Kein Grund angegeben"}`,
`Erstellt: ${
data && data.createdAt
? new Date(
data.createdAt
).toLocaleString(
"de-DE",
{
timeZone:
"Europe/Berlin"
}
)
: "Unbekannt"
}`,
`Geschlossen: ${
new Date().toLocaleString(
"de-DE",
{
timeZone:
"Europe/Berlin"
}
)
}`,
`Nachrichten: ${messages.length}`,
"======================================================",
""
].join("\n");

let transcript =
header;

for (
const message
of messages
) {

transcript +=
formatTicketMessage(
message
);

transcript +=
"\n";

}

const maxBytes =
7.5 *
1024 *
1024;

let buffer =
Buffer.from(
transcript,
"utf8"
);

if (
buffer.length >
maxBytes
) {

const shortened =
buffer
.subarray(
0,
Math.floor(
maxBytes
)
)
.toString(
"utf8"
) +
"\n\n[Transcript wurde wegen der Dateigröße gekürzt.]";

buffer =
Buffer.from(
shortened,
"utf8"
);

}

return {
buffer,

messageCount:
messages.length
};

}

// ======================================================
// TRANSCRIPT LOG SENDEN
// ======================================================

async function sendTicketTranscriptLog({
guild,
channel,
data,
reason,
requestedById,
confirmedById
}) {

try {

if (
!guild ||
!channel
) {
return false;
}

if (
!/^\d{17,20}$/.test(
TICKET_TRANSCRIPT_CHANNEL_ID
)
) {

console.log(
"⚠️ TICKET_TRANSCRIPT_CHANNEL_ID ist noch nicht eingetragen."
);

return false;
}

const logChannel =
guild.channels.cache.get(
TICKET_TRANSCRIPT_CHANNEL_ID
) ||
await guild.channels
.fetch(
TICKET_TRANSCRIPT_CHANNEL_ID
)
.catch(
() => null
);

if (
!logChannel ||
!logChannel.isTextBased()
) {

console.log(
`⚠️ Ticket-Transcript-Channel nicht gefunden: ${TICKET_TRANSCRIPT_CHANNEL_ID}`
);

return false;
}

const transcript =
await createTicketTranscript(
channel,
data,
reason,
requestedById,
confirmedById
);

const logEmbed =
new EmbedBuilder()

.setColor(
"#ED4245"
)

.setTitle(
"🔒 Ticket geschlossen"
)

.addFields(
{
name:
"🎫 Ticket",

value:
`#${channel.name}\n\`${channel.id}\``,

inline:
false
},
{
name:
"👤 Ticket-Ersteller",

value:
data && data.ownerId
? `<@${data.ownerId}> (\`${data.ownerId}\`)`
: "Unbekannt",

inline:
true
},
{
name:
"🛡️ Schließung angefragt von",

value:
requestedById
? `<@${requestedById}> (\`${requestedById}\`)`
: "Unbekannt",

inline:
true
},
{
name:
"✅ Bestätigt von",

value:
confirmedById
? `<@${confirmedById}> (\`${confirmedById}\`)`
: "Unbekannt",

inline:
true
},
{
name:
"📝 Grund",

value:
safeText(
reason,
"Kein Grund angegeben"
).substring(
0,
1024
),

inline:
false
},
{
name:
"📌 Übernommen von",

value:
data && data.claimedBy
? `<@${data.claimedBy}>`
: "Niemand",

inline:
true
},
{
name:
"➡️ Weitergeleitet an",

value:
data && data.forwardedTo
? `<@${data.forwardedTo}>`
: "Niemand",

inline:
true
},
{
name:
"💬 Nachrichten",

value:
`${transcript.messageCount}`,

inline:
true
}
)

.setFooter({
text:
"VIBE Ticket System • Transcript als Datei angehängt"
})

.setTimestamp();

const safeChannelName =
channel.name
.replace(
/[^a-zA-Z0-9_-]/g,
"-"
)
.substring(
0,
60
);

await logChannel.send({
embeds: [
logEmbed
],

files: [
{
attachment:
transcript.buffer,

name:
`ticket-${safeChannelName}-${channel.id}.txt`
}
]
});

return true;

} catch (error) {

console.error(
"❌ Ticket Transcript Fehler:",
error
);

return false;
}

}

// ======================================================
// GIVEAWAY DAUER
// ======================================================

function parseGiveawayDuration(
input
) {

if (!input) {
return null;
}

const value =
String(input)
.trim()
.toLowerCase()
.replace(
",",
"."
);

const compact =
value.replace(
/\s+/g,
""
);

const shortMatch =
compact.match(
/^(\d+(?:\.\d+)?)(s|m|h|d|w)$/i
);

if (shortMatch) {

const amount =
Number(
shortMatch[1]
);

const unit =
shortMatch[2]
.toLowerCase();

const multipliers = {
s:
1000,

m:
60 *
1000,

h:
60 *
60 *
1000,

d:
24 *
60 *
60 *
1000,

w:
7 *
24 *
60 *
60 *
1000
};

return Math.floor(
amount *
multipliers[unit]
);

}

const longMatch =
value.match(
/^(\d+(?:\.\d+)?)\s*(sekunde|sekunden|min|minute|minuten|stunde|stunden|std|tag|tage|tagen|woche|wochen)$/i
);

if (!longMatch) {
return null;
}

const amount =
Number(
longMatch[1]
);

const unit =
longMatch[2]
.toLowerCase();

let multiplier =
null;

if (
unit ===
"sekunde" ||
unit ===
"sekunden"
) {
multiplier =
1000;
}

if (
unit ===
"min" ||
unit ===
"minute" ||
unit ===
"minuten"
) {
multiplier =
60 *
1000;
}

if (
unit ===
"stunde" ||
unit ===
"stunden" ||
unit ===
"std"
) {
multiplier =
60 *
60 *
1000;
}

if (
unit ===
"tag" ||
unit ===
"tage" ||
unit ===
"tagen"
) {
multiplier =
24 *
60 *
60 *
1000;
}

if (
unit ===
"woche" ||
unit ===
"wochen"
) {
multiplier =
7 *
24 *
60 *
60 *
1000;
}

if (!multiplier) {
return null;
}

return Math.floor(
amount *
multiplier
);

}

// ======================================================
// GIVEAWAY EMBED
// ======================================================

function createGiveawayEmbed(
data,
ended = false,
winnerIds = []
) {

const endUnix =
Math.floor(
data.endAt /
1000
);

const embed =
new EmbedBuilder()

.setColor(
ended
? "#57F287"
: "#5865F2"
)

.setTitle(
`🎁 ${data.prize}`
)

.setDescription(
data.description ||
"Viel Glück an alle Teilnehmer! 🍀"
)

.addFields(
{
name:
"⏰ Ende",

value:
ended
? `Beendet <t:${endUnix}:R>`
: `<t:${endUnix}:R>\n<t:${endUnix}:f>`,

inline:
false
},
{
name:
"👤 Veranstaltet von",

value:
`<@${data.hostId}>`,

inline:
true
},
{
name:
"🎟️ Teilnehmer",

value:
`${data.participants.size}`,

inline:
true
},
{
name:
"🏆 Gewinner",

value:
`${data.winnerCount}`,

inline:
true
}
)

.setTimestamp(
data.createdAt
)

.setFooter({
text:
ended
? "Gewinnspiel beendet"
: "Klicke unten auf 🎉 Teilnehmen!"
});

if (ended) {

embed.addFields({
name:
"🎉 Ergebnis",

value:
winnerIds.length > 0
? winnerIds
.map(
id =>
`<@${id}>`
)
.join(
", "
)
: "Keine gültigen Teilnehmer."
});

}

return embed;

}

// ======================================================
// GEWINNER ZIEHEN
// ======================================================

function pickGiveawayWinners(
participants,
count
) {

const pool = [
...participants
];

const winners =
[];

while (
pool.length > 0 &&
winners.length < count
) {

const index =
Math.floor(
Math.random() *
pool.length
);

winners.push(
pool.splice(
index,
1
)[0]
);

}

return winners;

}

// ======================================================
// SLASH COMMANDS
// ======================================================

const commands = [

new SlashCommandBuilder()

.setName(
"ticketpanel"
)

.setDescription(
"Erstellt das Ticket Panel"
)

.toJSON(),

new SlashCommandBuilder()

.setName(
"logtest"
)

.setDescription(
"Testet das Server-Logging"
)

.toJSON(),

new SlashCommandBuilder()

.setName(
"clear"
)

.setDescription(
"Löscht Nachrichten aus diesem Channel"
)

.addIntegerOption(
option =>
option

.setName(
"nummer"
)

.setDescription(
"Wie viele Nachrichten sollen gelöscht werden?"
)

.setRequired(
true
)

.setMinValue(
1
)

.setMaxValue(
1000
)
)

.toJSON(),

new SlashCommandBuilder()

.setName(
"create"
)

.setDescription(
"Erstellt Inhalte auf dem Server"
)

.addSubcommand(
subcommand =>
subcommand

.setName(
"giveaway"
)

.setDescription(
"Erstellt ein Gewinnspiel"
)
)

.toJSON(),

new SlashCommandBuilder()

.setName(
"say"
)

.setDescription(
"Lässt den Bot eine Nachricht schreiben"
)

.toJSON()

];

// ======================================================
// REST
// ======================================================

const rest =
new REST({
version:
"10"
}).setToken(
TOKEN
);

// ======================================================
// COMMANDS REGISTRIEREN
// ======================================================

async function registerCommands() {

try {

console.log(
"⏳ Registriere Slash Commands..."
);

await rest.put(
Routes.applicationGuildCommands(
CLIENT_ID,
GUILD_ID
),
{
body:
commands
}
);

console.log(
"✅ Slash Commands registriert"
);

return true;

} catch (error) {

console.error(
"❌ Fehler beim Registrieren:",
error
);

return false;
}

}

// ======================================================
// BOT READY
// ======================================================

client.once(
Events.ClientReady,
async () => {

console.log("");

console.log(
"===================================="
);

console.log(
`✅ Bot online: ${client.user.tag}`
);

console.log(
`🆔 Bot ID: ${client.user.id}`
);

console.log(
`🌐 Port: ${PORT}`
);

console.log(
`📝 Server Log: ${SERVER_LOG_CHANNEL_ID}`
);

console.log(
`🛡️ Staff Rolle: ${STAFF_ROLE_ID}`
);

console.log(
`🎧 Support Rolle: ${SUPPORT_ROLE_ID}`
);

console.log(
"===================================="
);

console.log("");

await registerCommands();

}
);

// ======================================================
// BOT LOGIN
// ======================================================

if (!TOKEN) {

console.error(
"❌ TOKEN fehlt bei Render Environment!"
);

process.exit(1);

}

console.log(
"🔐 Bot wird eingeloggt..."
);

client.login(
TOKEN
).catch(
error => {

console.error(
"❌ Discord Login Fehler:",
error
);

}
);

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

if (
interaction.isChatInputCommand()
) {

// ==================================================
// /SAY
// ==================================================

if (
interaction.commandName ===
"say"
) {

if (
!isAdmin(
interaction.member
)
) {

return interaction.reply({
content:
"❌ Nur Administratoren können `/say` benutzen.",

flags:
MessageFlags.Ephemeral
});

}

const modal =
new ModalBuilder()

.setCustomId(
"say_modal"
)

.setTitle(
"Nachricht senden"
);

const messageInput =
new TextInputBuilder()

.setCustomId(
"say_message"
)

.setLabel(
"Was möchtest du sagen?"
)

.setPlaceholder(
"z. B. @Staff Hallo zusammen!"
)

.setStyle(
TextInputStyle.Paragraph
)

.setRequired(
true
)

.setMaxLength(
2000
);

const row =
new ActionRowBuilder()
.addComponents(
messageInput
);

modal.addComponents(
row
);

await interaction.showModal(
modal
);

return;
}

// ==================================================
// /CREATE GIVEAWAY
// ==================================================

if (
interaction.commandName ===
"create" &&
interaction.options.getSubcommand() ===
"giveaway"
) {

if (
!isFeatureEnabled(
"giveaways"
)
) {

return interaction.reply({
content:
"❌ Das Giveaway-System ist derzeit deaktiviert.",

flags:
MessageFlags.Ephemeral
});

}

if (
!isAdmin(
interaction.member
) &&
!interaction.member
.permissions
.has(
PermissionsBitField
.Flags
.ManageGuild
)
) {

return interaction.reply({
content:
"❌ Du benötigst die Berechtigung **Server verwalten**, um ein Gewinnspiel zu erstellen.",

flags:
MessageFlags.Ephemeral
});

}

const modal =
new ModalBuilder()

.setCustomId(
"create_giveaway_modal"
)

.setTitle(
"Gewinnspiel erstellen"
);

const durationInput =
new TextInputBuilder()

.setCustomId(
"giveaway_duration"
)

.setLabel(
"Dauer"
)

.setPlaceholder(
"z. B. 10 Minuten, 2 Stunden oder 1 Tag"
)

.setStyle(
TextInputStyle.Short
)

.setRequired(
true
);

const winnersInput =
new TextInputBuilder()

.setCustomId(
"giveaway_winners"
)

.setLabel(
"Anzahl der Gewinner"
)

.setPlaceholder(
"z. B. 1"
)

.setStyle(
TextInputStyle.Short
)

.setRequired(
true
);

const prizeInput =
new TextInputBuilder()

.setCustomId(
"giveaway_prize"
)

.setLabel(
"Preis"
)

.setPlaceholder(
"Was kann man gewinnen?"
)

.setStyle(
TextInputStyle.Short
)

.setRequired(
true
);

const descriptionInput =
new TextInputBuilder()

.setCustomId(
"giveaway_description"
)

.setLabel(
"Beschreibung"
)

.setPlaceholder(
"Optional: Weitere Informationen"
)

.setStyle(
TextInputStyle.Paragraph
)

.setRequired(
false
);

modal.addComponents(
new ActionRowBuilder()
.addComponents(
durationInput
),

new ActionRowBuilder()
.addComponents(
winnersInput
),

new ActionRowBuilder()
.addComponents(
prizeInput
),

new ActionRowBuilder()
.addComponents(
descriptionInput
)
);

await interaction.showModal(
modal
);

return;
}

// ==================================================
// LOG TEST
// ==================================================

if (
interaction.commandName ===
"logtest"
) {

if (
!isFeatureEnabled(
"serverLogs"
)
) {

return interaction.reply({
content:
"❌ Das Logging ist derzeit deaktiviert.",

flags:
MessageFlags.Ephemeral
});

}

if (
!isAdmin(
interaction.member
)
) {

return interaction.reply({
content:
"❌ Nur Administratoren können diesen Befehl benutzen.",

flags:
MessageFlags.Ephemeral
});

}

const embed =
baseEmbed(
"🧪 Logging Test",
0x5865f2,
"Das Server-Logging funktioniert."
);

embed.addFields(
{
name:
"Ausgeführt von",

value:
`${interaction.user} (${interaction.user.id})`
},
{
name:
"Channel",

value:
interaction.channel
? interaction.channel.toString()
: "Unbekannt"
}
);

await sendLog(
interaction.guild,
embed
);

return interaction.reply({
content:
"✅ Test-Log wurde gesendet.",

flags:
MessageFlags.Ephemeral
});

}

// ==================================================
// /CLEAR
// ==================================================

if (
interaction.commandName ===
"clear"
) {

if (
!isFeatureEnabled(
"clear"
)
) {

return interaction.reply({
content:
"❌ `/clear` ist derzeit deaktiviert.",

flags:
MessageFlags.Ephemeral
});

}

if (
!interaction.member
.permissions
.has(
PermissionsBitField
.Flags
.ManageMessages
) &&
!isAdmin(
interaction.member
)
) {

return interaction.reply({
content:
"❌ Du benötigst die Berechtigung **Nachrichten verwalten**.",

flags:
MessageFlags.Ephemeral
});

}

const amount =
interaction.options
.getInteger(
"nummer",
true
);

const channel =
interaction.channel;

if (
!channel ||
!channel.isTextBased() ||
typeof channel.bulkDelete !==
"function"
) {

return interaction.reply({
content:
"❌ In diesem Channel können keine Nachrichten gelöscht werden.",

flags:
MessageFlags.Ephemeral
});

}

await interaction.deferReply({
flags:
MessageFlags.Ephemeral
});

try {

let remaining =
amount;

let deletedTotal =
0;

while (
remaining > 0
) {

const batchSize =
Math.min(
remaining,
100
);

const deleted =
await channel.bulkDelete(
batchSize,
true
);

const deletedCount =
deleted.size;

deletedTotal +=
deletedCount;

remaining -=
deletedCount;

if (
deletedCount === 0 ||
deletedCount < batchSize
) {
break;
}

if (
remaining > 0
) {

await new Promise(
resolve =>
setTimeout(
resolve,
500
)
);

}

}

await interaction.editReply({
content:
`🧹 **${deletedTotal} Nachrichten wurden gelöscht.**` +
(
deletedTotal < amount
? "\n⚠️ Einige Nachrichten konnten nicht gelöscht werden, z. B. weil sie älter als 14 Tage sind."
: ""
)
});

const logEmbed =
baseEmbed(
"🧹 Nachrichten gelöscht",
0xed4245
);

logEmbed.addFields(
{
name:
"👤 Ausgeführt von",

value:
`${interaction.user} (${interaction.user.id})`
},
{
name:
"📍 Channel",

value:
channel.toString()
},
{
name:
"🗑️ Gelöscht",

value:
`${deletedTotal} Nachrichten`
},
{
name:
"🔢 Angefordert",

value:
`${amount} Nachrichten`
}
);

await sendLog(
interaction.guild,
logEmbed
);

} catch (error) {

console.error(
"❌ Clear Fehler:",
error
);

await interaction
.editReply({
content:
"❌ Beim Löschen der Nachrichten ist ein Fehler aufgetreten."
})
.catch(
() => {}
);

}

return;
}

// ==================================================
// TICKET PANEL
// ==================================================

if (
interaction.commandName ===
"ticketpanel"
) {

if (
!isFeatureEnabled(
"tickets"
)
) {

return interaction.reply({
content:
"❌ Das Ticket-System ist derzeit deaktiviert.",

flags:
MessageFlags.Ephemeral
});

}

if (
!isAdmin(
interaction.member
)
) {

return interaction.reply({
content:
"❌ Nur Administratoren können das Ticket Panel erstellen.",

flags:
MessageFlags.Ephemeral
});

}

const embed =
new EmbedBuilder()

.setColor(
"#2B2D31"
)

.setTitle(
"🎫 Allgemeiner Support"
)

.setDescription(
`Du hast ein Problem, eine Frage oder benötigst Hilfe auf unserem Server?

Dann bist du hier genau richtig!

Erstelle ein Ticket und beschreibe dein Anliegen so genau wie möglich.

━━━━━━━━━━━━━━━━━━

📌 **Wobei wir helfen können:**

• ❓ Fragen rund um den Server
• 🐛 Probleme & Bugs
• 🚨 Spieler melden
• 🛠️ Allgemeine Hilfe
• 🏗️ Bauprojekte & Aufträge
• 🎁 Giveaway Anliegen

━━━━━━━━━━━━━━━━━━

👥 **Bewerbungen & Bau-Firma**

Du möchtest Teil unseres Teams werden oder die Bau-Firma unterstützen?

Erstelle einfach ein Ticket.

━━━━━━━━━━━━━━━━━━

📋 **Wichtige Hinweise:**

• Beschreibe dein Anliegen genau
• Bleibe freundlich
• Erstelle nur ein Ticket pro Anliegen

━━━━━━━━━━━━━━━━━━

🚀 Vielen Dank und viel Spaß auf unserem Server!`
)

.setThumbnail(
client.user
.displayAvatarURL()
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

emoji:
"🛡️",

value:
"clan_bewerbung"
},
{
label:
"Team Bewerbung",

description:
"Bewirb dich für das Team",

emoji:
"👥",

value:
"team_bewerbung"
},
{
label:
"Bau Firma",

description:
"Firmenbewerbung und Aufträge",

emoji:
"🏗️",

value:
"bau_firma"
},
{
label:
"Giveaway",

description:
"Fragen und Hilfe zu Giveaways",

emoji:
"🎁",

value:
"giveaway"
}
]);

const row =
new ActionRowBuilder()
.addComponents(
menu
);

return interaction.reply({
embeds: [
embed
],

components: [
row
]
});

}

return;
}

// ==================================================
// SAY MODAL
// ==================================================

if (
interaction.isModalSubmit() &&
interaction.customId ===
"say_modal"
) {

if (
!isAdmin(
interaction.member
)
) {

return interaction.reply({
content:
"❌ Nur Administratoren können `/say` benutzen.",

flags:
MessageFlags.Ephemeral
});

}

const nachricht =
interaction.fields
.getTextInputValue(
"say_message"
)
.trim();

if (!nachricht) {

return interaction.reply({
content:
"❌ Bitte gib eine Nachricht ein.",

flags:
MessageFlags.Ephemeral
});

}

const sayMessage =
resolveSayRoleMentions(
interaction.guild,
nachricht
);

await interaction.reply({
content:
"✅ Nachricht gesendet.",

flags:
MessageFlags.Ephemeral
});

await interaction.channel.send({
content:
sayMessage.content,

allowedMentions: {
parse:
[],

roles:
sayMessage.roleIds,

repliedUser:
false
}
});

return;
}

// ==================================================
// GIVEAWAY MODAL
// ==================================================

if (
interaction.isModalSubmit() &&
interaction.customId ===
"create_giveaway_modal"
) {

if (
!isFeatureEnabled(
"giveaways"
)
) {

return interaction.reply({
content:
"❌ Das Giveaway-System ist deaktiviert.",

flags:
MessageFlags.Ephemeral
});

}

const durationText =
interaction.fields
.getTextInputValue(
"giveaway_duration"
)
.trim();

const winnersText =
interaction.fields
.getTextInputValue(
"giveaway_winners"
)
.trim();

const prize =
interaction.fields
.getTextInputValue(
"giveaway_prize"
)
.trim();

const description =
interaction.fields
.getTextInputValue(
"giveaway_description"
)
.trim();

const duration =
parseGiveawayDuration(
durationText
);

const winnerCount =
Number.parseInt(
winnersText,
10
);

if (
!duration ||
duration < 10000
) {

return interaction.reply({
content:
"❌ Ungültige Dauer.\n\n" +
"Beispiele:\n" +
"• `10 Minuten`\n" +
"• `2 Stunden`\n" +
"• `1 Tag`\n" +
"• `30m`\n" +
"• `2h`\n" +
"• `1d`",

flags:
MessageFlags.Ephemeral
});

}

if (
!Number.isInteger(
winnerCount
) ||
winnerCount < 1 ||
winnerCount > 20
) {

return interaction.reply({
content:
"❌ Die Anzahl der Gewinner muss zwischen **1 und 20** liegen.",

flags:
MessageFlags.Ephemeral
});

}

if (!prize) {

return interaction.reply({
content:
"❌ Bitte gib einen Preis an.",

flags:
MessageFlags.Ephemeral
});

}

await interaction.deferReply({
flags:
MessageFlags.Ephemeral
});

const giveawayId =
`${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const data = {

id:
giveawayId,

guildId:
interaction.guildId,

channelId:
interaction.channelId,

messageId:
null,

hostId:
interaction.user.id,

prize,

description,

winnerCount,

participants:
new Set(),

createdAt:
Date.now(),

endAt:
Date.now() +
duration,

ended:
false,

winnerIds:
[]

};

const joinButton =
new ButtonBuilder()

.setCustomId(
`giveaway_join_${giveawayId}`
)

.setLabel(
"Teilnehmen"
)

.setEmoji(
"🎉"
)

.setStyle(
ButtonStyle.Primary
);

const row =
new ActionRowBuilder()
.addComponents(
joinButton
);

const giveawayMessage =
await interaction.channel.send({
embeds: [
createGiveawayEmbed(
data
)
],

components: [
row
]
});

data.messageId =
giveawayMessage.id;

giveawayData.set(
giveawayId,
data
);

scheduleGiveawayEnd(
giveawayId
);

await interaction.editReply({
content:
`✅ Das Gewinnspiel wurde erfolgreich erstellt!\n${giveawayMessage.url}`
});

return;
}

// ==================================================
// TICKET SCHLIESSEN - GRUND MODAL
// ==================================================

if (
interaction.isModalSubmit() &&
interaction.customId ===
"ticket_close_reason_modal"
) {

if (
!isTicketStaff(
interaction.member
)
) {

return interaction.reply({
content:
"❌ Nur Mitglieder mit der Staff-Rolle können eine Ticket-Schließung starten.",

flags:
MessageFlags.Ephemeral
});

}

const channel =
interaction.channel;

const data =
getTicketData(
channel
);

if (!data) {

return interaction.reply({
content:
"❌ Ticket-Daten wurden nicht gefunden.",

flags:
MessageFlags.Ephemeral
});

}

if (
data.pendingClose
) {

return interaction.reply({
content:
"❌ Für dieses Ticket läuft bereits eine Schließungs-Anfrage.",

flags:
MessageFlags.Ephemeral
});

}

const reason =
interaction.fields
.getTextInputValue(
"ticket_close_reason"
)
.trim();

data.pendingClose = {
reason,

requestedBy:
interaction.user.id,

requestedAt:
Date.now()
};

const yesButton =
new ButtonBuilder()

.setCustomId(
"ticket_close_yes"
)

.setLabel(
"Ja, schließen"
)

.setEmoji(
"✅"
)

.setStyle(
ButtonStyle.Danger
);

const noButton =
new ButtonBuilder()

.setCustomId(
"ticket_close_no"
)

.setLabel(
"Nein, offen lassen"
)

.setEmoji(
"❌"
)

.setStyle(
ButtonStyle.Secondary
);

const confirmRow =
new ActionRowBuilder()
.addComponents(
yesButton,
noButton
);

const confirmEmbed =
new EmbedBuilder()

.setColor(
"#FEE75C"
)

.setTitle(
"🔒 Ticket schließen?"
)

.setDescription(
`<@${data.ownerId}>, möchtest du dein Ticket wirklich schließen?

📝 **Grund:** ${safeText(reason, "Kein Grund angegeben")}

Nur der Ticket-Ersteller kann **Ja** oder **Nein** auswählen.`
)

.setFooter({
text:
`Schließung angefragt von ${interaction.user.tag}`
})

.setTimestamp();

await interaction.reply({
content:
`<@${data.ownerId}>`,

embeds: [
confirmEmbed
],

components: [
confirmRow
],

allowedMentions: {
users: [
data.ownerId
]
}
});

return;
}

// ==================================================
// TICKET AUSWAHL
// ==================================================

if (
interaction.isStringSelectMenu() &&
interaction.customId ===
"ticket_menu"
) {

if (
!isFeatureEnabled(
"tickets"
)
) {

return interaction.reply({
content:
"❌ Das Ticket-System ist deaktiviert.",

flags:
MessageFlags.Ephemeral
});

}

await interaction.deferReply({
flags:
MessageFlags.Ephemeral
});

const selected =
interaction.values[0];

const config = {

clan_bewerbung: {

name:
`support-${interaction.user.username.toLowerCase()}`,

title:
"🛡️ Allgemeiner Support",

categoryId:
CLAN_CATEGORY_ID

},

team_bewerbung: {

name:
`bewerbung-${interaction.user.username.toLowerCase()}`,

title:
"👥 Team Bewerbung",

categoryId:
TEAM_CATEGORY_ID

},

bau_firma: {

name:
`bau-${interaction.user.username.toLowerCase()}`,

title:
"🏗️ Bau Firma",

categoryId:
BAU_CATEGORY_ID

},

giveaway: {

name:
`giveaway-${interaction.user.username.toLowerCase()}`,

title:
"🎁 Giveaway",

categoryId:
GIVEAWAY_CATEGORY_ID

}

}[selected];

if (!config) {

return interaction.editReply({
content:
"❌ Ungültige Ticket-Kategorie."
});

}

const guild =
interaction.guild;

const existing =
guild.channels.cache.find(
channel =>
channel.type ===
ChannelType.GuildText &&
channel.name ===
config.name
);

if (existing) {

return interaction.editReply({
content:
`❌ Du hast bereits ein Ticket offen: ${existing}`
});

}

const member =
await guild.members
.fetch(
interaction.user.id
)
.catch(
() => null
);

const staffRole =
await guild.roles
.fetch(
STAFF_ROLE_ID
)
.catch(
() => null
);

const category =
await guild.channels
.fetch(
config.categoryId
)
.catch(
() => null
);

if (
!member ||
!staffRole ||
!category
) {

return interaction.editReply({
content:
"❌ Ticket konnte nicht erstellt werden. Prüfe Rollen und Kategorien."
});

}

const channel =
await guild.channels.create({

name:
config.name,

type:
ChannelType.GuildText,

parent:
category.id,

permissionOverwrites: [
{
id:
guild.roles.everyone.id,

deny: [
PermissionsBitField
.Flags
.ViewChannel
]
},
{
id:
member.id,

allow: [
PermissionsBitField
.Flags
.ViewChannel,

PermissionsBitField
.Flags
.SendMessages,

PermissionsBitField
.Flags
.ReadMessageHistory
]
},
{
id:
staffRole.id,

allow: [
PermissionsBitField
.Flags
.ViewChannel,

PermissionsBitField
.Flags
.SendMessages,

PermissionsBitField
.Flags
.ReadMessageHistory
]
}
]

});

ticketData.set(
channel.id,
{
ownerId:
member.id,

claimedBy:
null,

forwardedTo:
null,

categoryTitle:
config.title,

createdAt:
Date.now(),

pendingClose:
null
}
);

const claimButton =
new ButtonBuilder()

.setCustomId(
"claim_ticket"
)

.setLabel(
"Ticket übernehmen"
)

.setEmoji(
"📌"
)

.setStyle(
ButtonStyle.Primary
);

const forwardButton =
new ButtonBuilder()

.setCustomId(
"forward_ticket"
)

.setLabel(
"Weiterleiten"
)

.setEmoji(
"➡️"
)

.setStyle(
ButtonStyle.Secondary
);

const closeButton =
new ButtonBuilder()

.setCustomId(
"close_ticket"
)

.setLabel(
"Ticket schließen"
)

.setEmoji(
"🔒"
)

.setStyle(
ButtonStyle.Danger
);

const row =
new ActionRowBuilder()
.addComponents(
claimButton,
forwardButton,
closeButton
);

const ticketEmbed =
new EmbedBuilder()

.setColor(
"#57F287"
)

.setTitle(
config.title
)

.setDescription(
`Hallo ${member} 👋

Dein Ticket wurde erfolgreich erstellt.

📌 Bitte beschreibe dein Anliegen möglichst genau.

🛡️ Ein Teammitglied wird sich schnellstmöglich darum kümmern.

📌 **Ticket übernehmen:** Nur Staff.
➡️ **Weiterleiten:** Nur Staff.
🔒 **Schließen:** Nur Staff startet die Schließung; du bestätigst danach mit Ja/Nein.`
)

.setFooter({
text:
"VIBE Ticket System"
})

.setTimestamp();

await channel.send({
content:
`<@&${STAFF_ROLE_ID}>`,

allowedMentions: {
roles: [
STAFF_ROLE_ID
]
},

embeds: [
ticketEmbed
],

components: [
row
]
});

await interaction.editReply({
content:
`✅ Dein Ticket wurde erstellt: ${channel}`
});

return;
}

// ==================================================
// TICKET WEITERLEITEN - USER AUSWAHL
// ==================================================

if (
interaction.isUserSelectMenu() &&
interaction.customId ===
"forward_ticket_user"
) {

await interaction.deferReply({
flags:
MessageFlags.Ephemeral
});

if (
!isTicketStaff(
interaction.member
)
) {

return interaction.editReply({
content:
"❌ Nur Teammitglieder können Tickets weiterleiten."
});

}

const selectedUserId =
interaction.values[0];

const selectedMember =
await interaction.guild
.members
.fetch(
selectedUserId
)
.catch(
() => null
);

if (
!selectedMember ||
!isTicketStaff(
selectedMember
)
) {

return interaction.editReply({
content:
"❌ Bitte wähle ein gültiges Teammitglied."
});

}

const channel =
interaction.channel;

const data =
getTicketData(
channel
);

if (!data) {

return interaction.editReply({
content:
"❌ Ticket-Daten nicht gefunden."
});

}

await channel
.permissionOverwrites
.edit(
selectedMember.id,
{
ViewChannel:
true,

SendMessages:
true,

ReadMessageHistory:
true
}
);

data.forwardedTo =
selectedMember.id;

await channel.send({
content:
`${selectedMember}`,

embeds: [
new EmbedBuilder()

.setColor(
"#5865F2"
)

.setTitle(
"➡️ Ticket weitergeleitet"
)

.setDescription(
`Dieses Ticket wurde weitergeleitet.

👤 **Von:** ${interaction.user}

🎯 **An:** ${selectedMember}`
)

.setTimestamp()
]
});

return interaction.editReply({
content:
`✅ Ticket wurde an ${selectedMember} weitergeleitet.`
});

}

// ==================================================
// BUTTONS
// ==================================================

if (
interaction.isButton()
) {

// ==================================================
// GIVEAWAY TEILNAHME
// ==================================================

if (
interaction.customId.startsWith(
"giveaway_join_"
)
) {

await interaction.deferReply({
flags:
MessageFlags.Ephemeral
});

if (
!isFeatureEnabled(
"giveaways"
)
) {

return interaction.editReply({
content:
"❌ Das Giveaway-System ist deaktiviert."
});

}

const giveawayId =
interaction.customId.replace(
"giveaway_join_",
""
);

const data =
giveawayData.get(
giveawayId
);

if (!data) {

return interaction.editReply({
content:
"❌ Dieses Gewinnspiel ist nicht mehr aktiv."
});

}

if (
data.ended ||
Date.now() >=
data.endAt
) {

return interaction.editReply({
content:
"❌ Dieses Gewinnspiel ist bereits beendet."
});

}

if (
interaction.member &&
(
interaction.member
.roles
.cache
.has(
STAFF_ROLE_ID
) ||
isAdmin(
interaction.member
)
)
) {

return interaction.editReply({
content:
"❌ Teammitglieder und Administratoren dürfen nicht teilnehmen."
});

}

if (
data.participants.has(
interaction.user.id
)
) {

return interaction.editReply({
content:
"🎉 Du nimmst bereits am Gewinnspiel teil!"
});

}

data.participants.add(
interaction.user.id
);

await interaction.message
.edit({
embeds: [
createGiveawayEmbed(
data
)
]
})
.catch(
() => {}
);

return interaction.editReply({
content:
"🎉 **Du machst jetzt beim Gewinnspiel mit!**\n\n🍀 Viel Glück!"
});

}

// ==================================================
// TICKET ÜBERNEHMEN
// ==================================================

if (
interaction.customId ===
"claim_ticket"
) {

await interaction.deferReply({
flags:
MessageFlags.Ephemeral
});

if (
!isTicketStaff(
interaction.member
)
) {

return interaction.editReply({
content:
"❌ Nur Teammitglieder mit der Staff-Rolle können Tickets übernehmen."
});

}

const data =
getTicketData(
interaction.channel
);

if (!data) {

return interaction.editReply({
content:
"❌ Ticket-Daten wurden nicht gefunden."
});

}

if (
data.claimedBy
) {

return interaction.editReply({
content:
`❌ Dieses Ticket wurde bereits von <@${data.claimedBy}> übernommen.`
});

}

data.claimedBy =
interaction.user.id;

await interaction.channel.send({
embeds: [
new EmbedBuilder()

.setColor(
"#57F287"
)

.setTitle(
"📌 Ticket übernommen"
)

.setDescription(
`Das Ticket wurde von ${interaction.user} übernommen.`
)

.setTimestamp()
]
});

return interaction.editReply({
content:
"✅ Du hast das Ticket übernommen."
});

}

// ==================================================
// TICKET WEITERLEITEN
// ==================================================

if (
interaction.customId ===
"forward_ticket"
) {

if (
!isTicketStaff(
interaction.member
)
) {

return interaction.reply({
content:
"❌ Nur Teammitglieder mit der Staff-Rolle können Tickets weiterleiten.",

flags:
MessageFlags.Ephemeral
});

}

const select =
new UserSelectMenuBuilder()

.setCustomId(
"forward_ticket_user"
)

.setPlaceholder(
"Teammitglied auswählen"
)

.setMinValues(
1
)

.setMaxValues(
1
);

const row =
new ActionRowBuilder()
.addComponents(
select
);

return interaction.reply({
content:
"➡️ Wähle das Teammitglied aus:",

components: [
row
],

flags:
MessageFlags.Ephemeral
});

}

// ==================================================
// TICKET SCHLIESSEN
// ==================================================

if (
interaction.customId ===
"close_ticket"
) {

if (
!isTicketStaff(
interaction.member
)
) {

return interaction.reply({
content:
"❌ Nur Mitglieder mit der Staff-Rolle können diesen Ticket-Button benutzen.",

flags:
MessageFlags.Ephemeral
});

}

const data =
getTicketData(
interaction.channel
);

if (!data) {

return interaction.reply({
content:
"❌ Ticket-Daten wurden nicht gefunden.",

flags:
MessageFlags.Ephemeral
});

}

if (
data.pendingClose
) {

return interaction.reply({
content:
"❌ Für dieses Ticket läuft bereits eine Schließungs-Anfrage.",

flags:
MessageFlags.Ephemeral
});

}

const modal =
new ModalBuilder()

.setCustomId(
"ticket_close_reason_modal"
)

.setTitle(
"Ticket schließen"
);

const reasonInput =
new TextInputBuilder()

.setCustomId(
"ticket_close_reason"
)

.setLabel(
"Grund"
)

.setPlaceholder(
"z. B. Done"
)

.setStyle(
TextInputStyle.Paragraph
)

.setRequired(
true
)

.setMaxLength(
500
);

modal.addComponents(
new ActionRowBuilder()
.addComponents(
reasonInput
)
);

await interaction.showModal(
modal
);

return;
}

// ==================================================
// TICKET SCHLIESSEN - JA
// ==================================================

if (
interaction.customId ===
"ticket_close_yes"
) {

const channel =
interaction.channel;

const data =
getTicketData(
channel
);

if (
!data ||
!data.pendingClose
) {

return interaction.reply({
content:
"❌ Es gibt keine offene Schließungs-Anfrage.",

flags:
MessageFlags.Ephemeral
});

}

if (
interaction.user.id !==
data.ownerId
) {

return interaction.reply({
content:
"❌ Nur der Ticket-Ersteller kann diese Schließung bestätigen.",

flags:
MessageFlags.Ephemeral
});

}

const closeData = {

reason:
data.pendingClose.reason,

requestedBy:
data.pendingClose.requestedBy

};

await interaction.deferUpdate();

const logSent =
await sendTicketTranscriptLog({

guild:
interaction.guild,

channel,

data,

reason:
closeData.reason,

requestedById:
closeData.requestedBy,

confirmedById:
interaction.user.id

});

if (!logSent) {

data.pendingClose =
null;

await channel.send({
content:
"❌ Das Ticket wurde **nicht** gelöscht, weil das Transcript nicht in den Ticket-Log-Channel gesendet werden konnte.\nBitte prüfe `TICKET_TRANSCRIPT_CHANNEL_ID` und die Bot-Berechtigungen."
})
.catch(
() => {}
);

return;
}

await channel.send({
embeds: [
new EmbedBuilder()

.setColor(
"#ED4245"
)

.setTitle(
"🔒 Ticket wird geschlossen"
)

.setDescription(
`Das Ticket wurde von ${interaction.user} bestätigt und wird jetzt geschlossen.

📝 **Grund:** ${safeText(closeData.reason, "Kein Grund angegeben")}

📄 Das Transcript wurde im Ticket-Log gespeichert.`
)

.setTimestamp()
]
})
.catch(
() => {}
);

ticketData.delete(
channel.id
);

setTimeout(
async () => {

await channel
.delete(
`Ticket geschlossen | Grund: ${safeText(closeData.reason, "Kein Grund")}`
)
.catch(
error => {

console.error(
"❌ Ticket löschen Fehler:",
error
);

}
);

},
1500
);

return;
}

// ==================================================
// TICKET SCHLIESSEN - NEIN
// ==================================================

if (
interaction.customId ===
"ticket_close_no"
) {

const data =
getTicketData(
interaction.channel
);

if (
!data ||
!data.pendingClose
) {

return interaction.reply({
content:
"❌ Es gibt keine offene Schließungs-Anfrage.",

flags:
MessageFlags.Ephemeral
});

}

if (
interaction.user.id !==
data.ownerId
) {

return interaction.reply({
content:
"❌ Nur der Ticket-Ersteller kann diese Schließung ablehnen.",

flags:
MessageFlags.Ephemeral
});

}

data.pendingClose =
null;

await interaction.update({
content:
"",

embeds: [
new EmbedBuilder()

.setColor(
"#57F287"
)

.setTitle(
"✅ Ticket bleibt offen"
)

.setDescription(
`${interaction.user} hat die Schließung abgelehnt. Das Ticket bleibt geöffnet.`
)

.setTimestamp()
],

components:
[]
});

return;
}

}

} catch (error) {

console.error(
"❌ Interaction Fehler:",
error
);

try {

if (
interaction.deferred ||
interaction.replied
) {

await interaction
.editReply({
content:
"❌ Es ist ein Fehler aufgetreten."
})
.catch(
() => {}
);

} else {

await interaction.reply({
content:
"❌ Es ist ein Fehler aufgetreten.",

flags:
MessageFlags.Ephemeral
});

}

} catch {}

}

}
);

// ======================================================
// GIVEAWAY BEENDEN
// ======================================================

async function endGiveaway(
giveawayId
) {

const data =
giveawayData.get(
giveawayId
);

if (
!data ||
data.ended
) {
return;
}

data.ended =
true;

const timer =
giveawayTimers.get(
giveawayId
);

if (timer) {

clearTimeout(
timer
);

giveawayTimers.delete(
giveawayId
);

}

const winners =
pickGiveawayWinners(
data.participants,
data.winnerCount
);

data.winnerIds =
winners;

const guild =
client.guilds.cache.get(
data.guildId
);

if (!guild) {
return;
}

const channel =
await guild.channels
.fetch(
data.channelId
)
.catch(
() => null
);

if (
!channel ||
!channel.isTextBased()
) {
return;
}

const message =
await channel.messages
.fetch(
data.messageId
)
.catch(
() => null
);

if (message) {

const disabledButton =
new ButtonBuilder()

.setCustomId(
`giveaway_join_${giveawayId}`
)

.setLabel(
"Gewinnspiel beendet"
)

.setEmoji(
"🎉"
)

.setStyle(
ButtonStyle.Secondary
)

.setDisabled(
true
);

const row =
new ActionRowBuilder()
.addComponents(
disabledButton
);

await message.edit({
embeds: [
createGiveawayEmbed(
data,
true,
winners
)
],

components: [
row
]
})
.catch(
() => {}
);

}

if (
winners.length > 0
) {

await channel.send({
content:
"🎉 **GEWINNSPIEL BEENDET!** 🎉\n\n" +

`🏆 Gewinner: ${
winners
.map(
id =>
`<@${id}>`
)
.join(
", "
)
}\n\n` +

`🎁 **Preis:** ${data.prize}\n\n` +

"Herzlichen Glückwunsch! 🎊",

allowedMentions: {
users:
winners
}
});

} else {

await channel.send({
content:
"🎉 **Gewinnspiel beendet!**\n\n" +
"Es gab leider keine gültigen Teilnehmer.\n\n" +
`🎁 **Preis:** ${data.prize}`
});

}

}

// ======================================================
// GIVEAWAY TIMER
// ======================================================

function scheduleGiveawayEnd(
giveawayId
) {

const data =
giveawayData.get(
giveawayId
);

if (!data) {
return;
}

const scheduleNext =
() => {

const current =
giveawayData.get(
giveawayId
);

if (
!current ||
current.ended
) {
return;
}

const remaining =
current.endAt -
Date.now();

if (
remaining <= 0
) {

endGiveaway(
giveawayId
).catch(
error => {

console.error(
"❌ Giveaway End Fehler:",
error
);

}
);

return;
}

const wait =
Math.min(
remaining,
2_000_000_000
);

const timer =
setTimeout(
scheduleNext,
wait
);

giveawayTimers.set(
giveawayId,
timer
);

};

scheduleNext();

}

// ======================================================
// SUPPORT VOICE WARTERAUM
// ======================================================

client.on(
Events.VoiceStateUpdate,
async (
oldState,
newState
) => {

try {

if (
!isFeatureEnabled(
"supportVoice"
)
) {
return;
}

if (
newState.channelId !==
SUPPORT_WARTE_RAUM_ID
) {
return;
}

if (
oldState.channelId ===
SUPPORT_WARTE_RAUM_ID
) {
return;
}

const guild =
newState.guild;

const member =
newState.member;

if (
!guild ||
!member
) {
return;
}

const logChannel =
await guild.channels
.fetch(
SUPPORT_LOG_CHANNEL_ID
)
.catch(
() => null
);

if (
!logChannel ||
!logChannel.isTextBased()
) {
return;
}

const embed =
baseEmbed(
"🎧 Neue Support-Anfrage",
0x00a8ff,
"Ein Spieler wartet im Support-Warteraum."
);

embed.addFields(
{
name:
"👤 Spieler",

value:
`${member} (${member.id})`
},
{
name:
"📞 Warteraum",

value:
newState.channel
? newState.channel.toString()
: "Unbekannt"
},
{
name:
"⏰ Zeit",

value:
`<t:${Math.floor(Date.now() / 1000)}:R>`
}
);

embed.setThumbnail(
member.user.displayAvatarURL({
dynamic:
true
})
);

await logChannel.send({
content:
`<@&${SUPPORT_ROLE_ID}>`,

allowedMentions: {
roles: [
SUPPORT_ROLE_ID
]
},

embeds: [
embed
]
});

await sendLog(
guild,
embed
);

} catch (error) {

console.error(
"❌ Voice Support Fehler:",
error
);

}

}
);

// ======================================================
// AUTO-ROLLE BEIM SERVER-BEITRITT
// ======================================================

client.on(
Events.GuildMemberAdd,
async member => {

try {

if (member.user.bot) {
return;
}

if (
!/^\d{17,20}$/.test(
AUTO_ROLE_ID
)
) {

console.log(
"⚠️ AUTO_ROLE_ID ist noch nicht richtig eingetragen."
);

return;
}

const role =
member.guild.roles.cache.get(
AUTO_ROLE_ID
) ||
await member.guild.roles.fetch(
AUTO_ROLE_ID
).catch(
() => null
);

if (!role) {

console.log(
`⚠️ Auto-Rolle nicht gefunden: ${AUTO_ROLE_ID}`
);

return;
}

if (
member.roles.cache.has(
role.id
)
) {
return;
}

await member.roles.add(
role,
"Automatische Rolle beim Server-Beitritt"
);

console.log(
`✅ Auto-Rolle ${role.name} an ${member.user.tag} vergeben.`
);

} catch (error) {

console.error(
"❌ Auto-Rolle Fehler:",
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

if (
!isFeatureEnabled(
"welcome"
)
) {
return;
}

const channel =
member.guild.channels.cache.get(
WELCOME_CHANNEL_ID
);

if (
!channel ||
!channel.isTextBased()
) {
return;
}

const embed =
new EmbedBuilder()

.setColor(
"#FEE75C"
)

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
dynamic:
true
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
"❌ Welcome Fehler:",
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

try {

if (
!isFeatureEnabled(
"memberLogs"
)
) {
return;
}

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
0x57f287,
"Ein neues Mitglied ist dem Server beigetreten."
);

embed.setThumbnail(
member.displayAvatarURL()
);

embed.addFields(
{
name:
"👤 Nutzer",

value:
`${member} (${member.user.tag})`
},
{
name:
"⏲️ Kontoalter",

value:
`${days} Tage`,

inline:
true
},
{
name:
"👥 Mitglieder",

value:
`${member.guild.memberCount}`,

inline:
true
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

} catch (error) {

console.error(
"❌ Join Log Fehler:",
error
);

}

}
);

// ======================================================
// MEMBER LEAVE / KICK
// ======================================================

client.on(
Events.GuildMemberRemove,
async member => {

try {

if (
!isFeatureEnabled(
"memberLogs"
) &&
!isFeatureEnabled(
"moderationLogs"
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
member.guild,
AuditLogEvent.MemberKick,
member.id
);

if (entry) {

if (
!isFeatureEnabled(
"moderationLogs"
)
) {
return;
}

const embed =
baseEmbed(
"🥾 Mitglied gekickt",
0xfaa61a,
"Ein Mitglied wurde vom Server gekickt."
);

embed.addFields(
{
name:
"👤 Nutzer",

value:
`${member.user.tag} (${member.id})`
},
{
name:
"🛡️ Verantwortlicher Moderator",

value:
entry.executor
? `${entry.executor} (${entry.executor.id})`
: "Unbekannt"
},
{
name:
"📄 Grund",

value:
safeText(
entry.reason,
"Kein Grund angegeben"
)
}
);

await sendLog(
member.guild,
embed
);

return;
}

if (
!isFeatureEnabled(
"memberLogs"
)
) {
return;
}

const embed =
baseEmbed(
"🔴 Mitglied hat den Server verlassen",
0xed4245,
"Ein Mitglied hat den Server verlassen."
);

embed.addFields({
name:
"👤 Nutzer",

value:
`${member.user.tag} (${member.id})`
});

embed.setFooter({
text:
`Aktuelle Memberanzahl: ${member.guild.memberCount}`
});

await sendLog(
member.guild,
embed
);

} catch (error) {

console.error(
"❌ Leave/Kick Fehler:",
error
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

try {

if (
!isFeatureEnabled(
"moderationLogs"
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
ban.guild,
AuditLogEvent.MemberBanAdd,
ban.user.id
);

const embed =
baseEmbed(
"⛔ Mitglied gebannt",
0x992d22,
"Ein Mitglied wurde gebannt."
);

embed.addFields({
name:
"👤 Nutzer",

value:
`${ban.user.tag} (${ban.user.id})`
});

if (entry) {

embed.addFields(
{
name:
"🛡️ Verantwortlicher Moderator",

value:
entry.executor
? `${entry.executor} (${entry.executor.id})`
: "Unbekannt"
},
{
name:
"📄 Grund",

value:
safeText(
entry.reason,
"Kein Grund angegeben"
)
}
);

}

await sendLog(
ban.guild,
embed
);

} catch (error) {

console.error(
"❌ Ban Log Fehler:",
error
);

}

}
);

// ======================================================
// UNBAN
// ======================================================

client.on(
Events.GuildBanRemove,
async ban => {

try {

if (
!isFeatureEnabled(
"moderationLogs"
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
ban.guild,
AuditLogEvent.MemberBanRemove,
ban.user.id
);

const embed =
baseEmbed(
"✅ Mitglied entbannt",
0x57f287,
"Ein Mitglied wurde entbannt."
);

embed.addFields({
name:
"👤 Nutzer",

value:
`${ban.user.tag} (${ban.user.id})`
});

if (entry) {

embed.addFields({
name:
"🛡️ Verantwortlicher",

value:
entry.executor
? `${entry.executor} (${entry.executor.id})`
: "Unbekannt"
});

}

await sendLog(
ban.guild,
embed
);

} catch (error) {

console.error(
"❌ Unban Log Fehler:",
error
);

}

}
);

// ======================================================
// TEAM ROLLEN
// ======================================================

const pendingTeamRoleUpdates =
new Map();

function getTrackedTeamRoleIds(
member
) {

const roleIds =
new Set();

for (
const roleConfig
of TEAM_ROLE_CONFIG
) {

if (
member.roles.cache.has(
roleConfig.id
)
) {

roleIds.add(
roleConfig.id
);

}

}

return roleIds;

}

function setsEqual(
first,
second
) {

if (
first.size !==
second.size
) {
return false;
}

for (
const value
of first
) {

if (
!second.has(
value
)
) {
return false;
}

}

return true;

}

function getPrimaryTeamRole(
roleIds
) {

return (
TEAM_ROLE_CONFIG.find(
role =>
roleIds.has(
role.id
)
) ||
null
);

}

async function sendTeamRoleMessage(
guild,
memberId,
type,
roleConfig = null
) {

try {

const channel =
guild.channels.cache.get(
TEAM_ROLE_MESSAGE_CHANNEL_ID
) ||
await guild.channels
.fetch(
TEAM_ROLE_MESSAGE_CHANNEL_ID
)
.catch(
() => null
);

if (
!channel ||
!channel.isTextBased()
) {

console.log(
`⚠️ Team-Nachrichten-Channel nicht gefunden: ${TEAM_ROLE_MESSAGE_CHANNEL_ID}`
);

return;
}

let content =
"";

if (
type ===
"welcome" &&
roleConfig
) {

content =
`🎉 **Willkommen im Team!**

<@${memberId}> ist ab sofort <@&${roleConfig.id}> ${roleConfig.placeText}.

Wir freuen uns, dich im Team zu haben und wünschen dir viel Erfolg und vor allem viel Spaß bei deinen neuen Aufgaben! 🤝`;

}

else if (
type ===
"position" &&
roleConfig
) {

content =
`🔄 **Neue Position!**

<@${memberId}> übernimmt ab sofort die Position <@&${roleConfig.id}> ${roleConfig.placeText}.

Wir wünschen dir viel Erfolg und vor allem viel Spaß bei deinen neuen Aufgaben! 🤝`;

}

else if (
type ===
"leave"
) {

content =
`👋 **Danke für deine Zeit!**

<@${memberId}> verlässt ab sofort das Team des **VIBE Clans**.

Wir bedanken uns für die gemeinsame Zeit und wünschen dir für deinen weiteren Weg alles Gute und viel Erfolg! 🤝`;

}

if (!content) {
return;
}

await channel.send({
content,

allowedMentions: {
users: [
memberId
],

roles:
[]
}
});

} catch (error) {

console.error(
"❌ Team-Rollen-Nachricht Fehler:",
error
);

}

}

// ======================================================
// TEAM ROLLE ÄNDERUNG VERARBEITEN
// ======================================================

async function processTeamRoleUpdate(
key
) {

const update =
pendingTeamRoleUpdates.get(
key
);

if (!update) {
return;
}

pendingTeamRoleUpdates.delete(
key
);

const beforeRoleIds =
update.beforeRoleIds;

const afterRoleIds =
update.afterRoleIds;

if (
setsEqual(
beforeRoleIds,
afterRoleIds
)
) {
return;
}

const addedRoleIds =
new Set(
[
...afterRoleIds
].filter(
id =>
!beforeRoleIds.has(
id
)
)
);

if (
beforeRoleIds.size ===
0 &&
afterRoleIds.size > 0
) {

const roleConfig =
getPrimaryTeamRole(
addedRoleIds.size > 0
? addedRoleIds
: afterRoleIds
);

if (roleConfig) {

await sendTeamRoleMessage(
update.guild,
update.memberId,
"welcome",
roleConfig
);

}

return;
}

if (
beforeRoleIds.size > 0 &&
afterRoleIds.size === 0
) {

await sendTeamRoleMessage(
update.guild,
update.memberId,
"leave"
);

return;
}

if (
addedRoleIds.size > 0
) {

const roleConfig =
getPrimaryTeamRole(
addedRoleIds
);

if (roleConfig) {

await sendTeamRoleMessage(
update.guild,
update.memberId,
"position",
roleConfig
);

}

}

}

// ======================================================
// TEAM ROLLEN EVENT
// ======================================================

client.on(
Events.GuildMemberUpdate,
(
before,
after
) => {

const beforeRoleIds =
getTrackedTeamRoleIds(
before
);

const afterRoleIds =
getTrackedTeamRoleIds(
after
);

if (
setsEqual(
beforeRoleIds,
afterRoleIds
)
) {
return;
}

const key =
`${after.guild.id}:${after.id}`;

const existing =
pendingTeamRoleUpdates.get(
key
);

if (existing) {

clearTimeout(
existing.timer
);

existing.afterRoleIds =
afterRoleIds;

existing.guild =
after.guild;

existing.memberId =
after.id;

existing.timer =
setTimeout(
() => {

processTeamRoleUpdate(
key
);

},
1500
);

return;
}

const update = {

guild:
after.guild,

memberId:
after.id,

beforeRoleIds,

afterRoleIds,

timer:
null

};

update.timer =
setTimeout(
() => {

processTeamRoleUpdate(
key
);

},
1500
);

pendingTeamRoleUpdates.set(
key,
update
);

}
);

// ======================================================
// NICKNAME + ROLLEN LOGGING
// ======================================================

client.on(
Events.GuildMemberUpdate,
async (
before,
after
) => {

try {

if (
!isFeatureEnabled(
"memberLogs"
)
) {
return;
}

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
0x5865f2,
"Der Nickname eines Mitglieds wurde geändert."
);

embed.addFields(
{
name:
"👤 Nutzer",

value:
`${after} (${after.id})`
},
{
name:
"📝 Vorher",

value:
safeText(
before.nickname,
before.user.username
)
},
{
name:
"📝 Nachher",

value:
safeText(
after.nickname,
after.user.username
)
}
);

if (entry) {

embed.addFields({
name:
"🛡️ Verantwortlicher",

value:
entry.executor
? `${entry.executor} (${entry.executor.id})`
: "Unbekannt"
});

}

await sendLog(
after.guild,
embed
);

}

const beforeRoles =
new Set(
before.roles.cache.map(
role =>
role.id
)
);

const afterRoles =
new Set(
after.roles.cache.map(
role =>
role.id
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
0x5865f2,
"Die Rollen eines Mitglieds wurden geändert."
);

embed.addFields({
name:
"👤 Nutzer",

value:
`${after} (${after.id})`
});

if (
addedRoles.size > 0
) {

embed.addFields({
name:
"✅ Hinzugefügt",

value:
addedRoles
.map(
role =>
role.toString()
)
.join("\n")
.substring(
0,
1024
)
});

}

if (
removedRoles.size > 0
) {

embed.addFields({
name:
"❌ Entfernt",

value:
removedRoles
.map(
role =>
role.toString()
)
.join("\n")
.substring(
0,
1024
)
});

}

if (entry) {

embed.addFields({
name:
"🛡️ Verantwortlicher",

value:
entry.executor
? `${entry.executor} (${entry.executor.id})`
: "Unbekannt"
});

}

await sendLog(
after.guild,
embed
);

} catch (error) {

console.error(
"❌ Member Update Fehler:",
error
);

}

}
);

// ======================================================
// VOICE LOGGING
// ======================================================

client.on(
Events.VoiceStateUpdate,
async (
before,
after
) => {

try {

if (
!isFeatureEnabled(
"voiceLogs"
)
) {
return;
}

const member =
after.member ||
before.member;

if (!member) {
return;
}

if (
!before.channel &&
after.channel
) {

const embed =
baseEmbed(
"🔊 Sprachkanal beigetreten",
0x1abc9c,
"Ein Mitglied ist einem Sprachkanal beigetreten."
);

embed.addFields(
{
name:
"👤 Nutzer",

value:
`${member} (${member.id})`
},
{
name:
"🔊 Kanal",

value:
after.channel.toString()
}
);

await sendLog(
member.guild,
embed
);

}

else if (
before.channel &&
!after.channel
) {

const embed =
baseEmbed(
"🔇 Sprachkanal verlassen",
0x2f3136,
"Ein Mitglied hat einen Sprachkanal verlassen."
);

embed.addFields(
{
name:
"👤 Nutzer",

value:
`${member} (${member.id})`
},
{
name:
"🔊 Kanal",

value:
before.channel.toString()
}
);

await sendLog(
member.guild,
embed
);

}

else if (
before.channel &&
after.channel &&
before.channel.id !==
after.channel.id
) {

const embed =
baseEmbed(
"🔁 Sprachkanal gewechselt",
0x1abc9c,
"Ein Mitglied hat den Sprachkanal gewechselt."
);

embed.addFields(
{
name:
"👤 Nutzer",

value:
`${member} (${member.id})`
},
{
name:
"⬅️ Von",

value:
before.channel.toString()
},
{
name:
"➡️ Zu",

value:
after.channel.toString()
}
);

await sendLog(
member.guild,
embed
);

}

if (
before.serverMute !==
after.serverMute
) {

const embed =
baseEmbed(
after.serverMute
? "🔇 Server-Stummschaltung aktiviert"
: "🔊 Server-Stummschaltung aufgehoben",

after.serverMute
? 0xed4245
: 0x57f287,

"Der Server-Mute-Status wurde geändert."
);

embed.addFields({
name:
"👤 Nutzer",

value:
`${member} (${member.id})`
});

await sendLog(
member.guild,
embed
);

}

if (
before.serverDeaf !==
after.serverDeaf
) {

const embed =
baseEmbed(
after.serverDeaf
? "🔕 Server-Taubschaltung aktiviert"
: "🔔 Server-Taubschaltung aufgehoben",

after.serverDeaf
? 0xed4245
: 0x57f287,

"Der Server-Deaf-Status wurde geändert."
);

embed.addFields({
name:
"👤 Nutzer",

value:
`${member} (${member.id})`
});

await sendLog(
member.guild,
embed
);

}

} catch (error) {

console.error(
"❌ Voice Logging Fehler:",
error
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

try {

if (
!isFeatureEnabled(
"channelLogs"
)
) {
return;
}

if (!channel.guild) {
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
channel.guild,
AuditLogEvent.ChannelCreate,
channel.id
);

const embed =
baseEmbed(
"🏠 Kanal erstellt",
0x57f287,
"Ein neuer Kanal wurde erstellt."
);

embed.addFields(
{
name:
"📁 Kanal",

value:
channel.toString()
},
{
name:
"🆔 ID",

value:
channel.id
}
);

if (entry) {

embed.addFields({
name:
"🛡️ Verantwortlicher",

value:
entry.executor
? `${entry.executor} (${entry.executor.id})`
: "Unbekannt"
});

}

await sendLog(
channel.guild,
embed
);

} catch (error) {

console.error(
"❌ Channel Create Fehler:",
error
);

}

}
);

// ======================================================
// CHANNEL DELETE
// ======================================================

client.on(
Events.ChannelDelete,
async channel => {

try {

if (
!isFeatureEnabled(
"channelLogs"
)
) {
return;
}

if (!channel.guild) {
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
channel.guild,
AuditLogEvent.ChannelDelete,
channel.id
);

const embed =
baseEmbed(
"🗑️ Kanal gelöscht",
0xed4245,
"Ein Kanal wurde gelöscht."
);

embed.addFields(
{
name:
"📁 Kanal",

value:
`#${safeText(
channel.name,
"Unbekannt"
)}`
},
{
name:
"🆔 ID",

value:
channel.id
}
);

if (entry) {

embed.addFields({
name:
"🛡️ Verantwortlicher",

value:
entry.executor
? `${entry.executor} (${entry.executor.id})`
: "Unbekannt"
});

}

await sendLog(
channel.guild,
embed
);

} catch (error) {

console.error(
"❌ Channel Delete Fehler:",
error
);

}

}
);

// ======================================================
// ROLLEN-EINSTELLUNGEN / BERECHTIGUNGEN LOGGING
// ======================================================

client.on(
Events.GuildRoleUpdate,
async (
before,
after
) => {

try {

if (
!isFeatureEnabled(
"roleLogs"
)
) {
return;
}

if (!after.guild) {
return;
}

const permissionChanges =
getPermissionChanges(
before,
after
);

const otherChanges = [];

if (before.name !== after.name) {
otherChanges.push(
`**Name:** ${before.name} → ${after.name}`
);
}

if (before.hexColor !== after.hexColor) {
otherChanges.push(
`**Farbe:** ${before.hexColor} → ${after.hexColor}`
);
}

if (before.hoist !== after.hoist) {
otherChanges.push(
`**Separat anzeigen:** ${before.hoist ? "Ja" : "Nein"} → ${after.hoist ? "Ja" : "Nein"}`
);
}

if (before.mentionable !== after.mentionable) {
otherChanges.push(
`**Erwähnbar:** ${before.mentionable ? "Ja" : "Nein"} → ${after.mentionable ? "Ja" : "Nein"}`
);
}

if (
permissionChanges.added.length === 0 &&
permissionChanges.removed.length === 0 &&
otherChanges.length === 0
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
AuditLogEvent.RoleUpdate,
after.id
);

const embed =
baseEmbed(
"🛡️ Rolle geändert",
0x5865f2,
"Die Einstellungen oder Berechtigungen einer Rolle wurden geändert."
);

embed.addFields({
name:
"🎭 Rolle",

value:
`${after}\n**Name:** ${after.name}\n**ID:** \`${after.id}\``
});

if (
permissionChanges.added.length > 0
) {

embed.addFields({
name:
"✅ Berechtigungen hinzugefügt",

value:
permissionChanges.added
.map(
permission =>
`• ${permission}`
)
.join("\n")
.substring(
0,
1024
)
});

}

if (
permissionChanges.removed.length > 0
) {

embed.addFields({
name:
"❌ Berechtigungen entfernt",

value:
permissionChanges.removed
.map(
permission =>
`• ${permission}`
)
.join("\n")
.substring(
0,
1024
)
});

}

if (
otherChanges.length > 0
) {

embed.addFields({
name:
"⚙️ Weitere Änderungen",

value:
otherChanges
.join("\n")
.substring(
0,
1024
)
});

}

embed.addFields({
name:
"👮 Geändert von",

value:
entry && entry.executor
? `${entry.executor} (${entry.executor.id})`
: "Unbekannt / Audit-Log nicht verfügbar"
});

await sendLog(
after.guild,
embed
);

} catch (error) {

console.error(
"❌ Rollen-Einstellungs-Log Fehler:",
error
);

}

}
);

// ======================================================
// CHANNEL UPDATE
// ======================================================

client.on(
Events.ChannelUpdate,
async (
before,
after
) => {

try {

if (
!isFeatureEnabled(
"channelLogs"
)
) {
return;
}

if (!after.guild) {
return;
}

if (
before.name !==
after.name
) {

const embed =
baseEmbed(
"✏️ Kanalname geändert",
0x5865f2,
"Ein Kanal wurde umbenannt."
);

embed.addFields(
{
name:
"📁 Kanal",

value:
after.toString()
},
{
name:
"📝 Vorher",

value:
safeText(
before.name
)
},
{
name:
"📝 Nachher",

value:
safeText(
after.name
)
}
);

await sendLog(
after.guild,
embed
);

}

if (
before.permissionOverwrites &&
after.permissionOverwrites &&
!before.permissionOverwrites.cache.equals(
after.permissionOverwrites.cache
)
) {

const embed =
baseEmbed(
"🔐 Kanal-Berechtigungen aktualisiert",
0x5865f2,
"Die Berechtigungen eines Kanals wurden geändert."
);

embed.addFields({
name:
"📁 Kanal",

value:
after.toString()
});

await sendLog(
after.guild,
embed
);

}

} catch (error) {

console.error(
"❌ Channel Update Fehler:",
error
);

}

}
);

// ======================================================
// MESSAGE DELETE LOG
// ======================================================

client.on(
Events.MessageDelete,
async message => {

try {

if (
!isFeatureEnabled(
"messageLogs"
)
) {
return;
}

if (!message.guild) {
return;
}

if (
message.author &&
client.user &&
message.author.id ===
client.user.id
) {
return;
}

const content =
message.content
? message.content.substring(
0,
1000
)
: "*(Kein Textinhalt / Embed / Anhang)*";

const embed =
baseEmbed(
"🗑️ Nachricht gelöscht",
0xed4245,
"Eine Nachricht wurde gelöscht."
);

embed.addFields(
{
name:
"👤 Autor",

value:
message.author
? `${message.author} (${message.author.id})`
: "Unbekannt"
},
{
name:
"📍 Kanal",

value:
message.channel
? message.channel.toString()
: "Unbekannt"
},
{
name:
"💬 Inhalt",

value:
safeText(
content,
"*(Kein Inhalt)*"
).substring(
0,
1024
)
}
);

await sendLog(
message.guild,
embed
);

} catch (error) {

console.error(
"❌ Message Delete Logging Fehler:",
error
);

}

}
);

// ======================================================
// MESSAGE EDIT LOG
// ======================================================

client.on(
Events.MessageUpdate,
async (
before,
after
) => {

try {

if (
!isFeatureEnabled(
"messageLogs"
)
) {
return;
}

if (!before.guild) {
return;
}

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
0xfee75c,
"Eine Nachricht wurde bearbeitet."
);

embed.addFields(
{
name:
"👤 Autor",

value:
before.author
? `${before.author} (${before.author.id})`
: "Unbekannt"
},
{
name:
"📍 Kanal",

value:
before.channel
? before.channel.toString()
: "Unbekannt"
},
{
name:
"📝 Vorher",

value:
safeText(
before.content,
"*(leer)*"
).substring(
0,
1024
)
},
{
name:
"📝 Nachher",

value:
safeText(
after.content,
"*(leer)*"
).substring(
0,
1024
)
}
);

if (after.url) {

embed.addFields({
name:
"🔗 Nachricht",

value:
`[Zur Nachricht](${after.url})`
});

}

await sendLog(
before.guild,
embed
);

} catch (error) {

console.error(
"❌ Message Edit Logging Fehler:",
error
);

}

}
);

// ======================================================
// DISCORD CLIENT ERROR
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

// ======================================================
// DISCORD WARN
// ======================================================

client.on(
Events.Warn,
warning => {

console.warn(
"⚠️ Discord Warnung:",
warning
);

}
);

// ======================================================
// UNHANDLED PROMISE REJECTION
// ======================================================

process.on(
"unhandledRejection",
error => {

console.error(
"❌ Unhandled Promise Rejection:",
error
);

}
);

// ======================================================
// UNCAUGHT EXCEPTION
// ======================================================

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
// START MELDUNG
// ======================================================

console.log(
"✅ VIBE Bot Systeme geladen."
);

console.log(
"✅ Team-Rollen-Nachrichten System geladen."
);
