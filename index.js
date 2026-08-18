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
// WEB SERVER + VIBE BOT DASHBOARD – RENDER
// ======================================================

const app = express();

const PORT =
    process.env.PORT ||
    3000;

app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

// ======================================================
// DASHBOARD KONFIGURATION
// ======================================================

const DASHBOARD_CONFIG_FILE =
    path.join(process.cwd(), "dashboard-config.json");

const DASHBOARD_USER =
    process.env.DASHBOARD_USER || "kqwii";
    "admin";

const DASHBOARD_PASSWORD =
    process.env.DASHBOARD_PASSWORD || "Vibeownewr123";
    "VIBE-2026";

const defaultDashboardConfig = {

    features: {
        tickets: true,
        giveaways: true,
        counting: true,
        welcome: true,
        supportVoice: true,
        clear: true,
        serverLogs: true,
        memberLogs: true,
        moderationLogs: true,
        voiceLogs: true,
        channelLogs: true,
        messageLogs: true
    },

    channels: {
        welcomeChannelId: "1488581808470757468",
        staffRoleId: "1488904093970858115",
        supportRoleId: "1488904093970858115",
        supportWaitingRoomId: "1488584492628185293",
        supportLogChannelId: "1488584310385803416",
        serverLogChannelId: process.env.SERVER_LOG_CHANNEL_ID || "1488584374554460372",
        clanCategoryId: "1534287236407759040",
        teamCategoryId: "1534287314464018655",
        bauCategoryId: "1534287374819917896",
        giveawayCategoryId: "1538095441940447294"
    },

    presence: {
        status: "online",
        activityType: "Watching",
        activityText: "VIBE Server"
    }

};

function mergeDashboardConfig(saved = {}) {

    return {
        features: {
            ...defaultDashboardConfig.features,
            ...(saved.features || {})
        },
        channels: {
            ...defaultDashboardConfig.channels,
            ...(saved.channels || {})
        },
        presence: {
            ...defaultDashboardConfig.presence,
            ...(saved.presence || {})
        }
    };

}

function loadDashboardConfig() {

    try {

        if (!fs.existsSync(DASHBOARD_CONFIG_FILE)) {
            return mergeDashboardConfig();
        }

        const raw = fs.readFileSync(
            DASHBOARD_CONFIG_FILE,
            "utf8"
        );

        return mergeDashboardConfig(
            JSON.parse(raw)
        );

    } catch (error) {

        console.error(
            "❌ Dashboard-Konfiguration konnte nicht geladen werden:",
            error
        );

        return mergeDashboardConfig();

    }

}

let dashboardConfig =
    loadDashboardConfig();

function saveDashboardConfig() {

    try {

        fs.writeFileSync(
            DASHBOARD_CONFIG_FILE,
            JSON.stringify(dashboardConfig, null, 2),
            "utf8"
        );

        return true;

    } catch (error) {

        console.error(
            "❌ Dashboard-Konfiguration konnte nicht gespeichert werden:",
            error
        );

        return false;

    }

}

function isFeatureEnabled(name) {

    return dashboardConfig.features[name] !== false;

}

const dashboardSessions =
    new Map();

const dashboardActivity = [];

function dashboardLog(message, type = "info") {

    const item = {
        time: Date.now(),
        type,
        message: String(message)
    };

    dashboardActivity.unshift(item);

    if (dashboardActivity.length > 80) {
        dashboardActivity.length = 80;
    }

}

function parseCookies(req) {

    const result = {};
    const header = req.headers.cookie || "";

    for (const part of header.split(";")) {

        const index = part.indexOf("=");

        if (index === -1) {
            continue;
        }

        const key = part.slice(0, index).trim();
        const value = part.slice(index + 1).trim();

        if (key) {
            result[key] = decodeURIComponent(value);
        }

    }

    return result;

}

function cleanupDashboardSessions() {

    const now = Date.now();

    for (const [token, expiresAt] of dashboardSessions) {

        if (expiresAt <= now) {
            dashboardSessions.delete(token);
        }

    }

}

function isDashboardAuthenticated(req) {

    cleanupDashboardSessions();

    const cookies = parseCookies(req);
    const token = cookies.vibe_dashboard_session;

    if (!token) {
        return false;
    }

    const expiresAt = dashboardSessions.get(token);

    return Boolean(
        expiresAt &&
        expiresAt > Date.now()
    );

}

function requireDashboardAuth(req, res, next) {

    if (!isDashboardAuthenticated(req)) {

        if (req.path.startsWith("/api/")) {
            return res.status(401).json({
                ok: false,
                error: "Nicht eingeloggt"
            });
        }

        return res.redirect("/login");
    }

    next();

}

function secureCompare(a, b) {

    const aa = Buffer.from(String(a));
    const bb = Buffer.from(String(b));

    if (aa.length !== bb.length) {
        return false;
    }

    return crypto.timingSafeEqual(aa, bb);

}

