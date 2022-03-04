const { GoogleSpreadsheet } = require('google-spreadsheet');
//eslint-disable-next-line no-unused-vars
const { DBElitiriCupSignUp, DBElitiriCupLobbies } = require('../dbObjects');
const { currentElitiriCup } = require('../config.json');

//to-do
//date fuckery

module.exports = {
	name: 'elitiri-lobby',
	//aliases: ['developer'],
	description: `Manage lobbies for ${currentElitiriCup}`,
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
	async execute(msg, args, interaction, client) {

		// UNCOMMENT THIS LATER
		// eslint-disable-next-line no-undef
		// if (process.env.SERVER !== 'Live') {
		//     return;
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
				if (msg && msg.id) {
					return msg.reply(`Seems like you're not registered for ${currentElitiriCup}`);
				} else {
					return interaction.reply({ content: `Seems like you're not registered for ${currentElitiriCup}` });
				}
			}

			// Make sure lobbyId is valid
			if (args[0].replace(/\D+/, '') > 24 ||  args[0].replace(/\D+/, '') < 1) {
				if (msg && msg.id) {
					return msg.reply('Please make sure your lobby ID is correct');
				} else {
					return interaction.reply({ content: 'Please make sure your lobby ID is correct' });
				}
			}

			//set schedule sheets for different brackets
			let scheduleSheetId;
			let lobbyAb;
			// player bracket check
			if (elitiriSignUp.bracketName == 'Top Bracket') {
				scheduleSheetId = 'Qualifiers Schedules-Top';
				lobbyAb = 'DQ-';
			} else if (elitiriSignUp.bracketName == 'Middle Bracket') { 
				scheduleSheetId = 'Qualifiers Schedules-Middle';
				lobbyAb = 'CQ-';
			} else if (elitiriSignUp.bracketName == 'Lower Bracket') {
				scheduleSheetId = 'Qualifiers Schedules-Lower';
				lobbyAb = 'BQ-';
			} else if (elitiriSignUp.bracketName == 'Beginner Bracket') {
				scheduleSheetId = 'Qualifiers Schedules-Beginner';
				lobbyAb = 'AQ-';
			}
			
			let lobbyId = lobbyAb + args[0].replace(/\D+/, '') < 1;

			//fancy hardcoded shit will be here soon tm
			let date = new Date();


			// eslint-disable-next-line no-unused-vars
			const tournamentLobby = await DBElitiriCupLobbies.findOne({
				where: {
					tournamentName: currentElitiriCup,
					lobbyId: lobbyId,
				}
			});
			//no lobby table with given Id has been created yet
			if (!tournamentLobby){
				//create a lobby
				await DBElitiriCupLobbies.create({
					tournamentName: currentElitiriCup,
					lobbyId: lobbyId,
					lobbyDate: date,
					bracketName: elitiriSignUp.bracketName,
					refdiscordTag: null,
					refOsuUserId : null,
					refOsuName : null,
				});
			}

			const playersInLobby = await DBElitiriCupSignUp.count({
				where: {
					lobbyId: lobbyId
				}
			});
			if (playersInLobby > 15){
				if (msg && msg.id) {
					return msg.reply('This lobby is full. Please, choose another one');
				} else {
					return interaction.reply({ content: 'This lobby is full. Please, choose another one' });
				}
			}

			// previousLobbyId is used to clear previous playerNameCell with player name
			let previousLobbyId = null;
			// set tournamentLobbyId for the player
			if (elitiriSignUp.tournamentLobbyId == null){
				elitiriSignUp.tournamentLobbyId = lobbyId;
			} else {
				previousLobbyId = elitiriSignUp.tournamentLobbyId;
				elitiriSignUp.tournamentLobbyId = lobbyId;
			}
			await elitiriSignUp.save();

			if (previousLobbyId == elitiriSignUp.tournamentLobbyId){
				if (msg && msg.id) {
					return msg.reply('You are already in this lobby');
				} else {
					return interaction.reply({ content: 'You are already in this lobby' });
				}
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

			//search for players in the lobby with given ID
			let lobbyPlayers = await DBElitiriCupSignUp.findAll({
				where:{
					tournamentName: currentElitiriCup,
					tournamentLobbyId: lobbyId
				}
			});
			// eslint-disable-next-line no-unused-vars
			let previousLobbyPlayers = await DBElitiriCupSignUp.findAll({
				where:{
					tournamentName: currentElitiriCup,
					tournamentLobbyId: previousLobbyId
				}
			});

			let playerName, playerNameCell, quantityCell;

			//j is a row counter
			let j; 
			
			// Your homework is to understand this block of code good luck agreeGe
			try {
				// clear new lobby row
				j = Number(elitiriSignUp.tournamentLobbyId.replace(/\D+/, ''));
				if (j > 12){
					j++;
				}
				for (let i = 0; i < 14; i++) {
					playerNameCell = sheet.getCell(3 + j, 6 + i);
					playerNameCell.value = null;
				}
				//if lobby was set before
				if(previousLobbyId !== null){
					//clear previous lobby row
					j = Number(previousLobbyId.replace(/\D+/, ''));
					if (j > 12){
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
					//fill in new lobby row
					j = Number(elitiriSignUp.tournamentLobbyId.replace(/\D+/, ''));
					if (j > 12){
						j++;
					}
					for (let i = 0; i < lobbyPlayers.length; i++) {
						playerName = lobbyPlayers[i].osuName;
						playerNameCell = sheet.getCell(3 + j, 6 + i);
						playerNameCell.value = playerName;

						quantityCell = sheet.getCell(3 + j, 5);
						quantityCell.value = lobbyPlayers.length + '/15';
					}
					//if lobby wasnt set before
					//fill in lobby row
				} else {
					for (let i = 0; i < lobbyPlayers.length; i++) {
						playerName = lobbyPlayers[i].osuName;
						playerNameCell = sheet.getCell(3 + j, 6 + i);
						playerNameCell.value = playerName;

						quantityCell = sheet.getCell(3 + j, 5);
						quantityCell.value = lobbyPlayers.length + '/15';
					}
				}
				await sheet.saveUpdatedCells();

			} catch (error) {
				console.log(error);
			}
			

			if (msg && msg.id) {
				return msg.reply(`You have successfully claimed lobby  \`${lobbyId}\``);
			} else {
				return interaction.reply({ content: `You have successfully claimed lobby \`${lobbyId}\`` });
			}


			//edit after
		} else if (args[0] == 'prune'){
			let target = args[1];
			let elitiriSignUp = await DBElitiriCupSignUp.findOne({
				where:{
					userId: target
				}
			});
			elitiriSignUp.tournamentLobbyId = null;
			await elitiriSignUp.save();
			msg.reply('Done');
		} else if (args[0].toLowerCase == 'referee'){
			//WIP
		}
	}
};




