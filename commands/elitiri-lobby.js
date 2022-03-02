const { GoogleSpreadsheet } = require('google-spreadsheet');
//eslint-disable-next-line no-unused-vars
const { DBElitiriCupSignUp, DBElitiriCupLobbies } = require('../dbObjects');
const { currentElitiriCup } = require('../config.json');




//to-do
//what if lobby already has 15 players in it, is there a way to limit number of id's in the table?
//if player changes his lobby, previews lobby' row should 
// the empty string '' is recognized as a cell with a value and the counta function counts it as a cell with a value, so we need a way to put the empty empty string
//avoid players breaking the bot by providing wrong lobby id


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

			let lobbyId = args[1];
			
			// Make sure lobbyId is valid
			if (lobbyId.replace(/\D+/, '') > 24 || lobbyId.replace(/\D+/, '') < 1) {
				if (msg && msg.id) {
					return msg.reply('Please make sure your lobby ID is correct');
				} else {
					return interaction.reply({ content: 'Please make sure your lobby ID is correct' });
				}
			}

			//set schedule sheets for different brackets
			let scheduleSheetId;
			// player bracket check
			if (elitiriSignUp.bracketName == 'Top Bracket') {
				scheduleSheetId = 'Qualifiers Schedules-Top';
			} else if (elitiriSignUp.bracketName == 'Middle Bracket') { 
				scheduleSheetId = 'Qualifiers Schedules-Middle';
			} else if (elitiriSignUp.bracketName == 'Lower Bracket') {
				scheduleSheetId = 'Qualifiers Schedules-Lower';
			} else if (elitiriSignUp.bracketName == 'Beginner Bracket') {
				scheduleSheetId = 'Qualifiers Schedules-Beginner';
			}

			//fancy hardcoded function will be here soon tm
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
			// previousLobbyId is used to clear the previous playerNameCell with player' name
			let previousLobbyId;
			// set tournamentLobbyId for the player
			if (elitiriSignUp.tournamentLobbyId !== null){
				previousLobbyId = elitiriSignUp.tournamentLobbyId;
				elitiriSignUp.tournamentLobbyId = lobbyId;
			} else {
				elitiriSignUp.tournamentLobbyId = lobbyId;
			}
			await elitiriSignUp.save();

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

			//lobby wasnt created before
			if(previousLobbyId == undefined){
				// 'j' is the counter for the row
				let j = Number(elitiriSignUp.tournamentLobbyId.replace(/\D+/, ''));
				if (j > 12){
					j++;
				}
				for (let i = 0; i < lobbyPlayers.length; i++) {
					let playerName = lobbyPlayers[i].osuName;
					let  playerNameCell = sheet.getCell(3 + j, 6 + i); //getCell(row, column) zero-indexed
					playerNameCell.value =  playerName;

				}
				//Lobby was created before
			} else {
				let j = Number(previousLobbyId.replace(/\D+/, ''));
				if (j > 12){
					j++;
				}
				//clear row
				for (let i = 0; i < lobbyPlayers.length; i++) {
					let  playerNameCell = sheet.getCell(3 + j, 6 + i); //getCell(row, column) zero-indexed
					playerNameCell.value = null;
				}
				//add names back
				j = Number(elitiriSignUp.tournamentLobbyId.replace(/\D+/, ''));
				if (j > 12){
					j++;
				}
				for (let i = 0; i < lobbyPlayers.length; i++) {
					let playerName = lobbyPlayers[i].osuName;
					let playerNameCell = sheet.getCell(3 + j, 6 + i); //getCell(row, column) zero-indexed
					playerNameCell.value =  playerName;
				}
			}

			await sheet.saveUpdatedCells();

			if (msg && msg.id) {
				return msg.reply(`You have successfully claimed lobby ${lobbyId}`);
			} else {
				return interaction.reply({ content: `You have successfully claimed lobby ${lobbyId}` });
			}

			//delete before merging
		} else if (args[0] == 'prune'){
			DBElitiriCupLobbies.destroy({
				where: {
					tournamentName: currentElitiriCup,
				}
			});
			let elitiriSignUp = await DBElitiriCupSignUp.findOne({
				where:{
					userId: msg.author.id
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