function dashboardLoginHtml(errorMessage = "") {

    const error = errorMessage
        ? `<div class="error">${String(errorMessage).replace(/[<>&\"]/g, "")}</div>`
        : "";

    return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VIBE Bot Dashboard Login</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#080b12;color:#f5f7fb;font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif}.wrap{width:min(430px,calc(100% - 32px));background:#111622;border:1px solid #222a3a;border-radius:24px;padding:30px;box-shadow:0 24px 80px rgba(0,0,0,.35)}.brand{display:flex;align-items:center;gap:12px;margin-bottom:24px}.logo{width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#6d5dfc,#8c7bff);display:grid;place-items:center;font-weight:900;font-size:20px}.muted{color:#8f9bb2}.row{margin-top:16px}label{display:block;font-size:13px;color:#aeb7c9;margin-bottom:7px}input{width:100%;border:1px solid #2a3448;background:#0b101a;color:#fff;padding:13px 14px;border-radius:12px;outline:none}input:focus{border-color:#7b6cff;box-shadow:0 0 0 3px rgba(123,108,255,.15)}button{width:100%;margin-top:20px;border:0;background:#7264ff;color:white;border-radius:12px;padding:13px;font-weight:800;cursor:pointer}.error{padding:11px 12px;border-radius:10px;background:#38171d;color:#ff9aa8;margin:14px 0;font-size:14px}.hint{font-size:12px;color:#728099;margin-top:18px;line-height:1.6}</style>
</head>
<body>
<div class="wrap">
<div class="brand"><div class="logo">V</div><div><div style="font-weight:900;font-size:20px">VIBE Bot</div><div class="muted">Admin Dashboard</div></div></div>
${error}
<form method="post" action="/dashboard/login">
<div class="row"><label>Benutzername</label><input name="username" autocomplete="username" required></div>
<div class="row"><label>Passwort</label><input name="password" type="password" autocomplete="current-password" required></div>
<button type="submit">Einloggen</button>
</form>
<div class="hint">Standard: <b>admin</b> / <b>VIBE-2026</b>. Auf Render unbedingt die Environment Variables <b>DASHBOARD_USER</b> und <b>DASHBOARD_PASSWORD</b> setzen.</div>
</div>
</body>
</html>`;

}

function dashboardHtml() {

    return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>VIBE Bot Dashboard</title>
<style>
:root{--bg:#080b12;--panel:#10151f;--panel2:#151b28;--border:#222a3a;--text:#f4f6fb;--muted:#8995aa;--accent:#7667ff;--accent2:#9488ff;--good:#3ddc97;--warn:#ffc857;--bad:#ff5c72}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif}.layout{display:grid;grid-template-columns:230px 1fr;min-height:100vh}.side{border-right:1px solid var(--border);background:#0b0f17;padding:22px 16px;position:sticky;top:0;height:100vh}.brand{display:flex;align-items:center;gap:11px;padding:0 8px 22px}.logo{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,var(--accent),#9a70ff);display:grid;place-items:center;font-weight:900}.brand b{display:block}.brand span{font-size:12px;color:var(--muted)}.nav{display:grid;gap:5px}.nav a{color:#a8b2c5;text-decoration:none;padding:10px 12px;border-radius:10px;font-size:14px}.nav a:hover,.nav a.active{color:#fff;background:#171d2a}.logout{position:absolute;bottom:20px;left:16px;right:16px}.logout a{display:block;text-align:center;text-decoration:none;color:#ff99a7;border:1px solid #3a2430;padding:10px;border-radius:10px}.main{padding:26px;max-width:1500px;width:100%;margin:0 auto}.top{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:22px}.top h1{font-size:26px;margin:0}.sub{color:var(--muted);font-size:14px;margin-top:4px}.status{display:flex;align-items:center;gap:8px;background:#121923;border:1px solid var(--border);padding:9px 12px;border-radius:999px;font-size:13px}.dot{width:9px;height:9px;border-radius:50%;background:var(--warn)}.dot.on{background:var(--good);box-shadow:0 0 0 4px rgba(61,220,151,.1)}.metrics{display:grid;grid-template-columns:repeat(6,minmax(140px,1fr));gap:12px}.metric,.card{background:var(--panel);border:1px solid var(--border);border-radius:16px}.metric{padding:16px}.metric .k{font-size:12px;color:var(--muted);margin-bottom:8px}.metric .v{font-size:22px;font-weight:900}.metric .s{font-size:11px;color:#718097;margin-top:5px}.section{margin-top:22px}.section-title{display:flex;justify-content:space-between;align-items:end;margin-bottom:10px}.section-title h2{margin:0;font-size:18px}.section-title span{font-size:12px;color:var(--muted)}.grid2{display:grid;grid-template-columns:1.25fr .75fr;gap:14px}.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.card{padding:16px}.features{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.feature{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid var(--border);background:var(--panel2);padding:13px;border-radius:13px}.feature b{font-size:14px}.feature small{display:block;color:var(--muted);margin-top:3px}.switch{position:relative;width:44px;height:24px;flex:0 0 auto}.switch input{opacity:0;width:0;height:0}.slider{position:absolute;inset:0;background:#343b4b;border-radius:99px;cursor:pointer;transition:.2s}.slider:before{content:"";position:absolute;width:18px;height:18px;left:3px;top:3px;background:white;border-radius:50%;transition:.2s}.switch input:checked+.slider{background:var(--accent)}.switch input:checked+.slider:before{transform:translateX(20px)}.formgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.field label{display:block;font-size:12px;color:var(--muted);margin:0 0 6px}.field input,.field select,.field textarea{width:100%;border:1px solid #2a3448;background:#0b1018;color:#fff;border-radius:10px;padding:10px 11px;outline:none}.field textarea{min-height:92px;resize:vertical}.field input:focus,.field select:focus,.field textarea:focus{border-color:var(--accent)}.btns{display:flex;gap:8px;flex-wrap:wrap;margin-top:13px}.btn{border:1px solid #313b50;background:#171e2b;color:#fff;padding:9px 12px;border-radius:10px;font-weight:750;cursor:pointer}.btn.primary{background:var(--accent);border-color:var(--accent)}.btn.danger{background:#3b1620;border-color:#632333;color:#ffb2bd}.btn.good{background:#123326;border-color:#1d6048;color:#a9f2d3}.activity{display:grid;gap:8px;max-height:330px;overflow:auto}.activity-item{border-bottom:1px solid var(--border);padding:9px 2px}.activity-item:last-child{border:0}.activity-item .time{font-size:11px;color:#6f7c92}.activity-item .msg{font-size:13px;margin-top:3px}.tag{display:inline-block;font-size:11px;padding:3px 7px;border-radius:99px;background:#1b2332;color:#aab7cd}.toast{position:fixed;right:20px;bottom:20px;background:#151c29;border:1px solid var(--border);padding:12px 15px;border-radius:11px;display:none;z-index:10}.toast.show{display:block}.code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:#aeb9cc}.warning{padding:11px 12px;border:1px solid #4a3b1d;background:#211c10;color:#ffd980;border-radius:11px;font-size:12px;margin-top:12px}@media(max-width:1150px){.metrics{grid-template-columns:repeat(3,1fr)}.features{grid-template-columns:repeat(2,1fr)}.grid2{grid-template-columns:1fr}}@media(max-width:760px){.layout{display:block}.side{position:static;width:100%;height:auto;border-right:0;border-bottom:1px solid var(--border)}.nav{grid-template-columns:repeat(3,1fr)}.logout{position:static;margin-top:12px}.main{padding:18px}.top{align-items:flex-start;flex-direction:column}.metrics{grid-template-columns:repeat(2,1fr)}.features,.formgrid,.grid3{grid-template-columns:1fr}.nav a{text-align:center;font-size:12px}}
</style>
</head>
<body>
<div class="layout">
<aside class="side">
<div class="brand"><div class="logo">V</div><div><b>VIBE Bot</b><span>Control Center</span></div></div>
<nav class="nav"><a class="active" href="#overview">Übersicht</a><a href="#modules">Module</a><a href="#settings">Einstellungen</a><a href="#tools">Tools</a><a href="#system">System</a></nav>
<div class="logout"><a href="/dashboard/logout">Abmelden</a></div>
</aside>
<main class="main">
<section id="overview">
<div class="top"><div><h1>Dashboard</h1><div class="sub" id="guildName">Discord Bot wird geladen…</div></div><div class="status"><span id="onlineDot" class="dot"></span><span id="onlineText">Verbinde…</span></div></div>
<div class="metrics">
<div class="metric"><div class="k">PING</div><div class="v" id="mPing">–</div><div class="s">Discord Gateway</div></div>
<div class="metric"><div class="k">MITGLIEDER</div><div class="v" id="mMembers">–</div><div class="s">auf dem Server</div></div>
<div class="metric"><div class="k">CHANNELS</div><div class="v" id="mChannels">–</div><div class="s">Text + Voice</div></div>
<div class="metric"><div class="k">OFFENE TICKETS</div><div class="v" id="mTickets">–</div><div class="s">im Arbeitsspeicher</div></div>
<div class="metric"><div class="k">GIVEAWAYS</div><div class="v" id="mGiveaways">–</div><div class="s">aktiv</div></div>
<div class="metric"><div class="k">UPTIME</div><div class="v" id="mUptime">–</div><div class="s" id="mMemory">RAM –</div></div>
</div>
</section>

<section id="modules" class="section">
<div class="section-title"><h2>Bot-Funktionen</h2><span>Änderungen gelten sofort</span></div>
<div class="card"><div id="featureGrid" class="features"></div></div>
</section>

<section id="settings" class="section">
<div class="section-title"><h2>Discord Einstellungen</h2><span>IDs können ohne Codeänderung angepasst werden</span></div>
<div class="grid2">
<div class="card"><div class="formgrid" id="channelFields"></div><div class="btns"><button class="btn primary" id="saveChannels">IDs speichern</button></div><div class="warning">Wenn du Rollen-/Channel-IDs änderst, prüfe danach die Bot-Berechtigungen auf Discord.</div></div>
<div class="card"><h3 style="margin-top:0">Bot Presence</h3><div class="field"><label>Status</label><select id="presenceStatus"><option value="online">Online</option><option value="idle">Abwesend</option><option value="dnd">Bitte nicht stören</option><option value="invisible">Unsichtbar</option></select></div><div class="field" style="margin-top:10px"><label>Aktivität</label><select id="activityType"><option>Playing</option><option>Watching</option><option>Listening</option><option>Competing</option></select></div><div class="field" style="margin-top:10px"><label>Text</label><input id="activityText" maxlength="100" placeholder="VIBE Server"></div><div class="btns"><button class="btn primary" id="savePresence">Presence speichern</button></div></div>
</div>
</section>

<section id="tools" class="section">
<div class="section-title"><h2>Bot Tools</h2><span>Direkte Aktionen</span></div>
<div class="grid3">
<div class="card"><h3 style="margin-top:0">Announcement senden</h3><div class="field"><label>Channel-ID</label><input id="announceChannel" placeholder="123456789..."></div><div class="field" style="margin-top:10px"><label>Nachricht</label><textarea id="announceText" placeholder="Deine Nachricht..."></textarea></div><div class="btns"><button class="btn primary" id="sendAnnouncement">Senden</button></div></div>
<div class="card"><h3 style="margin-top:0">Counting</h3><div class="field"><label>Counting Channel-ID</label><input id="countingChannel" placeholder="123456789..."></div><div class="btns"><button class="btn good" id="startCounting">Starten</button><button class="btn" id="stopCounting">Stoppen</button></div><p class="sub">Status: <b id="countingState">–</b><br>Nächste Zahl: <b id="countingNumber">–</b></p></div>
<div class="card"><h3 style="margin-top:0">Bot Informationen</h3><div class="sub">Bot</div><div id="botTag" style="font-weight:800;margin:3px 0 10px">–</div><div class="sub">Bot-ID</div><div id="botId" class="code">–</div><div class="sub" style="margin-top:10px">Node.js</div><div id="nodeVersion" class="code">–</div><div class="sub" style="margin-top:10px">Server-ID</div><div id="guildId" class="code">–</div></div>
</div>
</section>

<section id="system" class="section">
<div class="section-title"><h2>System</h2><span>Admin Aktionen</span></div>
<div class="grid2">
<div class="card"><h3 style="margin-top:0">Wartung</h3><p class="sub">Slash-Commands neu bei Discord registrieren oder den Node-Prozess neu starten.</p><div class="btns"><button class="btn" id="reloadCommands">Slash-Commands neu laden</button><button class="btn danger" id="restartBot">Bot neu starten</button></div></div>
<div class="card"><h3 style="margin-top:0">Dashboard-Aktivität</h3><div id="activityList" class="activity"><div class="sub">Noch keine Einträge.</div></div></div>
</div>
</section>
</main>
</div>
<div id="toast" class="toast"></div>
<script>
const featureMeta={tickets:["Tickets","Ticketpanel, Claim, Weiterleiten, Schließen"],giveaways:["Giveaways","Erstellen, Teilnahme und Verwaltung"],counting:["Counting","Counting-Commands und Zahlen-System"],welcome:["Welcome","Willkommensnachrichten"],supportVoice:["Support Voice","Warteraum-Benachrichtigungen"],clear:["Clear Command","/clear Nachrichten löschen"],serverLogs:["Server Logs","Master-Schalter für alle Logs"],memberLogs:["Member Logs","Join, Leave, Rollen, Nickname"],moderationLogs:["Moderation Logs","Ban und Unban"],voiceLogs:["Voice Logs","Join, Leave, Move, Mute, Deaf"],channelLogs:["Channel Logs","Erstellen, Löschen, Updates"],messageLogs:["Message Logs","Gelöschte und bearbeitete Nachrichten"]};
const channelMeta={welcomeChannelId:"Welcome Channel",staffRoleId:"Staff Rolle",supportRoleId:"Support Rolle",supportWaitingRoomId:"Support Warteraum",supportLogChannelId:"Support Log Channel",serverLogChannelId:"Server Log Channel",clanCategoryId:"Support Kategorie",teamCategoryId:"Team Kategorie",bauCategoryId:"Bau Kategorie",giveawayCategoryId:"Giveaway Kategorie"};
let state=null;
function toast(msg,bad=false){const el=document.getElementById("toast");el.textContent=msg;el.style.borderColor=bad?"#66303b":"#2d4a40";el.style.color=bad?"#ffadb9":"#aff1d5";el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2800)}
async function api(url,options={}){options.headers=Object.assign({"Content-Type":"application/json"},options.headers||{});const r=await fetch(url,options);if(r.status===401){location.href="/login";throw new Error("Nicht eingeloggt")};const data=await r.json().catch(()=>({}));if(!r.ok||data.ok===false)throw new Error(data.error||"Fehler");return data}
function fmtUptime(sec){sec=Math.max(0,Math.floor(sec||0));const d=Math.floor(sec/86400),h=Math.floor((sec%86400)/3600),m=Math.floor((sec%3600)/60);return d?d+"d "+h+"h":h?h+"h "+m+"m":m+"m"}
function renderFeatures(features){const grid=document.getElementById("featureGrid");grid.innerHTML="";Object.keys(featureMeta).forEach(key=>{const meta=featureMeta[key],el=document.createElement("div");el.className="feature";el.innerHTML='<div><b>'+meta[0]+'</b><small>'+meta[1]+'</small></div><label class="switch"><input type="checkbox" data-feature="'+key+'" '+(features[key]!==false?'checked':'')+'><span class="slider"></span></label>';grid.appendChild(el)});grid.querySelectorAll("input[data-feature]").forEach(input=>input.addEventListener("change",async()=>{try{const patch={};patch[input.dataset.feature]=input.checked;await api("/api/dashboard/config",{method:"POST",body:JSON.stringify({features:patch})});toast((featureMeta[input.dataset.feature]||[input.dataset.feature])[0]+(input.checked?" aktiviert":" deaktiviert"));load()}catch(e){input.checked=!input.checked;toast(e.message,true)}}))}
function renderChannels(channels){const box=document.getElementById("channelFields");if(box.children.length)return;Object.keys(channelMeta).forEach(key=>{const el=document.createElement("div");el.className="field";el.innerHTML='<label>'+channelMeta[key]+'</label><input id="ch_'+key+'" data-channel="'+key+'" placeholder="Discord ID">';box.appendChild(el)});Object.keys(channelMeta).forEach(key=>document.getElementById("ch_"+key).value=channels[key]||"")}
function renderActivity(items){const el=document.getElementById("activityList");if(!items||!items.length){el.innerHTML='<div class="sub">Noch keine Einträge.</div>';return}el.innerHTML=items.slice(0,20).map(x=>'<div class="activity-item"><span class="tag">'+String(x.type||"info")+'</span><div class="msg">'+String(x.message||"").replace(/</g,"&lt;")+'</div><div class="time">'+new Date(x.time).toLocaleString("de-DE")+'</div></div>').join("")}
async function load(){try{const d=await api("/api/dashboard/status");state=d;document.getElementById("onlineDot").className="dot "+(d.bot.ready?"on":"");document.getElementById("onlineText").textContent=d.bot.ready?"Bot online":"Bot startet / offline";document.getElementById("guildName").textContent=(d.guild.name||"Discord Server")+" • "+(d.bot.tag||"Bot startet…");document.getElementById("mPing").textContent=(d.bot.ping>=0?d.bot.ping+" ms":"–");document.getElementById("mMembers").textContent=d.guild.members??"–";document.getElementById("mChannels").textContent=d.guild.channels??"–";document.getElementById("mTickets").textContent=d.runtime.openTickets;document.getElementById("mGiveaways").textContent=d.runtime.activeGiveaways;document.getElementById("mUptime").textContent=fmtUptime(d.system.uptime);document.getElementById("mMemory").textContent="RAM "+d.system.memoryMb+" MB";document.getElementById("botTag").textContent=d.bot.tag||"–";document.getElementById("botId").textContent=d.bot.id||"–";document.getElementById("nodeVersion").textContent=d.system.node;document.getElementById("guildId").textContent=d.guild.id||"–";document.getElementById("countingState").textContent=d.runtime.countingActive?"Aktiv":"Gestoppt";document.getElementById("countingNumber").textContent=d.runtime.currentNumber;renderFeatures(d.config.features);renderChannels(d.config.channels);document.getElementById("presenceStatus").value=d.config.presence.status||"online";document.getElementById("activityType").value=d.config.presence.activityType||"Watching";document.getElementById("activityText").value=d.config.presence.activityText||"";renderActivity(d.activity)}catch(e){document.getElementById("onlineText").textContent="Dashboard API Fehler"}}
document.getElementById("saveChannels").addEventListener("click",async()=>{const channels={};document.querySelectorAll("[data-channel]").forEach(i=>channels[i.dataset.channel]=i.value.trim());try{await api("/api/dashboard/config",{method:"POST",body:JSON.stringify({channels})});toast("Discord IDs gespeichert");load()}catch(e){toast(e.message,true)}});
document.getElementById("savePresence").addEventListener("click",async()=>{try{await api("/api/dashboard/action/presence",{method:"POST",body:JSON.stringify({status:document.getElementById("presenceStatus").value,activityType:document.getElementById("activityType").value,activityText:document.getElementById("activityText").value})});toast("Presence aktualisiert");load()}catch(e){toast(e.message,true)}});
document.getElementById("sendAnnouncement").addEventListener("click",async()=>{try{await api("/api/dashboard/action/announcement",{method:"POST",body:JSON.stringify({channelId:document.getElementById("announceChannel").value.trim(),message:document.getElementById("announceText").value.trim()})});toast("Nachricht gesendet");document.getElementById("announceText").value="";load()}catch(e){toast(e.message,true)}});
document.getElementById("startCounting").addEventListener("click",async()=>{try{await api("/api/dashboard/action/counting",{method:"POST",body:JSON.stringify({action:"start",channelId:document.getElementById("countingChannel").value.trim()})});toast("Counting gestartet");load()}catch(e){toast(e.message,true)}});
document.getElementById("stopCounting").addEventListener("click",async()=>{try{await api("/api/dashboard/action/counting",{method:"POST",body:JSON.stringify({action:"stop"})});toast("Counting gestoppt");load()}catch(e){toast(e.message,true)}});
document.getElementById("reloadCommands").addEventListener("click",async()=>{try{await api("/api/dashboard/action/reload-commands",{method:"POST",body:"{}"});toast("Slash-Commands neu registriert");load()}catch(e){toast(e.message,true)}});
document.getElementById("restartBot").addEventListener("click",async()=>{if(!confirm("Bot wirklich neu starten? Auf Render startet der Service danach automatisch neu, wenn Auto-Restart aktiv ist."))return;try{await api("/api/dashboard/action/restart",{method:"POST",body:"{}"});toast("Neustart ausgelöst")}catch(e){toast(e.message,true)}});
load();setInterval(load,10000);
</script>
</body>
</html>`;

}

