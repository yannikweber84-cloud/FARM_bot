require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

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
// WEB SERVER + DASHBOARD
// ======================================================

const app = express();

const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);

app.use(express.json());
app.use(
    express.urlencoded({
        extended: false
    })
);

// ======================================================
// DASHBOARD LOGIN
// ======================================================

const DASHBOARD_USER =
    process.env.DASHBOARD_USER || "kqwii";

const DASHBOARD_PASSWORD =
    process.env.DASHBOARD_PASSWORD || "VIBE-2026";

const dashboardSessions = new Map();

// ======================================================
// COOKIES LESEN
// ======================================================

function parseCookies(req) {

    const cookies = {};

    const cookieHeader =
        req.headers.cookie || "";

    cookieHeader
        .split(";")
        .forEach(cookie => {

            const parts =
                cookie.split("=");

            const key =
                parts.shift()?.trim();

            const value =
                parts.join("=");

            if (key) {

                cookies[key] =
                    decodeURIComponent(
                        value || ""
                    );

            }

        });

    return cookies;

}

// ======================================================
// LOGIN PRÜFEN
// ======================================================

function isDashboardAuthenticated(req) {

    const cookies =
        parseCookies(req);

    const token =
        cookies.vibe_dashboard_session;

    if (!token) {
        return false;
    }

    const expires =
        dashboardSessions.get(token);

    if (!expires) {
        return false;
    }

    if (Date.now() > expires) {

        dashboardSessions.delete(token);

        return false;

    }

    return true;

}

// ======================================================
// LOGIN SEITE
// ======================================================

function dashboardLoginHtml(error = "") {

    return `
<!DOCTYPE html>

<html lang="de">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>VIBE Bot Login</title>

    <style>

        * {
            box-sizing: border-box;
        }

        body {

            margin: 0;

            min-height: 100vh;

            display: flex;

            align-items: center;

            justify-content: center;

            font-family:
                Arial,
                Helvetica,
                sans-serif;

            background:
                #080b12;

            color:
                white;

        }

        .login {

            width:
                400px;

            max-width:
                calc(100% - 30px);

            padding:
                35px;

            border-radius:
                20px;

            background:
                #111722;

            border:
                1px solid #242d3d;

        }

        .logo {

            width:
                55px;

            height:
                55px;

            margin-bottom:
                20px;

            display:
                flex;

            align-items:
                center;

            justify-content:
                center;

            border-radius:
                15px;

            background:
                #5865f2;

            font-size:
                24px;

            font-weight:
                bold;

        }

        h1 {

            margin:
                0 0 5px;

        }

        .description {

            margin-bottom:
                25px;

            color:
                #8f9bb0;

        }

        label {

            display:
                block;

            margin-top:
                16px;

            margin-bottom:
                7px;

            font-size:
                14px;

            color:
                #c3cada;

        }

        input {

            width:
                100%;

            padding:
                13px;

            border:
                1px solid #2d3749;

            border-radius:
                10px;

            outline:
                none;

            background:
                #090e17;

            color:
                white;

            font-size:
                15px;

        }

        input:focus {

            border-color:
                #5865f2;

        }

        button {

            width:
                100%;

            margin-top:
                22px;

            padding:
                13px;

            border:
                none;

            border-radius:
                10px;

            cursor:
                pointer;

            background:
                #5865f2;

            color:
                white;

            font-size:
                15px;

            font-weight:
                bold;

        }

        button:hover {

            background:
                #4752c4;

        }

        .error {

            margin-top:
                15px;

            padding:
                10px;

            border-radius:
                8px;

            background:
                #3b171d;

            color:
                #ff98a5;

        }

    </style>

</head>

<body>

    <div class="login">

        <div class="logo">
            V
        </div>

        <h1>
            VIBE Bot
        </h1>

        <div class="description">
            Admin Dashboard
        </div>

        ${
            error
                ? `<div class="error">${error}</div>`
                : ""
        }

        <form
            method="POST"
            action="/dashboard/login"
        >

            <label>
                Benutzername
            </label>

            <input
                type="text"
                name="username"
                autocomplete="username"
                required
            >

            <label>
                Passwort
            </label>

            <input
                type="password"
                name="password"
                autocomplete="current-password"
                required
            >

            <button type="submit">
                Einloggen
            </button>

        </form>

    </div>

</body>

</html>
`;

}

