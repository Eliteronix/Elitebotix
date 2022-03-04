const { GoogleSpreadsheet } = require('google-spreadsheet');
//eslint-disable-next-line no-unused-vars
const { DBElitiriCupSignUp, DBElitiriCupLobbies } = require('../dbObjects');
const { currentElitiriCup } = require('../config.json');
const { populateMsgFromInteraction } = require('../utils');

module.exports = {
	name: 'elitiri-lobby',
	//aliases: ['developer'],
	description: `Allows you to manage lobbies for the ${currentElitiriCup}`,
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
		//WIP
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
				if (msg.id) {
					return msg.reply(`Seems like you're not registered for ${currentElitiriCup}`);
				} else {
					return interaction.editReply({ content: `Seems like you're not registered for ${currentElitiriCup}` });
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
			
			let lobbyId = lobbyAb + args[0].replace(/\D+/, '');

			// Make sure lobbyId is valid
			if (lobbyId.replace(/\D+/, '') > 24 ||  lobbyId.replace(/\D+/, '') < 1 || lobbyId.replace(/\D+/, '').length > 2) {
				if (msg.id) {
					return msg.reply('Please make sure your lobby ID is correct');
				} else {
					return interaction.editReply({ content: 'Please make sure your lobby ID is correct' });
				}
			}
			//can be moved to config.json actually
			let currentElitiriCupBeginnerQualsFirstLobby = 1646445600000; // ms 
			let currentElitiriCupLowerQualsFirstLobby = 1647050400000; // ms
			let currentElitiriCupMiddleQualsFirstLobby = 1647655200000; // ms
			let currentElitiriCupTopQualsFirstLobby = 1648260000000; // ms
			let givenLobbyDate = new Date().getTime();
			if (elitiriSignUp.bracketName == 'Top Bracket'){
				givenLobbyDate = Number(currentElitiriCupTopQualsFirstLobby + Number(((lobbyId.replace(/\D+/, '') - 1) * 7200000))); // first lobby + ((lobby ID - 1) * 7200000) || 7200000 - is 2 hours in ms
			}else if (elitiriSignUp.bracketName == 'Middle Bracket'){	
				givenLobbyDate = Number(currentElitiriCupMiddleQualsFirstLobby) + Number(((lobbyId.replace(/\D+/, '') - 1) * 7200000));
			}else if (elitiriSignUp.bracketName == 'Lower Bracket'){
				givenLobbyDate = Number(currentElitiriCupLowerQualsFirstLobby + Number(((lobbyId.replace(/\D+/, '') - 1) * 7200000)));
			}else {
				givenLobbyDate = Number(currentElitiriCupBeginnerQualsFirstLobby + Number(((lobbyId.replace(/\D+/, '') - 1) * 7200000)));
			}

			let date = new Date(givenLobbyDate).toUTCString();
		
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
					tournamentLobbyId: lobbyId
				}
			});
			if (playersInLobby > 15){
				if (msg.id) {
					return msg.reply('This lobby is full. Please, choose another one');
				} else {
					return interaction.editReply({ content: 'This lobby is full. Please, choose another one' });
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
				if (msg.id) {
					return msg.reply(`You are already in lobby ${lobbyId}`);
				} else {
					return interaction.editReply({ content: `You are already in lobby ${lobbyId}` });
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
				if (msg.id) {
					return msg.reply('Something went wrong... Please, try again');
				} else {
					return interaction.editReply({ content: 'Something went wrong... Please, try again' });
				}
			}
			

			if (msg.id) {
				return msg.reply(`You have successfully claimed lobby  \`${lobbyId}\``);
			} else {
				return interaction.editReply({ content: `You have successfully claimed lobby \`${lobbyId}\`` });
			}


			//edit after
			// THIS DOESNT DELETE PLAYER FROM THE SHEET
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
			// let lobbyid = args[0];
			// let lobby = await DBElitiriCupLobbies.findOne({
			// 	where:{
			// 		lobbyId: lobbyId
			// 	}
			// });
		}
	}
};




