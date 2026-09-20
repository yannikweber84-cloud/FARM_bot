require("dotenv").config();

const fs = require("fs");
const path = require("path");
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
    AuditLogEvent,
    ContainerBuilder,
    TextDisplayBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize
} = require("discord.js");

const app = express();

const PORT =
    process.env.PORT ||
    3000;

function isFeatureEnabled() {
    return true;
}

app.get("/", (req, res) => {
    res
        .status(200)
        .send("VIBE Bot is online.");
});

app.get("/health", (req, res) => {
    res
        .status(200)
        .json({
            status: "online",
            service: "VIBE Bot"
        });
});

app.listen(PORT, () => {
    console.log(
        `🌐 Health web server is running on port ${PORT}`
    );
});

const TOKEN =
    process.env.TOKEN;

const CLIENT_ID =
    "1551279743112974446";

const GUILD_ID =
    "1551264272682586257";

const BIRTHDAY_GLOBAL_CHANNEL_ID =
    process.env.BIRTHDAY_GLOBAL_CHANNEL_ID ||
    "1551264273756332158";

const BIRTHDAY_DATA_FILE =
    path.join(
        __dirname,
        "birthdays.json"
    );

const WELCOME_CHANNEL_ID =
    "1551292846961860798";

const AUTO_ROLE_ID =
    "1551264273110663183";

const STAFF_ROLE_ID =
    "1551270763687055360";


// ==========================================
// ABSENCE ROLE
// ENTER YOUR ROLE ID HERE
// ==========================================

const ABSENCE_ROLE_ID =
    process.env.ABSENCE_ROLE_ID ||
    "1551282500423258134";

const ABSENCE_DATA_FILE =
    path.join(
        __dirname,
        "absences.json"
    );


const SUPPORT_ROLE_ID =
    STAFF_ROLE_ID;

const SUPPORT_WAITING_ROOM_ID =
    "1551281020186267731";

const SUPPORT_LOG_CHANNEL_ID =
    "1551281150578917407";

const TICKET_TRANSCRIPT_CHANNEL_ID =
    "1551281233667817523";

const TICKET_BANNER_NAME =
    "VIBE_banner67.png";

const TICKET_BANNER_FILE =
    path.join(
        __dirname,
        TICKET_BANNER_NAME
    );

const GLOBAL_LOG_CHANNEL_ID =
    "1551264273949265960";

const VOICE_LOG_CHANNEL_ID =
    "1551264273949265961";

const JOIN_LEAVE_LOG_CHANNEL_ID =
    "1551264274171826357";



const LEADER_ROLE_ID =
    "1551264273119055896";

const CO_LEADER_ROLE_ID =
    "1551281520273129613";

const GIVEAWAY_BLOCK_DATA_FILE =
    path.join(__dirname, "giveaway-blocks.json");



const TICKET_CATEGORY_ID =
    "1551270720783384756";

const GIVEAWAY_CATEGORY_ID =
    "1551270720783384756";


const ticketData =
    new Map();

const giveawayData =
    new Map();

const giveawayTimers =
    new Map();


let giveawayBlockStore = { blockedUsers: [] };

function loadGiveawayBlockStore() {
    try {
        if (!fs.existsSync(GIVEAWAY_BLOCK_DATA_FILE)) {
            saveGiveawayBlockStore();
            return;
        }
        const raw = fs.readFileSync(GIVEAWAY_BLOCK_DATA_FILE, "utf8");
        if (!raw.trim()) return;
        const parsed = JSON.parse(raw);
        giveawayBlockStore.blockedUsers = Array.isArray(parsed.blockedUsers)
            ? [...new Set(parsed.blockedUsers.map(String))]
            : [];
    } catch (error) {
        console.error("❌ Giveaway block list could not be loaded:", error);
    }
}

function saveGiveawayBlockStore() {
    try {
        fs.writeFileSync(
            GIVEAWAY_BLOCK_DATA_FILE,
            JSON.stringify(giveawayBlockStore, null, 2),
            "utf8"
        );
    } catch (error) {
        console.error("❌ Giveaway block list could not be saved:", error);
    }
}

function canManageGiveawayBlocks(member) {
    return Boolean(
        member?.roles?.cache?.has(LEADER_ROLE_ID) ||
        member?.roles?.cache?.has(CO_LEADER_ROLE_ID)
    );
}

function isGiveawayRoleExcluded(member) {
    return Boolean(
        member?.roles?.cache?.has(LEADER_ROLE_ID) ||
        member?.roles?.cache?.has(CO_LEADER_ROLE_ID)
    );
}

function isGiveawayBlocked(userId) {
    return giveawayBlockStore.blockedUsers.includes(String(userId));
}




let birthdayStore = {
    birthdays: {},
    listChannelId: null,
    listMessageId: null,
    lastAnnouncementDate: null,
    announced: {}
};


let absenceStore = {
    entries: {}
};


// ==========================================
// LOAD ABSENCE DATA
// ==========================================

function loadAbsenceStore() {
    try {

        if (
            !fs.existsSync(
                ABSENCE_DATA_FILE
            )
        ) {

            saveAbsenceStore();

            return;
        }


        const raw =
            fs.readFileSync(
                ABSENCE_DATA_FILE,
                "utf8"
            );


        if (
            !raw.trim()
        ) {
            return;
        }


        const parsed =
            JSON.parse(
                raw
            );


        absenceStore = {
            entries:
                parsed.entries &&
                typeof parsed.entries ===
                    "object"
                    ? parsed.entries
                    : {}
        };


    } catch (error) {

        console.error(
            "❌ Absence data could not be loaded:",
            error
        );

    }
}


// ==========================================
// SAVE ABSENCE DATA
// ==========================================

function saveAbsenceStore() {
    try {

        fs.writeFileSync(
            ABSENCE_DATA_FILE,

            JSON.stringify(
                absenceStore,
                null,
                2
            ),

            "utf8"
        );


    } catch (error) {

        console.error(
            "❌ Absence data could not be saved:",
            error
        );

    }
}


// ==========================================
// LOAD BIRTHDAYS
// ==========================================

function loadBirthdayStore() {
    try {

        if (
            !fs.existsSync(
                BIRTHDAY_DATA_FILE
            )
        ) {

            saveBirthdayStore();

            return;
        }


        const raw =
            fs.readFileSync(
                BIRTHDAY_DATA_FILE,
                "utf8"
            );


        if (
            !raw.trim()
        ) {
            return;
        }


        const parsed =
            JSON.parse(
                raw
            );


        birthdayStore = {

            birthdays:
                parsed.birthdays &&
                typeof parsed.birthdays ===
                    "object"
                    ? parsed.birthdays
                    : {},


            listChannelId:
                parsed.listChannelId ||
                null,


            listMessageId:
                parsed.listMessageId ||
                null,


            lastAnnouncementDate:
                parsed.lastAnnouncementDate ||
                null,


            announced:
                parsed.announced &&
                typeof parsed.announced ===
                    "object"
                    ? parsed.announced
                    : {}

        };


    } catch (error) {

        console.error(
            "❌ Birthday data could not be loaded:",
            error
        );

    }
}


// ==========================================
// SAVE BIRTHDAYS
// ==========================================

function saveBirthdayStore() {
    try {

        fs.writeFileSync(
            BIRTHDAY_DATA_FILE,

            JSON.stringify(
                birthdayStore,
                null,
                2
            ),

            "utf8"
        );


    } catch (error) {

        console.error(
            "❌ Birthday data could not be saved:",
            error
        );

    }
}


// ==========================================
// BIRTHDAY DATUM
// ==========================================

function parseBirthdayInput(input) {

    const text =
        String(
            input ||
            ""
        )
            .trim()
            .replace(
                /\s+/g,
                ""
            );


    const match =
        text.match(
            /^(\d{1,2})[.\/-](\d{1,2})(?:[.\/-](\d{4}))?$/
        );


    if (
        !match
    ) {
        return null;
    }


    const day =
        Number(
            match[1]
        );


    const month =
        Number(
            match[2]
        );


    const year =
        match[3]
            ? Number(
                match[3]
            )
            : null;


    if (
        month < 1 ||
        month > 12 ||
        day < 1
    ) {
        return null;
    }


    const validationYear =
        year ||
        2000;


    const testDate =
        new Date(
            Date.UTC(
                validationYear,
                month - 1,
                day
            )
        );


    if (
        testDate.getUTCDate() !==
            day ||

        testDate.getUTCMonth() + 1 !==
            month
    ) {
        return null;
    }


    if (
        year &&
        (
            year < 1900 ||
            year > 2100
        )
    ) {
        return null;
    }


    return {
        day,
        month,
        year
    };
}


// ==========================================
// ABSENCE DATUM
// ==========================================

function parseAbsenceDate(input) {

    const text =
        String(
            input ||
            ""
        )
            .trim();


    const match =
        text.match(
            /^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/
        );


    if (
        !match
    ) {
        return null;
    }


    const day =
        Number(
            match[1]
        );


    const month =
        Number(
            match[2]
        );


    const year =
        Number(
            match[3]
        );


    const date =
        new Date(
            Date.UTC(
                year,
                month - 1,
                day
            )
        );


    if (
        year < 2020 ||
        year > 2100 ||

        date.getUTCFullYear() !==
            year ||

        date.getUTCMonth() + 1 !==
            month ||

        date.getUTCDate() !==
            day
    ) {

        return null;
    }


    return {
        day,
        month,
        year,

        timestamp:
            date.getTime()
    };
}


function formatAbsenceDate(data) {

    return `${String(data.day).padStart(2, "0")}.${String(data.month).padStart(2, "0")}.${data.year}`;

}


// ==========================================
// BERLIN TIME
// ==========================================

function getBerlinTimestamp(
    data,
    hour,
    minute,
    second
) {

    const timeZone =
        "Europe/Berlin";


    let guess =
        Date.UTC(
            data.year,
            data.month - 1,
            data.day,
            hour,
            minute,
            second
        );


    for (
        let i = 0;
        i < 2;
        i++
    ) {

        const parts =
            new Intl.DateTimeFormat(
                "en-GB",
                {
                    timeZone,

                    year:
                        "numeric",

                    month:
                        "2-digit",

                    day:
                        "2-digit",

                    hour:
                        "2-digit",

                    minute:
                        "2-digit",

                    second:
                        "2-digit",

                    hourCycle:
                        "h23"
                }
            )
                .formatToParts(
                    new Date(
                        guess
                    )
                );


        const values = {};


        for (
            const part
            of parts
        ) {

            if (
                part.type ===
                    "year" ||

                part.type ===
                    "month" ||

                part.type ===
                    "day" ||

                part.type ===
                    "hour" ||

                part.type ===
                    "minute" ||

                part.type ===
                    "second"
            ) {

                values[
                    part.type
                ] =
                    Number(
                        part.value
                    );

            }

        }


        const shownAsUtc =
            Date.UTC(
                values.year,
                values.month - 1,
                values.day,
                values.hour,
                values.minute,
                values.second
            );


        const offset =
            shownAsUtc -
            guess;


        guess =
            Date.UTC(
                data.year,
                data.month - 1,
                data.day,
                hour,
                minute,
                second
            ) -
            offset;

    }


    return guess;
}


// ==========================================
// RESTZEIT ABSENCE
// ==========================================

function getRemainingAbsenceHours(
    endAt
) {

    return Math.max(
        0,

        Math.ceil(
            (
                endAt -
                Date.now()
            ) /
            (
                60 *
                60 *
                1000
            )
        )
    );

}


// ==========================================
// ABSENCES EMBED
// ==========================================

function createAbsenceEmbed(
    data,
    ended = false
) {

    const hasKnownEnd = Number.isFinite(data.endAt);
    const endUnix = hasKnownEnd ? Math.floor(data.endAt / 1000) : null;

    const remainingHours =
        ended || !hasKnownEnd
            ? null
            : getRemainingAbsenceHours(data.endAt);

    const restzeit =
        ended
            ? "✅ **Absence Ended**"
            : hasKnownEnd
                ? `**${remainingHours} hour${remainingHours === 1 ? "" : "n"}**\n<t:${endUnix}:R>`
                : "**Unknown**";


    const embed =
        new EmbedBuilder()

            .setColor(
                ended
                    ? "#57F287"
                    : "#FEE75C"
            )

            .setTitle(
                "📅 Staff Absence"
            )

            .setDescription(
                ended
                    ? `<@${data.userId}> is available again.`
                    : `<@${data.userId}> is currently absent from the **VIBE Clan**.`
            )

            .addFields(
                {
                    name:
                        "👤 Staff Member",

                    value:
                        `<@${data.userId}>`,

                    inline:
                        false
                },

                {
                    name:
                        "📆 From",

                    value:
                        `**${data.startText}**`,

                    inline:
                        true
                },

                {
                    name:
                        "📆 Until",

                    value:
                        `**${data.endText}**`,

                    inline:
                        true
                },

                {
                    name:
                        "⏳ Restzeit",

                    value:
                        restzeit,

                    inline:
                        true
                },

                {
                    name:
                        "🕒 End",

                    value:
                        hasKnownEnd ? `<t:${endUnix}:F>` : "**Unknown**",

                    inline:
                        false
                },

                {
                    name:
                        "📝 Reason",

                    value:
                        safeText(
                            data.reason,
                            "No reason provided"
                        )
                            .substring(
                                0,
                                1024
                            ),

                    inline:
                        false
                },

                {
                    name:
                        "📌 Status",

                    value:
                        ended
                            ? "🟢 **Available Again**"
                            : "🔴 **Absent**",

                    inline:
                        false
                }
            )

            .setFooter({
                text:
                    ended
                        ? "VIBE Clan • Absence ended automatically"
                        : "VIBE Clan • Staff Absence"
            })

            .setTimestamp();


    if (
        data.avatarUrl
    ) {

        embed.setThumbnail(
            data.avatarUrl
        );

    }


    return embed;
}


// ==========================================
// UPDATE ABSENCE MESSAGE
// ==========================================

async function updateAbsenceMessage(
    entry,
    ended = false
) {

    try {

        const guild =
            client.guilds.cache.get(
                entry.guildId
            ) ||

            await client.guilds.fetch(
                entry.guildId
            )
                .catch(
                    () => null
                );


        if (
            !guild
        ) {
            return false;
        }


        const channel =
            guild.channels.cache.get(
                entry.channelId
            ) ||

            await guild.channels.fetch(
                entry.channelId
            )
                .catch(
                    () => null
                );


        if (
            !channel ||
            !channel.isTextBased()
        ) {
            return false;
        }


        const message =
            await channel.messages.fetch(
                entry.messageId
            )
                .catch(
                    () => null
                );


        if (
            !message
        ) {
            return false;
        }


        await message.edit({
            embeds: [
                createAbsenceEmbed(
                    entry,
                    ended
                )
            ]
        });


        return true;


    } catch (error) {

        console.error(
            "❌ Absence message update error:",
            error
        );


        return false;
    }
}


// ==========================================
// CHECK ABSENCES AUTOMATICALLY
// ==========================================

async function checkAbsenceen() {

    try {

        const entries =
            Object.values(
                absenceStore.entries
            );


        if (
            entries.length ===
            0
        ) {
            return;
        }


        let changed =
            false;


        for (
            const entry
            of entries
        ) {

            // Absences without a known end date remain active until changed manually.
            if (!Number.isFinite(entry.endAt)) {
                continue;
            }

            const remainingHours =
                getRemainingAbsenceHours(
                    entry.endAt
                );


            // Noch aktiv
            if (
                Date.now() <
                entry.endAt
            ) {

                // Only edit the message,
                // when one fewer hour remains.

                if (
                    entry.lastRemainingHours !==
                    remainingHours
                ) {

                    entry.lastRemainingHours =
                        remainingHours;


                    await updateAbsenceMessage(
                        entry,
                        false
                    );


                    changed =
                        true;
                }


                continue;
            }


            // ==========================================
            // ABGELAUFEN
            // ==========================================

            const guild =
                client.guilds.cache.get(
                    entry.guildId
                ) ||

                await client.guilds.fetch(
                    entry.guildId
                )
                    .catch(
                        () => null
                    );


            let roleRemoved =
                true;


            if (
                guild
            ) {

                const member =
                    await guild.members.fetch(
                        entry.userId
                    )
                        .catch(
                            () => null
                        );


                if (
                    member &&
                    member.roles.cache.has(
                        ABSENCE_ROLE_ID
                    )
                ) {

                    try {

                        await member.roles.remove(
                            ABSENCE_ROLE_ID,
                            "Absence ended automatically"
                        );


                        console.log(
                            `✅ Absence role removed from ${entry.userId}.`
                        );


                    } catch (error) {

                        roleRemoved =
                            false;


                        console.error(
                            `❌ Absence role could not be removed from ${entry.userId} could not be removed:`,
                            error
                        );

                    }

                }

            }


            if (
                !roleRemoved
            ) {
                continue;
            }


            await updateAbsenceMessage(
                entry,
                true
            );


            delete absenceStore.entries[
                entry.userId
            ];


            changed =
                true;
        }


        if (
            changed
        ) {

            saveAbsenceStore();

        }


    } catch (error) {

        console.error(
            "❌ Absence check error:",
            error
        );

    }
}