// ======================================================
// DASHBOARD SEITE
// ======================================================

function dashboardHtml() {

    return `
<!DOCTYPE html>

<html lang="de">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1"
    >

    <title>
        VIBE Bot Dashboard
    </title>

    <style>

        * {
            box-sizing: border-box;
        }

        body {

            margin: 0;

            background:
                #080b12;

            color:
                white;

            font-family:
                Arial,
                Helvetica,
                sans-serif;

        }

        header {

            height:
                70px;

            padding:
                0 30px;

            display:
                flex;

            align-items:
                center;

            justify-content:
                space-between;

            background:
                #0d121c;

            border-bottom:
                1px solid #222b3b;

        }

        .brand {

            display:
                flex;

            align-items:
                center;

            gap:
                12px;

        }

        .logo {

            width:
                42px;

            height:
                42px;

            display:
                flex;

            align-items:
                center;

            justify-content:
                center;

            border-radius:
                12px;

            background:
                #5865f2;

            font-weight:
                bold;

        }

        .online {

            color:
                #57f287;

        }

        main {

            max-width:
                1400px;

            margin:
                auto;

            padding:
                30px;

        }

        h1 {

            margin-top:
                0;

        }

        .cards {

            display:
                grid;

            grid-template-columns:
                repeat(
                    auto-fit,
                    minmax(
                        210px,
                        1fr
                    )
                );

            gap:
                16px;

            margin-top:
                25px;

        }

        .card {

            padding:
                20px;

            border-radius:
                15px;

            border:
                1px solid #222b3b;

            background:
                #111722;

        }

        .card-title {

            color:
                #8d99ad;

            font-size:
                13px;

            margin-bottom:
                10px;

        }

        .value {

            font-size:
                24px;

            font-weight:
                bold;

        }

        .section {

            margin-top:
                25px;

            padding:
                20px;

            border:
                1px solid #222b3b;

            border-radius:
                15px;

            background:
                #111722;

        }

        .modules {

            display:
                grid;

            grid-template-columns:
                repeat(
                    auto-fit,
                    minmax(
                        240px,
                        1fr
                    )
                );

            gap:
                12px;

        }

        .module {

            display:
                flex;

            align-items:
                center;

            justify-content:
                space-between;

            padding:
                15px;

            background:
                #0b1019;

            border:
                1px solid #252e40;

            border-radius:
                10px;

        }

        .switch {

            position:
                relative;

            width:
                50px;

            height:
                27px;

        }

        .switch input {

            display:
                none;

        }

        .slider {

            position:
                absolute;

            inset:
                0;

            cursor:
                pointer;

            border-radius:
                50px;

            background:
                #343d4d;

            transition:
                0.2s;

        }

        .slider:before {

            content:
                "";

            position:
                absolute;

            width:
                21px;

            height:
                21px;

            left:
                3px;

            top:
                3px;

            border-radius:
                50%;

            background:
                white;

            transition:
                0.2s;

        }

        input:checked + .slider {

            background:
                #5865f2;

        }

        input:checked + .slider:before {

            transform:
                translateX(
                    23px
                );

        }

        button {

            border:
                none;

            padding:
                11px 16px;

            border-radius:
                9px;

            cursor:
                pointer;

            color:
                white;

            background:
                #5865f2;

        }

        button:hover {

            background:
                #4752c4;

        }

        input[type="text"] {

            width:
                100%;

            padding:
                11px;

            margin-top:
                7px;

            color:
                white;

            background:
                #090e17;

            border:
                1px solid #2a3445;

            border-radius:
                8px;

        }

        .logout {

            color:
                #ff7b8d;

            text-decoration:
                none;

        }

        .message {

            margin-top:
                10px;

            color:
                #57f287;

        }

    </style>

</head>

<body>

<header>

    <div class="brand">

        <div class="logo">
            V
        </div>

        <div>

            <b>
                VIBE Bot
            </b>

            <div class="online">
                ● Online
            </div>

        </div>

    </div>

    <a
        href="/logout"
        class="logout"
    >
        Ausloggen
    </a>

</header>

<main>

    <h1>
        Dashboard
    </h1>

    <div>
        Bot Verwaltung & Einstellungen
    </div>

    <div class="cards">

        <div class="card">

            <div class="card-title">
                BOT STATUS
            </div>

            <div
                class="value"
                id="botStatus"
            >
                Laden...
            </div>

        </div>

        <div class="card">

            <div class="card-title">
                PING
            </div>

            <div
                class="value"
                id="ping"
            >
                -
            </div>

        </div>

        <div class="card">

            <div class="card-title">
                MITGLIEDER
            </div>

            <div
                class="value"
                id="members"
            >
                -
            </div>

        </div>

        <div class="card">

            <div class="card-title">
                CHANNELS
            </div>

            <div
                class="value"
                id="channels"
            >
                -
            </div>

        </div>

        <div class="card">

            <div class="card-title">
                UPTIME
            </div>

            <div
                class="value"
                id="uptime"
            >
                -
            </div>

        </div>

        <div class="card">

            <div class="card-title">
                RAM
            </div>

            <div
                class="value"
                id="ram"
            >
                -
            </div>

        </div>

    </div>

    <div class="section">

        <h2>
            Bot Funktionen
        </h2>

        <div class="modules">

            ${createSwitch(
                "tickets",
                "Ticket System"
            )}

            ${createSwitch(
                "giveaways",
                "Giveaways"
            )}

            ${createSwitch(
                "counting",
                "Counting"
            )}

            ${createSwitch(
                "welcome",
                "Welcome System"
            )}

            ${createSwitch(
                "supportVoice",
                "Support Warteraum"
            )}

            ${createSwitch(
                "clear",
                "/clear"
            )}

            ${createSwitch(
                "serverLogs",
                "Server Logs"
            )}

            ${createSwitch(
                "memberLogs",
                "Member Logs"
            )}

            ${createSwitch(
                "moderationLogs",
                "Moderation Logs"
            )}

            ${createSwitch(
                "voiceLogs",
                "Voice Logs"
            )}

            ${createSwitch(
                "channelLogs",
                "Channel Logs"
            )}

            ${createSwitch(
                "messageLogs",
                "Message Logs"
            )}

        </div>

        <div
            class="message"
            id="saveMessage"
        ></div>

    </div>

    <div class="section">

        <h2>
            Nachricht senden
        </h2>

        <label>
            Discord Channel-ID
        </label>

        <input
            id="announcementChannel"
            type="text"
            placeholder="148858..."
        >

        <br><br>

        <label>
            Nachricht
        </label>

        <input
            id="announcementText"
            type="text"
            placeholder="Deine Nachricht..."
        >

        <br><br>

        <button id="sendAnnouncement">
            Nachricht senden
        </button>

        <div
            class="message"
            id="announcementMessage"
        ></div>

    </div>

    <div class="section">

        <h2>
            Bot Aktionen
        </h2>

        <button id="reloadCommands">
            Slash Commands neu laden
        </button>

    </div>

</main>

<script>

const switches =
    document.querySelectorAll(
        "[data-feature]"
    );

async function loadStatus() {

    try {

        const response =
            await fetch(
                "/api/dashboard/status"
            );

        if (!response.ok) {
            return;
        }

        const data =
            await response.json();

        document.getElementById(
            "botStatus"
        ).textContent =
            data.bot.ready
                ? "Online"
                : "Offline";

        document.getElementById(
            "ping"
        ).textContent =
            data.bot.ping >= 0
                ? data.bot.ping + " ms"
                : "-";

        document.getElementById(
            "members"
        ).textContent =
            data.guild.members ?? "-";

        document.getElementById(
            "channels"
        ).textContent =
            data.guild.channels ?? "-";

        document.getElementById(
            "ram"
        ).textContent =
            data.system.memoryMb +
            " MB";

        const seconds =
            Math.floor(
                data.system.uptime
            );

        const hours =
            Math.floor(
                seconds / 3600
            );

        const minutes =
            Math.floor(
                (
                    seconds % 3600
                ) / 60
            );

        document.getElementById(
            "uptime"
        ).textContent =
            hours +
            "h " +
            minutes +
            "m";

        for (
            const feature
            of switches
        ) {

            const name =
                feature.dataset.feature;

            feature.checked =
                data.config.features[
                    name
                ] !== false;

        }

    } catch (error) {

        console.error(
            error
        );

    }

}

async function saveFeatures() {

    const features = {};

    for (
        const feature
        of switches
    ) {

        features[
            feature.dataset.feature
        ] =
            feature.checked;

    }

    const response =
        await fetch(
            "/api/dashboard/config",
            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body:
                    JSON.stringify({
                        features
                    })

            }
        );

    const result =
        await response.json();

    const message =
        document.getElementById(
            "saveMessage"
        );

    if (result.ok) {

        message.textContent =
            "✅ Einstellungen gespeichert.";

    } else {

        message.textContent =
            "❌ " +
            (
                result.error ||
                "Fehler"
            );

    }

}

for (
    const feature
    of switches
) {

    feature.addEventListener(
        "change",
        saveFeatures
    );

}

document
    .getElementById(
        "sendAnnouncement"
    )
    .addEventListener(
        "click",
        async () => {

            const channelId =
                document
                    .getElementById(
                        "announcementChannel"
                    )
                    .value
                    .trim();

            const message =
                document
                    .getElementById(
                        "announcementText"
                    )
                    .value
                    .trim();

            const response =
                await fetch(
                    "/api/dashboard/action/announcement",
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json"

                        },

                        body:
                            JSON.stringify({
                                channelId,
                                message
                            })

                    }
                );

            const result =
                await response.json();

            document
                .getElementById(
                    "announcementMessage"
                )
                .textContent =
                    result.ok
                        ? "✅ Nachricht gesendet."
                        : "❌ " +
                            (
                                result.error ||
                                "Fehler"
                            );

        }
    );

document
    .getElementById(
        "reloadCommands"
    )
    .addEventListener(
        "click",
        async () => {

            const response =
                await fetch(
                    "/api/dashboard/action/register-commands",
                    {
                        method:
                            "POST"
                    }
                );

            const result =
                await response.json();

            alert(
                result.ok
                    ? "✅ Commands neu geladen."
                    : "❌ " +
                        (
                            result.error ||
                            "Fehler"
                        )
            );

        }
    );

loadStatus();

setInterval(
    loadStatus,
    5000
);

</script>

</body>

</html>
`;

}

