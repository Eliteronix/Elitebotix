const { GoogleSpreadsheet } = require('google-spreadsheet');
const { DBElitiriCupSignUp, DBElitiriCupLobbies, DBDiscordUsers, DBElitiriCupStaff } = require('../dbObjects');
const { currentElitiriCup, currentElitiriCupTopQualsFirstLobby, currentElitiriCupMiddleQualsFirstLobby, currentElitiriCupLowerQualsFirstLobby, currentElitiriCupBeginnerQualsFirstLobby, currentElitiriCupRefSheetId } = require('../config.json');
const { populateMsgFromInteraction } = require('../utils');

module.exports = {
	name: 'elitiri-lobby',
	//aliases: ['developer'],
	description: `Allows you to claim lobby for the ${currentElitiriCup}`,
	usage: 'claim <LobbyID>',
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
	async execute(msg, args, interaction, additionalObjects) {
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			args = [interaction.options._subcommand];

			let lobbyId = null;
			for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
				if (interaction.options._hoistedOptions[i].name === 'lobbyid') {
					lobbyId = interaction.options._hoistedOptions[i].value;
				}
			}

			await interaction.deferReply({ ephemeral: true });
			args.push(lobbyId);
		}

		const doc = new GoogleSpreadsheet(currentElitiriCupRefSheetId);
		// Initialize Auth - see more available options at https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
		await doc.useServiceAccountAuth({
			// eslint-disable-next-line no-undef
			client_email: process.env.GOOGLESHEETSSERVICEACCOUNTMAIL,
			// eslint-disable-next-line no-undef
			private_key: process.env.GOOGLESHEETSSERVICEACCOUNTPRIVATEKEY.replace(/\\n/g, '\n'),
		});
		await doc.loadInfo(); // loads document properties and worksheet

		// eslint-disable-next-line no-undef
		// if (process.env.SERVER !== 'Live') {
		// 	return;
		// }


		if (args[0].toLowerCase() === 'claim') {
			args.shift();
			const elitiriSignUp = await DBElitiriCupSignUp.findOne({
				where: {
					tournamentName: currentElitiriCup,
					userId: msg.author.id,
				}
			});

			if (!elitiriSignUp) {
				if (msg.id) {
					return msg.reply(`Seems like you're not registered for the ${currentElitiriCup}`);
				} else {
					return interaction.editReply({ content: `Seems like you're not registered for the ${currentElitiriCup}` });
				}
			}

			//set schedule sheets for different brackets
			let scheduleSheetId;
			let lobbyAbbreviation;
			// player bracket check
			if (elitiriSignUp.bracketName == 'Top Bracket') {
				scheduleSheetId = 'Qualifiers Schedules-Top';
				lobbyAbbreviation = 'DQ-';
			} else if (elitiriSignUp.bracketName == 'Middle Bracket') {
				scheduleSheetId = 'Qualifiers Schedules-Middle';
				lobbyAbbreviation = 'CQ-';
			} else if (elitiriSignUp.bracketName == 'Lower Bracket') {
				scheduleSheetId = 'Qualifiers Schedules-Lower';
				lobbyAbbreviation = 'BQ-';
			} else if (elitiriSignUp.bracketName == 'Beginner Bracket') {
				scheduleSheetId = 'Qualifiers Schedules-Beginner';
				lobbyAbbreviation = 'AQ-';
			}

			let lobbyId = lobbyAbbreviation + args[0].replace(/\D+/, '');

			// Make sure lobbyId is valid
			if (lobbyId.replace(/\D+/, '') > 24 || lobbyId.replace(/\D+/, '') < 1 || lobbyId.replace(/\D+/, '').length > 2) {
				if (msg.id) {
					return msg.reply('Please make sure your lobby ID is correct');
				} else {
					return interaction.editReply({ content: 'Please make sure your lobby ID is correct' });
				}
			}

			let date = new Date();
			if (roundOverCheck(elitiriSignUp.bracketName, lobbyId.replace(/\D+/, '')) == true) {
				if (msg.id) {
					return msg.reply('Your qualifier round is over');
				} else {
					return interaction.editReply({ content: 'Your qualifier round is over' });
				}
			} else {
				date = new Date(roundOverCheck(elitiriSignUp.bracketName, lobbyId.replace(/\D+/, ''))).toUTCString();
			}
			// eslint-disable-next-line no-unused-vars
			const tournamentLobby = await DBElitiriCupLobbies.findOne({
				where: {
					tournamentName: currentElitiriCup,
					lobbyId: lobbyId,
				}
			});
			//no lobby table with given Id has been created yet
			if (!tournamentLobby) {
				//create a lobby
				await DBElitiriCupLobbies.create({
					tournamentName: currentElitiriCup,
					lobbyId: lobbyId,
					lobbyDate: date,
					bracketName: elitiriSignUp.bracketName,
					refDiscordTag: null,
					refOsuUserId: null,
					refOsuName: null,
				});
			}

			const playersInLobby = await DBElitiriCupSignUp.count({
				where: {
					tournamentLobbyId: lobbyId
				}
			});
			if (playersInLobby > 15) {
				if (msg.id) {
					return msg.reply('This lobby is full. Please, choose another one');
				} else {
					return interaction.editReply({ content: 'This lobby is full. Please, choose another one' });
				}
			}

			// previousLobbyId is used to clear previous playerNameCell with player name
			let previousLobbyId = null;
			// set tournamentLobbyId for the player
			if (elitiriSignUp.tournamentLobbyId == null) {
				elitiriSignUp.tournamentLobbyId = lobbyId;
			} else {
				previousLobbyId = elitiriSignUp.tournamentLobbyId;
				elitiriSignUp.tournamentLobbyId = lobbyId;
			}
			await elitiriSignUp.save();

			if (previousLobbyId == elitiriSignUp.tournamentLobbyId) {
				if (msg.id) {
					return msg.reply(`You are already in lobby ${lobbyId}`);
				} else {
					return interaction.editReply({ content: `You are already in lobby ${lobbyId}` });
				}
			}

			// Initialize the sheet - doc ID is the long id in the sheets URL

			const sheet = doc.sheetsByTitle[scheduleSheetId];
			await sheet.loadCells('A1:U29');

			//search for players in the lobby with given ID
			let lobbyPlayers = await DBElitiriCupSignUp.findAll({
				where: {
					tournamentName: currentElitiriCup,
					tournamentLobbyId: lobbyId
				}
			});
			// eslint-disable-next-line no-unused-vars
			let previousLobbyPlayers = await DBElitiriCupSignUp.findAll({
				where: {
					tournamentName: currentElitiriCup,
					tournamentLobbyId: previousLobbyId
				}
			});

			let playerName, playerNameCell, quantityCell;

			//j is a row counter
			let j;

			try {
				// clear new lobby row
				j = Number(elitiriSignUp.tournamentLobbyId.replace(/\D+/, ''));
				if (j > 12) {
					j++;
				}
				for (let i = 0; i < 14; i++) {
					playerNameCell = sheet.getCell(3 + j, 6 + i);
					playerNameCell.value = null;
				}
				//fill in new lobby row
				for (let i = 0; i < lobbyPlayers.length; i++) {
					playerName = lobbyPlayers[i].osuName;
					playerNameCell = sheet.getCell(3 + j, 6 + i);
					playerNameCell.value = playerName;

					quantityCell = sheet.getCell(3 + j, 5);
					quantityCell.value = lobbyPlayers.length + '/15';
				}
				//if lobby was set before
				if (previousLobbyId !== null) {
					//clear previous lobby row
					j = Number(previousLobbyId.replace(/\D+/, ''));
					if (j > 12) {
						j++;
					}
					for (let i = 0; i < 14; i++) {
						playerNameCell = sheet.getCell(3 + j, 6 + i);
						playerNameCell.value = null;

						quantityCell = sheet.getCell(3 + j, 5);
						quantityCell.value = previousLobbyPlayers.length + '/15';
					}
					//fill in previous lobby row
					for (let i = 0; i < previousLobbyPlayers.length; i++) {
						playerName = previousLobbyPlayers[i].osuName;
						playerNameCell = sheet.getCell(3 + j, 6 + i);
						playerNameCell.value = playerName;

						quantityCell = sheet.getCell(3 + j, 5);
						quantityCell.value = previousLobbyPlayers.length + '/15';
					}

					//if lobby wasnt set before
					//fill in lobby row
				}
				await sheet.saveUpdatedCells();

			} catch (error) {
				console.log(error);
				if (msg.id) {
					return msg.reply('Something went wrong... Please, try again');
				} else {
					return interaction.editReply({ content: 'Something went wrong... Please, try again' });
				}
			}

			if (msg.id) {
				return msg.reply(`You have successfully claimed lobby \`${lobbyId}\``);
			} else {
				return interaction.editReply({ content: `You have successfully claimed lobby \`${lobbyId}\`` });
			}


		} else if (args[0].toLowerCase() == 'referee') {
			args.shift();
			if (!args[0]) {
				if (msg.id) {
					return msg.reply('Please provide a valid lobby ID');
				} else {
					return interaction.editReply({ content: 'Please provide a valid lobby ID' });
				}
			}
			let lobbyId;
			let refereeCell;
			let scheduleSheetId;
			let bracketName;
			if (args[0].replace(/\d+/, '') == 'DQ-') {
				scheduleSheetId = 'Qualifiers Schedules-Top';
				bracketName = 'Top Bracket';
			} else if (args[0].replace(/\d+/, '') == 'CQ-') {
				scheduleSheetId = 'Qualifiers Schedules-Middle';
				bracketName = 'Middle Bracket';
			} else if (args[0].replace(/\d+/, '') == 'BQ-') {
				scheduleSheetId = 'Qualifiers Schedules-Lower';
				bracketName = 'Lower Bracket';
			} else {
				scheduleSheetId = 'Qualifiers Schedules-Beginner';
				bracketName = 'Beginner Bracket';
			}

			const sheet = doc.sheetsByTitle[scheduleSheetId];
			await sheet.loadCells('A1:U29');

			lobbyId = args[0];
			let potentialLobby = await DBElitiriCupLobbies.findOne({
				where: {
					lobbyId: lobbyId
				}
			});

			if (!potentialLobby) {
				if (msg.id) {
					return msg.reply(`There are no players in the \`${lobbyId}\` lobby`);
				} else {
					return interaction.editReply({ content: `There are no players in the \`${lobbyId}\` lobby` });
				}
			}
			//row counter
			let k;
			k = Number(lobbyId.replace(/\D+/, ''));
			if (k > 12) {
				k++;
			}

			const discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: msg.author.id
				}
			});

			let potentialReferee = await DBElitiriCupStaff.findOne({
				where: {
					tournamentName: currentElitiriCup,
					referee: true,
					osuUserId: discordUser.osuUserId
				}
			});

			let elitirisignup = await DBElitiriCupSignUp.findOne({
				where: {
					tournamentName: currentElitiriCup,
					osuUserId: discordUser.osuUserId
				}
			});

			if (roundOverCheck(bracketName, lobbyId) == true) {
				if (msg.id) {
					return msg.reply('This qualifier round is over');
				} else {
					return interaction.editReply({ content: 'This qualifier round is over' });
				}
			}

			if (elitirisignup) {
				if (elitirisignup.bracketName == bracketName && elitirisignup.rankAchived == null) {
					if (msg.id) {
						return msg.reply('You are not allowed to ref your own bracket unless you have lost');
					} else {
						return interaction.editReply({ content: 'You are not allowed to ref your own bracket unless you have lost' });
					}
				}
			}

			if (!potentialReferee) {
				if (msg.id) {
					return msg.reply(`You're not a referee for the ${currentElitiriCup}. If you think this is a mistake, please contact head staff of the tournament`);
				} else {
					return interaction.editReply({ content: `You're not a referee for the ${currentElitiriCup}. If you think this is a mistake, please contact head staff of the tournament` });
				}
			}

			if (potentialLobby.refOsuName !== null && potentialLobby.refOsuName !== discordUser.osuName) {
				if (msg.id) {
					return msg.reply(`This lobby is already been taken by \`${potentialLobby.refOsuName}\`. If you want to take this lobby, please contact them`);
				} else {
					return interaction.editReply({ content: `This lobby is already been taken by \`${potentialLobby.refOsuName}\`. If you want to take this lobby, please contact them` });
				}
			} else if (potentialLobby.refOsuName == discordUser.osuName) {
				if (msg.id) {
					return msg.reply(`You have already claimed \`${lobbyId}\` lobby as referee`);
				} else {
					return interaction.editReply({ content: `You have already claimed \`${lobbyId}\` lobby as referee` });
				}
			}

			potentialLobby.refOsuName = discordUser.osuName;
			if (msg.id) {
				potentialLobby.refDiscordTag = msg.member.user.tag;
			} else {
				potentialLobby.refDiscordTag = interaction.member.user.tag;
			}

			potentialLobby.refOsuUserId = discordUser.osuUserId;
			await potentialLobby.save();

			//create notification task

			try {
				refereeCell = sheet.getCell(3 + k, 4);
				refereeCell.value = potentialLobby.refOsuName;

				await sheet.saveUpdatedCells();

				if (msg.id) {
					return msg.reply(`You successfully claimed \`${lobbyId}\` as referee`);
				} else {
					return interaction.editReply({ content: `You successfully claimed \`${lobbyId}\` as referee` });
				}
			} catch (error) {
				console.log(error);
				if (msg.id) {
					return msg.reply('Something went wrong. Please, try again');
				} else {
					interaction.editReply({ content: 'Something went wrong. Please, try again' });
				}

			}
		} else if (args[0].toLowerCase() == 'refereedrop') {
			args.shift();
			let lobbyId = args[0];
			if (!args[0]) {
				if (msg.id) {
					return msg.reply('Please provide a valid lobby ID');
				} else {
					return interaction.editReply({ content: 'Please provide a valid lobby ID' });
				}
			}
			let potentialLobby = await DBElitiriCupLobbies.findOne({
				where: {
					lobbyId: lobbyId
				}
			});

			if (!potentialLobby) {
				if (msg.id) {
					return msg.reply(`Lobby \`${lobbyId}\` not found`);
				} else {
					return interaction.editReply({ content: `Lobby \`${lobbyId}\` not found` });
				}
			}

			const discordUser = await DBDiscordUsers.findOne({
				where: {
					userId: msg.author.id
				}
			});

			if (potentialLobby.refOsuName !== discordUser.osuName) {
				if (msg.id) {
					return msg.reply(`You are not a referee for \`${lobbyId}\``);
				} else {
					return interaction.editReply({ content: `You are not a referee for \`${lobbyId}\`` });
				}
			}
			potentialLobby.refOsuName = null;
			potentialLobby.refDiscordTag = null;
			potentialLobby.refOsuUserId = null;
			await potentialLobby.save();

			let k = Number(lobbyId.replace(/\D+/, ''));
			if (k > 12) {
				k++;
			}

			let scheduleSheetId;
			if (args[0].replace(/\d+/, '') == 'DQ-') {
				scheduleSheetId = 'Qualifiers Schedules-Top';
			} else if (args[0].replace(/\d+/, '') == 'CQ-') {
				scheduleSheetId = 'Qualifiers Schedules-Middle';
			} else if (args[0].replace(/\d+/, '') == 'BQ-') {
				scheduleSheetId = 'Qualifiers Schedules-Lower';
			} else {
				scheduleSheetId = 'Qualifiers Schedules-Beginner';
			}

			try {
				const sheet = doc.sheetsByTitle[scheduleSheetId];
				await sheet.loadCells('A1:U29');

				let refereeCell = sheet.getCell(3 + k, 4);
				refereeCell.value = null;

				await sheet.saveUpdatedCells();

				if (msg.id) {
					return msg.reply(`Successfully unassigned you from \`${lobbyId}\``);
				} else {
					interaction.editReply({ content: `Successfully unassigned you from \`${lobbyId}\`` });
				}
			} catch (error) {
				console.log(error);
				if (msg.id) {
					return msg.reply('Something went wrong. Please, try again');
				} else {
					interaction.editReply({ content: 'Something went wrong. Please, try again' });
				}
			}
		}
	}
};