// ==========================================
// BIRTHDAYS DATUM FORMATIEREN
// ==========================================

function formatBirthdayDate(data) {

    const day =
        String(
            data.day
        )
            .padStart(
                2,
                "0"
            );


    const month =
        String(
            data.month
        )
            .padStart(
                2,
                "0"
            );


    return data.year
        ? `${day}.${month}.${data.year}`
        : `${day}.${month}.`;
}


function getBerlinDateParts() {

    const formatter =
        new Intl.DateTimeFormat(
            "en-GB",
            {
                timeZone:
                    "Europe/Berlin",

                day:
                    "2-digit",

                month:
                    "2-digit",

                year:
                    "numeric"
            }
        );


    const parts =
        formatter.formatToParts(
            new Date()
        );


    const result = {};


    for (
        const part
        of parts
    ) {

        if (
            part.type ===
                "day" ||

            part.type ===
                "month" ||

            part.type ===
                "year"
        ) {

            result[
                part.type
            ] =
                Number(
                    part.value
                );

        }

    }


    return {

        day:
            result.day,

        month:
            result.month,

        year:
            result.year,

        key:
            `${result.year}-${String(result.month).padStart(2, "0")}-${String(result.day).padStart(2, "0")}`

    };
}


function birthdaySortValue(
    data,
    now
) {

    let year =
        now.year;


    let date =
        Date.UTC(
            year,
            data.month - 1,
            data.day
        );


    const today =
        Date.UTC(
            now.year,
            now.month - 1,
            now.day
        );


    if (
        date <
        today
    ) {

        year +=
            1;


        date =
            Date.UTC(
                year,
                data.month - 1,
                data.day
            );

    }


    return date;
}


// ==========================================
// BIRTHDAY LIST EMBED
// ==========================================

function createBirthdayListEmbed() {

    const entries =
        Object.entries(
            birthdayStore.birthdays
        );


    const now =
        getBerlinDateParts();


    entries.sort(
        (a, b) =>

            birthdaySortValue(
                a[1],
                now
            ) -

            birthdaySortValue(
                b[1],
                now
            )
    );


    let description;


    if (
        entries.length ===
        0
    ) {

        description =
            "No one has entered a birthday yet.";

    } else {

        description =
            entries
                .map(
                    ([userId, data], index) =>
                        `**${index + 1}.** <@${userId}> — **${formatBirthdayDate(data)}**`
                )
                .join(
                    "\n"
                );


        if (
            description.length >
            4000
        ) {

            description =
                description.substring(
                    0,
                    3970
                ) +
                "\n\n*List truncated.*";

        }

    }


    return new EmbedBuilder()

        .setColor(
            "#FEE75C"
        )

        .setTitle(
            "🎂 Birthday List"
        )

        .setDescription(
            description
        )

        .setFooter({
            text:
                `${entries.length} birthday${entries.length === 1 ? "" : "s"} entered • updates automatically`
        })

        .setTimestamp();
}


// ==========================================
// UPDATE BIRTHDAY LIST
// ==========================================

async function updateBirthdayListMessage(
    guild
) {

    if (
        !guild ||
        !birthdayStore.listChannelId ||
        !birthdayStore.listMessageId
    ) {
        return false;
    }


    try {

        const channel =
            guild.channels.cache.get(
                birthdayStore.listChannelId
            ) ||

            await guild.channels.fetch(
                birthdayStore.listChannelId
            )
                .catch(
                    () => null
                );


        if (
            !channel ||
            !channel.isTextBased()
        ) {
            return false;
        }


        const message =
            await channel.messages.fetch(
                birthdayStore.listMessageId
            )
                .catch(
                    () => null
                );


        if (
            !message
        ) {
            return false;
        }


        await message.edit({
            embeds: [
                createBirthdayListEmbed()
            ]
        });


        return true;


    } catch (error) {

        console.error(
            "❌ Birthday list update error:",
            error
        );


        return false;
    }
}


// ==========================================
// CHECK BIRTHDAYS
// ==========================================

async function checkBirthdays() {

    try {

        const guild =
            client.guilds.cache.get(
                GUILD_ID
            );


        if (
            !guild
        ) {
            return;
        }


        const today =
            getBerlinDateParts();


        const birthdayUserIds =
            Object.entries(
                birthdayStore.birthdays
            )

                .filter(
                    ([, data]) =>
                        data.day ===
                            today.day &&

                        data.month ===
                            today.month
                )

                .map(
                    ([userId]) =>
                        userId
                );


        if (
            birthdayUserIds.length ===
            0
        ) {
            return;
        }


        let globalChannel =
            null;


        if (
            /^\d{17,20}$/.test(
                BIRTHDAY_GLOBAL_CHANNEL_ID
            )
        ) {

            globalChannel =
                guild.channels.cache.get(
                    BIRTHDAY_GLOBAL_CHANNEL_ID
                ) ||

                await guild.channels.fetch(
                    BIRTHDAY_GLOBAL_CHANNEL_ID
                )
                    .catch(
                        () => null
                    );

        }


        if (
            !globalChannel ||
            !globalChannel.isTextBased()
        ) {

            const preferredNames = [
                "global",
                "global-chat",
                "globalchat",
                "allgemein",
                "chat"
            ];


            for (
                const channelName
                of preferredNames
            ) {

                const found =
                    guild.channels.cache.find(
                        channel =>
                            channel.isTextBased() &&

                            channel.name.toLowerCase() ===
                                channelName
                    );


                if (
                    found
                ) {

                    globalChannel =
                        found;

                    break;
                }

            }

        }


        if (
            !globalChannel ||
            !globalChannel.isTextBased()
        ) {

            console.log(
                `⚠️ Birthday global channel not found: ${BIRTHDAY_GLOBAL_CHANNEL_ID}`
            );


            return;
        }


        let changed =
            false;


        for (
            const userId
            of birthdayUserIds
        ) {

            if (
                birthdayStore.announced &&

                birthdayStore.announced[
                    userId
                ] ===
                    today.key
            ) {

                continue;
            }


            await globalChannel.send({

                content:
                    `Happy birthday <@${userId}> 🥳`,


                allowedMentions: {
                    users: [
                        userId
                    ]
                }

            });


            if (
                !birthdayStore.announced ||

                typeof birthdayStore.announced !==
                    "object"
            ) {

                birthdayStore.announced =
                    {};

            }


            birthdayStore.announced[
                userId
            ] =
                today.key;


            changed =
                true;

        }


        if (
            changed
        ) {

            birthdayStore.lastAnnouncementDate =
                today.key;


            saveBirthdayStore();

        }


    } catch (error) {

        console.error(
            "❌ Birthday check error:",
            error
        );

    }
}


// Load data
loadBirthdayStore();
loadAbsenceStore();
loadGiveawayBlockStore();


// ==========================================
// DISCORD CLIENT
// ==========================================

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


// ==========================================
// HELPERS
// ==========================================

function safeText(
    value,
    fallback = "Unknown"
) {

    if (
        value === null ||
        value === undefined
    ) {
        return fallback;
    }


    const text =
        String(
            value
        )
            .trim();


    if (
        !text
    ) {
        return fallback;
    }


    return text;
}


function formatTimeoutDuration(ms) {

    if (
        !Number.isFinite(
            ms
        ) ||
        ms <= 0
    ) {
        return "Unknown";
    }


    const totalSeconds =
        Math.ceil(
            ms /
            1000
        );


    const days =
        Math.floor(
            totalSeconds /
            86400
        );


    const hours =
        Math.floor(
            (
                totalSeconds %
                86400
            ) /
            3600
        );


    const minutes =
        Math.floor(
            (
                totalSeconds %
                3600
            ) /
            60
        );


    const seconds =
        totalSeconds %
        60;


    const parts =
        [];


    if (
        days > 0
    ) {

        parts.push(
            `${days} day${days === 1 ? "" : "e"}`
        );

    }


    if (
        hours > 0
    ) {

        parts.push(
            `${hours} hour${hours === 1 ? "" : "n"}`
        );

    }


    if (
        minutes > 0
    ) {

        parts.push(
            `${minutes} minute${minutes === 1 ? "" : "n"}`
        );

    }


    if (
        seconds > 0 &&
        days === 0 &&
        hours === 0
    ) {

        parts.push(
            `${seconds} second${seconds === 1 ? "" : "n"}`
        );

    }


    return (
        parts.join(
            " "
        ) ||
        "Less than 1 second"
    );
}


const PERMISSION_NAMES_EN = {

    Administrator:
        "Administrator",

    ViewAuditLog:
        "View Audit Log",

    ManageGuild:
        "Manage Server",

    ManageRoles:
        "Manage Roles",

    ManageChannels:
        "Manage Channels",

    KickMembers:
        "Kick Members",

    BanMembers:
        "Ban Members",

    ManageMessages:
        "Manage Messages",

    MentionEveryone:
        "Mention @everyone / @here / roles",

    ManageNicknames:
        "Manage Nicknames",

    ChangeNickname:
        "Change Nickname",

    ViewChannel:
        "View Channel",

    SendMessages:
        "Send Messages",

    SendMessagesInThreads:
        "Send Messages in Threads",

    CreatePublicThreads:
        "Create Public Threads",

    CreatePrivateThreads:
        "Create Private Threads",

    ManageThreads:
        "Manage Threads",

    EmbedLinks:
        "Embed Links",

    AttachFiles:
        "Attach Files",

    ReadMessageHistory:
        "Read Message History",

    AddReactions:
        "Add Reactions",

    UseExternalEmojis:
        "Use External Emojis",

    UseExternalStickers:
        "Use External Stickers",

    Connect:
        "Connect to Voice Channel",

    Speak:
        "Speak",

    MuteMembers:
        "Mute Members",

    DeafenMembers:
        "Deafen Members",

    MoveMembers:
        "Move Members",

    UseVAD:
        "Use Voice Activity",

    PrioritySpeaker:
        "Priority Speaker",

    Stream:
        "Video / Screen Share",

    ManageWebhooks:
        "Manage Webhooks",

    ManageEvents:
        "Manage Events",

    CreateEvents:
        "Create Events",

    ModerateMembers:
        "Timeout Members",

    ViewCreatorMonetizationAnalytics:
        "View Monetization Analytics",

    UseApplicationCommands:
        "Use Application Commands",

    UseEmbeddedActivities:
        "Use Activities",

    UseSoundboard:
        "Use Soundboard",

    UseExternalSounds:
        "Use External Sounds",

    SendVoiceMessages:
        "Send Voice Messages",

    CreateGuildExpressions:
        "Create Server Expressions",

    ManageGuildExpressions:
        "Manage Server Expressions"

};


function getPermissionDisplayName(
    name
) {

    return (
        PERMISSION_NAMES_EN[
            name
        ] ||
        name
    );

}


function getPermissionChanges(
    beforeRole,
    afterRole
) {

    const added =
        [];


    const removed =
        [];


    for (
        const [name, bit]
        of Object.entries(
            PermissionsBitField.Flags
        )
    ) {

        const hadBefore =
            beforeRole
                .permissions
                .has(
                    bit
                );


        const hasAfter =
            afterRole
                .permissions
                .has(
                    bit
                );


        if (
            !hadBefore &&
            hasAfter
        ) {

            added.push(
                getPermissionDisplayName(
                    name
                )
            );

        }


        if (
            hadBefore &&
            !hasAfter
        ) {

            removed.push(
                getPermissionDisplayName(
                    name
                )
            );

        }

    }


    return {
        added,
        removed
    };
}


function escapeRegExp(value) {

    return String(
        value
    )
        .replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

}


function resolveSayRoleMentions(
    guild,
    text
) {

    if (
        !guild
    ) {

        return {

            content:
                String(
                    text
                ),

            roleIds:
                []

        };

    }


    let content =
        String(
            text
        );


    const roleIds =
        new Set();


    const roles = [
        ...guild
            .roles
            .cache
            .values()
    ]

        .filter(
            role =>
                role.id !==
                    guild.id
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

                (
                    match,
                    prefix
                ) => {

                    found =
                        true;


                    return (
                        `${prefix}<@&${role.id}>`
                    );

                }
            );


        if (
            found
        ) {

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

            rawMatch[1] !==
                guild.id
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
        typeof color ===
            "number"
            ? color
            : 0x5865f2
    );


    if (
        description !== null &&
        description !== undefined
    ) {

        const text =
            String(
                description
            )
                .trim();


        if (
            text.length > 0
        ) {

            embed.setDescription(
                text
            );

        }

    }


    embed.setTimestamp();


    return embed;
}


function getLogChannel(guild, channelId) {

    if (!guild || !channelId) {
        return null;
    }

    const channel = guild.channels.cache.get(channelId);

    if (!channel || !channel.isTextBased()) {
        return null;
    }

    return channel;
}


async function sendLog(guild, embed, channelId = GLOBAL_LOG_CHANNEL_ID) {

    try {
        if (!isFeatureEnabled("serverLogs") || !guild || !embed) {
            return;
        }

        const channel = getLogChannel(guild, channelId);

        if (!channel) {
            console.log(`⚠️ Log channel not found: ${channelId}`);
            return;
        }

        await channel.send({ embeds: [embed] });
    } catch (error) {
        console.error("❌ Logging error:", error);
    }
}


async function sendVoiceLog(guild, embed) {
    return sendLog(guild, embed, VOICE_LOG_CHANNEL_ID);
}


async function sendJoinLeaveLog(guild, embed) {
    return sendLog(guild, embed, JOIN_LEAVE_LOG_CHANNEL_ID);
}