// ======================================================
// SWITCH HTML
// ======================================================

function createSwitch(
    id,
    name
) {

    return `

<div class="module">

    <span>
        ${name}
    </span>

    <label class="switch">

        <input
            type="checkbox"
            data-feature="${id}"
            checked
        >

        <span class="slider">
        </span>

    </label>

</div>

`;

}

// ======================================================
// DASHBOARD KONFIG
// ======================================================

const dashboardConfig = {

    features: {

        tickets:
            true,

        giveaways:
            true,

        counting:
            true,

        welcome:
            true,

        supportVoice:
            true,

        clear:
            true,

        serverLogs:
            true,

        memberLogs:
            true,

        moderationLogs:
            true,

        voiceLogs:
            true,

        channelLogs:
            true,

        messageLogs:
            true

    }

};

function isFeatureEnabled(
    name
) {

    return (
        dashboardConfig.features[
            name
        ] !== false
    );

}

// ======================================================
// LOGIN POST
// ======================================================

app.post(
    "/dashboard/login",
    (req, res) => {

        const username =
            String(
                req.body.username ||
                ""
            );

        const password =
            String(
                req.body.password ||
                ""
            );

        if (
            username !==
                DASHBOARD_USER ||
            password !==
                DASHBOARD_PASSWORD
        ) {

            return res
                .status(401)
                .send(
                    dashboardLoginHtml(
                        "Benutzername oder Passwort falsch."
                    )
                );

        }

        const token =
            crypto
                .randomBytes(32)
                .toString("hex");

        dashboardSessions.set(

            token,

            Date.now() +
            24 *
            60 *
            60 *
            1000

        );

        res.setHeader(

            "Set-Cookie",

            `vibe_dashboard_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`

        );

        console.log(
            "🔐 Dashboard Login erfolgreich."
        );

        return res.redirect("/");

    }
);

