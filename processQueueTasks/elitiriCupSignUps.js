const { GoogleSpreadsheet } = require('google-spreadsheet');
const { DBElitiriCupSignUp } = require('../dbObjects');

module.exports = {
	// eslint-disable-next-line no-unused-vars
	async execute(client, processQueueEntry) {

		// Initialize the sheet - doc ID is the long id in the sheets URL
		const doc = new GoogleSpreadsheet('1jjZm93sA0XQs6Zfgh1Ev-46IuNunobDiW80uQMM8K2k');

		// Initialize Auth - see more available options at https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
		await doc.useServiceAccountAuth({
			// eslint-disable-next-line no-undef
			client_email: process.env.GOOGLESHEETSSERVICEACCOUNTMAIL,
			// eslint-disable-next-line no-undef
			private_key: process.env.GOOGLESHEETSSERVICEACCOUNTPRIVATEKEY.replace(/\\n/g, '\n'),
		});

		console.log('Loading');
		await doc.loadInfo(); // loads document properties and worksheet
		console.log('Loaded');

		const sheet = doc.sheetsByTitle['Player List'];

		let lowerBracketPlayers = await DBElitiriCupSignUp.findAll({
			where: {
				tournamentName: 'Elitiri Cup Summer 2021',
				// bracketName: 'Lower Bracket'
			}
		});

		quicksort(lowerBracketPlayers);

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
			if (lowerBracketPlayers[i]) {
				numberValue = i + 1;
				playerName = lowerBracketPlayers[i].osuName;
				playerID = lowerBracketPlayers[i].osuUserId;
				playerRank = lowerBracketPlayers[i].osuRank;
				discordTag = lowerBracketPlayers[i].discordTag;
				if (lowerBracketPlayers[i].saturdayEarlyAvailability) {
					time = `${lowerBracketPlayers[i].saturdayEarlyAvailability} - ${lowerBracketPlayers[i].saturdayLateAvailability} UTC | ${lowerBracketPlayers[i].sundayEarlyAvailability} - ${lowerBracketPlayers[i].sundayLateAvailability} UTC`;
				} else {
					time = 'No availabilities set by the player';
				}
				connected = 'Yes';
				badges = lowerBracketPlayers[i].osuBadges;
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
			if (i % 100 === 0) {
				console.log('Writing');
				await sheet.saveUpdatedCells();
				console.log('Wrote');
			}
		}
	},
};

function partition(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].osuRank) <= parseFloat(pivot.osuRank)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksort(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partition(list, start, end);
		quicksort(list, start, p - 1);
		quicksort(list, p + 1, end);
	}
	return list;
}