// ======================================================
// DASHBOARD ROUTES
// ======================================================

app.get("/health", (req, res) => {

    res.status(200).json({
        status: "online",
        bot: client?.user?.tag || "starting",
        ready: Boolean(client?.isReady?.())
    });

});

app.get("/login", (req, res) => {

    if (isDashboardAuthenticated(req)) {
        return res.redirect("/");
    }

    res.status(200).send(
        dashboardLoginHtml()
    );

});

app.post("/dashboard/login", (req, res) => {

    const username = req.body?.username || "";
    const password = req.body?.password || "";

    if (
        !secureCompare(username, DASHBOARD_USER) ||
        !secureCompare(password, DASHBOARD_PASSWORD)
    ) {

        dashboardLog(
            "Fehlgeschlagener Dashboard-Login",
            "security"
        );

        return res.status(401).send(
            dashboardLoginHtml("Benutzername oder Passwort ist falsch.")
        );
    }

    const token =
        crypto.randomBytes(32).toString("hex");

    dashboardSessions.set(
        token,
        Date.now() + 12 * 60 * 60 * 1000
    );

    const secure =
        req.secure ||
        req.headers["x-forwarded-proto"] === "https";

    res.setHeader(
        "Set-Cookie",
        `vibe_dashboard_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${secure ? "; Secure" : ""}`
    );

    dashboardLog(
        "Dashboard-Login erfolgreich",
        "security"
    );

    res.redirect("/");

});