// ======================================================
// LOGOUT
// ======================================================

app.get(
    "/logout",
    (req, res) => {

        const cookies =
            parseCookies(req);

        if (
            cookies
                .vibe_dashboard_session
        ) {

            dashboardSessions.delete(

                cookies
                    .vibe_dashboard_session

            );

        }

        res.setHeader(

            "Set-Cookie",

            "vibe_dashboard_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0"

        );

        res.redirect("/");

    }
);

// ======================================================
// HAUPTSEITE
// DAS IST DIE WICHTIGE ROUTE FÜR:
// https://farm-bot-sx00.onrender.com/
// ======================================================

app.get(
    "/",
    (req, res) => {

        if (
            !isDashboardAuthenticated(
                req
            )
        ) {

            return res
                .status(200)
                .send(
                    dashboardLoginHtml()
                );

        }

        return res
            .status(200)
            .send(
                dashboardHtml()
            );

    }
);

// ======================================================
// /LOGIN AUCH ERLAUBEN
// ======================================================

app.get(
    "/login",
    (req, res) => {

        return res.redirect(
            "/"
        );

    }
);

// ======================================================
// /DASHBOARD AUCH ERLAUBEN
// ======================================================

app.get(
    "/dashboard",
    (req, res) => {

        return res.redirect(
            "/"
        );

    }
);