// if the round is over function returns true, if not - givenLobbyDate
function roundOverCheck(bracketName, lobbyId) {

	let now = new Date();
	let givenLobbyDate = new Date();
	let k = 0;
	if (lobbyId > 12) {
		k = 1;
	}

	if (bracketName == 'Top Bracket') {
		givenLobbyDate.setUTCMilliseconds(0);
		givenLobbyDate.setUTCSeconds(0);
		givenLobbyDate.setUTCMinutes(0);
		givenLobbyDate.setUTCHours(currentElitiriCupTopQualsFirstLobby.hours + 2 * (lobbyId.replace(/\D+/, '') - 1));
		givenLobbyDate.setUTCDate(currentElitiriCupTopQualsFirstLobby.day + k);
		givenLobbyDate.setUTCMonth(currentElitiriCupTopQualsFirstLobby.zeroIndexMonth); //Zero Indexed
		givenLobbyDate.setUTCFullYear(currentElitiriCupTopQualsFirstLobby.year);
	} else if (bracketName == 'Middle Bracket') {
		givenLobbyDate.setUTCMilliseconds(0);
		givenLobbyDate.setUTCSeconds(0);
		givenLobbyDate.setUTCMinutes(0);
		givenLobbyDate.setUTCHours(currentElitiriCupMiddleQualsFirstLobby.hours + 2 * (lobbyId.replace(/\D+/, '') - 1));
		givenLobbyDate.setUTCDate(currentElitiriCupMiddleQualsFirstLobby.day + k);
		givenLobbyDate.setUTCMonth(currentElitiriCupMiddleQualsFirstLobby.zeroIndexMonth); //Zero Indexed
		givenLobbyDate.setUTCFullYear(currentElitiriCupMiddleQualsFirstLobby.year);
	} else if (bracketName == 'Lower Bracket') {
		givenLobbyDate.setUTCMilliseconds(0);
		givenLobbyDate.setUTCSeconds(0);
		givenLobbyDate.setUTCMinutes(0);
		givenLobbyDate.setUTCHours(currentElitiriCupLowerQualsFirstLobby.hours + 2 * (lobbyId.replace(/\D+/, '') - 1));
		givenLobbyDate.setUTCDate(currentElitiriCupLowerQualsFirstLobby.day) + k;
		givenLobbyDate.setUTCMonth(currentElitiriCupLowerQualsFirstLobby.zeroIndexMonth); //Zero Indexed
		givenLobbyDate.setUTCFullYear(currentElitiriCupLowerQualsFirstLobby.year);
	} else if (bracketName == 'Beginner Bracket') {
		givenLobbyDate.setUTCMilliseconds(0);
		givenLobbyDate.setUTCSeconds(0);
		givenLobbyDate.setUTCMinutes(0);
		givenLobbyDate.setUTCHours(currentElitiriCupBeginnerQualsFirstLobby.hours + 2 * (lobbyId.replace(/\D+/, '') - 1));
		givenLobbyDate.setUTCDate(currentElitiriCupBeginnerQualsFirstLobby.day + k);
		givenLobbyDate.setUTCMonth(currentElitiriCupBeginnerQualsFirstLobby.zeroIndexMonth); //Zero Indexed
		givenLobbyDate.setUTCFullYear(currentElitiriCupBeginnerQualsFirstLobby.year);
	}

	if (now > givenLobbyDate) {
		return true;
	} else {
		return givenLobbyDate;
	}
}