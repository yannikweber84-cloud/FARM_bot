require("dotenv").config();

const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("FARM Bot läuft!");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🌐 Server läuft auf Port ${PORT}`);
});


// =======================
// DISCORD IMPORTS
// =======================

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
} = require("discord.js");


// =======================
// BOT DATEN
// =======================

const TOKEN = process.env.TOKEN;

const CLIENT_ID = "1534286416945614889";


// =======================
// WELCOME SYSTEM
// =======================

const WELCOME_CHANNEL_ID = "1507456889615810642";

const ROLE_1_ID = "1508899625258717355";
const ROLE_2_ID = "1507456888843800596";


// =======================
// VOICE SUPPORT
// =======================

const SUPPORT_WARTE_RAUM_ID = "1507456890253349029";

const SUPPORT_LOG_CHANNEL_ID = "1507456890576306401";

const SUPPORT_ROLE_ID = "1508899899222134835";


// =======================
// TICKET SYSTEM
// =======================

const STAFF_ROLE_ID = "1488904093970858115";


const CLAN_CATEGORY_ID = "1534287236407759040";

const TEAM_CATEGORY_ID = "1534287314464018655";

const BAU_CATEGORY_ID = "1534287374819917896";


// =======================
// COUNTING SYSTEM
// =======================

let countingActive = false;

let currentNumber = 1;

let lastUserId = null;


// =======================
// CLIENT
// =======================

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

        .setName("countingstart")

        .setDescription("Startet das Counting")

        .toJSON(),



    new SlashCommandBuilder()

        .setName("ticketpanel")

        .setDescription("Erstellt das Ticket Panel")

        .toJSON()

];


// =======================
// COMMAND REGISTRIERUNG
// =======================

const rest = new REST({

    version: "10"

}).setToken(TOKEN);



(async () => {

    try {


        await rest.put(

            Routes.applicationCommands(CLIENT_ID),

            {

                body: commands

            }

        );


        console.log("✅ Slash Commands registriert");


    } catch (error) {


        console.error(error);


    }


})();



// =======================
// READY
// =======================

client.once(Events.ClientReady, () => {


    console.log(`✅ ${client.user.tag} ist online!`);


});


// =======================
// JOIN SYSTEM
// =======================

client.on(Events.GuildMemberAdd, async (member) => {


    try {


        await member.roles.add(ROLE_1_ID);


        await member.roles.add(ROLE_2_ID);



        const channel = member.guild.channels.cache.get(

            WELCOME_CHANNEL_ID

        );



        if (!channel) return;



        const embed = new EmbedBuilder()


            .setColor("Yellow")


            .setTitle("⚡️ Logging ⚡️")


            .setDescription(

`${member} ist gejoined!


UserId:

${member.id}


Aktuelle Memberanzahl:

${member.guild.memberCount}`

            )


            .setThumbnail(

                member.user.displayAvatarURL({

                    dynamic:true

                })

            )


            .setTimestamp();



        await channel.send({

            embeds:[embed]

        });



    } catch(err) {


        console.error("Join Fehler:",err);


    }


});// =======================
// VOICE SUPPORT SYSTEM
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


                .setColor("Yellow")


                .setTitle("🎧 Voice-Support benötigt!")


                .setDescription(

`👤 Spieler:

${newState.member}


📞 Kanal:

${newState.channel}


⏰ Zeit:

<t:${Math.floor(Date.now() / 1000)}:R>`

                )


                .setTimestamp();



            await logChannel.send({


                content:`<@&${SUPPORT_ROLE_ID}>`,


                embeds:[embed]


            });



        }



    } catch(err) {


        console.error("Voice Fehler:",err);


    }


});




// =======================
// INTERACTION SYSTEM
// =======================


client.on(Events.InteractionCreate, async interaction => {



    if (!interaction.isChatInputCommand()) return;




    // =======================
    // COUNTING START
    // =======================


    if(interaction.commandName === "countingstart"){



        countingActive = true;


        currentNumber = 1;


        lastUserId = null;



        await interaction.reply(

            "🎉 Counting gestartet bei **1**!"

        );


    }




});




// =======================
// COUNTING SYSTEM
// =======================


client.on("messageCreate", async message => {



    if(message.author.bot) return;



    if(!countingActive) return;



    if(!/^\d+$/.test(message.content)) return;



    const number = parseInt(message.content);




    // gleicher User zweimal


    if(message.author.id === lastUserId){



        await message.channel.send(

            "❌ Du kannst nicht zweimal hintereinander zählen! Reset auf **1**"

        );



        currentNumber = 1;


        lastUserId = null;



        return;


    }




    // richtige Zahl


    if(number === currentNumber){



        await message.react("✅");



        lastUserId = message.author.id;



        currentNumber++;




        if(currentNumber > 100000){



            await message.channel.send(

                "🎉 **100000 erreicht!** Counting startet wieder bei **1**."

            );



            currentNumber = 1;


            lastUserId = null;


        }




    } else {



        await message.channel.send(

            `❌ Falsch! Erwartet war **${currentNumber}**. Reset auf **1**`

        );



        currentNumber = 1;


        lastUserId = null;



    }




});




// =======================
// TICKET INTERACTION START
// =======================


client.on(Events.InteractionCreate, async interaction => {



    // =======================
    // TICKET PANEL COMMAND
    // =======================


    if(interaction.isChatInputCommand()){



        if(interaction.commandName === "ticketpanel"){



            const embed = new EmbedBuilder()



                .setColor("#2B2D31")



                .setTitle("🎫 Allgemeiner Support")



                .setDescription(`

Du hast ein Problem, eine Frage oder benötigst Hilfe?

Dann bist du hier genau richtig!


━━━━━━━━━━━━━━━━━━


📌 **Wobei wir helfen können:**


• ❓ Fragen rund um den Server

• 🐛 Probleme & Bugs

• 🚨 Spieler melden

• 🛠 Allgemeine Hilfe

• 🏗 Bauprojekte & Aufträge


━━━━━━━━━━━━━━━━━━


👥 **Bewerbungen & Bau-Firma**


Erstelle ein Ticket und sende uns deine Bewerbung.


━━━━━━━━━━━━━━━━━━


📋 **Hinweise:**


• Beschreibe dein Anliegen genau

• Bleibe freundlich

• Nur ein Ticket pro Anliegen


━━━━━━━━━━━━━━━━━━


🚀 Viel Spaß auf dem Server!

                `)



                .setThumbnail(

                    client.user.displayAvatarURL()

                )



                .setFooter({

                    text:"VIBE Support System"

                });




            const menu = new StringSelectMenuBuilder()



                .setCustomId("ticket_menu")



                .setPlaceholder(

                    "Wähle eine Kategorie aus"

                )



                .addOptions([



                    {

                        label:"Allgemeiner Support",

                        description:"Hilfe und Anliegen",

                        emoji:"🛡",

                        value:"clan_bewerbung"

                    },



                    {

                        label:"Team/Clan Bewerbung",

                        description:"Bewirb dich für Team oder Clan",

                        emoji:"👥",

                        value:"team_bewerbung"

                    },



                    {

                        label:"Bau Firma",

                        description:"Firmenbewerbung und Aufträge",

                        emoji:"🏗",

                        value:"bau_firma"

                    }



                ]);





            const row = new ActionRowBuilder()

                .addComponents(menu);




            await interaction.reply({


                embeds:[embed],


                components:[row]


            });



        }


    }



});// =======================
// TICKET AUSWAHL MENU
// =======================

client.on(Events.InteractionCreate, async interaction => {


    if(!interaction.isStringSelectMenu()) return;


    if(interaction.customId !== "ticket_menu") return;



    const selected = interaction.values[0];



    let ticketName = "";

    let ticketTitle = "";

    let categoryID = null;




    // =======================
    // KATEGORIEN
    // =======================


    if(selected === "clan_bewerbung"){


        ticketName = `💬support-${interaction.user.username.toLowerCase()}`;

        ticketTitle = "🛡 Allgemeiner Support";

        categoryID = CLAN_CATEGORY_ID;


    }




    if(selected === "team_bewerbung"){


        ticketName = `📝bewerbung-${interaction.user.username.toLowerCase()}`;

        ticketTitle = "👥 Team/Clan Bewerbung";

        categoryID = TEAM_CATEGORY_ID;


    }




    if(selected === "bau_firma"){


        ticketName = `🧱bau-${interaction.user.username.toLowerCase()}`;

        ticketTitle = "🏗 Bau Firma";

        categoryID = BAU_CATEGORY_ID;


    }




    // =======================
    // CHECK OB TICKET EXISTIERT
    // =======================


    const existing = interaction.guild.channels.cache.find(

        c => c.name === ticketName.toLowerCase()

    );



    if(existing){


        return interaction.reply({

            content:`❌ Du hast bereits ein Ticket offen: ${existing}`,

            ephemeral:true

        });


    }




    // =======================
    // TICKET ERSTELLEN
    // =======================


    const channel = await interaction.guild.channels.create({



        name:ticketName,



        type:ChannelType.GuildText,



        parent:categoryID,



        permissionOverwrites:[



            {

                id:interaction.guild.id,


                deny:[

                    PermissionsBitField.Flags.ViewChannel

                ]

            },



            {

                id:interaction.user.id,


                allow:[


                    PermissionsBitField.Flags.ViewChannel,


                    PermissionsBitField.Flags.SendMessages,


                    PermissionsBitField.Flags.ReadMessageHistory


                ]

            },



            {

                id:STAFF_ROLE_ID,


                allow:[


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


        .setCustomId("claim_ticket")


        .setLabel("Ticket übernehmen")


        .setEmoji("📌")


        .setStyle(ButtonStyle.Primary);





    const closeButton = new ButtonBuilder()


        .setCustomId("close_ticket")


        .setLabel("Ticket schließen")


        .setEmoji("🔒")


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



        .setColor("#57F287")



        .setTitle(ticketTitle)



        .setDescription(`