// ======================================================
// DASHBOARD AUTH FÜR API
// ======================================================

function requireDashboardAuth(
    req,
    res,
    next
) {

    if (
        !isDashboardAuthenticated(
            req
        )
    ) {

        return res
            .status(401)
            .json({

                ok:
                    false,

                error:
                    "Nicht eingeloggt"

            });

    }

    next();

}

// ======================================================
// HEALTH
// ======================================================

app.get(
    "/health",
    (req, res) => {

        res.status(200).json({

            status:
                "online",

            bot:
                typeof client !==
                    "undefined" &&
                client?.user?.tag
                    ? client.user.tag
                    : "starting"

        });

    }
);

// ======================================================
// STATUS API
// ======================================================

app.get(
    "/api/dashboard/status",
    requireDashboardAuth,
    async (req, res) => {

        try {

            const ready =
                client.isReady();

            const guild =
                client.guilds.cache.get(
                    GUILD_ID
                );

            return res.json({

                ok:
                    true,

                bot: {

                    ready,

                    tag:
                        client.user?.tag ||
                        "starting",

                    ping:
                        ready
                            ? Math.round(
                                client.ws.ping
                            )
                            : -1

                },

                guild: {

                    members:
                        guild?.memberCount ??
                        0,

                    channels:
                        guild?.channels
                            ?.cache
                            ?.size ??
                        0

                },

                system: {

                    uptime:
                        process.uptime(),

                    memoryMb:
                        Math.round(

                            process
                                .memoryUsage()
                                .rss /

                            1024 /

                            1024

                        )

                },

                config:
                    dashboardConfig

            });

        } catch (error) {

            console.error(
                "Dashboard Status Fehler:",
                error
            );

            return res
                .status(500)
                .json({

                    ok:
                        false,

                    error:
                        "Status konnte nicht geladen werden."

                });

        }

    }
);

// ======================================================
// FUNKTIONEN AN/AUS
// ======================================================

app.post(
    "/api/dashboard/config",
    requireDashboardAuth,
    (req, res) => {

        if (
            req.body &&
            req.body.features
        ) {

            for (
                const feature
                of Object.keys(
                    dashboardConfig.features
                )
            ) {

                if (
                    typeof req.body
                        .features[
                            feature
                        ] ===
                    "boolean"
                ) {

                    dashboardConfig
                        .features[
                            feature
                        ] =
                        req.body
                            .features[
                                feature
                            ];

                }

            }

        }

        console.log(
            "⚙️ Dashboard Einstellungen geändert:",
            dashboardConfig.features
        );

        return res.json({

            ok:
                true,

            config:
                dashboardConfig

        });

    }
);

// ======================================================
// ANNOUNCEMENT
// ======================================================

app.post(
    "/api/dashboard/action/announcement",
    requireDashboardAuth,
    async (req, res) => {

        try {

            const channelId =
                String(
                    req.body.channelId ||
                    ""
                ).trim();

            const message =
                String(
                    req.body.message ||
                    ""
                ).trim();

            if (
                !channelId ||
                !message
            ) {

                return res
                    .status(400)
                    .json({

                        ok:
                            false,

                        error:
                            "Channel-ID und Nachricht fehlen."

                    });

            }

            const channel =
                await client.channels
                    .fetch(
                        channelId
                    )
                    .catch(
                        () => null
                    );

            if (
                !channel ||
                !channel.isTextBased()
            ) {

                return res
                    .status(404)
                    .json({

                        ok:
                            false,

                        error:
                            "Channel nicht gefunden."

                    });

            }

            await channel.send({

                content:
                    message,

                allowedMentions: {

                    parse:
                        []

                }

            });

            return res.json({

                ok:
                    true

            });

        } catch (error) {

            console.error(
                "Announcement Fehler:",
                error
            );

            return res
                .status(500)
                .json({

                    ok:
                        false,

                    error:
                        "Nachricht konnte nicht gesendet werden."

                });

        }

    }
);

