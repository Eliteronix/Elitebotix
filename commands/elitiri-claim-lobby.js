const { GoogleSpreadsheet } = require('google-spreadsheet');
const { DBElitiriCupSignUp } = require('../dbObjects');
// eslint-disable-next-line no-unused-vars
const { currentElitiriCup } = require('../config.json');

// To-Do (it is 5:27 right now i havent slept yet my code sucks ass as always thanks)
// what to do if lobby is full
// user is not registered
// lobbyId regex
// lobby change (i actually have no clue how we can search for the osuName, as far as i know you cant find values of the range of cells with sheets api)
// process queue fuckery :hypers:

module.exports = {
    name: 'elitiri-claim-lobby',
    //aliases: ['developer'],
    description: `Claim your qualifiers lobby for ${currentElitiriCup}`,
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
        // Elite you need to use your regex power and get rid of the possible lobby abbreviation (AQ-1 => 1)
        let lobbyId = Number(args[0]);

        // Make sure lobbyId is valid
        if (lobbyId > 24 || lobbyId < 1) {
            if (msg && msg.id) {
                return msg.reply('Please make sure your lobby ID is correct');
            } else {
                return interaction.reply({ content: 'Please make sure your lobby ID is correct' });
            }
        } else {
            await updateSheet(lobbyId);
            msg.reply('Done.');
        }
    }
};

async function updateSheet(lobbyId) {
    // UNCOMMENT THIS LATER

    // eslint-disable-next-line no-undef
    // if (process.env.SERVER !== 'Live') {
    //     return;
    // }

    try {
        // STUFF NEEDS TESTING

        // let bracketPlayers = await DBElitiriCupSignUp.findAll({
        //     where: {
        //         tournamentName: currentElitiriCup,
        //         bracketName: bracketName,
        //         osuName: osuName
        //     }
        // });


        // players bracket check
        if (bracketName == 'Top Bracket') {
            scheduleSheetId = 'Qualifiers Schedules-Top';
        } else if (bracketName == 'Middle Bracket') {
            scheduleSheetId = 'Qualifiers Schedules-Middle';
        } else if (bracketName == 'Lower Bracket') {
            scheduleSheetId = 'Qualifiers Schedules-Lower';
        } else if (bracketName == 'Beginner Bracket') {
            scheduleSheetId = 'Qualifiers Schedules-Beginner';
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

        for (let i = 0; i < 15; i++) {
            // let playerName = 'Roddy';
            if (bracketPlayers[i]) {
                playerName = bracketPlayers[i].osuName;
            }

            // i couldnt make loadCells function work properly so had to load cells from A1
            const PlayerNameCell = sheet.getCell(3 + lobbyId, 6 + i); //getCell(row, column) zero-indexed
            if (PlayerNameCell.value !== playerName) {
                PlayerNameCell.value = playerName;
            }
        }
        await sheet.saveUpdatedCells();
    } catch (error) {
        if (error.message === 'Google API error - [503] The service is currently unavailable.'
            || error.message === 'Request failed with status code 502'
            || error.message === 'Google API error - [500] Internal error encountered.') { console.log(error); }
    }
}