app.get("/dashboard/logout", (req, res) => {

    const cookies = parseCookies(req);

    if (cookies.vibe_dashboard_session) {
        dashboardSessions.delete(
            cookies.vibe_dashboard_session
        );
    }

    res.setHeader(
        "Set-Cookie",
        "vibe_dashboard_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0"
    );

    res.redirect("/login");

});

app.get("/", requireDashboardAuth, (req, res) => {

    res.status(200).send(
        dashboardHtml()
    );

});

app.get("/dashboard", requireDashboardAuth, (req, res) => {

    res.redirect("/");

});

app.get("/api/dashboard/status", requireDashboardAuth, async (req, res) => {

    try {

        const ready =
            Boolean(client?.isReady?.());

        const guild =
            client?.guilds?.cache?.get(GUILD_ID) ||
            null;

        const activeGiveaways =
            [...giveawayData.values()].filter(
                item =>
                    item &&
                    !item.ended &&
                    item.endAt > Date.now()
            ).length;

        res.json({
            ok: true,
            bot: {
                ready,
                tag: client?.user?.tag || "starting",
                id: client?.user?.id || null,
                ping: ready && Number.isFinite(client.ws.ping)
                    ? Math.round(client.ws.ping)
                    : -1
            },
            guild: {
                id: guild?.id || GUILD_ID,
                name: guild?.name || "VIBE Server",
                members: guild?.memberCount ?? null,
                channels: guild?.channels?.cache?.size ?? null,
                roles: guild?.roles?.cache?.size ?? null
            },
            runtime: {
                openTickets: ticketData.size,
                activeGiveaways,
                countingActive,
                countingChannelId,
                currentNumber
            },
            system: {
                uptime: process.uptime(),
                memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
                node: process.version,
                platform: process.platform
            },
            config: dashboardConfig,
            activity: dashboardActivity.slice(0, 30)
        });

    } catch (error) {

        console.error(
            "❌ Dashboard Status Fehler:",
            error
        );

        res.status(500).json({
            ok: false,
            error: "Status konnte nicht geladen werden."
        });

    }

});

function cleanDiscordId(value) {

    const text = String(value || "").trim();

    if (!text) {
        return "";
    }

    return /^\d{16,22}$/.test(text)
        ? text
        : null;

}

function applyDashboardChannels() {

    WELCOME_CHANNEL_ID = dashboardConfig.channels.welcomeChannelId || WELCOME_CHANNEL_ID;
    STAFF_ROLE_ID = dashboardConfig.channels.staffRoleId || STAFF_ROLE_ID;
    SUPPORT_ROLE_ID = dashboardConfig.channels.supportRoleId || STAFF_ROLE_ID;
    SUPPORT_WARTE_RAUM_ID = dashboardConfig.channels.supportWaitingRoomId || SUPPORT_WARTE_RAUM_ID;
    SUPPORT_LOG_CHANNEL_ID = dashboardConfig.channels.supportLogChannelId || SUPPORT_LOG_CHANNEL_ID;
    SERVER_LOG_CHANNEL_ID = dashboardConfig.channels.serverLogChannelId || SERVER_LOG_CHANNEL_ID;
    CLAN_CATEGORY_ID = dashboardConfig.channels.clanCategoryId || CLAN_CATEGORY_ID;
    TEAM_CATEGORY_ID = dashboardConfig.channels.teamCategoryId || TEAM_CATEGORY_ID;
    BAU_CATEGORY_ID = dashboardConfig.channels.bauCategoryId || BAU_CATEGORY_ID;
    GIVEAWAY_CATEGORY_ID = dashboardConfig.channels.giveawayCategoryId || GIVEAWAY_CATEGORY_ID;

}