async function getAuditExecutor(
    guild,
    action,
    targetId,
    maxEntries = 10
) {

    try {

        if (
            !guild
        ) {
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


        return (
            entry ||
            null
        );


    } catch (error) {

        if (
            error.code !==
            50013
        ) {

            console.error(
                "❌ Audit log error:",
                error
            );

        }


        return null;
    }
}


async function getTimeoutAuditEntry(
    guild,
    targetId
) {

    try {

        const logs =
            await guild.fetchAuditLogs({

                limit:
                    10,

                type:
                    AuditLogEvent.MemberUpdate

            });


        const entry =
            logs.entries.find(
                entry => {

                    if (
                        !entry.target ||
                        entry.target.id !==
                            targetId
                    ) {

                        return false;
                    }


                    if (
                        Date.now() -
                            entry.createdTimestamp >
                            15000
                    ) {

                        return false;
                    }


                    if (
                        !Array.isArray(
                            entry.changes
                        )
                    ) {

                        return true;
                    }


                    return entry.changes.some(
                        change =>
                            change.key ===
                                "communication_disabled_until"
                    );

                }
            );


        return (
            entry ||
            null
        );


    } catch (error) {

        if (
            error.code !==
            50013
        ) {

            console.error(
                "❌ Timeout audit error:",
                error
            );

        }


        return null;
    }
}


function isAdmin(member) {

    if (
        !member
    ) {
        return false;
    }


    return member
        .permissions
        .has(
            PermissionsBitField
                .Flags
                .Administrator
        );

}


function isStaff(member) {

    if (
        !member
    ) {
        return false;
    }


    return (
        member
            .roles
            .cache
            .has(
                STAFF_ROLE_ID
            ) ||

        isAdmin(
            member
        )
    );

}


function isTicketStaff(member) {

    if (
        !member ||
        !member.roles ||
        !member.roles.cache
    ) {

        return false;
    }


    return member
        .roles
        .cache
        .has(
            STAFF_ROLE_ID
        );

}


function getTicketData(channel) {

    if (
        !channel
    ) {
        return null;
    }


    return (
        ticketData.get(
            channel.id
        ) ||
        null
    );
}


// ==========================================
// TICKET TRANSCRIPT
// ==========================================

async function fetchAllTicketMessages(channel) {

    const messages =
        [];


    let beforeId =
        null;


    while (
        true
    ) {

        const options = {
            limit:
                100
        };


        if (
            beforeId
        ) {

            options.before =
                beforeId;

        }


        const batch =
            await channel
                .messages
                .fetch(
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
            batch.size <
                100 ||
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


function formatTicketMessage(message) {

    const timestamp =
        new Date(
            message.createdTimestamp
        )
            .toLocaleString(
                "en-GB",
                {
                    timeZone:
                        "Europe/Berlin"
                }
            );


    const author =
        message.author
            ? `${message.author.tag} (${message.author.id})`
            : "Unknowner User";


    const parts =
        [];


    const content =
        message.content
            ? message.content.trim()
            : "";


    if (
        content
    ) {

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


            if (
                embed.title
            ) {

                embedParts.push(
                    `Titel: ${embed.title}`
                );

            }


            if (
                embed.description
            ) {

                embedParts.push(
                    `Beschreibung: ${embed.description}`
                );

            }


            if (
                embed.url
            ) {

                embedParts.push(
                    `URL: ${embed.url}`
                );

            }


            parts.push(
                `[Embed${
                    embedParts.length
                        ? ` | ${embedParts.join(" | ")}`
                        : ""
                }]`
            );

        }

    }


    if (
        parts.length ===
        0
    ) {

        parts.push(
            "[No text message]"
        );

    }


    const body =
        parts
            .join(
                "\n"
            )
            .replace(
                /\r/g,
                ""
            );


    return (
        `[${timestamp}] ${author}\n${body}\n`
    );
}


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


        `Ticket Creator: ${
            data &&
            data.ownerId
                ? data.ownerId
                : "Unknown"
        }`,


        `Category: ${
            data &&
            data.categoryTitle
                ? data.categoryTitle
                : "Unknown"
        }`,


        `Claimed by: ${
            data &&
            data.claimedBy
                ? data.claimedBy
                : "No one"
        }`,


        `Forwarded to: ${
            data &&
            data.forwardedTo
                ? data.forwardedTo
                : "No one"
        }`,


        `Closure requested by: ${
            requestedById ||
            "Unknown"
        }`,


        `Closure confirmed by: ${
            confirmedById ||
            "Unknown"
        }`,


        `Reason: ${
            reason ||
            "No reason provided"
        }`,


        `Created: ${
            data &&
            data.createdAt
                ? new Date(
                    data.createdAt
                )
                    .toLocaleString(
                        "en-GB",
                        {
                            timeZone:
                                "Europe/Berlin"
                        }
                    )
                : "Unknown"
        }`,


        `Geschlossen: ${
            new Date()
                .toLocaleString(
                    "en-GB",
                    {
                        timeZone:
                            "Europe/Berlin"
                    }
                )
        }`,


        `Messages: ${messages.length}`,


        "======================================================",

        ""

    ].join(
        "\n"
    );


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
            "\n\n[Transcript was truncated because of the file size.]";


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


        const logChannel =
            guild
                .channels
                .cache
                .get(
                    TICKET_TRANSCRIPT_CHANNEL_ID
                ) ||

            await guild
                .channels
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
                `⚠️ Ticket transcript channel not found: ${TICKET_TRANSCRIPT_CHANNEL_ID}`
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
                    "🔒 Ticket Closed"
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
                            "👤 Ticket Creator",

                        value:
                            data &&
                            data.ownerId
                                ? `<@${data.ownerId}> (\`${data.ownerId}\`)`
                                : "Unknown",

                        inline:
                            true
                    },

                    {
                        name:
                            "🛡️ Closure Requested By",

                        value:
                            requestedById
                                ? `<@${requestedById}> (\`${requestedById}\`)`
                                : "Unknown",

                        inline:
                            true
                    },

                    {
                        name:
                            "✅ Confirmed by",

                        value:
                            confirmedById
                                ? `<@${confirmedById}> (\`${confirmedById}\`)`
                                : "Unknown",

                        inline:
                            true
                    },

                    {
                        name:
                            "📝 Reason",

                        value:
                            safeText(
                                reason,
                                "No reason provided"
                            )
                                .substring(
                                    0,
                                    1024
                                ),

                        inline:
                            false
                    },

                    {
                        name:
                            "📌 Claimed By",

                        value:
                            data &&
                            data.claimedBy
                                ? `<@${data.claimedBy}>`
                                : "No one",

                        inline:
                            true
                    },

                    {
                        name:
                            "➡️ Forwarded To",

                        value:
                            data &&
                            data.forwardedTo
                                ? `<@${data.forwardedTo}>`
                                : "No one",

                        inline:
                            true
                    },

                    {
                        name:
                            "💬 Messages",

                        value:
                            `${transcript.messageCount}`,

                        inline:
                            true
                    }
                )

                .setFooter({
                    text:
                        "VIBE Ticket System • Transcript attached as a file"
                })

                .setTimestamp();


        const safeChannelName =
            channel
                .name
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
            "❌ Ticket transcript error:",
            error
        );


        return false;
    }
}


// ==========================================
// HIGH-END TICKET DASHBOARD
// ==========================================

function getTicketStatus(data) {

    if (
        data.pendingClose
    ) {
        return "🔴 CLOSURE REQUESTED";
    }

    if (
        data.forwardedTo
    ) {
        return "🔵 FORWARDED";
    }

    if (
        data.claimedBy
    ) {
        return "🟢 IN PROGRESS";
    }

    return "🟡 WAITING FOR STAFF";
}


function buildTicketDashboard(
    data
) {

    const ticketId =
        data.ticketId ||
        "UNKNOWN";

    const status =
        getTicketStatus(
            data
        );

    const claimedText =
        data.claimedBy
            ? `<@${data.claimedBy}>`
            : "No one yet";

    const forwardedText =
        data.forwardedTo
            ? `<@${data.forwardedTo}>`
            : "—";

    let answersText =
        "No additional information.";

    if (
        Array.isArray(
            data.formAnswers
        ) &&
        data.formAnswers.length >
            0
    ) {

        answersText =
            data.formAnswers
                .map(
                    item =>
                        `**${item.question}**\n${safeText(item.answer, "Not provided")}`
                )
                .join(
                    "\n\n"
                );

    }

    if (
        answersText.length >
        2600
    ) {
        answersText =
            answersText.substring(
                0,
                2570
            ) +
            "\n\n…";
    }

    const claimButton =
        new ButtonBuilder()
            .setCustomId(
                "claim_ticket"
            )
            .setLabel(
                "Claim"
            )
            .setEmoji(
                "📌"
            )
            .setStyle(
                ButtonStyle.Success
            );

    const forwardButton =
        new ButtonBuilder()
            .setCustomId(
                "forward_ticket"
            )
            .setLabel(
                "Forward"
            )
            .setEmoji(
                "➡️"
            )
            .setStyle(
                ButtonStyle.Primary
            );

    const closeButton =
        new ButtonBuilder()
            .setCustomId(
                "close_ticket"
            )
            .setLabel(
                "Close"
            )
            .setEmoji(
                "🔒"
            )
            .setStyle(
                ButtonStyle.Danger
            );

    const buttonRow =
        new ActionRowBuilder()
            .addComponents(
                claimButton,
                forwardButton,
                closeButton
            );

    const container =
        new ContainerBuilder()

            .setAccentColor(
                0xD49A16
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
`# 🎫 VIBE Support Center
-# Ticket Node • ${ticketId}

<@${data.ownerId}> welcome to your private support area.`
                    )
            )

            .addSeparatorComponents(
                new SeparatorBuilder()
                    .setDivider(
                        true
                    )
                    .setSpacing(
                        SeparatorSpacingSize.Small
                    )
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
`### 📡 LIVE STATUS
> **Status:** ${status}
> **Category:** ${safeText(data.categoryTitle, "Unknown")}
> **Created by:** <@${data.ownerId}>
> **Assigned Staff:** ${claimedText}
> **Forwarded to:** ${forwardedText}
> **Created:** <t:${Math.floor(data.createdAt / 1000)}:R>`
                    )
            )

            .addSeparatorComponents(
                new SeparatorBuilder()
                    .setDivider(
                        true
                    )
                    .setSpacing(
                        SeparatorSpacingSize.Small
                    )
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
`### 📝 YOUR DETAILS
${answersText}`
                    )
            )

            .addSeparatorComponents(
                new SeparatorBuilder()
                    .setDivider(
                        true
                    )
                    .setSpacing(
                        SeparatorSpacingSize.Small
                    )
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
`### 🛡️ SUPPORT CONTROL
> **Claim** → Staff claims the ticket
> **Forward** → Forward the ticket to a staff member
> **Close** → Start a closure request with confirmation

-# The dashboard updates automatically whenever the ticket status changes.`
                    )
            )

            .addActionRowComponents(
                buttonRow
            )

            .addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(
                        "-# VIBE CORE • Private Support Session"
                    )
            );

    return [
        container
    ];
}


async function refreshTicketDashboard(
    channel,
    data
) {

    if (
        !channel ||
        !data ||
        !data.dashboardMessageId
    ) {
        return false;
    }

    const message =
        await channel.messages.fetch(
            data.dashboardMessageId
        )
            .catch(
                () => null
            );

    if (
        !message
    ) {
        return false;
    }

    await message.edit({
        components:
            buildTicketDashboard(
                data
            ),

        flags:
            MessageFlags.IsComponentsV2
    })
        .catch(
            error => {

                console.error(
                    "❌ Ticket dashboard update error:",
                    error
                );

            }
        );

    return true;
}


// ==========================================
// CREATE TICKET
// ==========================================

async function createTicketChannel(
    interaction,
    config,
    answers = []
) {

    const guild =
        interaction.guild;


    const member =
        await guild
            .members
            .fetch(
                interaction.user.id
            )
            .catch(
                () => null
            );


    const staffRole =
        await guild
            .roles
            .fetch(
                STAFF_ROLE_ID
            )
            .catch(
                () => null
            );


    const category =
        await guild
            .channels
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
                "❌ Ticket could not be created. Check the role and category configuration."
        });

    }


    const existing =
        guild
            .channels
            .cache
            .find(
                channel =>
                    channel.type ===
                        ChannelType.GuildText &&

                    channel.name ===
                        config.name
            );


    if (
        existing
    ) {

        return interaction.editReply({
            content:
                `❌ You already have an open ticket: ${existing}`
        });

    }


    const channel =
        await guild
            .channels
            .create({

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

            ticketId:
                channel.id.slice(-6).toUpperCase(),

            dashboardMessageId:
                null,

            createdAt:
                Date.now(),

            pendingClose:
                null,

            formAnswers:
                answers
        }
    );


    const data =
        getTicketData(
            channel
        );


    const dashboardMessage =
        await channel.send({

            components:
                buildTicketDashboard(
                    data
                ),

            allowedMentions: {
                users: [
                    member.id
                ],
                roles: [
                    STAFF_ROLE_ID
                ]
            },

            flags:
                MessageFlags.IsComponentsV2

        });


    data.dashboardMessageId =
        dashboardMessage.id;


    await channel.send({
        content:
            `<@&${STAFF_ROLE_ID}> • New Ticket **#${data.ticketId}** from ${member}`,

        allowedMentions: {
            roles: [
                STAFF_ROLE_ID
            ],
            users: [
                member.id
            ]
        }
    });


    await interaction.editReply({
        content:
            `✅ Your ticket was created: ${channel}`
    });
}


// ==========================================
// GIVEAWAY ZEIT
// ==========================================

function parseGiveawayDuration(input) {

    if (
        !input
    ) {
        return null;
    }


    const value =
        String(
            input
        )
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


    if (
        shortMatch
    ) {

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
            multipliers[
                unit
            ]
        );

    }


    const longMatch =
        value.match(
            /^(\d+(?:\.\d+)?)\s*(s|sec|second|seconds|min|minute|minutes|h|hr|hour|hours|d|day|days|w|week|weeks)$/i
        );


    if (
        !longMatch
    ) {
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
        unit === "s" ||
        unit === "sec" ||
        unit === "second" ||
        unit === "seconds"
    ) {

        multiplier =
            1000;

    }


    if (
        unit === "min" ||
        unit === "minute" ||
        unit === "minuten"
    ) {

        multiplier =
            60 *
            1000;

    }


    if (
        unit === "h" ||
        unit === "hr" ||
        unit === "hour" ||
        unit === "hours"
    ) {

        multiplier =
            60 *
            60 *
            1000;

    }


    if (
        unit === "d" ||
        unit === "day" ||
        unit === "days"
    ) {

        multiplier =
            24 *
            60 *
            60 *
            1000;

    }


    if (
        unit === "w" ||
        unit === "week" ||
        unit === "weeks"
    ) {

        multiplier =
            7 *
            24 *
            60 *
            60 *
            1000;

    }


    if (
        !multiplier
    ) {
        return null;
    }


    return Math.floor(
        amount *
        multiplier
    );
}


// ==========================================
// GIVEAWAY EMBED
// ==========================================

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
                "Good luck to all participants! 🍀"
            )

            .addFields(
                {
                    name:
                        "⏰ Ende",

                    value:
                        ended
                            ? `Ended <t:${endUnix}:R>`
                            : `<t:${endUnix}:R>\n<t:${endUnix}:f>`,

                    inline:
                        false
                },

                {
                    name:
                        "👤 Hosted By",

                    value:
                        `<@${data.hostId}>`,

                    inline:
                        true
                },

                {
                    name:
                        "🎟️ Participants",

                    value:
                        `${data.participants.size}`,

                    inline:
                        true
                },

                {
                    name:
                        "🏆 Winners",

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
                        ? "Giveaway Ended"
                        : "Click 🎉 Participate below!"
            });


    if (
        ended
    ) {

        embed.addFields({

            name:
                "🎉 Result",


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

                    : "No valid participants."

        });

    }


    return embed;
}


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


// ==========================================
// SLASH COMMANDS
// ==========================================

