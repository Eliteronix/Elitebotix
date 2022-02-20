const { GoogleSpreadsheet } = require('google-spreadsheet');
const { DBElitiriCupSignUp, DBElitiriLobbies } = require('../dbObjects');
// eslint-disable-next-line no-unused-vars
const { currentElitiriCup } = require('../config.json');

// To-Do (it is 5:27 right now i havent slept yet my code sucks ass as always thanks)
// what to do if lobby is full
// lobbyId regex

module.exports = {
    name: 'elitiri-claim-lobby',
    //aliases: ['developer'],
    description: `Choose your qualifier lobby for ${currentElitiriCup}`,
    usage: '<LobbyID>',
    //permissions: 'KICK_MEMBERS',
    //permissionsTranslated: 'Manage Server',
    // botPermissions: Permissions.FLAGS.SEND_MESSAGES,
    botPermissionsTranslated: 'Send Messages',
    //guildOnly: true,
    args: true,
    cooldown: 15,
    noCooldownMessage: false,
    tags: 'elitiri',
    prefixCommand: true,
    // eslint-disable-next-line no-unused-vars
    async execute(msg, args, interaction, client) {
        // UNCOMMENT THIS LATER
        // eslint-disable-next-line no-undef
        // if (process.env.SERVER !== 'Live') {
        //     return;
        // }

        let lobbyId = Number(args[0]);

        // Make sure lobbyId is valid
        if (lobbyId > 24 || lobbyId < 1) {
            if (msg && msg.id) {
                return msg.reply('Please make sure your lobby ID is correct');
            } else {
                return interaction.reply({ content: 'Please make sure your lobby ID is correct' });
            }
        }
        // STUFF NEEDS TESTING
        let player = await DBElitiriCupSignUp.findAll({
            where: {
                tournamentName: currentElitiriCup,
                userId: msg.author.id,
            }
        });

        if (!player) {
            if (msg && msg.id) {
                return msg.reply(`Seems like you're not registered for ${currentElitiriCup}`);
            } else {
                return interaction.reply({ content: `Seems like you're not registered for ${currentElitiriCup}` });
            }
        }

        let scheduleSheetId;
        let lobbyAbbreviation;
        // players bracket check
        if (player[0].bracketName == 'Top Bracket') {
            scheduleSheetId = 'Qualifiers Schedules-Top';
            lobbyAbbreviation = 'DQ-';
        } else if (player[0].bracketName == 'Middle Bracket') {
            scheduleSheetId = 'Qualifiers Schedules-Middle';
            lobbyAbbreviation = 'CQ-';
        } else if (player[0].bracketName == 'Lower Bracket') {
            scheduleSheetId = 'Qualifiers Schedules-Lower';
            lobbyAbbreviation = 'BQ-';
        } else if (player[0].bracketName == 'Beginner Bracket') {
            scheduleSheetId = 'Qualifiers Schedules-Beginner';
            lobbyAbbreviation = 'AQ-';
        }

        // Initialize the sheet - doc ID is the long id in the sheets URL
        const doc = new GoogleSpreadsheet('1FPr133dAROYGUpJOaQPGTvGq5hjk8B-Ik82rmZsa9NM');
        // Initialize Auth - see more available options at https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
        await doc.useServiceAccountAuth({
            // eslint-disable-next-line no-undef
            client_email: process.env.GOOGLESHEETSSERVICEACCOUNTMAIL,
            // eslint-disable-next-line no-undef
            private_key: process.env.GOOGLESHEETSSERVICEACCOUNTPRIVATEKEY.replace(/\\n/g, '\n'),
        });
        await doc.loadInfo(); // loads document properties and worksheet
        const sheet = doc.sheetsByTitle[scheduleSheetId];
        await sheet.loadCells('A1:U29');


        //we need to skip 17th row
        if (lobbyId > 12) {
            lobbyId++;
        }

        let PlayerNameCell = sheet.getCell(3 + lobbyId, 6);
        for (let i = 0; PlayerNameCell !== ''; i++) {
            PlayerNameCell = sheet.getCell(3 + lobbyId, 6 + i); //getCell(row, column) zero-indexed
            if (PlayerNameCell.value !== player[0].osuName) {
                PlayerNameCell.value = player[0].osuName;
            }
        }
        await sheet.saveUpdatedCells();

        if (msg && msg.id) {
            return msg.reply(`You have successfully claimed lobby ${lobbyAbbreviation}${args[0]}`);
        } else {
            return interaction.reply({ content: `You have successfully claimed lobby ${lobbyAbbreviation}${args[0]}` });
        }
    }
};