app.post("/api/dashboard/config", requireDashboardAuth, (req, res) => {

    try {

        if (req.body?.features) {

            for (const key of Object.keys(defaultDashboardConfig.features)) {

                if (typeof req.body.features[key] === "boolean") {
                    dashboardConfig.features[key] = req.body.features[key];
                }

            }

        }

        if (req.body?.channels) {

            for (const key of Object.keys(defaultDashboardConfig.channels)) {

                if (!(key in req.body.channels)) {
                    continue;
                }

                const id = cleanDiscordId(
                    req.body.channels[key]
                );

                if (id === null) {
                    return res.status(400).json({
                        ok: false,
                        error: `Ungültige Discord-ID bei ${key}`
                    });
                }

                dashboardConfig.channels[key] = id;

            }

            applyDashboardChannels();

        }

        saveDashboardConfig();

        dashboardLog(
            "Bot-Konfiguration im Dashboard geändert",
            "config"
        );

        res.json({
            ok: true,
            config: dashboardConfig
        });

    } catch (error) {

        console.error(
            "❌ Dashboard Config Fehler:",
            error
        );

        res.status(500).json({
            ok: false,
            error: "Konfiguration konnte nicht gespeichert werden."
        });

    }

});

function activityTypeNumber(type) {

    return {
        Playing: 0,
        Streaming: 1,
        Listening: 2,
        Watching: 3,
        Custom: 4,
        Competing: 5
    }[type] ?? 3;

}

async function applyDashboardPresence() {

    if (!client?.isReady?.()) {
        return false;
    }

    const status =
        ["online", "idle", "dnd", "invisible"].includes(
            dashboardConfig.presence.status
        )
            ? dashboardConfig.presence.status
            : "online";

    const activityText =
        String(
            dashboardConfig.presence.activityText || ""
        ).trim().substring(0, 100);

    client.user.setPresence({
        status,
        activities: activityText
            ? [{
                name: activityText,
                type: activityTypeNumber(
                    dashboardConfig.presence.activityType
                )
            }]
            : []
    });

    return true;

}

app.post("/api/dashboard/action/presence", requireDashboardAuth, async (req, res) => {

    const status = String(req.body?.status || "online");
    const activityType = String(req.body?.activityType || "Watching");
    const activityText = String(req.body?.activityText || "").trim().substring(0, 100);

    if (!["online", "idle", "dnd", "invisible"].includes(status)) {
        return res.status(400).json({
            ok: false,
            error: "Ungültiger Status."
        });
    }

    dashboardConfig.presence = {
        status,
        activityType,
        activityText
    };

    saveDashboardConfig();
    await applyDashboardPresence();

    dashboardLog(
        `Bot-Presence geändert: ${status} / ${activityText || "kein Text"}`,
        "presence"
    );

    res.json({ ok: true });

});

app.post("/api/dashboard/action/announcement", requireDashboardAuth, async (req, res) => {

    try {

        if (!client?.isReady?.()) {
            return res.status(503).json({
                ok: false,
                error: "Bot ist noch nicht bereit."
            });
        }

        const channelId = cleanDiscordId(
            req.body?.channelId
        );

        const message = String(
            req.body?.message || ""
        ).trim();

        if (!channelId || !message) {
            return res.status(400).json({
                ok: false,
                error: "Channel-ID und Nachricht werden benötigt."
            });
        }

        if (message.length > 2000) {
            return res.status(400).json({
                ok: false,
                error: "Discord-Nachrichten dürfen maximal 2000 Zeichen haben."
            });
        }

        const channel =
            await client.channels.fetch(channelId)
                .catch(() => null);

        if (!channel || !channel.isTextBased()) {
            return res.status(404).json({
                ok: false,
                error: "Text-Channel nicht gefunden."
            });
        }

        await channel.send({
            content: message,
            allowedMentions: {
                parse: []
            }
        });

        dashboardLog(
            `Announcement an #${channel.name || channelId} gesendet`,
            "action"
        );

        res.json({ ok: true });

    } catch (error) {

        console.error(
            "❌ Dashboard Announcement Fehler:",
            error
        );

        res.status(500).json({
            ok: false,
            error: "Nachricht konnte nicht gesendet werden."
        });

    }

});

app.post("/api/dashboard/action/counting", requireDashboardAuth, (req, res) => {

    const action = String(req.body?.action || "");

    if (action === "stop") {

        countingActive = false;
        countingChannelId = null;
        currentNumber = 1;
        lastUserId = null;

        dashboardLog(
            "Counting über Dashboard gestoppt",
            "action"
        );

        return res.json({ ok: true });
    }

    if (action === "start") {

        if (!isFeatureEnabled("counting")) {
            return res.status(400).json({
                ok: false,
                error: "Counting-Modul ist deaktiviert."
            });
        }

        const channelId = cleanDiscordId(
            req.body?.channelId
        );

        if (!channelId) {
            return res.status(400).json({
                ok: false,
                error: "Gültige Counting Channel-ID fehlt."
            });
        }

        countingActive = true;
        countingChannelId = channelId;
        currentNumber = 1;
        lastUserId = null;

        dashboardLog(
            `Counting über Dashboard gestartet: ${channelId}`,
            "action"
        );

        return res.json({ ok: true });
    }

    res.status(400).json({
        ok: false,
        error: "Ungültige Counting-Aktion."
    });

});

app.post("/api/dashboard/action/reload-commands", requireDashboardAuth, async (req, res) => {

    try {

        await registerCommands();

        dashboardLog(
            "Slash-Commands über Dashboard neu registriert",
            "action"
        );

        res.json({ ok: true });

    } catch (error) {

        res.status(500).json({
            ok: false,
            error: "Slash-Commands konnten nicht neu registriert werden."
        });

    }

});

app.post("/api/dashboard/action/restart", requireDashboardAuth, (req, res) => {

    dashboardLog(
        "Bot-Neustart über Dashboard ausgelöst",
        "system"
    );

    res.json({
        ok: true,
        message: "Neustart wird ausgelöst."
    });

    setTimeout(
        () => process.exit(0),
        500
    );

});

app.listen(PORT, () => {

    console.log(
        `🌐 Dashboard/Webserver läuft auf Port ${PORT}`
    );

    dashboardLog(
        `Dashboard gestartet auf Port ${PORT}`,
        "system"
    );

});

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

let WELCOME_CHANNEL_ID =
    dashboardConfig.channels.welcomeChannelId ||
    "1488581808470757468";

// ======================================================
// STAFF
// ======================================================

let STAFF_ROLE_ID =
    dashboardConfig.channels.staffRoleId ||
    "1488904093970858115";

// ======================================================
// SUPPORT
// ======================================================

let SUPPORT_ROLE_ID =
    dashboardConfig.channels.supportRoleId ||
    STAFF_ROLE_ID;

let SUPPORT_WARTE_RAUM_ID =
    dashboardConfig.channels.supportWaitingRoomId ||
    "1488584492628185293";

