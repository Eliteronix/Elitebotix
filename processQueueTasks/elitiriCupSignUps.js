const { GoogleSpreadsheet } = require('google-spreadsheet');
const { DBElitiriCupSignUp, DBProcessQueue } = require('../dbObjects');
const { currentElitiriCup, currentElitiriCupTopSheetId, currentElitiriCupMiddleSheetId, currentElitiriCupLowerSheetId, currentElitiriCupBeginnerSheetId } = require('../config.json');

module.exports = {
	// eslint-disable-next-line no-unused-vars
	async execute(client, processQueueEntry) {
		return processQueueEntry.destroy();
		// console.log('elitiriCupSignUps');
		if (processQueueEntry.additions === 'Top Bracket') {
			await updateSheet(currentElitiriCupTopSheetId, processQueueEntry.additions);
		} else if (processQueueEntry.additions === 'Middle Bracket') {
			await updateSheet(currentElitiriCupMiddleSheetId, processQueueEntry.additions);
		} else if (processQueueEntry.additions === 'Lower Bracket') {
			await updateSheet(currentElitiriCupLowerSheetId, processQueueEntry.additions);
		} else if (processQueueEntry.additions === 'Beginner Bracket') {
			await updateSheet(currentElitiriCupBeginnerSheetId, processQueueEntry.additions);
		}

		processQueueEntry.destroy();
	},
};

async function updateSheet(spreadsheetID, bracketName) {
	if (process.env.SERVER !== 'Live') {
		return;
	}

	try {
		// Initialize the sheet - doc ID is the long id in the sheets URL
		const doc = new GoogleSpreadsheet(spreadsheetID);

		// Initialize Auth - see more available options at https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
		await doc.useServiceAccountAuth({
			client_email: process.env.GOOGLESHEETSSERVICEACCOUNTMAIL,
			private_key: process.env.GOOGLESHEETSSERVICEACCOUNTPRIVATEKEY.replace(/\\n/g, '\n'),
		});

		await doc.loadInfo(); // loads document properties and worksheet

		const sheet = doc.sheetsByTitle['Player List'];

		let bracketPlayers = await DBElitiriCupSignUp.findAll({
			attributes: ['osuName', 'osuUserId', 'osuRank', 'discordTag', 'saturdayEarlyAvailability', 'saturdayLateAvailability', 'sundayEarlyAvailability', 'sundayLateAvailability', 'osuBadges'],
			where: {
				tournamentName: currentElitiriCup,
				bracketName: bracketName
			}
		});

		bracketPlayers.sort((a, b) => parseInt(a.osuRank) - parseInt(b.osuRank));

		await sheet.loadCells('B4:J500');
		for (let i = 0; i < 496; i++) {
			let numberValue = '';
			let playerName = '';
			let playerID = '';
			let playerRank = '';
			let discordTag = '';
			let time = '';
			let connected = '';
			let badges = '';
			if (bracketPlayers[i]) {
				numberValue = i + 1;
				playerName = bracketPlayers[i].osuName;
				playerID = bracketPlayers[i].osuUserId;
				playerRank = bracketPlayers[i].osuRank;
				discordTag = bracketPlayers[i].discordTag;
				if (bracketPlayers[i].saturdayEarlyAvailability) {
					time = `${bracketPlayers[i].saturdayEarlyAvailability} - ${bracketPlayers[i].saturdayLateAvailability} UTC | ${bracketPlayers[i].sundayEarlyAvailability} - ${bracketPlayers[i].sundayLateAvailability} UTC`;
				} else {
					time = 'No availabilities set';
				}
				connected = 'Yes';
				badges = bracketPlayers[i].osuBadges;
			}

			const NumberCell = sheet.getCell(3 + i, 1); //getCell(row, column) zero-indexed
			if (NumberCell.value !== numberValue) {
				NumberCell.value = numberValue;
			}

			const PlayerNameCell = sheet.getCell(3 + i, 2); //getCell(row, column) zero-indexed
			if (PlayerNameCell.value !== playerName) {
				PlayerNameCell.value = playerName;
			}

			const PlayerIDCell = sheet.getCell(3 + i, 3); //getCell(row, column) zero-indexed
			if (PlayerIDCell.value !== playerID) {
				PlayerIDCell.value = playerID;
			}


			const RankCell = sheet.getCell(3 + i, 4); //getCell(row, column) zero-indexed
			if (RankCell.value !== playerRank) {
				RankCell.value = playerRank;
			}

			const DiscordTagCell = sheet.getCell(3 + i, 5); //getCell(row, column) zero-indexed
			if (DiscordTagCell.value !== discordTag) {
				DiscordTagCell.value = discordTag;
			}

			const TimeCell = sheet.getCell(3 + i, 6); //getCell(row, column) zero-indexed
			if (TimeCell.value !== time) {
				TimeCell.value = time;
			}

			const ConnectedCell = sheet.getCell(3 + i, 8); //getCell(row, column) zero-indexed
			if (ConnectedCell.value !== connected) {
				ConnectedCell.value = connected;
			}

			const BadgesCell = sheet.getCell(3 + i, 9); //getCell(row, column) zero-indexed
			if (BadgesCell.value !== badges) {
				BadgesCell.value = badges;
			}
			if (i % 150 === 0 || i === 495) {
				await sheet.saveUpdatedCells();
			}
		}
	} catch (error) {
		if (error.message === 'Google API error - [503] The service is currently unavailable.'
			|| error.message === 'Request failed with status code 502'
			|| error.message === 'Google API error - [500] Internal error encountered.') {
			const task = await DBProcessQueue.count({
				where: {
					guildId: 'None',
					task: 'elitiriCupSignUps',
					additions: bracketName
				}
			});

			if (task === 0) {
				let date = new Date();
				date.setUTCMinutes(date.getUTCMinutes() + 1);
				DBProcessQueue.create({ guildId: 'None', task: 'elitiriCupSignUps', priority: 3, additions: bracketName, date: date });
			}
		} else {
			console.error(error);
		}
	}

	const task = await DBProcessQueue.count({
		where: {
			task: 'elitiriRoleAssignment'
		}
	});

	if (task === 0) {
		let date = new Date();
		DBProcessQueue.create({
			guildId: 'None', task: 'elitiriRoleAssignment', priority: 3, date: date
		});
	}
}