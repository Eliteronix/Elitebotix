const { GoogleSpreadsheet } = require('google-spreadsheet');
const { DBElitiriCupSignUp } = require('../dbObjects');
// eslint-disable-next-line no-unused-vars
const { currentElitiriCup, currentElitiriCupTopSheetId, currentElitiriCupMiddleSheetId, currentElitiriCupLowerSheetId, currentElitiriCupBeginnerSheetId } = require('../config.json');

module.exports = {
	name: 'claim-lobby',
	//aliases: ['developer'],
	description: 'Sends feedback to the dev',
	usage: '<bug/feature/feedback> <description>',
	//permissions: 'KICK_MEMBERS',
	//permissionsTranslated: 'Manage Server',
	// botPermissions: Permissions.FLAGS.SEND_MESSAGES,
	botPermissionsTranslated: 'Send Messages',
	//guildOnly: true,
	args: false,
	cooldown: 15,
	noCooldownMessage: false,
	tags: 'general',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, client) {
		await updateSheet();
		msg.reply('Done.');
	}
};

// I've commented out and deleted some player checking stuff just to make it easier to understand what causes this error agreeGe

let spreadsheetID = '1FPr133dAROYGUpJOaQPGTvGq5hjk8B-Ik82rmZsa9NM';

async function updateSheet() {
	// eslint-disable-next-line no-undef
	// if (process.env.SERVER !== 'Live') {
	// 	return;
	// }

	try {
		const doc = new GoogleSpreadsheet(spreadsheetID);
		await doc.useServiceAccountAuth({
			// eslint-disable-next-line no-undef
			client_email: process.env.GOOGLESHEETSSERVICEACCOUNTMAIL,
			// eslint-disable-next-line no-undef
			private_key: process.env.GOOGLESHEETSSERVICEACCOUNTPRIVATEKEY.replace(/\\n/g, '\n'),
		});

		await doc.loadInfo();
		const sheet = doc.sheetsById[392895724];

		// let bracketPlayer = await DBElitiriCupSignUp.findAll({
		// 	where: {
		// 		tournamentName: currentElitiriCup,
		// 		bracketName: bracketName,
		// 	}
		// });
        
		await sheet.loadCells('G5:U16');
		for (let i = 0; i < 14; i++) {
			// 	let playerName = '';
			// 	// if (bracketPlayer[i]) {
			// 	// 	// playerName = bracketPlayer[i].osuName;
			// 	// 	playerName = 'Roddy';
			// 	// }

			let playerName = 'Rod Rod';
			const PlayerNameCell = sheet.getCell(0, 0); //getCell(row, column) zero-indexed
			if (PlayerNameCell.value !== playerName) {
				PlayerNameCell.value = playerName;
			}

			await sheet.saveUpdatedCells();
		}
	} catch (error) {
		console.log(error);
	}
}