let SUPPORT_LOG_CHANNEL_ID =
    dashboardConfig.channels.supportLogChannelId ||
    "1488584310385803416";

// ======================================================
// SERVER LOG
// ======================================================

let SERVER_LOG_CHANNEL_ID =
    dashboardConfig.channels.serverLogChannelId ||
    process.env.SERVER_LOG_CHANNEL_ID ||
    "1488584374554460372";

// ======================================================
// TICKET KATEGORIEN
// ======================================================

let CLAN_CATEGORY_ID =
    dashboardConfig.channels.clanCategoryId ||
    "1534287236407759040";

let TEAM_CATEGORY_ID =
    dashboardConfig.channels.teamCategoryId ||
    "1534287314464018655";

let BAU_CATEGORY_ID =
    dashboardConfig.channels.bauCategoryId ||
    "1534287374819917896";

let GIVEAWAY_CATEGORY_ID =
    dashboardConfig.channels.giveawayCategoryId ||
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
            ).trim();

        if (
            text.length >
            0
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
// ======================================================

async function sendLog(
    guild,
    embed
) {

    if (!isFeatureEnabled("serverLogs")) {
        return;
    }

    try {

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

        return entry ||
            null;

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

                winnerIds.length >
                    0

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
        pool.length >
            0 &&
        winners.length <
            count
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

        const disabledRow =
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
                disabledRow
            ]

        }).catch(
            () => {}
        );

    }

    if (
        winners.length >
        0
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

        }).catch(
            () => {}
        );

    } else {

        await channel.send({

            content:

                "🎉 **Gewinnspiel beendet!**\n\n" +

                "Es gab leider keine gültigen Teilnehmer.\n\n" +

                `🎁 **Preis:** ${data.prize}`

        }).catch(
            () => {}
        );

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
                remaining <=
                0
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

    // ==================================================
    // /CLEAR
    // ==================================================

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

    // ==================================================
    // /CREATE GIVEAWAY
    // ==================================================

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

    } catch (error) {

        console.error(
            "❌ Fehler beim Registrieren:",
            error
        );

    }

}

// ======================================================
// READY
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

        await applyDashboardPresence();

        dashboardLog(
            `Discord Bot online: ${client.user.tag}`,
            "system"
        );

    }

);

// ======================================================
// DASHBOARD FEATURE GUARD FÜR INTERACTIONS
// ======================================================

function getInteractionFeature(interaction) {

    if (interaction.isChatInputCommand()) {

        if (interaction.commandName === "ticketpanel") {
            return "tickets";
        }

        if (
            interaction.commandName === "countingstart" ||
            interaction.commandName === "countingstop"
        ) {
            return "counting";
        }

        if (interaction.commandName === "clear") {
            return "clear";
        }

        if (interaction.commandName === "logtest") {
            return "serverLogs";
        }

        if (
            interaction.commandName === "create" &&
            interaction.options.getSubcommand(false) === "giveaway"
        ) {
            return "giveaways";
        }

    }

    if (
        interaction.isModalSubmit() &&
        interaction.customId === "create_giveaway_modal"
    ) {
        return "giveaways";
    }

    if (
        interaction.isStringSelectMenu() &&
        interaction.customId === "ticket_menu"
    ) {
        return "tickets";
    }

    if (
        interaction.isUserSelectMenu() &&
        interaction.customId === "forward_ticket_user"
    ) {
        return "tickets";
    }

    if (interaction.isButton()) {

        if (
            interaction.customId.startsWith("giveaway_join_")
        ) {
            return "giveaways";
        }

        if ([
            "claim_ticket",
            "forward_ticket",
            "close_ticket"
        ].includes(interaction.customId)) {
            return "tickets";
        }

    }

    return null;

}

async function replyFeatureDisabled(interaction, feature) {

    const names = {
        tickets: "Ticket-System",
        giveaways: "Giveaway-System",
        counting: "Counting-System",
        clear: "Clear-Command",
        serverLogs: "Server-Logging"
    };

    const content =
        `⛔ **${names[feature] || feature} ist aktuell im Bot-Dashboard deaktiviert.**`;

    if (interaction.deferred || interaction.replied) {

        return interaction.followUp({
            content,
            flags: MessageFlags.Ephemeral
        }).catch(() => {});

    }

    return interaction.reply({
        content,
        flags: MessageFlags.Ephemeral
    }).catch(() => {});

}

// ======================================================
// INTERACTIONS
// ======================================================