// ======================================================
// WICHTIG:
// app.listen ERST NACH DEN ROUTES
// ======================================================

app.listen(
    PORT,
    () => {

        console.log(
            `🌐 Dashboard/Webserver läuft auf Port ${PORT}`
        );

        console.log(
            `🌐 Dashboard: https://farm-bot-sx00.onrender.com/`
        );

    }
);

// ======================================================
// KONFIGURATION
// ======================================================

const TOKEN =
    process.env.TOKEN;

const CLIENT_ID =
    "1534585700408889466";

const GUILD_ID =
    "1488581484565500157";

// ======================================================
// WELCOME
// ======================================================

const WELCOME_CHANNEL_ID =
    "1488581808470757468";

// ======================================================
// STAFF
// ======================================================

const STAFF_ROLE_ID =
    "1488904093970858115";

// ======================================================
// SUPPORT
// ======================================================

const SUPPORT_ROLE_ID =
    STAFF_ROLE_ID;

const SUPPORT_WARTE_RAUM_ID =
    "1488584492628185293";

const SUPPORT_LOG_CHANNEL_ID =
    "1488584310385803416";

// ======================================================
// SERVER LOG
// ======================================================

const SERVER_LOG_CHANNEL_ID =
    process.env.SERVER_LOG_CHANNEL_ID ||
    "1488584374554460372";

// ======================================================
// TICKET KATEGORIEN
// ======================================================

const CLAN_CATEGORY_ID =
    "1534287236407759040";

const TEAM_CATEGORY_ID =
    "1534287314464018655";

const BAU_CATEGORY_ID =
    "1534287374819917896";

const GIVEAWAY_CATEGORY_ID =
    "1538095441940447294";

// ======================================================
// COUNTING
// ======================================================

let countingActive =
    false;

let countingChannelId =
    null;

let currentNumber =
    1;

let lastUserId =
    null;

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
            String(
                description
            ).trim();

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

// ======================================================
// LOG CHANNEL
// ======================================================

function getLogChannel(
    guild
) {

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

    if (
        !channel.isTextBased()
    ) {

        return null;

    }

    return channel;

}

// ======================================================
// LOG SENDEN
// DASHBOARD SCHALTER WIRD BEACHTET
// ======================================================