Hallo ${interaction.user} 👋


Dein Ticket wurde erfolgreich erstellt.


📌 Beschreibe dein Anliegen möglichst genau,

damit das Team dir schnell helfen kann.



`)



        .setFooter({

            text:"VIBE Ticket System"

        })



        .setTimestamp();





    await channel.send({



        content:`<@&${STAFF_ROLE_ID}>`,



        embeds:[

            ticketEmbed

        ],



        components:[

            buttonRow

        ]



    });





    await interaction.reply({



        content:`✅ Dein Ticket wurde erstellt: ${channel}`,



        ephemeral:true



    });



});
// =======================
// TICKET BUTTON SYSTEM
// =======================

client.on(Events.InteractionCreate, async interaction => {


    if(!interaction.isButton()) return;



    // =======================
    // TICKET ÜBERNEHMEN
    // =======================


    if(interaction.customId === "claim_ticket"){



        if(!interaction.member.roles.cache.has(STAFF_ROLE_ID)){



            return interaction.reply({


                content:"❌ Nur Teammitglieder können Tickets übernehmen.",


                ephemeral:true


            });



        }





        const claimedButton = new ButtonBuilder()


            .setCustomId("claimed_ticket")


            .setLabel(

                `Übernommen von ${interaction.user.username}`

            )


            .setEmoji("✅")


            .setStyle(ButtonStyle.Success)


            .setDisabled(true);





        const closeButton = new ButtonBuilder()


            .setCustomId("close_ticket")


            .setLabel("Ticket schließen")


            .setEmoji("🔒")


            .setStyle(ButtonStyle.Danger);





        const newRow = new ActionRowBuilder()


            .addComponents(


                claimedButton,


                closeButton


            );





        await interaction.message.edit({



            components:[newRow]



        });





        const claimEmbed = new EmbedBuilder()



            .setColor("#5865F2")



            .setDescription(`

📌 Der Teamler ${interaction.user} hat das Ticket übernommen.


Er wird sich zeitnah um dich kümmern!

            `)



            .setTimestamp();





        await interaction.reply({


            embeds:[claimEmbed]


        });



    }







    // =======================
    // TICKET SCHLIESSEN
    // =======================


    if(interaction.customId === "close_ticket"){



        await interaction.reply({


            content:"🔒 Ticket wird in 3 Sekunden geschlossen...",


            ephemeral:false



        });





        setTimeout(() => {



            interaction.channel.delete()


                .catch(console.error);



        },3000);



    }



});





// =======================
// LOGIN
// =======================

client.login(TOKEN);