const commands = [

    new SlashCommandBuilder()

        .setName(
            "ticketpanel"
        )

        .setDescription(
            "Creates the ticket panel"
        )

        .toJSON(),


    new SlashCommandBuilder()

        .setName(
            "logtest"
        )

        .setDescription(
            "Tests server logging"
        )

        .toJSON(),


    new SlashCommandBuilder()

        .setName(
            "clear"
        )

        .setDescription(
            "Deletes messages from this channel"
        )

        .addIntegerOption(
            option =>
                option

                    .setName(
                        "number"
                    )

                    .setDescription(
                        "How many messages should be deleted?"
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
            "Creates content on the server"
        )

        .addSubcommand(
            subcommand =>
                subcommand

                    .setName(
                        "giveaway"
                    )

                    .setDescription(
                        "Creates a giveaway"
                    )
        )

        .toJSON(),


    new SlashCommandBuilder()
        .setName("giveaway")
        .setDescription("Giveaway management")
        .addSubcommand(subcommand =>
            subcommand
                .setName("block")
                .setDescription("Blocks a user from giveaways")
                .addUserOption(option =>
                    option
                        .setName("user")
                        .setDescription("User to block")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("unblock")
                .setDescription("Removes a giveaway block")
                .addUserOption(option =>
                    option
                        .setName("user")
                        .setDescription("User to unblock")
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("participants")
                .setDescription("Shows all participants in the current giveaway")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("blocklist")
                .setDescription("Shows all members blocked from giveaways")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("reroll")
                .setDescription("Rerolls winners from an ended giveaway")
        )
        .toJSON(),


    new SlashCommandBuilder()

        .setName(
            "birthday"
        )

        .setDescription(
            "Birthday system"
        )

        .addSubcommand(
            subcommand =>
                subcommand

                    .setName(
                        "panel"
                    )

                    .setDescription(
                        "Creates the birthday entry panel"
                    )
        )

        .addSubcommand(
            subcommand =>
                subcommand

                    .setName(
                        "list"
                    )

                    .setDescription(
                        "Creates or shows the birthday list"
                    )
        )

        .addSubcommand(
            subcommand =>
                subcommand

                    .setName(
                        "delete"
                    )

                    .setDescription(
                        "Deletes a birthday from the list"
                    )

                    .addUserOption(
                        option =>
                            option

                                .setName(
                                    "user"
                                )

                                .setDescription(
                                    "Which user should be deleted?"
                                )

                                .setRequired(
                                    true
                                )
                    )
        )

        .toJSON(),


    new SlashCommandBuilder()

        .setName(
            "absence"
        )

        .setDescription(
            "Marks you as absent for a period of time"
        )

        .toJSON(),


    new SlashCommandBuilder()

        .setName(
            "say"
        )

        .setDescription(
            "Makes the bot send a message"
        )

        .toJSON()

];


// ==========================================
// COMMAND REGISTRATION
// ==========================================

const rest =
    new REST({
        version:
            "10"
    })
        .setToken(
            TOKEN
        );


async function registerCommands() {

    try {

        console.log(
            "⏳ Registering slash commands..."
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
            "✅ Slash commands registered"
        );


        return true;


    } catch (error) {

        console.error(
            "❌ Registration error:",
            error
        );


        return false;
    }
}


// ==========================================
// CLIENT READY
// ==========================================

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

        // Discord status: Away / Idle 🌙
        client.user.setPresence({
            status: "idle"
        });

        console.log(
            `🆔 Bot ID: ${client.user.id}`
        );

        console.log(
            `🌐 Port: ${PORT}`
        );

        console.log(
            `📝 Global Log: ${GLOBAL_LOG_CHANNEL_ID}`
        );

        console.log(
            `🛡️ Staff Role: ${STAFF_ROLE_ID}`
        );

        console.log(
            `🎧 Support Role: ${SUPPORT_ROLE_ID}`
        );

        console.log(
            "===================================="
        );


        await registerCommands();


        await checkBirthdays();


        await checkAbsenceen();


        setInterval(
            checkBirthdays,
            60 * 1000
        );


        // Check every minute.
        // The embed is only edited when the remaining hour changes.
        setInterval(
            checkAbsenceen,
            60 * 1000
        );

    }
);


if (
    !TOKEN
) {

    console.error(
        "❌ TOKEN is missing in the Render environment!"
    );


    process.exit(
        1
    );

}


console.log(
    "🔐 Logging in bot..."
);


client
    .login(
        TOKEN
    )
    .catch(
        error => {

            console.error(
                "❌ Discord login error:",
                error
            );

        }
    );


// ==========================================
// INTERACTIONS
// ==========================================

client.on(
    Events.InteractionCreate,

    async interaction => {

        try {

            // ==========================================
            // SLASH COMMANDS
            // ==========================================

            if (
                interaction.isChatInputCommand()
            ) {

                // ==========================================
                // GIVEAWAY VERWALTUNG
                // ==========================================
                if (interaction.commandName === "giveaway") {
                    if (!canManageGiveawayBlocks(interaction.member)) {
                        return interaction.reply({
                            content: "❌ Only Leader and Co-Leader may use giveaway management.",
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    const subcommand = interaction.options.getSubcommand();

                    if (subcommand === "participants") {
                        const activeGiveaways = [...giveawayData.values()]
                            .filter(data =>
                                !data.ended &&
                                Date.now() < data.endAt &&
                                data.guildId === interaction.guildId
                            )
                            .sort((a, b) => b.createdAt - a.createdAt);

                        const data =
                            activeGiveaways.find(item => item.channelId === interaction.channelId) ||
                            activeGiveaways[0];

                        if (!data) {
                            return interaction.reply({
                                content: "❌ There is currently no active giveaway.",
                                flags: MessageFlags.Ephemeral
                            });
                        }

                        const participantIds = [...data.participants];

                        if (participantIds.length === 0) {
                            return interaction.reply({
                                content: `🎁 No one is participating in the current giveaway **${data.prize}** yet.`,
                                flags: MessageFlags.Ephemeral
                            });
                        }

                        const participantLines = participantIds.map(
                            (userId, index) => `**${index + 1}.** <@${userId}>`
                        );

                        const chunks = [];
                        let current = "";

                        for (const line of participantLines) {
                            if ((current + "\n" + line).length > 1800) {
                                chunks.push(current);
                                current = line;
                            } else {
                                current += (current ? "\n" : "") + line;
                            }
                        }

                        if (current) chunks.push(current);

                        await interaction.reply({
                            content:
                                `🎁 **Participants – ${data.prize}**\n` +
                                `👥 **${participantIds.length} participants**\n\n` +
                                chunks[0],
                            flags: MessageFlags.Ephemeral
                        });

                        for (let i = 1; i < chunks.length; i++) {
                            await interaction.followUp({
                                content: chunks[i],
                                flags: MessageFlags.Ephemeral
                            });
                        }

                        return;
                    }

                    if (subcommand === "blocklist") {
                        const blockedIds = [...new Set(giveawayBlockStore.blockedUsers.map(String))];

                        if (blockedIds.length === 0) {
                            return interaction.reply({
                                content: "✅ Currently, **no one** is blocked from giveaways.",
                                flags: MessageFlags.Ephemeral
                            });
                        }

                        const lines = blockedIds.map(
                            (userId, index) => `**${index + 1}.** <@${userId}> — \`${userId}\``
                        );

                        const chunks = [];
                        let current = "";

                        for (const line of lines) {
                            if ((current + "\n" + line).length > 1800) {
                                chunks.push(current);
                                current = line;
                            } else {
                                current += (current ? "\n" : "") + line;
                            }
                        }

                        if (current) chunks.push(current);

                        await interaction.reply({
                            content:
                                `🚫 **Giveaway Block List**\n` +
                                `👥 **${blockedIds.length} blocked**\n\n` +
                                chunks[0],
                            flags: MessageFlags.Ephemeral
                        });

                        for (let i = 1; i < chunks.length; i++) {
                            await interaction.followUp({
                                content: chunks[i],
                                flags: MessageFlags.Ephemeral
                            });
                        }

                        return;
                    }

                    if (subcommand === "reroll") {
                        const endedGiveaways = [...giveawayData.values()]
                            .filter(data =>
                                data.ended &&
                                data.guildId === interaction.guildId
                            )
                            .sort((a, b) => b.endAt - a.endAt);

                        const data =
                            endedGiveaways.find(item => item.channelId === interaction.channelId) ||
                            endedGiveaways[0];

                        if (!data) {
                            return interaction.reply({
                                content: "❌ No ended giveaway was found that can be rerolled.",
                                flags: MessageFlags.Ephemeral
                            });
                        }

                        const oldWinnerIds = Array.isArray(data.winnerIds)
                            ? data.winnerIds
                            : [];

                        const eligibleParticipants = [...data.participants].filter(
                            userId =>
                                !isGiveawayBlocked(userId) &&
                                !oldWinnerIds.includes(userId)
                        );

                        const newWinners = pickGiveawayWinners(
                            eligibleParticipants,
                            data.winnerCount
                        );

                        if (newWinners.length === 0) {
                            return interaction.reply({
                                content: "❌ There are no other valid participants for a reroll.",
                                flags: MessageFlags.Ephemeral
                            });
                        }

                        data.winnerIds = newWinners;

                        const giveawayChannel =
                            interaction.guild.channels.cache.get(data.channelId) ||
                            await interaction.guild.channels.fetch(data.channelId).catch(() => null);

                        if (!giveawayChannel || !giveawayChannel.isTextBased()) {
                            return interaction.reply({
                                content: "❌ The original giveaway channel was not found.",
                                flags: MessageFlags.Ephemeral
                            });
                        }

                        const winnerMentions = newWinners
                            .map(userId => `<@${userId}>`)
                            .join(", ");

                        await giveawayChannel.send({
                            content:
                                `🔁 **GIVEAWAY REROLL**\n\n` +
                                `🎁 **Prize:** ${data.prize}\n` +
                                `🏆 **New Winners:** ${winnerMentions}\n\n` +
                                `Congratulations! 🎉`,
                            allowedMentions: {
                                users: newWinners
                            }
                        });

                        return interaction.reply({
                            content:
                                `✅ Giveaway **${data.prize}** was rerolled.\n` +
                                `Neue Winners: ${winnerMentions}`,
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    const target = interaction.options.getUser("user", true);

                    if (target.bot) {
                        return interaction.reply({
                            content: "❌ Bots cannot be blocked from giveaways.",
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    if (subcommand === "block") {
                        if (isGiveawayBlocked(target.id)) {
                            return interaction.reply({
                                content: `ℹ️ <@${target.id}> is already blocked from giveaways.`,
                                flags: MessageFlags.Ephemeral
                            });
                        }

                        giveawayBlockStore.blockedUsers.push(target.id);
                        saveGiveawayBlockStore();

                        for (const data of giveawayData.values()) {
                            data.participants?.delete(target.id);
                        }

                        return interaction.reply({
                            content: `✅ <@${target.id}> was blocked from giveaways.`,
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    if (subcommand === "unblock") {
                        if (!isGiveawayBlocked(target.id)) {
                            return interaction.reply({
                                content: `ℹ️ <@${target.id}> is currently not blocked from giveaways.`,
                                flags: MessageFlags.Ephemeral
                            });
                        }

                        giveawayBlockStore.blockedUsers =
                            giveawayBlockStore.blockedUsers.filter(id => id !== target.id);
                        saveGiveawayBlockStore();

                        return interaction.reply({
                            content: `✅ The giveaway block for <@${target.id}> was removed.`,
                            flags: MessageFlags.Ephemeral
                        });
                    }
                }


                // ==========================================
                // BIRTHDAY
                // ==========================================

                if (
                    interaction.commandName ===
                    "birthday"
                ) {

                    const subcommand =
                        interaction.options
                            .getSubcommand();


                    // PANEL
                    if (
                        subcommand ===
                        "panel"
                    ) {

                        if (
                            !isAdmin(
                                interaction.member
                            )
                        ) {

                            return interaction.reply({

                                content:
                                    "❌ Only administrators can create the birthday panel.",

                                flags:
                                    MessageFlags.Ephemeral

                            });

                        }


                        const button =
                            new ButtonBuilder()

                                .setCustomId(
                                    "birthday_open_modal"
                                )

                                .setLabel(
                                    "Enter Birthday"
                                )

                                .setEmoji(
                                    "🎂"
                                )

                                .setStyle(
                                    ButtonStyle.Primary
                                );


                        const row =
                            new ActionRowBuilder()
                                .addComponents(
                                    button
                                );


                        const embed =
                            new EmbedBuilder()

                                .setColor(
                                    "#FEE75C"
                                )

                                .setTitle(
                                    "🎂 Enter Birthday"
                                )

                                .setDescription(
`Click **Enter Birthday** below and enter your birthday.

📅 Example: **09.05.2011**

Your birthday will then automatically appear in the birthday list.`
                                )

                                .setFooter({
                                    text:
                                        "VIBE Birthday system"
                                })

                                .setTimestamp();


                        await interaction.channel.send({

                            embeds: [
                                embed
                            ],

                            components: [
                                row
                            ]

                        });


                        return interaction.reply({

                            content:
                                "✅ Birthday panel was created.",

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }


                    // LIST
                    if (
                        subcommand ===
                        "list"
                    ) {

                        if (
                            !isAdmin(
                                interaction.member
                            )
                        ) {

                            return interaction.reply({

                                content:
                                    "❌ Only administrators can create or move the permanent birthday list.",

                                flags:
                                    MessageFlags.Ephemeral

                            });

                        }


                        await interaction.deferReply({
                            flags:
                                MessageFlags.Ephemeral
                        });


                        const oldUpdated =
                            await updateBirthdayListMessage(
                                interaction.guild
                            );


                        if (
                            oldUpdated &&

                            birthdayStore.listChannelId ===
                                interaction.channel.id
                        ) {

                            return interaction.editReply({
                                content:
                                    "✅ The existing birthday list was updated."
                            });

                        }


                        const listMessage =
                            await interaction.channel.send({

                                embeds: [
                                    createBirthdayListEmbed()
                                ]

                            });


                        birthdayStore.listChannelId =
                            interaction.channel.id;


                        birthdayStore.listMessageId =
                            listMessage.id;


                        saveBirthdayStore();


                        return interaction.editReply({

                            content:
                                "✅ The birthday list was created and will now update automatically."

                        });

                    }


                    // DELETE
                    if (
                        subcommand ===
                        "delete"
                    ) {

                        if (
                            !isAdmin(
                                interaction.member
                            )
                        ) {

                            return interaction.reply({

                                content:
                                    "❌ Only administrators can delete birthdays.",

                                flags:
                                    MessageFlags.Ephemeral

                            });

                        }


                        const user =
                            interaction.options.getUser(
                                "user",
                                true
                            );


                        if (
                            !birthdayStore.birthdays[
                                user.id
                            ]
                        ) {

                            return interaction.reply({

                                content:
                                    `❌ ${user} does not have a saved birthday.`,

                                flags:
                                    MessageFlags.Ephemeral

                            });

                        }


                        delete birthdayStore.birthdays[
                            user.id
                        ];


                        if (
                            birthdayStore.announced
                        ) {

                            delete birthdayStore.announced[
                                user.id
                            ];

                        }


                        saveBirthdayStore();


                        await updateBirthdayListMessage(
                            interaction.guild
                        );


                        return interaction.reply({

                            content:
                                `✅ The birthday of ${user} was deleted.`,

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }

                }


                // ==========================================
                // /ABSENCE
                // ==========================================

                if (
                    interaction.commandName ===
                    "absence"
                ) {

                    if (
                        !interaction.member ||
                        !interaction.member.roles ||

                        !interaction.member.roles.cache.has(
                            STAFF_ROLE_ID
                        )
                    ) {

                        return interaction.reply({

                            content:
                                "❌ You are not allowed to use this command.",

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }


                    const modal =
                        new ModalBuilder()

                            .setCustomId(
                                "absence_modal"
                            )

                            .setTitle(
                                "Staff Absence"
                            );


                    const startInput =
                        new TextInputBuilder()

                            .setCustomId(
                                "absence_start"
                            )

                            .setLabel(
                                "When does your absence start?"
                            )

                            .setPlaceholder(
                                "z. B. 05.09.2026"
                            )

                            .setStyle(
                                TextInputStyle.Short
                            )

                            .setRequired(
                                true
                            )

                            .setMaxLength(
                                10
                            );


                    const endInput =
                        new TextInputBuilder()

                            .setCustomId(
                                "absence_end"
                            )

                            .setLabel(
                                "Until when will you be absent?"
                            )

                            .setPlaceholder(
                                "e.g. 12.09.2026 or Unknown"
                            )

                            .setStyle(
                                TextInputStyle.Short
                            )

                            .setRequired(
                                true
                            )

                            .setMaxLength(
                                20
                            );


                    const reasonInput =
                        new TextInputBuilder()

                            .setCustomId(
                                "absence_reason"
                            )

                            .setLabel(
                                "Reason"
                            )

                            .setPlaceholder(
                                "e.g. vacation, school, or personal reasons"
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
                                startInput
                            ),

                        new ActionRowBuilder()
                            .addComponents(
                                endInput
                            ),

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


                // ==========================================
                // /SAY
                // ==========================================

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
                                "❌ Only administrators can use `/say`.",

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
                                "Send Message"
                            );


                    const messageInput =
                        new TextInputBuilder()

                            .setCustomId(
                                "say_message"
                            )

                            .setLabel(
                                "What would you like to say?"
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


                    modal.addComponents(

                        new ActionRowBuilder()
                            .addComponents(
                                messageInput
                            )

                    );


                    await interaction.showModal(
                        modal
                    );


                    return;
                }


                // ==========================================
                // GIVEAWAY ERSTELLEN
                // ==========================================

                if (
                    interaction.commandName ===
                        "create" &&

                    interaction.options
                        .getSubcommand() ===
                        "giveaway"
                ) {

                    if (
                        !isFeatureEnabled(
                            "giveaways"
                        )
                    ) {

                        return interaction.reply({

                            content:
                                "❌ The giveaway system is currently disabled.",

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
                                "❌ You need the **Manage Server** permission to create a giveaway.",

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
                                "Create Giveaway"
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
                                "e.g. 10 minutes, 2 hours, or 1 day"
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
                                "Number of Winners"
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
                                "Prize"
                            )

                            .setPlaceholder(
                                "What can be won?"
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


                // ==========================================
                // LOG TEST
                // ==========================================

                if (
                    interaction.commandName ===
                    "logtest"
                ) {

                    if (
                        !isAdmin(
                            interaction.member
                        )
                    ) {

                        return interaction.reply({

                            content:
                                "❌ Only administrators can use this command.",

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }


                    const embed =
                        baseEmbed(
                            "🧪 Logging Test",
                            0x5865f2,
                            "Server logging is working."
                        );


                    embed.addFields(

                        {
                            name:
                                "Executed By",

                            value:
                                `${interaction.user} (${interaction.user.id})`
                        },

                        {
                            name:
                                "Channel",

                            value:
                                interaction.channel
                                    ? interaction.channel.toString()
                                    : "Unknown"
                        }

                    );


                    await sendLog(
                        interaction.guild,
                        embed
                    );


                    return interaction.reply({

                        content:
                            "✅ Test log was sent.",

                        flags:
                            MessageFlags.Ephemeral

                    });
                }


                // ==========================================
                // CLEAR
                // ==========================================

                if (
                    interaction.commandName ===
                    "clear"
                ) {

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
                                "❌ You need the **Manage Messages** permission.",

                            flags:
                                MessageFlags.Ephemeral

                        });
                    }


                    const amount =
                        interaction.options
                            .getInteger(
                                "number",
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
                                "❌ Messages cannot be deleted in this channel.",

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }


                    await interaction.deferReply({
                        flags:
                            MessageFlags.Ephemeral
                    });


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

                    }


                    await interaction.editReply({

                        content:
                            `🧹 **${deletedTotal} messages were deleted.**`

                    });


                    const logEmbed =
                        baseEmbed(
                            "🧹 Messages Deleted",
                            0xed4245
                        );


                    logEmbed.addFields(

                        {
                            name:
                                "👤 Executed By",

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
                                "🗑️ Deleted",

                            value:
                                `${deletedTotal} messages`
                        }

                    );


                    await sendLog(
                        interaction.guild,
                        logEmbed
                    );


                    return;
                }


                // ==========================================
                // TICKET PANEL
                // ==========================================

                if (
                    interaction.commandName ===
                    "ticketpanel"
                ) {

                    if (
                        !isAdmin(
                            interaction.member
                        )
                    ) {

                        return interaction.reply({
                            content:
                                "❌ Only administrators can create the ticket panel.",

                            flags:
                                MessageFlags.Ephemeral
                        });

                    }


                    if (
                        !fs.existsSync(
                            TICKET_BANNER_FILE
                        )
                    ) {

                        return interaction.reply({
                            content:
                                `❌ The ticket banner **${TICKET_BANNER_NAME}** was not found. Place the file in the same folder as your bot index.`,

                            flags:
                                MessageFlags.Ephemeral
                        });

                    }


                    const menu =
                        new StringSelectMenuBuilder()

                            .setCustomId(
                                "ticket_menu"
                            )

                            .setPlaceholder(
                                "🎟️ Select Support Area"
                            )

                            .addOptions([
                                {
                                    label:
                                        "General Support",

                                    description:
                                        "Fragen, Probleme & allgemeine Anliegen",

                                    emoji:
                                        "💠",

                                    value:
                                        "clan_application"
                                },
                                {
                                    label:
                                        "Staff Application",

                                    description:
                                        "Apply for the VIBE staff team",

                                    emoji:
                                        "👥",

                                    value:
                                        "staff_application"
                                },
                                {
                                    label:
                                        "Building Service",

                                    description:
                                        "Application or Build Request",

                                    emoji:
                                        "🏗️",

                                    value:
                                        "building_service"
                                },
                                {
                                    label:
                                        "Giveaway Support",

                                    description:
                                        "Hilfe bei Giveaways & Gewinnen",

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


                    const container =
                        new ContainerBuilder()

                            .setAccentColor(
                                0xD49A16
                            )

                            .addMediaGalleryComponents(
                                new MediaGalleryBuilder()
                                    .addItems(
                                        new MediaGalleryItemBuilder()
                                            .setURL(
                                                `attachment://${TICKET_BANNER_NAME}`
                                            )
                                    )
                            )

                            .addTextDisplayComponents(
                                new TextDisplayBuilder()
                                    .setContent(
`# 🎫 VIBE Support Center
-# Private Support • Fast • Clear • Direct

Welcome im **VIBE Support Center**.
Select the area below that best matches your request.`
                                    )
                            )

                            .addSeparatorComponents(
                                new SeparatorBuilder()
                                    .setDivider(
                                        true
                                    )
                                    .setSpacing(
                                        SeparatorSpacingSize.Small
                                    )
                            )

                            .addTextDisplayComponents(
                                new TextDisplayBuilder()
                                    .setContent(
`> 💠 **GENERAL SUPPORT**
> Questions, problems, or other requests related to VIBE.

> 👥 **STAFF APPLICATION**
> Want to join the staff team? Start your application here.

> 🏗️ **BUILDING SERVICE**
> Build request or application for our building service.

> 🎁 **GIVEAWAY SUPPORT**
> Problems, questions, or help related to our giveaways.`
                                    )
                            )

                            .addSeparatorComponents(
                                new SeparatorBuilder()
                                    .setDivider(
                                        true
                                    )
                                    .setSpacing(
                                        SeparatorSpacingSize.Small
                                    )
                            )

                            .addTextDisplayComponents(
                                new TextDisplayBuilder()
                                    .setContent(
`### ⚡ SO FUNKTIONIERT'S
> **1.** Select a category
> **2.** Fill out the form
> **3.** A private ticket is created automatically
> **4.** Live status shows the current progress at any time
> **5.** After completion, you can rate the support experience with ⭐ 1–5

-# Please create only one ticket per request.`
                                    )
                            )

                            .addActionRowComponents(
                                row
                            )

                            .addTextDisplayComponents(
                                new TextDisplayBuilder()
                                    .setContent(
                                        "-# VIBE CORE • Support Infrastructure"
                                    )
                            );


                    return interaction.reply({

                        components: [
                            container
                        ],

                        files: [
                            {
                                attachment:
                                    TICKET_BANNER_FILE,

                                name:
                                    TICKET_BANNER_NAME
                            }
                        ],

                        flags:
                            MessageFlags.IsComponentsV2

                    });

                }

                return;
            }


            // ==========================================
            // ABSENCE FORMULAR ABSENDEN
            // ==========================================

            if (
                interaction.isModalSubmit() &&

                interaction.customId ===
                    "absence_modal"
            ) {

                if (
                    !interaction.member ||
                    !interaction.member.roles ||

                    !interaction.member.roles.cache.has(
                        STAFF_ROLE_ID
                    )
                ) {

                    return interaction.reply({

                        content:
                            "❌ You are not allowed to use this command.",

                        flags:
                            MessageFlags.Ephemeral

                    });

                }


                if (
                    !/^\d{17,20}$/.test(
                        ABSENCE_ROLE_ID
                    )
                ) {

                    return interaction.reply({

                        content:
                            "❌ The **ABSENCE_ROLE_ID** has not been configured in the code yet.",

                        flags:
                            MessageFlags.Ephemeral

                    });

                }


                const startText =
                    interaction.fields
                        .getTextInputValue(
                            "absence_start"
                        )
                        .trim();


                const endText =
                    interaction.fields
                        .getTextInputValue(
                            "absence_end"
                        )
                        .trim();


                const reason =
                    interaction.fields
                        .getTextInputValue(
                            "absence_reason"
                        )
                        .trim();


                const startDate =
                    parseAbsenceDate(
                        startText
                    );


                const endUnknown =
                    /^(unknown|i don't know|dont know|not sure)$/i.test(endText);

                const endDate =
                    endUnknown
                        ? null
                        : parseAbsenceDate(endText);


                if (!startDate || (!endUnknown && !endDate)) {
                    return interaction.reply({
                        content: "❌ Please enter a valid start date. For the end date, use e.g. **05.09.2026** or **Unknown**.",
                        flags: MessageFlags.Ephemeral
                    });
                }


                if (
                    endDate &&
                    endDate.timestamp <
                    startDate.timestamp
                ) {

                    return interaction.reply({

                        content:
                            "❌ The end date cannot be before the start date.",

                        flags:
                            MessageFlags.Ephemeral

                    });

                }


                const startAt =
                    getBerlinTimestamp(
                        startDate,
                        0,
                        0,
                        0
                    );


                // If set to "Unknown", there is no automatic end date.
                const endAt =
                    endDate
                        ? getBerlinTimestamp(endDate, 23, 59, 59)
                        : null;


                if (
                    endAt !== null &&
                    endAt <=
                    Date.now()
                ) {

                    return interaction.reply({

                        content:
                            "❌ The end of your absence is already in the past.",

                        flags:
                            MessageFlags.Ephemeral

                    });

                }


                const absenceRole =
                    interaction.guild.roles.cache.get(
                        ABSENCE_ROLE_ID
                    ) ||

                    await interaction.guild.roles.fetch(
                        ABSENCE_ROLE_ID
                    )
                        .catch(
                            () => null
                        );


                if (
                    !absenceRole
                ) {

                    return interaction.reply({

                        content:
                            "❌ The absence role was not found. Check **ABSENCE_ROLE_ID**.",

                        flags:
                            MessageFlags.Ephemeral

                    });

                }


                try {

                    await interaction.member.roles.add(
                        absenceRole,
                        endDate ? `Absent until ${formatAbsenceDate(endDate)}` : "Absence end unknown"
                    );


                } catch (error) {

                    console.error(
                        "❌ Error assigning absence role:",
                        error
                    );


                    return interaction.reply({

                        content:
                            "❌ I could not give you the absence role. Make sure my bot role is **above** the absence role and I have **Manage Roles**.",

                        flags:
                            MessageFlags.Ephemeral

                    });

                }


                const entry = {

                    userId:
                        interaction.user.id,


                    guildId:
                        interaction.guild.id,


                    channelId:
                        interaction.channel.id,


                    messageId:
                        null,


                    startText:
                        formatAbsenceDate(
                            startDate
                        ),


                    endText:
                        endDate ? formatAbsenceDate(endDate) : "Unknown",


                    startAt,


                    endAt,


                    reason:
                        reason,


                    avatarUrl:
                        interaction.user
                            .displayAvatarURL({
                                size:
                                    256
                            }),


                    lastRemainingHours:
                        endAt !== null ? getRemainingAbsenceHours(endAt) : null,


                    createdAt:
                        Date.now()

                };


                const absenceMessage =
                    await interaction.channel.send({

                        embeds: [
                            createAbsenceEmbed(
                                entry,
                                false
                            )
                        ]

                    });


                entry.messageId =
                    absenceMessage.id;


                absenceStore.entries[
                    interaction.user.id
                ] =
                    entry;


                saveAbsenceStore();


                await interaction.reply({

                    content:
                        `✅ Your absence was saved and the role ${absenceRole} was assigned to you. It will be removed automatically when the absence ends.`,

                    flags:
                        MessageFlags.Ephemeral

                });


                return;
            }


            // ==========================================
            // SAY MODAL
            // ==========================================

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
                            "❌ Only administrators can use `/say`.",

                        flags:
                            MessageFlags.Ephemeral

                    });

                }


                const messageText =
                    interaction.fields
                        .getTextInputValue(
                            "say_message"
                        )
                        .trim();


                const sayMessage =
                    resolveSayRoleMentions(
                        interaction.guild,
                        messageText
                    );


                await interaction.reply({

                    content:
                        "✅ Message sent.",

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


            // ==========================================
            // GIVEAWAY MODAL
            // ==========================================

            if (
                interaction.isModalSubmit() &&

                interaction.customId ===
                    "create_giveaway_modal"
            ) {

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
`❌ Invalide Dauer.

Examples:
• \`10 minuten\`
• \`2 hourn\`
• \`1 day\`
• \`30m\`
• \`2h\`
• \`1d\``,

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
                            "❌ The number of winners must be between **1 and 20**.",

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
                            "Participate"
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
                        `✅ The giveaway was created successfully!\n${giveawayMessage.url}`

                });


                return;
            }


            // ==========================================
            // TICKET SELECT MENU
            // ==========================================

            if (
                interaction.isStringSelectMenu() &&

                interaction.customId ===
                    "ticket_menu"
            ) {

                const selected =
                    interaction.values[0];


                if (
                    selected ===
                    "giveaway"
                ) {

                    await interaction.deferReply({
                        flags:
                            MessageFlags.Ephemeral
                    });


                    return createTicketChannel(

                        interaction,

                        {
                            name:
                                `giveaway-${interaction.user.username.toLowerCase()}`,

                            title:
                                "🎁 Giveaway",

                            categoryId:
                                GIVEAWAY_CATEGORY_ID
                        },

                        []

                    );

                }


                if (
                    selected ===
                    "clan_application"
                ) {

                    const modal =
                        new ModalBuilder()

                            .setCustomId(
                                "ticket_form_support"
                            )

                            .setTitle(
                                "General Support"
                            );


                    const anliegen =
                        new TextInputBuilder()

                            .setCustomId(
                                "support_anliegen"
                            )

                            .setLabel(
                                "What do you need help with?"
                            )

                            .setPlaceholder(
                                "Describe your request..."
                            )

                            .setStyle(
                                TextInputStyle.Paragraph
                            )

                            .setRequired(
                                true
                            )

                            .setMaxLength(
                                1000
                            );


                    modal.addComponents(

                        new ActionRowBuilder()
                            .addComponents(
                                anliegen
                            )

                    );


                    await interaction.showModal(
                        modal
                    );


                    return;
                }


                if (
                    selected ===
                    "staff_application"
                ) {

                    const modal =
                        new ModalBuilder()

                            .setCustomId(
                                "ticket_form_staff"
                            )

                            .setTitle(
                                "Staff Application"
                            );


                    const alter =
                        new TextInputBuilder()

                            .setCustomId(
                                "team_alter"
                            )

                            .setLabel(
                                "How old are you?"
                            )

                            .setStyle(
                                TextInputStyle.Short
                            )

                            .setRequired(
                                true
                            );


                    const playtimeHours =
                        new TextInputBuilder()

                            .setCustomId(
                                "staff_playtime"
                            )

                            .setLabel(
                                "How many playtime hours on OPSUCHT?"
                            )

                            .setStyle(
                                TextInputStyle.Short
                            )

                            .setRequired(
                                true
                            );


                    const requestedRole =
                        new TextInputBuilder()

                            .setCustomId(
                                "staff_role"
                            )

                            .setLabel(
                                "Which role are you applying for?"
                            )

                            .setStyle(
                                TextInputStyle.Short
                            )

                            .setRequired(
                                true
                            );


                    const hadRoleBefore =
                        new TextInputBuilder()

                            .setCustomId(
                                "staff_role_before"
                            )

                            .setLabel(
                                "Have you had this role before?"
                            )

                            .setStyle(
                                TextInputStyle.Short
                            )

                            .setRequired(
                                true
                            );


                    const infos =
                        new TextInputBuilder()

                            .setCustomId(
                                "staff_info"
                            )

                            .setLabel(
                                "Information about you (optional)"
                            )

                            .setStyle(
                                TextInputStyle.Paragraph
                            )

                            .setRequired(
                                false
                            )

                            .setMaxLength(
                                1000
                            );


                    modal.addComponents(

                        new ActionRowBuilder()
                            .addComponents(
                                alter
                            ),

                        new ActionRowBuilder()
                            .addComponents(
                                playtimeHours
                            ),

                        new ActionRowBuilder()
                            .addComponents(
                                requestedRole
                            ),

                        new ActionRowBuilder()
                            .addComponents(
                                hadRoleBefore
                            ),

                        new ActionRowBuilder()
                            .addComponents(
                                infos
                            )

                    );


                    await interaction.showModal(
                        modal
                    );


                    return;
                }


                if (
                    selected ===
                    "building_service"
                ) {

                    const modal =
                        new ModalBuilder()

                            .setCustomId(
                                "ticket_form_building"
                            )

                            .setTitle(
                                "Building Service"
                            );


                    const art =
                        new TextInputBuilder()

                            .setCustomId(
                                "building_type"
                            )

                            .setLabel(
                                "Application or Build Request?"
                            )

                            .setPlaceholder(
                                "Application or Build Request"
                            )

                            .setStyle(
                                TextInputStyle.Short
                            )

                            .setRequired(
                                true
                            );


                    const buildRequest =
                        new TextInputBuilder()

                            .setCustomId(
                                "build_request"
                            )

                            .setLabel(
                                "What should we build for you?"
                            )

                            .setPlaceholder(
                                "Only for build requests"
                            )

                            .setStyle(
                                TextInputStyle.Paragraph
                            )

                            .setRequired(
                                false
                            );


                    const alter =
                        new TextInputBuilder()

                            .setCustomId(
                                "building_age"
                            )

                            .setLabel(
                                "How old are you?"
                            )

                            .setPlaceholder(
                                "Only for applications"
                            )

                            .setStyle(
                                TextInputStyle.Short
                            )

                            .setRequired(
                                false
                            );


                    const vorzeigen =
                        new TextInputBuilder()

                            .setCustomId(
                                "building_showcase"
                            )

                            .setLabel(
                                "Can you show us some previous work?"
                            )

                            .setPlaceholder(
                                "Only for applications"
                            )

                            .setStyle(
                                TextInputStyle.Paragraph
                            )

                            .setRequired(
                                false
                            );


                    const aktiv =
                        new TextInputBuilder()

                            .setCustomId(
                                "building_activity"
                            )

                            .setLabel(
                                "How active are you during the week?"
                            )

                            .setPlaceholder(
                                "Only for applications"
                            )

                            .setStyle(
                                TextInputStyle.Short
                            )

                            .setRequired(
                                false
                            );


                    modal.addComponents(

                        new ActionRowBuilder()
                            .addComponents(
                                art
                            ),

                        new ActionRowBuilder()
                            .addComponents(
                                buildRequest
                            ),

                        new ActionRowBuilder()
                            .addComponents(
                                alter
                            ),

                        new ActionRowBuilder()
                            .addComponents(
                                vorzeigen
                            ),

                        new ActionRowBuilder()
                            .addComponents(
                                aktiv
                            )

                    );


                    await interaction.showModal(
                        modal
                    );


                    return;
                }

            }


            // ==========================================
            // BIRTHDAY MODAL
            // ==========================================

            if (
                interaction.isModalSubmit() &&

                interaction.customId ===
                    "birthday_modal"
            ) {

                const birthdayInput =
                    interaction.fields
                        .getTextInputValue(
                            "birthday_date"
                        );


                const parsedBirthday =
                    parseBirthdayInput(
                        birthdayInput
                    );


                if (
                    !parsedBirthday
                ) {

                    return interaction.reply({

                        content:
                            "❌ Invalid date. Please use e.g. **09.05.2011** or **09.05.**",

                        flags:
                            MessageFlags.Ephemeral

                    });

                }


                const existed =
                    Boolean(
                        birthdayStore.birthdays[
                            interaction.user.id
                        ]
                    );


                birthdayStore.birthdays[
                    interaction.user.id
                ] = {

                    day:
                        parsedBirthday.day,

                    month:
                        parsedBirthday.month,

                    year:
                        parsedBirthday.year,

                    username:
                        interaction.user.username,

                    updatedAt:
                        Date.now()

                };


                if (
                    birthdayStore.announced
                ) {

                    delete birthdayStore.announced[
                        interaction.user.id
                    ];

                }


                saveBirthdayStore();


                await updateBirthdayListMessage(
                    interaction.guild
                );


                await interaction.reply({

                    content:
                        `${existed ? "✅ Your birthday was changed to" : "✅ Your birthday was saved:"} **${formatBirthdayDate(parsedBirthday)}**`,

                    flags:
                        MessageFlags.Ephemeral

                });


                await checkBirthdays();


                return;
            }


            // ==========================================
            // SUPPORT FORM
            // ==========================================

            if (
                interaction.isModalSubmit() &&

                interaction.customId ===
                    "ticket_form_support"
            ) {

                await interaction.deferReply({
                    flags:
                        MessageFlags.Ephemeral
                });


                return createTicketChannel(

                    interaction,

                    {
                        name:
                            `support-${interaction.user.username.toLowerCase()}`,

                        title:
                            "🛡️ General Support",

                        categoryId:
                            TICKET_CATEGORY_ID
                    },

                    [
                        {
                            question:
                                "What do you need help with?",

                            answer:
                                interaction.fields
                                    .getTextInputValue(
                                        "support_anliegen"
                                    )
                        }
                    ]

                );
            }


            // ==========================================
            // STAFF APPLICATION FORM
            // ==========================================

            if (
                interaction.isModalSubmit() &&

                interaction.customId ===
                    "ticket_form_staff"
            ) {

                await interaction.deferReply({
                    flags:
                        MessageFlags.Ephemeral
                });


                return createTicketChannel(

                    interaction,

                    {
                        name:
                            `application-${interaction.user.username.toLowerCase()}`,

                        title:
                            "👥 Staff Application",

                        categoryId:
                            TICKET_CATEGORY_ID
                    },

                    [

                        {
                            question:
                                "How old are you?",

                            answer:
                                interaction.fields
                                    .getTextInputValue(
                                        "team_alter"
                                    )
                        },

                        {
                            question:
                                "How many playtime hours do you have on OPSUCHT?",

                            answer:
                                interaction.fields
                                    .getTextInputValue(
                                        "staff_playtime"
                                    )
                        },

                        {
                            question:
                                "Which role are you applying for?",

                            answer:
                                interaction.fields
                                    .getTextInputValue(
                                        "staff_role"
                                    )
                        },

                        {
                            question:
                                "Have you had this role before?",

                            answer:
                                interaction.fields
                                    .getTextInputValue(
                                        "staff_role_before"
                                    )
                        },

                        {
                            question:
                                "Information about you (optional)",

                            answer:
                                interaction.fields
                                    .getTextInputValue(
                                        "staff_info"
                                    ) ||
                                "Not provided"
                        }

                    ]

                );
            }


            // ==========================================
            // BUILDING SERVICE FORM
            // ==========================================

            if (
                interaction.isModalSubmit() &&

                interaction.customId ===
                    "ticket_form_building"
            ) {

                await interaction.deferReply({
                    flags:
                        MessageFlags.Ephemeral
                });


                return createTicketChannel(

                    interaction,

                    {
                        name:
                            `build-${interaction.user.username.toLowerCase()}`,

                        title:
                            "🏗️ Building Service",

                        categoryId:
                            TICKET_CATEGORY_ID
                    },

                    [

                        {
                            question:
                                "Do you want to apply or request a build?",

                            answer:
                                interaction.fields
                                    .getTextInputValue(
                                        "building_type"
                                    )
                        },

                        {
                            question:
                                "What should we build for you? (Build request)",

                            answer:
                                interaction.fields
                                    .getTextInputValue(
                                        "build_request"
                                    ) ||
                                "Not provided"
                        },

                        {
                            question:
                                "How old are you? (Application)",

                            answer:
                                interaction.fields
                                    .getTextInputValue(
                                        "building_age"
                                    ) ||
                                "Not provided"
                        },

                        {
                            question:
                                "Can you show us some previous work? (Application)",

                            answer:
                                interaction.fields
                                    .getTextInputValue(
                                        "building_showcase"
                                    ) ||
                                "Not provided"
                        },

                        {
                            question:
                                "How active are you during the week? (Application)",

                            answer:
                                interaction.fields
                                    .getTextInputValue(
                                        "building_activity"
                                    ) ||
                                "Not provided"
                        }

                    ]

                );
            }


            // ==========================================
            // TICKET CLOSURE REASON
            // ==========================================

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
                            "❌ Only members with the staff role can start a ticket closure.",

                        flags:
                            MessageFlags.Ephemeral

                    });

                }


                const data =
                    getTicketData(
                        interaction.channel
                    );


                if (
                    !data
                ) {

                    return interaction.reply({

                        content:
                            "❌ Ticket data was not found.",

                        flags:
                            MessageFlags.Ephemeral

                    });

                }


                if (
                    data.pendingClose
                ) {

                    return interaction.reply({

                        content:
                            "❌ A closure request is already active for this ticket.",

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
                            "Yes, Close"
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
                            "No, offen lassen"
                        )

                        .setEmoji(
                            "❌"
                        )

                        .setStyle(
                            ButtonStyle.Secondary
                        );


                const row =
                    new ActionRowBuilder()
                        .addComponents(
                            yesButton,
                            noButton
                        );


                const embed =
                    new EmbedBuilder()

                        .setColor(
                            "#FEE75C"
                        )

                        .setTitle(
                            "🔒 Close Ticket?"
                        )

                        .setDescription(
`<@${data.ownerId}>, do you really want to close your ticket?

📝 **Reason:** ${safeText(reason, "No reason provided")}

Only the ticket creator can select **Yes** or **No**.`
                        )

                        .setFooter({
                            text:
                                `Closure requested by ${interaction.user.tag}`
                        })

                        .setTimestamp();


                await interaction.reply({

                    content:
                        `<@${data.ownerId}>`,

                    embeds: [
                        embed
                    ],

                    components: [
                        row
                    ],

                    allowedMentions: {
                        users: [
                            data.ownerId
                        ]
                    }

                });


                return;
            }


            // ==========================================
            // TICKET FORWARD USER SELECT
            // ==========================================

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
                            "❌ Only staff members can forward tickets."
                    });

                }


                const selectedUserId =
                    interaction.values[0];


                const selectedMember =
                    await interaction.guild.members.fetch(
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
                            "❌ Please select a valid staff member."
                    });

                }


                const data =
                    getTicketData(
                        interaction.channel
                    );


                if (
                    !data
                ) {

                    return interaction.editReply({
                        content:
                            "❌ Ticket data not found."
                    });

                }


                await interaction.channel
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


                await refreshTicketDashboard(
                    interaction.channel,
                    data
                );


                await interaction.channel.send({

                    content:
                        `${selectedMember}`,

                    embeds: [
                        new EmbedBuilder()

                            .setColor(
                                "#5865F2"
                            )

                            .setTitle(
                                "➡️ Ticket Forwarded"
                            )

                            .setDescription(
`This ticket was forwarded.

👤 **From:** ${interaction.user}

🎯 **To:** ${selectedMember}`
                            )

                            .setTimestamp()
                    ]

                });


                return interaction.editReply({
                    content:
                        `✅ Ticket was forwarded to ${selectedMember}.`
                });
            }


            // ==========================================
            // BUTTONS
            // ==========================================

            if (
                interaction.isButton()
            ) {

                // ==========================================
                // TICKET-BEWERTUNG AUS DM
                // ==========================================
                if (interaction.customId.startsWith("ticket_rating_")) {
                    const match =
                        interaction.customId.match(
                            /^ticket_rating_([1-5])_(\d{17,20})_(\d{17,20})$/
                        );

                    if (!match) {
                        return interaction.reply({
                            content: "❌ This rating is invalid.",
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    const stars = Number(match[1]);
                    const ownerId = match[2];
                    const ticketChannelId = match[3];

                    if (interaction.user.id !== ownerId) {
                        return interaction.reply({
                            content: "❌ This ticket rating does not belong to you.",
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    const guild =
                        client.guilds.cache.get(GUILD_ID) ||
                        await client.guilds.fetch(GUILD_ID).catch(() => null);

                    if (!guild) {
                        return interaction.reply({
                            content: "❌ The rating could not be saved right now.",
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    const ratingChannel =
                        guild.channels.cache.get(TICKET_TRANSCRIPT_CHANNEL_ID) ||
                        await guild.channels.fetch(TICKET_TRANSCRIPT_CHANNEL_ID).catch(() => null);

                    if (!ratingChannel || !ratingChannel.isTextBased()) {
                        return interaction.reply({
                            content: "❌ The rating log channel was not found.",
                            flags: MessageFlags.Ephemeral
                        });
                    }

                    const starsText =
                        "⭐".repeat(stars) +
                        "☆".repeat(5 - stars);

                    await ratingChannel.send({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(
                                    stars >= 4
                                        ? "#57F287"
                                        : stars === 3
                                            ? "#FEE75C"
                                            : "#ED4245"
                                )
                                .setTitle("⭐ New Ticket Rating")
                                .addFields(
                                    {
                                        name: "👤 Member",
                                        value: `<@${interaction.user.id}> (\`${interaction.user.id}\`)`,
                                        inline: false
                                    },
                                    {
                                        name: "🎫 Ticket ID",
                                        value: `\`${ticketChannelId}\``,
                                        inline: true
                                    },
                                    {
                                        name: "⭐ Bewertung",
                                        value: `**${stars}/5**\n${starsText}`,
                                        inline: true
                                    }
                                )
                                .setFooter({
                                    text: "VIBE • Ticket System"
                                })
                                .setTimestamp()
                        ]
                    });

                    const disabledComponents =
                        interaction.message.components.map(row => {
                            const newRow =
                                new ActionRowBuilder();

                            for (const component of row.components) {
                                newRow.addComponents(
                                    ButtonBuilder.from(component)
                                        .setDisabled(true)
                                );
                            }

                            return newRow;
                        });

                    await interaction.update({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("#57F287")
                                .setTitle("✅ Thank you for your rating!")
                                .setDescription(
                                    `You rated your support experience **${stars}/5 stars**.\n\n${starsText}`
                                )
                                .setFooter({
                                    text: "VIBE • Ticket Rating"
                                })
                                .setTimestamp()
                        ],
                        components: disabledComponents
                    });

                    return;
                }

                // Birthday
                if (
                    interaction.customId ===
                    "birthday_open_modal"
                ) {

                    const existing =
                        birthdayStore.birthdays[
                            interaction.user.id
                        ];


                    const modal =
                        new ModalBuilder()

                            .setCustomId(
                                "birthday_modal"
                            )

                            .setTitle(
                                "Enter Birthday"
                            );


                    const dateInput =
                        new TextInputBuilder()

                            .setCustomId(
                                "birthday_date"
                            )

                            .setLabel(
                                "Wann hast du Birthday?"
                            )

                            .setPlaceholder(
                                "z. B. 09.05.2011"
                            )

                            .setStyle(
                                TextInputStyle.Short
                            )

                            .setRequired(
                                true
                            )

                            .setMaxLength(
                                10
                            );


                    if (
                        existing
                    ) {

                        dateInput.setValue(
                            formatBirthdayDate(
                                existing
                            )
                        );

                    }


                    modal.addComponents(

                        new ActionRowBuilder()
                            .addComponents(
                                dateInput
                            )

                    );


                    await interaction.showModal(
                        modal
                    );


                    return;
                }


                // ==========================================
                // JOIN GIVEAWAY
                // ==========================================

                if (
                    interaction.customId.startsWith(
                        "giveaway_join_"
                    )
                ) {

                    await interaction.deferReply({
                        flags:
                            MessageFlags.Ephemeral
                    });


                    const giveawayId =
                        interaction.customId
                            .replace(
                                "giveaway_join_",
                                ""
                            );


                    const data =
                        giveawayData.get(
                            giveawayId
                        );


                    if (
                        !data
                    ) {

                        return interaction.editReply({
                            content:
                                "❌ This giveaway is no longer active."
                        });

                    }


                    if (
                        data.ended ||
                        Date.now() >=
                            data.endAt
                    ) {

                        return interaction.editReply({
                            content:
                                "❌ This giveaway has already ended."
                        });

                    }


                    if (isGiveawayRoleExcluded(interaction.member)) {
                        return interaction.editReply({
                            content: "❌ Leader and Co-Leader may not participate in giveaways."
                        });
                    }

                    if (isGiveawayBlocked(interaction.user.id)) {
                        return interaction.editReply({
                            content: "❌ You are blocked from participating in giveaways."
                        });
                    }


                    if (
                        data.participants.has(
                            interaction.user.id
                        )
                    ) {

                        return interaction.editReply({
                            content:
                                "🎉 You are already participating in the giveaway!"
                        });

                    }


                    data.participants.add(
                        interaction.user.id
                    );


                    await interaction.message.edit({

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
                            "🎉 **You are now participating in the giveaway!**\n\n🍀 Good luck!"

                    });
                }


                // ==========================================
                // CLAIM
                // ==========================================

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
                                "❌ Only members with the staff role can claim tickets."

                        });

                    }


                    const data =
                        getTicketData(
                            interaction.channel
                        );


                    if (
                        !data
                    ) {

                        return interaction.editReply({
                            content:
                                "❌ Ticket data was not found."
                        });

                    }


                    if (
                        data.claimedBy
                    ) {

                        return interaction.editReply({

                            content:
                                `❌ This ticket has already been claimed by <@${data.claimedBy}> claimed.`

                        });

                    }


                    data.claimedBy =
                        interaction.user.id;


                    await refreshTicketDashboard(
                        interaction.channel,
                        data
                    );


                    await interaction.channel.send({

                        embeds: [
                            new EmbedBuilder()

                                .setColor(
                                    "#57F287"
                                )

                                .setTitle(
                                    "📌 Ticket Claimed"
                                )

                                .setDescription(
                                    `The ticket was claimed by ${interaction.user}.`
                                )

                                .setTimestamp()
                        ]

                    });


                    return interaction.editReply({
                        content:
                            "✅ You claimed the ticket."
                    });
                }


                // ==========================================
                // FORWARD
                // ==========================================

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
                                "❌ Only members with the staff role can forward tickets.",

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
                                "Select Staff Member"
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
                            "➡️ Select the staff member:",

                        components: [
                            row
                        ],

                        flags:
                            MessageFlags.Ephemeral

                    });
                }


                // ==========================================
                // CLOSE
                // ==========================================

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
                                "❌ Only members with the staff role can use this ticket button.",

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }


                    const data =
                        getTicketData(
                            interaction.channel
                        );


                    if (
                        !data
                    ) {

                        return interaction.reply({

                            content:
                                "❌ Ticket data was not found.",

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }


                    if (
                        data.pendingClose
                    ) {

                        return interaction.reply({

                            content:
                                "❌ A closure request is already active for this ticket.",

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
                                "Close Ticket"
                            );


                    const reasonInput =
                        new TextInputBuilder()

                            .setCustomId(
                                "ticket_close_reason"
                            )

                            .setLabel(
                                "Reason"
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


                // ==========================================
                // TICKET CLOSE YES
                // ==========================================

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
                                "❌ There is no active closure request.",

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
                                "❌ Only the ticket creator can confirm this closure.",

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


                    if (
                        !logSent
                    ) {

                        data.pendingClose =
                            null;


                        await channel.send({

                            content:
                                "❌ The ticket was **not** deleted because the transcript could not be sent to the ticket log channel."

                        });


                        return;
                    }


                    await channel.send({

                        embeds: [
                            new EmbedBuilder()

                                .setColor(
                                    "#ED4245"
                                )

                                .setTitle(
                                    "🔒 Ticket Is Closing"
                                )

                                .setDescription(
`The ticket was confirmed by ${interaction.user} and will now be closed.

📝 **Reason:** ${safeText(closeData.reason, "No reason provided")}

📄 The transcript was saved in the ticket log.`
                                )

                                .setTimestamp()
                        ]

                    });


                    // ==========================================
                    // TICKET-BEWERTUNG PER DM
                    // ==========================================
                    const ticketOwner =
                        await client.users.fetch(data.ownerId)
                            .catch(() => null);

                    if (ticketOwner) {
                        const ratingRow =
                            new ActionRowBuilder()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId(`ticket_rating_1_${data.ownerId}_${channel.id}`)
                                        .setLabel("1 Stern")
                                        .setEmoji("⭐")
                                        .setStyle(ButtonStyle.Secondary),

                                    new ButtonBuilder()
                                        .setCustomId(`ticket_rating_2_${data.ownerId}_${channel.id}`)
                                        .setLabel("2 Sterne")
                                        .setEmoji("⭐")
                                        .setStyle(ButtonStyle.Secondary),

                                    new ButtonBuilder()
                                        .setCustomId(`ticket_rating_3_${data.ownerId}_${channel.id}`)
                                        .setLabel("3 Sterne")
                                        .setEmoji("⭐")
                                        .setStyle(ButtonStyle.Primary),

                                    new ButtonBuilder()
                                        .setCustomId(`ticket_rating_4_${data.ownerId}_${channel.id}`)
                                        .setLabel("4 Sterne")
                                        .setEmoji("⭐")
                                        .setStyle(ButtonStyle.Success),

                                    new ButtonBuilder()
                                        .setCustomId(`ticket_rating_5_${data.ownerId}_${channel.id}`)
                                        .setLabel("5 Sterne")
                                        .setEmoji("⭐")
                                        .setStyle(ButtonStyle.Success)
                                );

                        await ticketOwner.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("#D49A16")
                                    .setTitle("⭐ How was your support experience?")
                                    .setDescription(
                                        "Your ticket was closed.\n\n" +
                                        "Please rate your experience with our staff from **1 to 5 stars**."
                                    )
                                    .addFields(
                                        {
                                            name: "🎫 Ticket",
                                            value: `\`${channel.name}\``,
                                            inline: true
                                        },
                                        {
                                            name: "📂 Category",
                                            value: safeText(data.categoryTitle, "Unknown"),
                                            inline: true
                                        }
                                    )
                                    .setFooter({
                                        text: "VIBE • Ticket Rating"
                                    })
                                    .setTimestamp()
                            ],
                            components: [
                                ratingRow
                            ]
                        }).catch(error => {
                            console.log(
                                `⚠️ Ticket Ratings-DM an ${data.ownerId} could not be sent:`,
                                error?.message || error
                            );
                        });
                    }


                    ticketData.delete(
                        channel.id
                    );


                    setTimeout(
                        async () => {

                            await channel.delete(
                                `Ticket Closed | Reason: ${safeText(closeData.reason, "No reason")}`
                            )
                                .catch(
                                    error => {

                                        console.error(
                                            "❌ Ticket deletion error:",
                                            error
                                        );

                                    }
                                );

                        },

                        1500
                    );


                    return;
                }


                // ==========================================
                // TICKET CLOSE NO
                // ==========================================

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
                                "❌ There is no active closure request.",

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
                                "❌ Only the ticket creator can reject this closure.",

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }


                    data.pendingClose =
                        null;

                    await refreshTicketDashboard(
                        interaction.channel,
                        data
                    );


                    await interaction.update({

                        content:
                            "",


                        embeds: [
                            new EmbedBuilder()

                                .setColor(
                                    "#57F287"
                                )

                                .setTitle(
                                    "✅ Ticket Remains Open"
                                )

                                .setDescription(
                                    `${interaction.user} rejected the closure. The ticket remains open.`
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
                "❌ Interaction error:",
                error
            );


            try {

                if (
                    interaction.deferred ||
                    interaction.replied
                ) {

                    await interaction.editReply({

                        content:
                            "❌ An error occurred."

                    })
                        .catch(
                            () => {}
                        );

                } else {

                    await interaction.reply({

                        content:
                            "❌ An error occurred.",

                        flags:
                            MessageFlags.Ephemeral

                    });

                }


            } catch {}

        }

    }
);


// ==========================================
// GIVEAWAY ENDE
// ==========================================

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


    if (
        timer
    ) {

        clearTimeout(
            timer
        );


        giveawayTimers.delete(
            giveawayId
        );

    }


    const eligibleParticipants =
        [...data.participants].filter(userId => !isGiveawayBlocked(userId));

    const winners =
        pickGiveawayWinners(
            eligibleParticipants,
            data.winnerCount
        );


    data.winnerIds =
        winners;


    const guild =
        client.guilds.cache.get(
            data.guildId
        );


    if (
        !guild
    ) {
        return;
    }


    const channel =
        await guild.channels.fetch(
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
        await channel.messages.fetch(
            data.messageId
        )
            .catch(
                () => null
            );


    if (
        message
    ) {

        const disabledButton =
            new ButtonBuilder()

                .setCustomId(
                    `giveaway_join_${giveawayId}`
                )

                .setLabel(
                    "Giveaway Ended"
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
`🎉 **GIVEAWAY ENDED!** 🎉

🏆 Winners: ${winners.map(id => `<@${id}>`).join(", ")}

🎁 **Prize:** ${data.prize}

Congratulations! 🎊`,


            allowedMentions: {
                users:
                    winners
            }

        });


    } else {

        await channel.send({

            content:
`🎉 **Giveaway Ended!**

Unfortunately, there were no valid participants.

🎁 **Prize:** ${data.prize}`

        });

    }
}


function scheduleGiveawayEnd(
    giveawayId
) {

    const data =
        giveawayData.get(
            giveawayId
        );


    if (
        !data
    ) {
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
                )
                    .catch(
                        error => {

                            console.error(
                                "❌ Giveaway end error:",
                                error
                            );

                        }
                    );


                return;
            }


            const wait =
                Math.min(
                    remaining,
                    2000000000
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


// ==========================================
// SUPPORT WAITING ROOM
// ==========================================

client.on(
    Events.VoiceStateUpdate,

    async (
        oldState,
        newState
    ) => {

        try {

            if (
                newState.channelId !==
                SUPPORT_WAITING_ROOM_ID
            ) {
                return;
            }


            if (
                oldState.channelId ===
                SUPPORT_WAITING_ROOM_ID
            ) {
                return;
            }


            const member =
                newState.member;


            if (
                !member
            ) {
                return;
            }


            const logChannel =
                await newState.guild.channels.fetch(
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
                    "🎧 New Support Request",
                    0x00a8ff,
                    "A user is waiting in the support waiting room."
                );


            embed.addFields(

                {
                    name:
                        "👤 User",

                    value:
                        `${member} (${member.id})`
                },

                {
                    name:
                        "📞 Waiting Room",

                    value:
                        newState.channel
                            ? newState.channel.toString()
                            : "Unknown"
                }

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


            await sendVoiceLog(
                newState.guild,
                embed
            );


        } catch (error) {

            console.error(
                "❌ Voice support error:",
                error
            );

        }

    }
);


// ==========================================
// AUTO ROLE
// ==========================================

client.on(
    Events.GuildMemberAdd,

    async member => {

        try {

            if (
                member.user.bot
            ) {
                return;
            }


            const role =
                member.guild.roles.cache.get(
                    AUTO_ROLE_ID
                ) ||

                await member.guild.roles.fetch(
                    AUTO_ROLE_ID
                )
                    .catch(
                        () => null
                    );


            if (
                !role
            ) {

                console.log(
                    `⚠️ Auto role not found: ${AUTO_ROLE_ID}`
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
                "Automatic role on server join"
            );


            console.log(
                `✅ Auto role ${role.name} assigned to ${member.user.tag}.`
            );


        } catch (error) {

            console.error(
                "❌ Auto role error:",
                error
            );

        }

    }
);


// ==========================================
// WELCOME
// ==========================================

client.on(
    Events.GuildMemberAdd,

    async member => {

        try {

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
                        "⚡ Welcome ⚡"
                    )

                    .setDescription(
`${member} joined the server!

👤 **User:**
${member.user.tag}

🆔 **User ID:**
${member.id}

👥 **Members:**
${member.guild.memberCount}`
                    )

                    .setThumbnail(
                        member.user
                            .displayAvatarURL()
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
                "❌ Welcome error:",
                error
            );

        }

    }
);


// ==========================================
// JOIN LOG
// ==========================================

client.on(
    Events.GuildMemberAdd,

    async member => {
        try {
            const now = Date.now();
            const accountAgeMs = now - member.user.createdTimestamp;
            const accountAgeDays = Math.floor(accountAgeMs / 86400000);
            const createdUnix = Math.floor(member.user.createdTimestamp / 1000);
            const joinedUnix = Math.floor((member.joinedTimestamp || now) / 1000);

            const embed =
                baseEmbed(
                    "🟢 Member Joined",
                    0x57f287,
                    "A new member joined the server."
                );

            embed.setThumbnail(member.displayAvatarURL());

            embed.addFields(
                { name: "👤 User", value: `${member} (${member.user.tag})`, inline: false },
                { name: "🆔 Account ID", value: `\`${member.id}\``, inline: false },
                { name: "📅 Account Created", value: `<t:${createdUnix}:F>\n<t:${createdUnix}:R>`, inline: true },
                { name: "⏲️ Account Age", value: `${accountAgeDays} day${accountAgeDays === 1 ? "" : "s"}`, inline: true },
                { name: "🚪 Joined Server", value: `<t:${joinedUnix}:F>`, inline: false },
                { name: "🤖 Bot Account", value: member.user.bot ? "Yes" : "No", inline: true },
                { name: "👥 Member Count", value: `${member.guild.memberCount}`, inline: true }
            );

            await sendJoinLeaveLog(member.guild, embed);
        } catch (error) {
            console.error("❌ Join log error:", error);
        }
    }
);


// ==========================================
// LEAVE / KICK LOG
// ==========================================

client.on(
    Events.GuildMemberRemove,

    async member => {
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));

            const now = Date.now();
            const joinedAt = member.joinedTimestamp || null;
            const stayedMs = joinedAt ? Math.max(0, now - joinedAt) : null;
            const stayedText = stayedMs === null
                ? "Unknown"
                : formatTimeoutDuration(stayedMs);
            const createdUnix = Math.floor(member.user.createdTimestamp / 1000);
            const joinedUnix = joinedAt ? Math.floor(joinedAt / 1000) : null;
            const entry = await getAuditExecutor(
                member.guild,
                AuditLogEvent.MemberKick,
                member.id
            );

            const wasKicked = Boolean(entry);
            const embed = baseEmbed(
                wasKicked ? "🥾 Member Kicked" : "🔴 Member Left",
                wasKicked ? 0xfaa61a : 0xed4245,
                wasKicked
                    ? "A member was kicked from the server."
                    : "A member left the server."
            );

            embed.setThumbnail(member.user.displayAvatarURL());
            embed.addFields(
                { name: "👤 User", value: `${member.user.tag}`, inline: false },
                { name: "🆔 Account ID", value: `\`${member.id}\``, inline: false },
                { name: "📅 Account Created", value: `<t:${createdUnix}:F>`, inline: true },
                { name: "🚪 Joined Server", value: joinedUnix ? `<t:${joinedUnix}:F>` : "Unknown", inline: true },
                { name: "⏳ Time on Server", value: stayedText, inline: true },
                { name: "🤖 Bot Account", value: member.user.bot ? "Yes" : "No", inline: true },
                { name: "👥 Member Count", value: `${member.guild.memberCount}`, inline: true }
            );

            if (wasKicked) {
                embed.addFields(
                    {
                        name: "🛡️ Moderator",
                        value: entry.executor
                            ? `${entry.executor} (${entry.executor.id})`
                            : "Unknown",
                        inline: false
                    },
                    {
                        name: "📄 Reason",
                        value: safeText(entry.reason, "No reason provided"),
                        inline: false
                    }
                );
            }

            await sendJoinLeaveLog(member.guild, embed);
        } catch (error) {
            console.error("❌ Leave/kick log error:", error);
        }
    }
);


// ==========================================
// BAN LOG
// ==========================================

client.on(
    Events.GuildBanAdd,

    async ban => {

        try {

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
                    "⛔ Member Banned",
                    0x992d22,
                    "A member was banned."
                );


            embed.addFields({

                name:
                    "👤 User",

                value:
                    `${ban.user.tag} (${ban.user.id})`

            });


            if (
                entry
            ) {

                embed.addFields(

                    {
                        name:
                            "🛡️ Responsible Moderator",

                        value:
                            entry.executor
                                ? `${entry.executor} (${entry.executor.id})`
                                : "Unknown"
                    },

                    {
                        name:
                            "📄 Reason",

                        value:
                            safeText(
                                entry.reason,
                                "No reason provided"
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
                "❌ Ban log error:",
                error
            );

        }

    }
);


// ==========================================
// UNBAN LOG
// ==========================================

client.on(
    Events.GuildBanRemove,

    async ban => {

        try {

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
                    "✅ Member Unbanned",
                    0x57f287,
                    "A member was unbanned."
                );


            embed.addFields({

                name:
                    "👤 User",

                value:
                    `${ban.user.tag} (${ban.user.id})`

            });


            if (
                entry
            ) {

                embed.addFields({

                    name:
                        "🛡️ Responsible User",

                    value:
                        entry.executor
                            ? `${entry.executor} (${entry.executor.id})`
                            : "Unknown"

                });

            }


            await sendLog(
                ban.guild,
                embed
            );


        } catch (error) {

            console.error(
                "❌ Unban log error:",
                error
            );

        }

    }
);


// ==========================================
// TIMEOUT LOG
// ==========================================

client.on(
    Events.GuildMemberUpdate,

    async (
        before,
        after
    ) => {

        try {

            const beforeTimeout =
                before.communicationDisabledUntilTimestamp ||
                null;


            const afterTimeout =
                after.communicationDisabledUntilTimestamp ||
                null;


            if (
                beforeTimeout ===
                afterTimeout
            ) {
                return;
            }


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        1200
                    )
            );


            const entry =
                await getTimeoutAuditEntry(
                    after.guild,
                    after.id
                );


            const executor =
                entry &&
                entry.executor

                    ? `${entry.executor} (${entry.executor.id})`

                    : "Unknown / expired automatically";


            const reason =
                entry &&
                entry.reason

                    ? safeText(
                        entry.reason,
                        "No reason provided"
                    )

                    : "No reason provided";


            if (
                afterTimeout &&
                afterTimeout >
                    Date.now()
            ) {

                const durationMs =
                    afterTimeout -
                    Date.now();


                const endUnix =
                    Math.floor(
                        afterTimeout /
                        1000
                    );


                const wasAlreadyTimedOut =
                    beforeTimeout &&
                    beforeTimeout >
                        Date.now();


                const embed =
                    baseEmbed(

                        wasAlreadyTimedOut
                            ? "⏳ Timeout Changed"
                            : "⏳ Timeout vergeben",

                        0xfaa61a,

                        wasAlreadyTimedOut
                            ? "A member timeout was changed."
                            : "A member received a timeout."

                    );


                embed.addFields(

                    {
                        name:
                            "👤 User",

                        value:
                            `${after} (${after.id})`
                    },

                    {
                        name:
                            "⏱️ Dauer",

                        value:
                            formatTimeoutDuration(
                                durationMs
                            ),

                        inline:
                            true
                    },

                    {
                        name:
                            "🕒 End",

                        value:
                            `<t:${endUnix}:f>\n<t:${endUnix}:R>`,

                        inline:
                            true
                    },

                    {
                        name:
                            "🛡️ Timeout By",

                        value:
                            executor
                    },

                    {
                        name:
                            "📄 Reason",

                        value:
                            reason.substring(
                                0,
                                1024
                            )
                    }

                );


                await sendLog(
                    after.guild,
                    embed
                );


                return;
            }


            if (
                beforeTimeout &&
                (
                    !afterTimeout ||
                    afterTimeout <=
                        Date.now()
                )
            ) {

                const embed =
                    baseEmbed(
                        "✅ Timeout Removed",
                        0x57f287,
                        "A member timeout was removed."
                    );


                embed.addFields(

                    {
                        name:
                            "👤 User",

                        value:
                            `${after} (${after.id})`
                    },

                    {
                        name:
                            "🛡️ Removed By",

                        value:
                            executor
                    }

                );


                if (
                    entry &&
                    entry.reason
                ) {

                    embed.addFields({

                        name:
                            "📄 Reason",

                        value:
                            safeText(
                                entry.reason,
                                "No reason provided"
                            )
                                .substring(
                                    0,
                                    1024
                                )

                    });

                }


                await sendLog(
                    after.guild,
                    embed
                );
            }


        } catch (error) {

            console.error(
                "❌ Timeout Logging error:",
                error
            );

        }

    }
);


// ==========================================
// MEMBER UPDATE LOG
// ==========================================

client.on(
    Events.GuildMemberUpdate,

    async (
        before,
        after
    ) => {

        try {

            // Nickname
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
                        "✏️ Nickname Changed",
                        0x5865f2,
                        "A member nickname was changed."
                    );


                embed.addFields(

                    {
                        name:
                            "👤 User",

                        value:
                            `${after} (${after.id})`
                    },

                    {
                        name:
                            "📝 Before",

                        value:
                            safeText(
                                before.nickname,
                                before.user.username
                            )
                    },

                    {
                        name:
                            "📝 After",

                        value:
                            safeText(
                                after.nickname,
                                after.user.username
                            )
                    }

                );


                if (
                    entry &&
                    entry.executor
                ) {

                    embed.addFields({

                        name:
                            "🛡️ Responsible User",

                        value:
                            `${entry.executor} (${entry.executor.id})`

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
                    "👥 Roles Updated",
                    0x5865f2,
                    "A member's roles were changed."
                );


            embed.addFields({

                name:
                    "👤 User",

                value:
                    `${after} (${after.id})`

            });


            if (
                addedRoles.size > 0
            ) {

                embed.addFields({

                    name:
                        "✅ Added",

                    value:
                        addedRoles
                            .map(
                                role =>
                                    role.toString()
                            )
                            .join(
                                "\n"
                            )
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
                        "❌ Removed",

                    value:
                        removedRoles
                            .map(
                                role =>
                                    role.toString()
                            )
                            .join(
                                "\n"
                            )
                            .substring(
                                0,
                                1024
                            )

                });

            }


            if (
                entry &&
                entry.executor
            ) {

                embed.addFields({

                    name:
                        "🛡️ Responsible User",

                    value:
                        `${entry.executor} (${entry.executor.id})`

                });

            }


            await sendLog(
                after.guild,
                embed
            );


        } catch (error) {

            console.error(
                "❌ Member update error:",
                error
            );

        }

    }
);


// ==========================================
// VOICE LOG
// ==========================================

client.on(
    Events.VoiceStateUpdate,

    async (
        before,
        after
    ) => {

        try {

            const member =
                after.member ||
                before.member;


            if (
                !member
            ) {
                return;
            }


            if (
                !before.channel &&
                after.channel
            ) {

                const embed =
                    baseEmbed(
                        "🔊 Joined Voice Channel",
                        0x1abc9c,
                        "A member joined a voice channel."
                    );


                embed.addFields(

                    {
                        name:
                            "👤 User",

                        value:
                            `${member} (${member.id})`
                    },

                    {
                        name:
                            "🔊 Channel",

                        value:
                            after.channel.toString()
                    }

                );


                await sendVoiceLog(
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
                        "🔇 Left Voice Channel",
                        0x2f3136,
                        "A member left a voice channel."
                    );


                embed.addFields(

                    {
                        name:
                            "👤 User",

                        value:
                            `${member} (${member.id})`
                    },

                    {
                        name:
                            "🔊 Channel",

                        value:
                            before.channel.toString()
                    }

                );


                await sendVoiceLog(
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
                        "🔁 Switched Voice Channel",
                        0x1abc9c,
                        "A member switched voice channels."
                    );


                embed.addFields(

                    {
                        name:
                            "👤 User",

                        value:
                            `${member} (${member.id})`
                    },

                    {
                        name:
                            "⬅️ From",

                        value:
                            before.channel.toString()
                    },

                    {
                        name:
                            "➡️ To",

                        value:
                            after.channel.toString()
                    }

                );


                await sendVoiceLog(
                    member.guild,
                    embed
                );

            }


        } catch (error) {

            console.error(
                "❌ Voice logging error:",
                error
            );

        }

    }
);


// ==========================================
// CHANNEL CREATE
// ==========================================

client.on(
    Events.ChannelCreate,

    async channel => {

        try {

            if (
                !channel.guild
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
                    channel.guild,
                    AuditLogEvent.ChannelCreate,
                    channel.id
                );


            const embed =
                baseEmbed(
                    "🏠 Channel Created",
                    0x57f287,
                    "A new channel was created."
                );


            embed.addFields(

                {
                    name:
                        "📁 Channel",

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


            if (
                entry &&
                entry.executor
            ) {

                embed.addFields({

                    name:
                        "🛡️ Responsible User",

                    value:
                        `${entry.executor} (${entry.executor.id})`

                });

            }


            await sendLog(
                channel.guild,
                embed
            );


        } catch (error) {

            console.error(
                "❌ Channel create error:",
                error
            );

        }

    }
);


// ==========================================
// CHANNEL DELETE
// ==========================================

client.on(
    Events.ChannelDelete,

    async channel => {

        try {

            if (
                !channel.guild
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
                    channel.guild,
                    AuditLogEvent.ChannelDelete,
                    channel.id
                );


            const embed =
                baseEmbed(
                    "🗑️ Channel Deleted",
                    0xed4245,
                    "A channel was deleted."
                );


            embed.addFields(

                {
                    name:
                        "📁 Channel",

                    value:
                        `#${safeText(channel.name)}`
                },

                {
                    name:
                        "🆔 ID",

                    value:
                        channel.id
                }

            );


            if (
                entry &&
                entry.executor
            ) {

                embed.addFields({

                    name:
                        "🛡️ Responsible User",

                    value:
                        `${entry.executor} (${entry.executor.id})`

                });

            }


            await sendLog(
                channel.guild,
                embed
            );


        } catch (error) {

            console.error(
                "❌ Channel delete error:",
                error
            );

        }

    }
);


// ==========================================
// ROLE UPDATE
// ==========================================

client.on(
    Events.GuildRoleUpdate,

    async (
        before,
        after
    ) => {

        try {

            const permissionChanges =
                getPermissionChanges(
                    before,
                    after
                );


            const otherChanges =
                [];


            if (
                before.name !==
                after.name
            ) {

                otherChanges.push(
                    `**Name:** ${before.name} → ${after.name}`
                );

            }


            if (
                before.hexColor !==
                after.hexColor
            ) {

                otherChanges.push(
                    `**Farbe:** ${before.hexColor} → ${after.hexColor}`
                );

            }


            if (
                before.hoist !==
                after.hoist
            ) {

                otherChanges.push(
                    `**Display Separately:** ${before.hoist ? "Yes" : "No"} → ${after.hoist ? "Yes" : "No"}`
                );

            }


            if (
                before.mentionable !==
                after.mentionable
            ) {

                otherChanges.push(
                    `**Mentionable:** ${before.mentionable ? "Yes" : "No"} → ${after.mentionable ? "Yes" : "No"}`
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
                    "🛡️ Role Updated",
                    0x5865f2,
                    "A role's settings or permissions were changed."
                );


            embed.addFields({

                name:
                    "🎭 Role",

                value:
`${after}
**Name:** ${after.name}
**ID:** \`${after.id}\``

            });


            if (
                permissionChanges.added.length >
                0
            ) {

                embed.addFields({

                    name:
                        "✅ Permissions Added",

                    value:
                        permissionChanges.added
                            .map(
                                permission =>
                                    `• ${permission}`
                            )
                            .join(
                                "\n"
                            )
                            .substring(
                                0,
                                1024
                            )

                });

            }


            if (
                permissionChanges.removed.length >
                0
            ) {

                embed.addFields({

                    name:
                        "❌ Permissions Removed",

                    value:
                        permissionChanges.removed
                            .map(
                                permission =>
                                    `• ${permission}`
                            )
                            .join(
                                "\n"
                            )
                            .substring(
                                0,
                                1024
                            )

                });

            }


            if (
                otherChanges.length >
                0
            ) {

                embed.addFields({

                    name:
                        "⚙️ Other Changes",

                    value:
                        otherChanges
                            .join(
                                "\n"
                            )
                            .substring(
                                0,
                                1024
                            )

                });

            }


            embed.addFields({

                name:
                    "👮 Changed By",

                value:
                    entry &&
                    entry.executor
                        ? `${entry.executor} (${entry.executor.id})`
                        : "Unknown / audit log unavailable"

            });


            await sendLog(
                after.guild,
                embed
            );


        } catch (error) {

            console.error(
                "❌ Role settings log error:",
                error
            );

        }

    }
);


// ==========================================
// CHANNEL UPDATE
// ==========================================

client.on(
    Events.ChannelUpdate,

    async (
        before,
        after
    ) => {

        try {

            if (
                before.name !==
                after.name
            ) {

                const embed =
                    baseEmbed(
                        "✏️ Channel Name Changed",
                        0x5865f2,
                        "A channel was renamed."
                    );


                embed.addFields(

                    {
                        name:
                            "📁 Channel",

                        value:
                            after.toString()
                    },

                    {
                        name:
                            "📝 Before",

                        value:
                            safeText(
                                before.name
                            )
                    },

                    {
                        name:
                            "📝 After",

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
                        AuditLogEvent.ChannelOverwriteUpdate,
                        after.id
                    );


                const embed =
                    baseEmbed(
                        "🔐 Channel Permissions Updated",
                        0x5865f2,
                        "A channel's permissions were changed."
                    );


                embed.addFields({

                    name:
                        "📁 Channel",

                    value:
                        after.toString()

                });


                if (
                    entry &&
                    entry.executor
                ) {

                    embed.addFields({

                        name:
                            "🛡️ Responsible User",

                        value:
                            `${entry.executor} (${entry.executor.id})`

                    });

                }


                await sendLog(
                    after.guild,
                    embed
                );

            }


        } catch (error) {

            console.error(
                "❌ Channel update error:",
                error
            );

        }

    }
);


// ==========================================
// MESSAGE DELETE
// ==========================================

client.on(
    Events.MessageDelete,

    async message => {

        try {

            if (
                !message.guild
            ) {
                return;
            }


            if (
                message.author &&
                message.author.bot
            ) {
                return;
            }


            const content =
                message.content
                    ? message.content.substring(
                        0,
                        1000
                    )
                    : "*(No text content / embed / attachment)*";


            const embed =
                baseEmbed(
                    "🗑️ Message Deleted",
                    0xed4245,
                    "A message was deleted."
                );


            embed.addFields(

                {
                    name:
                        "👤 Author",

                    value:
                        message.author
                            ? `${message.author} (${message.author.id})`
                            : "Unknown"
                },

                {
                    name:
                        "📍 Channel",

                    value:
                        message.channel
                            ? message.channel.toString()
                            : "Unknown"
                },

                {
                    name:
                        "💬 Content",

                    value:
                        safeText(
                            content,
                            "*(No content)*"
                        )
                            .substring(
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
                "❌ Message Delete Logging error:",
                error
            );

        }

    }
);


// ==========================================
// MESSAGE UPDATE
// ==========================================

client.on(
    Events.MessageUpdate,

    async (
        before,
        after
    ) => {

        try {

            if (
                !before.guild
            ) {
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
                    "✏️ Message Edited",
                    0xfee75c,
                    "A message was edited."
                );


            embed.addFields(

                {
                    name:
                        "👤 Author",

                    value:
                        before.author
                            ? `${before.author} (${before.author.id})`
                            : "Unknown"
                },

                {
                    name:
                        "📍 Channel",

                    value:
                        before.channel
                            ? before.channel.toString()
                            : "Unknown"
                },

                {
                    name:
                        "📝 Before",

                    value:
                        safeText(
                            before.content,
                            "*(leer)*"
                        )
                            .substring(
                                0,
                                1024
                            )
                },

                {
                    name:
                        "📝 After",

                    value:
                        safeText(
                            after.content,
                            "*(leer)*"
                        )
                            .substring(
                                0,
                                1024
                            )
                }

            );


            if (
                after.url
            ) {

                embed.addFields({

                    name:
                        "🔗 Message",

                    value:
                        `[Open Message](${after.url})`

                });

            }


            await sendLog(
                before.guild,
                embed
            );


        } catch (error) {

            console.error(
                "❌ Message Edit Logging error:",
                error
            );

        }

    }
);


// ==========================================
// ERROR HANDLING
// ==========================================

client.on(
    Events.Error,

    error => {

        console.error(
            "❌ Discord client error:",
            error
        );

    }
);


client.on(
    Events.Warn,

    warning => {

        console.warn(
            "⚠️ Discord Warnung:",
            warning
        );

    }
);


process.on(
    "unhandledRejection",

    error => {

        console.error(
            "❌ Unhandled Promise Rejection:",
            error
        );

    }
);


process.on(
    "uncaughtException",

    error => {

        console.error(
            "❌ Uncaught Exception:",
            error
        );

    }
);


// ==========================================
// START MELDUNGEN
// ==========================================

console.log(
    "✅ VIBE bot systems loaded."
);

console.log(
    "✅ Auto role system loaded."
);

console.log(
    "✅ Ticket form system loaded."
);

console.log(
    "✅ Timeout logging loaded."
);

console.log(
    "✅ Birthday system loaded."
);

console.log(
    "✅ Absence system with live remaining time loaded."
);