client.on(

    Events.InteractionCreate,

    async interaction => {

        try {

            const requiredFeature =
                getInteractionFeature(interaction);

            if (
                requiredFeature &&
                !isFeatureEnabled(requiredFeature)
            ) {

                await replyFeatureDisabled(
                    interaction,
                    requiredFeature
                );

                return;
            }

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
                        !isAdmin(
                            interaction.member
                        ) &&

                        !interaction.member.permissions.has(

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
                        !isAdmin(
                            interaction.member
                        ) &&

                        !interaction.member.permissions.has(

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

                        !interaction.member.permissions.has(

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
                // CLEAR
                // ==================================================

                if (
                    interaction.commandName ===
                    "clear"
                ) {

                    if (
                        !interaction.member.permissions.has(

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
                        interaction.options.getInteger(
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
                            remaining >
                            0
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
                                deletedCount ===
                                    0 ||
                                deletedCount <
                                    batchSize
                            ) {

                                break;

                            }

                            if (
                                remaining >
                                0
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

                        await interaction.editReply({

                            content:
                                "❌ Beim Löschen der Nachrichten ist ein Fehler aufgetreten. Prüfe, ob der Bot **Nachrichten verwalten** darf."

                        }).catch(
                            () => {}
                        );

                    }

                    return;

                }                // ==================================================
                // TICKET PANEL
                // ==================================================

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

Erstelle ein Ticket und beschreibe dein Anliegen so genau wie möglich, damit unser Team dir schnell und gezielt helfen kann.

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

Egal ob Builder, Helfer oder für ein anderes Teammitglied – erstelle einfach ein Ticket.

━━━━━━━━━━━━━━━━━━

🎁 **Giveaway**

Du hast Fragen zu einem Giveaway, einem Gewinn oder benötigst Hilfe bei einer Giveaway-Aktion?

Erstelle dafür ein Giveaway-Ticket.

━━━━━━━━━━━━━━━━━━

📋 **Wichtige Hinweise:**

• Beschreibe dein Anliegen genau
• Bleibe freundlich
• Erstelle nur ein Ticket pro Anliegen

━━━━━━━━━━━━━━━━━━

🚀 Vielen Dank und viel Spaß auf unserem Server!`
                            )

                            .setThumbnail(
                                client.user.displayAvatarURL()
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
                            "• `1d`\n\n" +
                            "Die Mindestdauer beträgt **10 Sekunden**.",

                        flags:
                            MessageFlags.Ephemeral

                    });

                }

                if (
                    !Number.isInteger(
                        winnerCount
                    ) ||
                    winnerCount <
                        1 ||
                    winnerCount >
                        20
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

                if (
                    !interaction.channel ||
                    !interaction.channel.isTextBased()
                ) {

                    return interaction.reply({

                        content:
                            "❌ Das Gewinnspiel kann in diesem Kanal nicht erstellt werden.",

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

                const logEmbed =
                    baseEmbed(

                        "🎁 Gewinnspiel erstellt",

                        0x5865f2,

                        "Ein neues Gewinnspiel wurde erstellt."

                    );

                logEmbed.addFields(

                    {

                        name:
                            "👤 Erstellt von",

                        value:
                            `${interaction.user} (${interaction.user.id})`

                    },

                    {

                        name:
                            "🎁 Preis",

                        value:
                            prize

                    },

                    {

                        name:
                            "🏆 Gewinner",

                        value:
                            `${winnerCount}`

                    },

                    {

                        name:
                            "⏰ Ende",

                        value:
                            `<t:${Math.floor(data.endAt / 1000)}:f>`

                    }

                );

                await sendLog(
                    interaction.guild,
                    logEmbed
                );

                return interaction.editReply({

                    content:
                        `✅ Das Gewinnspiel wurde erfolgreich erstellt!\n${giveawayMessage.url}`

                });

            }

            // ==================================================
            // TICKET SELECT MENU
            // ==================================================

            if (
                interaction.isStringSelectMenu() &&
                interaction.customId ===
                    "ticket_menu"
            ) {

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

                if (
                    !guild
                ) {

                    return interaction.editReply({

                        content:
                            "❌ Server konnte nicht geladen werden."

                    });

                }

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
                    !member
                ) {

                    return interaction.editReply({

                        content:
                            "❌ Dein Discord-Mitglied konnte nicht geladen werden."

                    });

                }

                if (
                    !staffRole
                ) {

                    return interaction.editReply({

                        content:
                            "❌ Die Staff-Rolle konnte nicht gefunden werden."

                    });

                }

                if (
                    !category ||
                    category.type !==
                        ChannelType.GuildCategory
                ) {

                    return interaction.editReply({

                        content:
                            "❌ Die Ticket-Kategorie wurde nicht gefunden."

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

                const buttonRow =
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

📌 Bitte beschreibe dein Anliegen möglichst genau, damit das Team dir schnell helfen kann.

🛡️ Ein Teammitglied wird sich schnellstmöglich darum kümmern.

📌 **Ticket übernehmen:** Ein Teammitglied übernimmt das Ticket.

➡️ **Weiterleiten:** Das Ticket kann an ein anderes Teammitglied weitergeleitet werden.

🔒 **Schließen:** Das Ticket wird geschlossen.`
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
                        buttonRow
                    ]

                });

                await interaction.editReply({

                    content:
                        `✅ Dein Ticket wurde erstellt: ${channel}`

                });

                const logEmbed =
                    baseEmbed(

                        "🎫 Ticket erstellt",

                        0x57f287

                    );

                logEmbed.addFields(

                    {

                        name:
                            "Ersteller",

                        value:
                            `${member} (${member.id})`

                    },

                    {

                        name:
                            "Ticket",

                        value:
                            channel.toString()

                    },

                    {

                        name:
                            "Kategorie",

                        value:
                            config.title

                    }

                );

                await sendLog(
                    guild,
                    logEmbed
                );

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
                    await interaction.guild.members
                        .fetch(
                            selectedUserId
                        )
                        .catch(
                            () => null
                        );

                if (
                    !selectedMember
                ) {

                    return interaction.editReply({

                        content:
                            "❌ Das ausgewählte Teammitglied wurde nicht gefunden."

                    });

                }

                if (
                    !isStaff(
                        selectedMember
                    )
                ) {

                    return interaction.editReply({

                        content:
                            "❌ Du kannst das Ticket nur an ein Mitglied mit der Staff-Rolle weiterleiten."

                    });

                }

                const channel =
                    interaction.channel;

                const data =
                    getTicketData(
                        channel
                    );

                if (
                    !channel ||
                    !data
                ) {

                    return interaction.editReply({

                        content:
                            "❌ Die Ticket-Daten konnten nicht gefunden werden."

                    });

                }

                await channel.permissionOverwrites.edit(

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

                const forwardEmbed =
                    new EmbedBuilder()

                        .setColor(
                            "#5865F2"
                        )

                        .setTitle(
                            "➡️ Ticket weitergeleitet"
                        )

                        .setDescription(
`Dieses Ticket wurde weitergeleitet.

👤 **Weitergeleitet von:**
${interaction.user}

🎯 **Weitergeleitet an:**
${selectedMember}

🔓 Das ausgewählte Teammitglied hat jetzt Zugriff auf dieses Ticket.`
                        )

                        .setFooter({

                            text:
                                "VIBE Ticket System"

                        })

                        .setTimestamp();

                await channel.send({

                    content:
                        `${selectedMember}`,

                    allowedMentions: {

                        users: [
                            selectedMember.id
                        ]

                    },

                    embeds: [
                        forwardEmbed
                    ]

                });

                await interaction.editReply({

                    content:
                        `✅ Ticket wurde an ${selectedMember} weitergeleitet.`

                });

                return;

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

                    const giveawayId =
                        interaction.customId.replace(
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
                                "❌ Dieses Gewinnspiel ist nicht mehr aktiv oder der Bot wurde zwischenzeitlich neu gestartet."

                        });

                    }

                    if (
                        data.ended ||
                        Date.now() >=
                            data.endAt
                    ) {

                        await endGiveaway(
                            giveawayId
                        ).catch(
                            () => {}
                        );

                        return interaction.editReply({

                            content:
                                "❌ Dieses Gewinnspiel ist bereits beendet."

                        });

                    }

                    // ==================================================
                    // STAFF / ADMIN DARF NICHT TEILNEHMEN
                    // ==================================================

                    if (
                        interaction.member &&
                        (
                            interaction.member.roles.cache.has(
                                STAFF_ROLE_ID
                            ) ||
                            isAdmin(
                                interaction.member
                            )
                        )
                    ) {

                        return interaction.editReply({

                            content:
                                "❌ **Teammitglieder und Administratoren dürfen nicht an diesem Gewinnspiel teilnehmen.**"

                        });

                    }

                    if (
                        data.participants.has(
                            interaction.user.id
                        )
                    ) {

                        return interaction.editReply({

                            content:
                                "🎉 Du nimmst bereits an diesem Gewinnspiel teil!"

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

                    }).catch(
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

                    await interaction.deferReply();

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

                    const channel =
                        interaction.channel;

                    const data =
                        getTicketData(
                            channel
                        );

                    if (
                        !channel ||
                        !data
                    ) {

                        return interaction.editReply({

                            content:
                                "❌ Die Ticket-Daten wurden nicht gefunden."

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

                    const member =
                        await interaction.guild.members
                            .fetch(
                                interaction.user.id
                            )
                            .catch(
                                () => null
                            );

                    const staffRole =
                        await interaction.guild.roles
                            .fetch(
                                STAFF_ROLE_ID
                            )
                            .catch(
                                () => null
                            );

                    if (
                        !member ||
                        !staffRole
                    ) {

                        return interaction.editReply({

                            content:
                                "❌ Teammitglied oder Staff-Rolle konnte nicht geladen werden."

                        });

                    }

                    data.claimedBy =
                        member.id;

                    data.forwardedTo =
                        null;

                    await channel.permissionOverwrites.edit(

                        staffRole.id,

                        {

                            ViewChannel:
                                true,

                            SendMessages:
                                false,

                            ReadMessageHistory:
                                true

                        }

                    );

                    await channel.permissionOverwrites.edit(

                        member.id,

                        {

                            ViewChannel:
                                true,

                            SendMessages:
                                true,

                            ReadMessageHistory:
                                true

                        }

                    );

                    if (
                        data.ownerId
                    ) {

                        await channel.permissionOverwrites.edit(

                            data.ownerId,

                            {

                                ViewChannel:
                                    true,

                                SendMessages:
                                    true,

                                ReadMessageHistory:
                                    true

                            }

                        );

                    }

                    const claimedButton =
                        new ButtonBuilder()

                            .setCustomId(
                                "claimed_ticket"
                            )

                            .setLabel(
                                `Übernommen von ${member.user.username}`
                            )

                            .setEmoji(
                                "✅"
                            )

                            .setStyle(
                                ButtonStyle.Success
                            )

                            .setDisabled(
                                true
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

                    const newRow =
                        new ActionRowBuilder()

                            .addComponents(

                                claimedButton,

                                forwardButton,

                                closeButton

                            );

                    await interaction.message.edit({

                        components: [
                            newRow
                        ]

                    });

                    const claimEmbed =
                        baseEmbed(

                            "📌 Ticket übernommen",

                            0x5865f2,

`Der Teamler ${member} hat dieses Ticket übernommen.

🔒 Andere Teammitglieder können jetzt nicht mehr schreiben.

🛡️ Administratoren können weiterhin schreiben.

👤 Der Ticket-Ersteller kann weiterhin schreiben.

➡️ Ein anderes Teammitglied kann nur über **Weiterleiten** Zugriff zum Schreiben erhalten.`

                        );

                    await interaction.editReply({

                        embeds: [
                            claimEmbed
                        ]

                    });

                    return;

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

                    const userSelect =
                        new UserSelectMenuBuilder()

                            .setCustomId(
                                "forward_ticket_user"
                            )

                            .setPlaceholder(
                                "Wähle das Teammitglied aus..."
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
                                userSelect
                            );

                    return interaction.reply({

                        content:
                            "➡️ **Ticket weiterleiten**\n\n" +
                            "Wähle unten das Teammitglied aus, an das dieses Ticket weitergeleitet werden soll.",

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

                    if (
                        !isStaff(
                            interaction.member
                        )
                    ) {

                        return interaction.reply({

                            content:
                                "❌ Nur Teammitglieder können Tickets schließen.",

                            flags:
                                MessageFlags.Ephemeral

                        });

                    }

                    const channel =
                        interaction.channel;

                    await interaction.deferReply();

                    await interaction.editReply({

                        content:
                            "🔒 Ticket wird in **3 Sekunden** geschlossen..."

                    });

                    const logEmbed =
                        baseEmbed(

                            "🔒 Ticket geschlossen",

                            0xed4245

                        );

                    logEmbed.addFields(

                        {

                            name:
                                "👤 Geschlossen von",

                            value:
                                `${interaction.user} (${interaction.user.id})`

                        },

                        {

                            name:
                                "🎫 Ticket",

                            value:
                                channel
                                    ? `#${channel.name}`
                                    : "Unbekannt"

                        }

                    );

                    await sendLog(
                        interaction.guild,
                        logEmbed
                    );

                    setTimeout(

                        async () => {

                            try {

                                if (
                                    channel
                                ) {

                                    ticketData.delete(
                                        channel.id
                                    );

                                }

                                if (
                                    channel &&
                                    channel.deletable
                                ) {

                                    await channel.delete();

                                }

                            } catch (error) {

                                console.error(
                                    "❌ Ticket Delete Fehler:",
                                    error
                                );

                            }

                        },

                        3000

                    );

                    return;

                }

            }

        } catch (error) {

            console.error(
                "❌ Interaction Fehler:",
                error
            );

            if (
                interaction.isRepliable() &&
                !interaction.replied &&
                !interaction.deferred
            ) {

                await interaction.reply({

                    content:
                        "❌ Es ist ein Fehler aufgetreten.",

                    flags:
                        MessageFlags.Ephemeral

                }).catch(
                    () => {}
                );

            } else if (
                interaction.deferred
            ) {

                await interaction.editReply({

                    content:
                        "❌ Es ist ein Fehler aufgetreten."

                }).catch(
                    () => {}
                );

            }

        }

    }
);

// ======================================================
// SUPPORT VOICE WARTERAUM
// ======================================================

client.on(
    Events.VoiceStateUpdate,
    async (oldState, newState) => {

        try {

            if (!isFeatureEnabled("supportVoice")) {
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
);// ======================================================
// COUNTING SYSTEM
// ======================================================

client.on(
    Events.MessageCreate,
    async message => {

        try {

            if (!isFeatureEnabled("counting")) {
                return;
            }

            if (
                message.author.bot
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

            if (
                !/^\d+$/.test(
                    message.content
                )
            ) {
                return;
            }

            const number =
                Number(
                    message.content
                );

            // ==================================================
            // NICHT ZWEIMAL HINTEREINANDER
            // ==================================================

            if (
                message.author.id ===
                lastUserId
            ) {

                await message.reply(
                    "❌ Du kannst nicht zweimal hintereinander zählen!\n" +
                    "🔄 Neustart bei **1**."
                );

                currentNumber =
                    1;

                lastUserId =
                    null;

                return;

            }

            // ==================================================
            // RICHTIGE ZAHL
            // ==================================================

            if (
                number ===
                currentNumber
            ) {

                await message
                    .react(
                        "✅"
                    )
                    .catch(
                        () => {}
                    );

                lastUserId =
                    message.author.id;

                currentNumber++;

                if (
                    currentNumber >
                    100000
                ) {

                    await message.channel.send(
                        "🎉 **100000 erreicht!**\n" +
                        "Das Counting startet wieder bei **1**."
                    );

                    currentNumber =
                        1;

                    lastUserId =
                        null;

                }

            } else {

                // ==================================================
                // FALSCHE ZAHL
                // ==================================================

                await message.reply(
                    `❌ **Falsch!** Erwartet wurde **${currentNumber}**.\n` +
                    "🔄 Neustart bei **1**."
                );

                currentNumber =
                    1;

                lastUserId =
                    null;

            }

        } catch (error) {

            console.error(
                "❌ Counting Fehler:",
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

            if (!isFeatureEnabled("welcome")) {
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

            if (!isFeatureEnabled("memberLogs")) {
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

            if (!isFeatureEnabled("memberLogs")) {
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

            if (
                entry
            ) {

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
                                ? entry.executor.toString()
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

            if (!isFeatureEnabled("moderationLogs")) {
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
                                ? entry.executor.toString()
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

            if (!isFeatureEnabled("moderationLogs")) {
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
                            ? entry.executor.toString()
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

            if (!isFeatureEnabled("memberLogs")) {
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
                addedRoles.size ===
                    0 &&
                removedRoles.size ===
                    0
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
                addedRoles.size >
                0
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
                removedRoles.size >
                0
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

            if (!isFeatureEnabled("voiceLogs")) {
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
            // JOIN
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
            // LEAVE
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
            // MOVE
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

            if (!isFeatureEnabled("channelLogs")) {
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

            if (!isFeatureEnabled("channelLogs")) {
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

            if (!isFeatureEnabled("channelLogs")) {
                return;
            }

            if (
                !after.guild
            ) {

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
                            "Vorher",

                        value:
                            safeText(
                                before.name
                            )
                    },

                    {
                        name:
                            "Nachher",

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

            if (!isFeatureEnabled("messageLogs")) {
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

            if (!isFeatureEnabled("messageLogs")) {
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
// TOKEN PRÜFEN
// ======================================================

if (
    !TOKEN
) {

    console.error("");
    console.error(
        "===================================="
    );

    console.error(
        "❌ TOKEN FEHLT!"
    );

    console.error(
        "Setze TOKEN in deiner .env Datei oder als Environment Variable auf Render."
    );

    console.error(
        "===================================="
    );

    console.error("");

    process.exit(
        1
    );

}


// ======================================================
// LOGIN
// ======================================================

console.log(
    "🔐 Bot wird eingeloggt..."
);

client.login(
    TOKEN
)

    .then(
        () => {

            console.log(
                "🔐 Login erfolgreich gestartet."
            );

        }
    )

    .catch(
        error => {

            console.error(
                "❌ Discord Login fehlgeschlagen:",
                error
            );

            process.exit(
                1
            );

        }
    );