async function sendLog(
    guild,
    embed
) {

    try {

        if (
            !isFeatureEnabled(
                "serverLogs"
            )
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
            getLogChannel(
                guild
            );

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

function isAdmin(
    member
) {

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

function isStaff(
    member
) {

    if (!member) {

        return false;

    }

    return (

        member.roles.cache.has(
            STAFF_ROLE_ID
        ) ||

        isAdmin(
            member
        )

    );

}

// ======================================================
// TICKET INFO
// ======================================================

function getTicketData(
    channel
) {

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
// GIVEAWAY DAUER UMWANDELN
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
            multipliers[unit]

        );

    }

    const longMatch =
        value.match(

            /^(\d+(?:\.\d+)?)\s*(sekunde|sekunden|min|minute|minuten|stunde|stunden|std|tag|tage|tagen|woche|wochen)$/i

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
        unit === "sekunde" ||
        unit === "sekunden"
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
        unit === "stunde" ||
        unit === "stunden" ||
        unit === "std"
    ) {

        multiplier =
            60 *
            60 *
            1000;

    }

    if (
        unit === "tag" ||
        unit === "tage" ||
        unit === "tagen"
    ) {

        multiplier =
            24 *
            60 *
            60 *
            1000;

    }

    if (
        unit === "woche" ||
        unit === "wochen"
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

    if (
        ended
    ) {

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

    const pool =
        [
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
            "countingstart"
        )

        .setDescription(
            "Startet das Counting"
        )

        .toJSON(),

    new SlashCommandBuilder()

        .setName(
            "countingstop"
        )

        .setDescription(
            "Stoppt das Counting"
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
// DASHBOARD:
// SLASH COMMANDS NEU LADEN
// ======================================================

app.post(
    "/api/dashboard/action/register-commands",
    requireDashboardAuth,
    async (req, res) => {

        try {

            const success =
                await registerCommands();

            if (
                !success
            ) {

                return res
                    .status(500)
                    .json({

                        ok:
                            false,

                        error:
                            "Commands konnten nicht registriert werden."

                    });

            }

            return res.json({

                ok:
                    true

            });

        } catch (error) {

            console.error(
                "Dashboard Command Fehler:",
                error
            );

            return res
                .status(500)
                .json({

                    ok:
                        false,

                    error:
                        "Fehler beim Neuladen der Commands."

                });

        }

    }
);

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
            `🌐 Dashboard: https://farm-bot-sx00.onrender.com/`
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
);// ======================================================
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
                // /CREATE GIVEAWAY
                // ==================================================

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
                // COUNTING START
                // ==================================================

                if (
                    interaction.commandName ===
                    "countingstart"
                ) {

                    if (
                        !isFeatureEnabled(
                            "counting"
                        )
                    ) {

                        return interaction.reply({

                            content:
                                "❌ Das Counting-System ist im Dashboard deaktiviert.",

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
                                "❌ Du benötigst die Berechtigung **Server verwalten**.",

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }

                    countingActive =
                        true;

                    countingChannelId =
                        interaction.channelId;

                    currentNumber =
                        1;

                    lastUserId =
                        null;

                    return interaction.reply({

                        content:
                            "🎉 **Counting gestartet!**\n\n" +
                            "📍 Dieser Channel ist jetzt der Counting-Channel.\n" +
                            "🔢 Erste Zahl: **1**"

                    });

                }

                // ==================================================
                // COUNTING STOP
                // ==================================================

                if (
                    interaction.commandName ===
                    "countingstop"
                ) {

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
                                "❌ Du benötigst die Berechtigung **Server verwalten**.",

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }

                    countingActive =
                        false;

                    countingChannelId =
                        null;

                    currentNumber =
                        1;

                    lastUserId =
                        null;

                    return interaction.reply({

                        content:
                            "🛑 **Counting wurde gestoppt.**"

                    });

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
                                "❌ Das Logging ist im Dashboard deaktiviert.",

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
                                "❌ `/clear` ist im Dashboard deaktiviert.",

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
                                await channel
                                    .bulkDelete(
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
                                deletedCount <
                                    batchSize
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
                                    deletedTotal <
                                        amount

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
            // GIVEAWAY MODAL ABGESENDET
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
                    duration <
                        10000
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

                if (
                    !prize
                ) {

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

                    prize:
                        prize,

                    description:
                        description,

                    winnerCount:
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
                    await interaction.channel
                        .send({

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
            // TICKET SELECT MENU
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

                if (
                    !config
                ) {

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

                if (
                    existing
                ) {

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
                                    guild.roles
                                        .everyone.id,

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

📌 **Ticket übernehmen:** Teammitglied übernimmt das Ticket.
➡️ **Weiterleiten:** Ticket an anderes Teammitglied weiterleiten.
🔒 **Schließen:** Ticket schließen.`
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
            // FORWARD USER SELECT
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
                    !isStaff(
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
                    !isStaff(
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

                if (
                    !data
                ) {

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
                    interaction.customId
                        .startsWith(
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
                        data.participants
                            .has(
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
                // CLAIM TICKET
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
                        !isStaff(
                            interaction.member
                        )
                    ) {

                        return interaction.editReply({

                            content:
                                "❌ Nur Teammitglieder können Tickets übernehmen."

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
                // FORWARD TICKET
                // ==================================================

                if (
                    interaction.customId ===
                    "forward_ticket"
                ) {

                    if (
                        !isStaff(
                            interaction.member
                        )
                    ) {

                        return interaction.reply({

                            content:
                                "❌ Nur Teammitglieder können Tickets weiterleiten.",

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
                // CLOSE TICKET
                // ==================================================

                if (
                    interaction.customId ===
                    "close_ticket"
                ) {

                    const data =
                        getTicketData(
                            interaction.channel
                        );

                    if (
                        !data
                    ) {

                        return interaction.reply({

                            content:
                                "❌ Ticket-Daten wurden nicht gefunden.",

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }

                    const canClose =
                        interaction.user.id ===
                            data.ownerId ||

                        isStaff(
                            interaction.member
                        ) ||

                        isAdmin(
                            interaction.member
                        );

                    if (
                        !canClose
                    ) {

                        return interaction.reply({

                            content:
                                "❌ Du darfst dieses Ticket nicht schließen.",

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }

                    await interaction.reply({

                        content:
                            "🔒 Ticket wird geschlossen..."

                    });

                    const channel =
                        interaction.channel;

                    ticketData.delete(
                        channel.id
                    );

                    setTimeout(
                        async () => {

                            await channel
                                .delete(
                                    `Ticket geschlossen von ${interaction.user.tag}`
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
                        2000
                    );

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
// COUNTING NACHRICHTEN
// ======================================================

client.on(
    Events.MessageCreate,
    async message => {

        try {

            if (
                message.author.bot
            ) {

                return;

            }

            if (
                !isFeatureEnabled(
                    "counting"
                )
            ) {

                return;

            }

            if (
                !countingActive
            ) {

                return;

            }

            if (
                message.channel.id !==
                    countingChannelId
            ) {

                return;

            }

            const number =
                Number(
                    message.content.trim()
                );

            if (
                !Number.isInteger(
                    number
                )
            ) {

                await message
                    .delete()
                    .catch(
                        () => {}
                    );

                return;

            }

            if (
                message.author.id ===
                    lastUserId
            ) {

                await message
                    .delete()
                    .catch(
                        () => {}
                    );

                await message.channel.send(
                    `❌ ${message.author}, du darfst nicht zweimal hintereinander zählen!`
                );

                currentNumber =
                    1;

                lastUserId =
                    null;

                return;

            }

            if (
                number !==
                    currentNumber
            ) {

                await message.channel.send(

                    `❌ ${message.author} hat die falsche Zahl geschrieben!\n\n` +
                    `🔄 Counting wurde zurückgesetzt.\n` +
                    `🔢 Start wieder bei **1**.`

                );

                currentNumber =
                    1;

                lastUserId =
                    null;

                return;

            }

            lastUserId =
                message.author.id;

            currentNumber++;

            await message.react(
                "✅"
            ).catch(
                () => {}
            );

        } catch (error) {

            console.error(
                "❌ Counting Fehler:",
                error
            );

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

    if (
        !guild
    ) {

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

    if (
        message
    ) {

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

        }).catch(
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

}// ======================================================
// SUPPORT VOICE WARTERAUM
// ======================================================

client.on(
    Events.VoiceStateUpdate,
    async (oldState, newState) => {

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
                    dynamic: true
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
                            dynamic: true
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

            // ==================================================
            // KICK
            // ==================================================

            if (
                entry
            ) {

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

            // ==================================================
            // NORMAL VERLASSEN
            // ==================================================

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

            if (
                entry
            ) {

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

            if (
                entry
            ) {

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
// NICKNAME + ROLLEN LOGGING
// ======================================================

client.on(
    Events.GuildMemberUpdate,
    async (before, after) => {

        try {

            if (
                !isFeatureEnabled(
                    "memberLogs"
                )
            ) {
                return;
            }

            // ==================================================
            // NICKNAME
            // ==================================================

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

                if (
                    entry
                ) {

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

            // ==================================================
            // ROLLEN
            // ==================================================

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

            if (
                entry
            ) {

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
    async (before, after) => {

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

            if (
                !member
            ) {
                return;
            }

            // ==================================================
            // VOICE JOIN
            // ==================================================

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

            // ==================================================
            // VOICE LEAVE
            // ==================================================

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

            // ==================================================
            // VOICE MOVE
            // ==================================================

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

            // ==================================================
            // SERVER MUTE
            // ==================================================

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

            // ==================================================
            // SERVER DEAF
            // ==================================================

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

            if (
                entry
            ) {

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

            if (
                entry
            ) {

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
// CHANNEL UPDATE
// ======================================================

client.on(
    Events.ChannelUpdate,
    async (before, after) => {

        try {

            if (
                !isFeatureEnabled(
                    "channelLogs"
                )
            ) {
                return;
            }

            if (
                !after.guild
            ) {
                return;
            }

            // ==================================================
            // CHANNEL NAME
            // ==================================================

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

            // ==================================================
            // CHANNEL PERMISSIONS
            // ==================================================

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

            if (
                !message.guild
            ) {
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
    async (before, after) => {

        try {

            if (
                !isFeatureEnabled(
                    "messageLogs"
                )
            ) {
                return;
            }

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

            if (
                after.url
            ) {

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
    "✅ VIBE Dashboard Systeme geladen."
);

console.log(
    "🌐 Webseite: https://farm-bot-sx00.onrender.com/"
);
