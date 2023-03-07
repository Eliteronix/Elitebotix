const { DBElitiriCupSignUp, DBElitiriCupSubmissions, DBDiscordUsers, DBElitiriCupStaff, DBProcessQueue, DBElitiriCupLobbies } = require('../dbObjects.js');
const { pause, logDatabaseQueries } = require('../utils.js');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { currentElitiriCup, currentElitiriCupHostSheetId, currentElitiriCupRefSheetId } = require('../config.json');

let potentialNMQualifierMaps = [];
let potentialHDQualifierMaps = [];
let potentialHRQualifierMaps = [];
let potentialDTQualifierMaps = [];
let potentialFMQualifierMaps = [];

let potentialNMRoundOf32Maps = [];
let potentialHDRoundOf32Maps = [];
let potentialHRRoundOf32Maps = [];
let potentialDTRoundOf32Maps = [];
let potentialFMRoundOf32Maps = [];

let potentialNMRoundOf16Maps = [];
let potentialHDRoundOf16Maps = [];
let potentialHRRoundOf16Maps = [];
let potentialDTRoundOf16Maps = [];
let potentialFMRoundOf16Maps = [];

let potentialNMQuarterfinalMaps = [];
let potentialHDQuarterfinalMaps = [];
let potentialHRQuarterfinalMaps = [];
let potentialDTQuarterfinalMaps = [];
let potentialFMQuarterfinalMaps = [];

let potentialNMSemifinalMaps = [];
let potentialHDSemifinalMaps = [];
let potentialHRSemifinalMaps = [];
let potentialDTSemifinalMaps = [];
let potentialFMSemifinalMaps = [];

let potentialNMFinalMaps = [];
let potentialHDFinalMaps = [];
let potentialHRFinalMaps = [];
let potentialDTFinalMaps = [];
let potentialFMFinalMaps = [];

let potentialNMGrandfinalMaps = [];
let potentialHDGrandfinalMaps = [];
let potentialHRGrandfinalMaps = [];
let potentialDTGrandfinalMaps = [];
let potentialFMGrandfinalMaps = [];

module.exports = {
	name: 'elitiri-admin',
	description: 'Admin control for the Elitiri Cup',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	cooldown: 5,
	tags: 'debug',
	async execute(msg, args) {
		//TODO: Update logdatabasequeries to use the new logger
		//Get the user from the DBDiscordUsers
		const discordUser = await DBDiscordUsers.findOne({
			where: { userId: msg.author.id }
		});

		const host = await DBElitiriCupStaff.findOne({
			where: { osuUserId: discordUser.osuUserId, host: true, tournamentName: currentElitiriCup },
		});

		if (msg.author.id !== '138273136285057025' && !host) {
			return;
		}

		if (args[0] === 'sr') {
			logDatabaseQueries(4, 'commands/elitiri-admin.js DBElitiriCupSignUp 1');
			const topElitiriSignUps = await DBElitiriCupSignUp.findAll({
				where: { tournamentName: currentElitiriCup, bracketName: 'Top Bracket' }
			});

			logDatabaseQueries(4, 'commands/elitiri-admin.js DBElitiriCupSignUp 2');
			const middleElitiriSignUps = await DBElitiriCupSignUp.findAll({
				where: { tournamentName: currentElitiriCup, bracketName: 'Middle Bracket' }
			});

			logDatabaseQueries(4, 'commands/elitiri-admin.js DBElitiriCupSignUp 3');
			const lowerElitiriSignUps = await DBElitiriCupSignUp.findAll({
				where: { tournamentName: currentElitiriCup, bracketName: 'Lower Bracket' }
			});

			logDatabaseQueries(4, 'commands/elitiri-admin.js DBElitiriCupSignUp 4');
			const beginnerElitiriSignUps = await DBElitiriCupSignUp.findAll({
				where: { tournamentName: currentElitiriCup, bracketName: 'Beginner Bracket' }
			});

			let topLowerDiff = 0;
			let topUpperDiff = 0;
			let middleLowerDiff = 0;
			let middleUpperDiff = 0;
			let lowerLowerDiff = 0;
			let lowerUpperDiff = 0;
			let beginnerLowerDiff = 0;
			let beginnerUpperDiff = 0;

			for (let i = 0; i < topElitiriSignUps.length; i++) {
				topLowerDiff += parseFloat(topElitiriSignUps[i].lowerDifficulty);
				topUpperDiff += parseFloat(topElitiriSignUps[i].upperDifficulty);
			}

			for (let i = 0; i < middleElitiriSignUps.length; i++) {
				middleLowerDiff += parseFloat(middleElitiriSignUps[i].lowerDifficulty);
				middleUpperDiff += parseFloat(middleElitiriSignUps[i].upperDifficulty);
			}

			for (let i = 0; i < lowerElitiriSignUps.length; i++) {
				lowerLowerDiff += parseFloat(lowerElitiriSignUps[i].lowerDifficulty);
				lowerUpperDiff += parseFloat(lowerElitiriSignUps[i].upperDifficulty);
			}

			for (let i = 0; i < beginnerElitiriSignUps.length; i++) {
				beginnerLowerDiff += parseFloat(beginnerElitiriSignUps[i].lowerDifficulty);
				beginnerUpperDiff += parseFloat(beginnerElitiriSignUps[i].upperDifficulty);
			}

			topLowerDiff = topLowerDiff / topElitiriSignUps.length;
			topUpperDiff = topUpperDiff / topElitiriSignUps.length;
			middleLowerDiff = middleLowerDiff / middleElitiriSignUps.length;
			middleUpperDiff = middleUpperDiff / middleElitiriSignUps.length;
			lowerLowerDiff = lowerLowerDiff / lowerElitiriSignUps.length;
			lowerUpperDiff = lowerUpperDiff / lowerElitiriSignUps.length;
			beginnerLowerDiff = beginnerLowerDiff / beginnerElitiriSignUps.length;
			beginnerUpperDiff = beginnerUpperDiff / beginnerElitiriSignUps.length;


			const eliteronixUser = await msg.client.users.fetch('138273136285057025');
			eliteronixUser.send(`Top Bracket: \`${Math.round(topLowerDiff * 100) / 100} - ${Math.round(topUpperDiff * 100) / 100}\`\nMiddle Bracket: \`${Math.round(middleLowerDiff * 100) / 100} - ${Math.round(middleUpperDiff * 100) / 100}\`\nLower Bracket: \`${Math.round(lowerLowerDiff * 100) / 100} - ${Math.round(lowerUpperDiff * 100) / 100}\`\nBeginner Bracket: \`${Math.round(beginnerLowerDiff * 100) / 100} - ${Math.round(beginnerUpperDiff * 100) / 100}\``);
		} else if (args[0] === 'message') {
			args.shift();
			let targetGroup = '';
			let targetBracket = '';
			if (!args[0]) {
				return msg.reply('You didn\'t specify a valid target group. It should be `everyone`, `noAvailibility` or `noSubmissions` instead.');
			} else if (args[0] === 'everyone') {
				targetGroup = 'Every Player';
			} else if (args[0] === 'noAvailability') {
				targetGroup = 'Players with missing availabilities';
			} else if (args[0] === 'noSubmissions') {
				targetGroup = 'Players with missing submissions';
			} else if (args[0] === 'noLobby') {
				targetGroup = 'Players with missing lobby';
			} else {
				return msg.reply(`${args[0]} is not a valid target group. It should be \`everyone\`, \`noAvailability\` or \`noSubmissions\` instead.`);
			}

			if (!args[1]) {
				return msg.reply('You didn\'t specify a valid target bracket. It should be `all`, `top`, `middle`, `lower` or `beginner` instead.');
			} else if (args[1] === 'top') {
				targetBracket = 'Top Bracket';
			} else if (args[1] === 'middle') {
				targetBracket = 'Middle Bracket';
			} else if (args[1] === 'lower') {
				targetBracket = 'Lower Bracket';
			} else if (args[1] === 'beginner') {
				targetBracket = 'Beginner Bracket';
			} else if (args[1] === 'all') {
				targetBracket = 'Every Bracket';
			} else {
				return msg.reply(`${args[1]} is not a valid target bracket. It should be \`all\`, \`top\`, \`middle\`, \`lower\` or \`beginner\` instead.`);
			}

			logDatabaseQueries(4, 'commands/elitiri-admin.js DBElitiriCupSignUp 5');
			let elitiriSignUps = await DBElitiriCupSignUp.findAll({
				where: {
					tournamentName: currentElitiriCup,
					rankAchieved: null
				}
			});

			if (targetBracket !== 'Every Bracket') {
				for (let i = 0; i < elitiriSignUps.length; i++) {
					if (elitiriSignUps[i].bracketName !== targetBracket) {
						elitiriSignUps.splice(i, 1);
						i--;
					}
				}
			}

			if (targetGroup === 'Players with missing availabilities') {
				for (let i = 0; i < elitiriSignUps.length; i++) {
					if (elitiriSignUps[i].saturdayEarlyAvailability !== null) {
						elitiriSignUps.splice(i, 1);
						i--;
					}
				}
			} else if (targetGroup === 'Players with missing submissions') {
				for (let i = 0; i < elitiriSignUps.length; i++) {
					logDatabaseQueries(4, 'commands/elitiri-admin.js DBElitiriCupSubmissions 1');
					let submissions = await DBElitiriCupSubmissions.findAll({
						where: { tournamentName: currentElitiriCup, osuUserId: elitiriSignUps[i].osuUserId }
					});

					if (submissions.length === 5) {
						elitiriSignUps.splice(i, 1);
						i--;
					}
				}
			} else if (targetGroup === 'Players with missing lobby') {
				for (let i = 0; i < elitiriSignUps.length; i++) {
					if (elitiriSignUps[i].tournamentLobbyId !== null) {
						elitiriSignUps.splice(i, 1);
						i--;
					}
				}
			}

			args.shift();
			args.shift();

			if (!args[0]) {
				return msg.reply('You didn\'t provide a message to send.');
			}

			for (let i = 0; i < elitiriSignUps.length; i++) {
				let content = args.join(' ');
				const user = await msg.client.users.fetch(elitiriSignUps[i].userId);

				for (let j = 0; j < 3; j++) {
					try {
						await user.send(`Message to ${targetGroup} of ${targetBracket} in the Elitiri Cup:\n\n${content}`)
							.then(() => {
								j = Infinity;
							})
							.catch(async (error) => {
								throw (error);
							});
					} catch (error) {
						if (error.message === 'Cannot send messages to this user' || error.message === 'Internal Server Error') {
							if (j !== 2) {
								await pause(5000);
							}
						} else {
							j = Infinity;
							console.error(error);
						}
					}
				}
				// eslint-disable-next-line no-console
				console.log('Finished messaging', i, 'out of', elitiriSignUps.length);
			}
		} else if (args[0] === 'prune') {
			args.shift();
			let targetGroup = '';
			if (!args[0]) {
				return msg.reply('You didn\'t specify a valid target group. It should be `everyone`, `noAvailibility` or `noSubmissions` instead.');
			} else if (args[0] === 'noSubmissions') {
				targetGroup = 'Players with missing submissions';
			} else if (args[0] === 'player') {
				targetGroup = 'A specific player';
				if (!args[1]) {
					return msg.reply('No player specified');
				}
			} else {
				return msg.reply(`${args[0]} is not a valid target group. It should be \`everyone\`, \`noAvailability\` or \`noSubmissions\` instead.`);
			}

			logDatabaseQueries(4, 'commands/elitiri-admin.js DBElitiriCupSignUp 6');
			let elitiriSignUps = await DBElitiriCupSignUp.findAll({
				where: { tournamentName: currentElitiriCup }
			});

			if (targetGroup === 'Players with missing submissions') {
				for (let i = 0; i < elitiriSignUps.length; i++) {
					logDatabaseQueries(4, 'commands/elitiri-admin.js DBElitiriCupSubmissions 2');
					let submissions = await DBElitiriCupSubmissions.findAll({
						where: { tournamentName: currentElitiriCup, osuUserId: elitiriSignUps[i].osuUserId }
					});

					if (submissions.length !== 5) {
						elitiriSignUps[i].destroy();
						submissions.forEach(submission => {
							submission.destroy();
						});

						const user = await msg.client.users.fetch(elitiriSignUps[i].userId);

						for (let j = 0; j < 3; j++) {
							try {
								await user.send('**You were disqualified** from the `Elitiri Cup` due to missing map submissions.')
									.then(() => {
										j = Infinity;
									})
									.catch(async (error) => {
										throw (error);
									});
							} catch (error) {
								if (error.message === 'Cannot send messages to this user' || error.message === 'Internal Server Error') {
									if (j !== 2) {
										await pause(5000);
									}
								} else {
									j = Infinity;
									console.error(error);
								}
							}
						}
						// eslint-disable-next-line no-console
						console.log('Player removed from Elitiri Cup');
					}
				}
			} else if (targetGroup === 'A specific player') {
				for (let i = 0; i < elitiriSignUps.length; i++) {
					logDatabaseQueries(4, 'commands/elitiri-admin.js DBElitiriCupSubmissions 3');
					let submissions = await DBElitiriCupSubmissions.findAll({
						where: { tournamentName: currentElitiriCup, osuUserId: elitiriSignUps[i].osuUserId }
					});

					if (elitiriSignUps[i].osuUserId === args[1]) {
						elitiriSignUps[i].destroy();
						submissions.forEach(submission => {
							submission.destroy();
						});

						const user = await msg.client.users.fetch(elitiriSignUps[i].userId);

						for (let j = 0; j < 3; j++) {
							try {
								await user.send('You were removed from the `Elitiri Cup` by staff. If you have any questions feel free to ask any member of the staff.')
									.then(() => {
										j = Infinity;
									})
									.catch(async (error) => {
										throw (error);
									});
							} catch (error) {
								if (error.message === 'Cannot send messages to this user' || error.message === 'Internal Server Error') {
									if (j !== 2) {
										await pause(5000);
									}
								} else {
									j = Infinity;
									console.error(error);
								}
							}
						}
						// eslint-disable-next-line no-console
						console.log('Player removed from Elitiri Cup');
					}
				}
			}
		} else if (args[0].toLowerCase() === 'prunelobby') {
			args.shift();
			const elitiriSignUp = await DBElitiriCupSignUp.findOne({
				where: {
					osuUserId: args[1]
				}
			});

			if (!elitiriSignUp.tournamentLobbyId) {
				return msg.channel.send(`${args[1]} does not have a lobby set`);
			}

			let k = Number(elitiriSignUp.tournamentLobbyId.replace(/\D+/, ''));
			if (k > 12) {
				k++;
			}

			let scheduleSheetId;
			if (elitiriSignUp.tournamentLobbyId.replace(/\d+/, '') == 'DQ-') {
				scheduleSheetId = 'Qualifiers Schedules-Top';
			} else if (elitiriSignUp.tournamentLobbyId.replace(/\d+/, '') == 'CQ-') {
				scheduleSheetId = 'Qualifiers Schedules-Middle';
			} else if (elitiriSignUp.tournamentLobbyId.replace(/\d+/, '') == 'BQ-') {
				scheduleSheetId = 'Qualifiers Schedules-Lower';
			} else {
				scheduleSheetId = 'Qualifiers Schedules-Beginner';
			}

			const doc = new GoogleSpreadsheet(currentElitiriCupRefSheetId);
			await doc.useServiceAccountAuth({
				// eslint-disable-next-line no-undef
				client_email: process.env.GOOGLESHEETSSERVICEACCOUNTMAIL,
				// eslint-disable-next-line no-undef
				private_key: process.env.GOOGLESHEETSSERVICEACCOUNTPRIVATEKEY.replace(/\\n/g, '\n'),
			});
			await doc.loadInfo(); // loads document properties and worksheet

			const sheet = doc.sheetsByTitle[scheduleSheetId];
			await sheet.loadCells('A1:U29');

			let quantityCell;
			let playerNameCell;
			let lobbyPlayers = await DBElitiriCupSignUp.findAll({
				where: {
					tournamentName: currentElitiriCup,
					tournamentLobbyId: elitiriSignUp.tournamentLobbyId
				}
			});

			let j = Number(elitiriSignUp.tournamentLobbyId.replace(/\D+/, ''));
			if (j > 12) {
				j++;
			}

			elitiriSignUp.tournamentLobbyId = null;
			await elitiriSignUp.save();

			for (let i = 0; i < 14; i++) {
				playerNameCell = sheet.getCell(3 + j, 6 + i);
				playerNameCell.value = null;

				quantityCell = sheet.getCell(3 + j, 5);
				quantityCell.value = lobbyPlayers.length + '/15';
			}
			for (let i = 0; i < lobbyPlayers.length; i++) {
				let playerName = lobbyPlayers[i].osuName;
				playerNameCell = sheet.getCell(3 + j, 6 + i);
				playerNameCell.value = playerName;

				quantityCell = sheet.getCell(3 + j, 5);
				quantityCell.value = lobbyPlayers.length + '/15';
			}

			await sheet.saveUpdatedCells();
			msg.reply('Done.');
		} else if (args[0].toLowerCase() === 'setlobby') {
			args.shift();

			// lobbyID = args[0]
			// osuUserID = args[1]

			let lobby = await DBElitiriCupLobbies.findOne({
				where: {
					lobbyId: args[0],
					tournamentName: currentElitiriCup
				}
			});

			let elitirisignup = await DBElitiriCupSignUp.findOne({
				where: {
					osuUserId: args[1]
				}
			});

			if (!elitirisignup) {
				return msg.channel.send(`${args[0]} is not registered for ${currentElitiriCup}`);
			}

			if (!lobby) {
				await DBElitiriCupLobbies.create({
					tournamentName: currentElitiriCup,
					lobbyId: args[0],
					lobbyDate: null,
					bracketName: elitirisignup.bracketName,
					refDiscordTag: null,
					refOsuUserId: null,
					refOsuName: null,
				});
				elitirisignup.tournamentLobbyId = args[0];
				await elitirisignup.save();
			} else {
				elitirisignup.tournamentLobbyId = args[0];
				await elitirisignup.save();
			}
			msg.reply('Done.');
		} else if (args[0].toLowerCase() === 'clearreflobby') {
			args.shift();
			let lobby = await DBElitiriCupLobbies.findOne({
				where: {
					lobbyId: args[0]
				}
			});
			lobby.refOsuUserId = null;
			lobby.refDiscordTag = null;
			lobby.refOsuName = null;
			let k = Number(args[0].replace(/\D+/, ''));
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


			const doc = new GoogleSpreadsheet(currentElitiriCupRefSheetId);
			await doc.useServiceAccountAuth({
				// eslint-disable-next-line no-undef
				client_email: process.env.GOOGLESHEETSSERVICEACCOUNTMAIL,
				// eslint-disable-next-line no-undef
				private_key: process.env.GOOGLESHEETSSERVICEACCOUNTPRIVATEKEY.replace(/\\n/g, '\n'),
			});
			await doc.loadInfo(); // loads document properties and worksheet
			const sheet = doc.sheetsByTitle[scheduleSheetId];
			await sheet.loadCells('A1:U29');

			let refereeCell = sheet.getCell(3 + k, 4);
			refereeCell.value = null;

			await sheet.saveUpdatedCells();
			msg.reply('Done.');
		} else if (args[0] === 'placement') {
			logDatabaseQueries(4, 'commands/elitiri-admin.js DBElitiriCupSignUp 7');
			const elitiriSignUp = await DBElitiriCupSignUp.findOne({
				where: { osuUserId: args[1], tournamentName: currentElitiriCup }
			});

			if (args[2]) {
				elitiriSignUp.rankAchieved = args[2];
			} else {
				elitiriSignUp.rankAchieved = '';
			}

			elitiriSignUp.save();

			msg.reply(`Placement of \`${elitiriSignUp.osuName}\` set to \`${elitiriSignUp.rankAchieved}\``);
		} else if (args[0] === 'staff') {
			if (args[1]) {
				let tournamentName = currentElitiriCup;
				if (msg.author.id === '138273136285057025' && args[3] && args[4] && args[5] && args[6]) {
					tournamentName = `${args[3]} ${args[4]} ${args[5]} ${args[6]}`;
				}

				logDatabaseQueries(4, 'commands/elitiri-admin.js DBElitiriCupStaff');
				const staffMember = await DBElitiriCupStaff.findOne({
					where: { osuUserId: args[1], tournamentName: tournamentName }
				});

				if (args[2] === 'host') {
					if (msg.author.id !== '138273136285057025') {
						return msg.reply('Only Eliteronix can set hosts of the Elitiri Cup.');
					}

					if (staffMember) {
						//If they are host already
						if (staffMember.host) {
							staffMember.host = false;
							staffMember.save();
							createElitiriRoleAssignmentTask();
							return msg.reply(`${args[1]} is no longer host.`);
						}

						//If they are not host already
						staffMember.host = true;
						staffMember.save();
						createElitiriRoleAssignmentTask();
						return msg.reply(`${args[1]} has been given the host role.`);
					}

					//If there is no record for them in the db
					await DBElitiriCupStaff.create({
						osuUserId: args[1],
						tournamentName: tournamentName,
						host: true
					});
					createElitiriRoleAssignmentTask();
					return msg.reply(`${args[1]} has been given the host role.`);
				} else if (args[2] === 'streamer') {
					if (staffMember) {
						//If they are streamer already
						if (staffMember.streamer) {
							staffMember.streamer = false;
							staffMember.save();
							createElitiriRoleAssignmentTask();
							return msg.reply(`${args[1]} is no longer streamer.`);
						}

						//If they are not streamer already
						staffMember.streamer = true;
						staffMember.save();
						createElitiriRoleAssignmentTask();
						return msg.reply(`${args[1]} has been given the streamer role.`);
					}

					//If there is no record for them in the db
					await DBElitiriCupStaff.create({
						osuUserId: args[1],
						tournamentName: tournamentName,
						streamer: true
					});
					createElitiriRoleAssignmentTask();
					return msg.reply(`${args[1]} has been given the streamer role.`);
				} else if (args[2] === 'commentator') {
					if (staffMember) {
						//If they are commentator already
						if (staffMember.commentator) {
							staffMember.commentator = false;
							staffMember.save();
							createElitiriRoleAssignmentTask();
							return msg.reply(`${args[1]} is no longer commentator.`);
						}

						//If they are not commentator already
						staffMember.commentator = true;
						staffMember.save();
						createElitiriRoleAssignmentTask();
						return msg.reply(`${args[1]} has been given the commentator role.`);
					}

					//If there is no record for them in the db
					await DBElitiriCupStaff.create({
						osuUserId: args[1],
						tournamentName: tournamentName,
						commentator: true
					});
					createElitiriRoleAssignmentTask();
					return msg.reply(`${args[1]} has been given the commentator role.`);
				} else if (args[2] === 'referee') {
					if (staffMember) {
						//If they are referee already
						if (staffMember.referee) {
							staffMember.referee = false;
							staffMember.save();
							createElitiriRoleAssignmentTask();
							return msg.reply(`${args[1]} is no longer referee.`);
						}

						//If they are not referee already
						staffMember.referee = true;
						staffMember.save();
						createElitiriRoleAssignmentTask();
						return msg.reply(`${args[1]} has been given the referee role.`);
					}

					//If there is no record for them in the db
					await DBElitiriCupStaff.create({
						osuUserId: args[1],
						tournamentName: tournamentName,
						referee: true
					});
					createElitiriRoleAssignmentTask();
					return msg.reply(`${args[1]} has been given the referee role.`);
				} else if (args[2] === 'replayer') {
					if (staffMember) {
						//If they are replayer already
						if (staffMember.replayer) {
							staffMember.replayer = false;
							staffMember.save();
							createElitiriRoleAssignmentTask();
							return msg.reply(`${args[1]} is no longer replayer.`);
						}

						//If they are not replayer already
						staffMember.replayer = true;
						staffMember.save();
						createElitiriRoleAssignmentTask();
						return msg.reply(`${args[1]} has been given the replayer role.`);
					}

					//If there is no record for them in the db
					await DBElitiriCupStaff.create({
						osuUserId: args[1],
						tournamentName: tournamentName,
						replayer: true
					});
					createElitiriRoleAssignmentTask();
					return msg.reply(`${args[1]} has been given the replayer role.`);
				} else {
					return msg.reply('Invalid role.');
				}
			} else {
				msg.reply('Please specify a staff member to add or remove. (osu! user id)');
			}
		} else if (args[0] === 'slashCommands') {
			await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
				data: {
					name: 'elitiri-check',
					description: `Sends an info card about the viability of the beatmap for the ${currentElitiriCup}`,
					options: [
						{
							'name': 'modpool',
							'description': 'The pool the map should be checked for',
							'type': 3,
							'required': true,
							'choices': [
								{
									'name': 'NoMod',
									'value': 'NM'
								},
								{
									'name': 'Hidden',
									'value': 'HD'
								},
								{
									'name': 'HardRock',
									'value': 'HR'
								},
								{
									'name': 'DoubleTime',
									'value': 'DT'
								},
								{
									'name': 'FreeMod',
									'value': 'FM'
								},
							]
						},
						{
							'name': 'id',
							'description': 'The ID of the map (link also works)',
							'type': 3,
							'required': true
						},
						{
							'name': 'bracket',
							'description': 'The bracket the map should be checked for',
							'type': 3,
							'choices': [
								{
									'name': 'Top Bracket',
									'value': 'top'
								},
								{
									'name': 'Middle Bracket',
									'value': 'middle'
								},
								{
									'name': 'Lower Bracket',
									'value': 'lower'
								},
								{
									'name': 'Beginner Bracket',
									'value': 'beginner'
								}
							]
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
				data: {
					name: 'elitiri-submit',
					description: `Allows you to submit beatmaps for the ${currentElitiriCup}`,
					options: [
						{
							'name': 'submit',
							'description': 'Submit maps for the tournament',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'modpool',
									'description': 'The pool the map should be submitted for',
									'type': 3,
									'required': true,
									'choices': [
										{
											'name': 'NoMod',
											'value': 'NM'
										},
										{
											'name': 'Hidden',
											'value': 'HD'
										},
										{
											'name': 'HardRock',
											'value': 'HR'
										},
										{
											'name': 'DoubleTime',
											'value': 'DT'
										},
										{
											'name': 'FreeMod',
											'value': 'FM'
										},
									]
								},
								{
									'name': 'id',
									'description': 'The ID of the map (link also works)',
									'type': 3,
									'required': true
								},
							]
						},
						{
							'name': 'list',
							'description': 'Get a list of your currently submitted maps',
							'type': 1, // 1 is type SUB_COMMAND
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
				data: {
					name: 'elitiri-cup',
					description: `Allows you to sign up for the ${currentElitiriCup}`,
					options: [
						{
							'name': 'register',
							'description': `Register for the ${currentElitiriCup}`,
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'lowerlimit',
									'description': 'The star rating of the desired lower limit of your bracket',
									'type': 10, // 10 is type Number
									'required': true,
								},
								{
									'name': 'upperlimit',
									'description': 'The star rating of the desired upper limit of your bracket',
									'type': 10, // 10 is type Number
									'required': true,
								},
							]
						},
						{
							'name': 'unregister',
							'description': `Unregister from the ${currentElitiriCup}`,
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'server',
							'description': 'Get a link to the server of the tournament',
							'type': 1, // 1 is type SUB_COMMAND
						},
						{
							'name': 'availability',
							'description': 'Set your availability for the tournament',
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'earlysaturday',
									'description': 'The earliest you can play saturday',
									'type': 10, // 10 is type Number
									'required': true,
								},
								{
									'name': 'latesaturday',
									'description': 'The latest you can play saturday',
									'type': 10, // 10 is type Number
									'required': true,
								},
								{
									'name': 'earlysunday',
									'description': 'The earliest you can play sunday',
									'type': 10, // 10 is type Number
									'required': true,
								},
								{
									'name': 'latesunday',
									'description': 'The latest you can play sunday',
									'type': 10, // 10 is type Number
									'required': true,
								}
							]
						},
					]
				}
			});

			await msg.client.api.applications(msg.client.user.id).guilds(msg.guildId).commands.post({
				data: {
					name: 'elitiri-lobby',
					description: `Allows you to manage lobbies for the ${currentElitiriCup}`,
					options: [
						{
							'name': 'claim',
							'description': `Claim your qualifiers lobby for the ${currentElitiriCup}`,
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'lobbyid',
									'description': 'Lobby ID of the desired qualifiers lobby. For example: "CQ-4" or just the number: "4"',
									'type': 3, // 3 is type String
									'required': true,
								},
							]
						},
						{
							'name': 'referee',
							'description': `assigne yourself for the ${currentElitiriCup} lobby`,
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'lobbyid',
									'description': 'Lobby ID of the desired qualifiers lobby. For example: "CQ-4".',
									'type': 3, // 3 is type String
									'required': true,
								},
							]
						},
						{
							'name': 'refereedrop',
							'description': `unassigne yourself for the ${currentElitiriCup}`,
							'type': 1, // 1 is type SUB_COMMAND
							'options': [
								{
									'name': 'lobbyid',
									'description': 'Lobby ID of the desired qualifiers lobby. For example: "CQ-4".',
									'type': 3, // 3 is type String
									'required': true,
								},
							]
						},
					]
				}
			});

			msg.reply(`${currentElitiriCup}'s slash commands have been updated`);
		} else if (args[0] === 'createPools') {
			let allMaps = [];
			let rowOffset;
			if (args[1] === 'top') {
				logDatabaseQueries(4, 'commands/elitiri-admin.js DBElitiriCupSubmissions 4');
				allMaps = await DBElitiriCupSubmissions.findAll({
					where: { tournamentName: currentElitiriCup, bracketName: 'Top Bracket' }
				});
				rowOffset = 78;
			} else if (args[1] === 'middle') {
				logDatabaseQueries(4, 'commands/elitiri-admin.js DBElitiriCupSubmissions 5');
				allMaps = await DBElitiriCupSubmissions.findAll({
					where: { tournamentName: currentElitiriCup, bracketName: 'Middle Bracket' }
				});
				rowOffset = 53;
			} else if (args[1] === 'lower') {
				logDatabaseQueries(4, 'commands/elitiri-admin.js DBElitiriCupSubmissions 6');
				allMaps = await DBElitiriCupSubmissions.findAll({
					where: { tournamentName: currentElitiriCup, bracketName: 'Lower Bracket' }
				});
				rowOffset = 28;
			} else if (args[1] === 'beginner') {
				logDatabaseQueries(4, 'commands/elitiri-admin.js DBElitiriCupSubmissions 7');
				allMaps = await DBElitiriCupSubmissions.findAll({
					where: { tournamentName: currentElitiriCup, bracketName: 'Beginner Bracket' }
				});
				rowOffset = 3;
			} else {
				return msg.reply('Please specify for which bracket the pools should be created. (`top`, `middle`, `lower`, `beginner`)');
			}

			allMaps.sort((a, b) => parseFloat(a.starRating) - parseFloat(b.starRating));

			let allNMMaps = [];
			let allHDMaps = [];
			let allHRMaps = [];
			let allDTMaps = [];
			let allFMMaps = [];

			for (let i = 0; i < allMaps.length; i++) {
				if (allMaps[i].modPool === 'NM') {
					allNMMaps.push(allMaps[i]);
				} else if (allMaps[i].modPool === 'HD') {
					allHDMaps.push(allMaps[i]);
				} else if (allMaps[i].modPool === 'HR') {
					allHRMaps.push(allMaps[i]);
				} else if (allMaps[i].modPool === 'DT') {
					allDTMaps.push(allMaps[i]);
				} else {
					allFMMaps.push(allMaps[i]);
				}
			}

			let MappoolSizes = {
				totalNM: 39,
				totalHD: 17,
				totalHR: 17,
				totalDT: 17,
				totalFM: 15,
				Qual: { NM: 4, HD: 2, HR: 2, DT: 2, FM: 0 },
				Ro32: { NM: 4, HD: 2, HR: 2, DT: 2, FM: 2 },
				Ro16: { NM: 5, HD: 2, HR: 2, DT: 2, FM: 2 },
				QF: { NM: 6, HD: 2, HR: 2, DT: 2, FM: 2 },
				SF: { NM: 6, HD: 3, HR: 3, DT: 3, FM: 3 },
				F: { NM: 7, HD: 3, HR: 3, DT: 3, FM: 3 },
				GF: { NM: 7, HD: 3, HR: 3, DT: 3, FM: 3 }
			};

			//Putting NM maps into potential pools
			for (let i = 0; i < allNMMaps.length; i++) {
				let allPercentage = 100 / allNMMaps.length * i;
				if (allPercentage < 100 / MappoolSizes.totalNM * (MappoolSizes.Ro32.NM)) {
					potentialNMRoundOf32Maps.push(allNMMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalNM * (MappoolSizes.Ro32.NM + MappoolSizes.Ro16.NM)) {
					potentialNMRoundOf16Maps.push(allNMMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalNM * (MappoolSizes.Ro32.NM + MappoolSizes.Ro16.NM + MappoolSizes.QF.NM)) {
					potentialNMQuarterfinalMaps.push(allNMMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalNM * (MappoolSizes.Ro32.NM + MappoolSizes.Ro16.NM + MappoolSizes.QF.NM + MappoolSizes.Qual.NM)) {
					potentialNMQualifierMaps.push(allNMMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalNM * (MappoolSizes.Ro32.NM + MappoolSizes.Ro16.NM + MappoolSizes.QF.NM + MappoolSizes.Qual.NM + MappoolSizes.SF.NM)) {
					potentialNMSemifinalMaps.push(allNMMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalNM * (MappoolSizes.Ro32.NM + MappoolSizes.Ro16.NM + MappoolSizes.QF.NM + MappoolSizes.Qual.NM + MappoolSizes.SF.NM + MappoolSizes.F.NM)) {
					potentialNMFinalMaps.push(allNMMaps[i]);
				} else {
					potentialNMGrandfinalMaps.push(allNMMaps[i]);
				}
			}

			//Putting HD maps into potential pools
			for (let i = 0; i < allHDMaps.length; i++) {
				let allPercentage = 100 / allHDMaps.length * i;
				if (allPercentage < 100 / MappoolSizes.totalHD * (MappoolSizes.Ro32.HD)) {
					potentialHDRoundOf32Maps.push(allHDMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalHD * (MappoolSizes.Ro32.HD + MappoolSizes.Ro16.HD)) {
					potentialHDRoundOf16Maps.push(allHDMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalHD * (MappoolSizes.Ro32.HD + MappoolSizes.Ro16.HD + MappoolSizes.QF.HD)) {
					potentialHDQuarterfinalMaps.push(allHDMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalHD * (MappoolSizes.Ro32.HD + MappoolSizes.Ro16.HD + MappoolSizes.QF.HD + MappoolSizes.Qual.HD)) {
					potentialHDQualifierMaps.push(allHDMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalHD * (MappoolSizes.Ro32.HD + MappoolSizes.Ro16.HD + MappoolSizes.QF.HD + MappoolSizes.Qual.HD + MappoolSizes.SF.HD)) {
					potentialHDSemifinalMaps.push(allHDMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalHD * (MappoolSizes.Ro32.HD + MappoolSizes.Ro16.HD + MappoolSizes.QF.HD + MappoolSizes.Qual.HD + MappoolSizes.SF.HD + MappoolSizes.F.HD)) {
					potentialHDFinalMaps.push(allHDMaps[i]);
				} else {
					potentialHDGrandfinalMaps.push(allHDMaps[i]);
				}
			}

			//Putting HR maps into potential pools
			for (let i = 0; i < allHRMaps.length; i++) {
				let allPercentage = 100 / allHRMaps.length * i;
				if (allPercentage < 100 / MappoolSizes.totalHR * (MappoolSizes.Ro32.HR)) {
					potentialHRRoundOf32Maps.push(allHRMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalHR * (MappoolSizes.Ro32.HR + MappoolSizes.Ro16.HR)) {
					potentialHRRoundOf16Maps.push(allHRMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalHR * (MappoolSizes.Ro32.HR + MappoolSizes.Ro16.HR + MappoolSizes.QF.HR)) {
					potentialHRQuarterfinalMaps.push(allHRMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalHR * (MappoolSizes.Ro32.HR + MappoolSizes.Ro16.HR + MappoolSizes.QF.HR + MappoolSizes.Qual.HR)) {
					potentialHRQualifierMaps.push(allHRMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalHR * (MappoolSizes.Ro32.HR + MappoolSizes.Ro16.HR + MappoolSizes.QF.HR + MappoolSizes.Qual.HR + MappoolSizes.SF.HR)) {
					potentialHRSemifinalMaps.push(allHRMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalHR * (MappoolSizes.Ro32.HR + MappoolSizes.Ro16.HR + MappoolSizes.QF.HR + MappoolSizes.Qual.HR + MappoolSizes.SF.HR + MappoolSizes.F.HR)) {
					potentialHRFinalMaps.push(allHRMaps[i]);
				} else {
					potentialHRGrandfinalMaps.push(allHRMaps[i]);
				}
			}

			//Putting DT maps into potential pools
			for (let i = 0; i < allDTMaps.length; i++) {
				let allPercentage = 100 / allDTMaps.length * i;
				if (allPercentage < 100 / MappoolSizes.totalDT * (MappoolSizes.Ro32.DT)) {
					potentialDTRoundOf32Maps.push(allDTMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalDT * (MappoolSizes.Ro32.DT + MappoolSizes.Ro16.DT)) {
					potentialDTRoundOf16Maps.push(allDTMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalDT * (MappoolSizes.Ro32.DT + MappoolSizes.Ro16.DT + MappoolSizes.QF.DT)) {
					potentialDTQuarterfinalMaps.push(allDTMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalDT * (MappoolSizes.Ro32.DT + MappoolSizes.Ro16.DT + MappoolSizes.QF.DT + MappoolSizes.Qual.DT)) {
					potentialDTQualifierMaps.push(allDTMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalDT * (MappoolSizes.Ro32.DT + MappoolSizes.Ro16.DT + MappoolSizes.QF.DT + MappoolSizes.Qual.DT + MappoolSizes.SF.DT)) {
					potentialDTSemifinalMaps.push(allDTMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalDT * (MappoolSizes.Ro32.DT + MappoolSizes.Ro16.DT + MappoolSizes.QF.DT + MappoolSizes.Qual.DT + MappoolSizes.SF.DT + MappoolSizes.F.DT)) {
					potentialDTFinalMaps.push(allDTMaps[i]);
				} else {
					potentialDTGrandfinalMaps.push(allDTMaps[i]);
				}
			}

			//Putting FM maps into potential pools
			for (let i = 0; i < allFMMaps.length; i++) {
				let allPercentage = 100 / allFMMaps.length * i;
				if (allPercentage < 100 / MappoolSizes.totalFM * (MappoolSizes.Ro32.FM)) {
					potentialFMRoundOf32Maps.push(allFMMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalFM * (MappoolSizes.Ro32.FM + MappoolSizes.Ro16.FM)) {
					potentialFMRoundOf16Maps.push(allFMMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalFM * (MappoolSizes.Ro32.FM + MappoolSizes.Ro16.FM + MappoolSizes.QF.FM)) {
					potentialFMQuarterfinalMaps.push(allFMMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalFM * (MappoolSizes.Ro32.FM + MappoolSizes.Ro16.FM + MappoolSizes.QF.FM + MappoolSizes.Qual.FM)) {
					potentialFMQualifierMaps.push(allFMMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalFM * (MappoolSizes.Ro32.FM + MappoolSizes.Ro16.FM + MappoolSizes.QF.FM + MappoolSizes.Qual.FM + MappoolSizes.SF.FM)) {
					potentialFMSemifinalMaps.push(allFMMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalFM * (MappoolSizes.Ro32.FM + MappoolSizes.Ro16.FM + MappoolSizes.QF.FM + MappoolSizes.Qual.FM + MappoolSizes.SF.FM + MappoolSizes.F.FM)) {
					potentialFMFinalMaps.push(allFMMaps[i]);
				} else {
					potentialFMGrandfinalMaps.push(allFMMaps[i]);
				}
			}

			let qualifierPool = [];

			for (let i = 0; i < MappoolSizes.Qual.NM; i++) {
				qualifierPool = addRandomMapAndRemoveDuplicatesToFrom(qualifierPool, potentialNMQualifierMaps);
			}
			for (let i = 0; i < MappoolSizes.Qual.HD; i++) {
				qualifierPool = addRandomMapAndRemoveDuplicatesToFrom(qualifierPool, potentialHDQualifierMaps);
			}
			for (let i = 0; i < MappoolSizes.Qual.HR; i++) {
				qualifierPool = addRandomMapAndRemoveDuplicatesToFrom(qualifierPool, potentialHRQualifierMaps);
			}
			for (let i = 0; i < MappoolSizes.Qual.DT; i++) {
				qualifierPool = addRandomMapAndRemoveDuplicatesToFrom(qualifierPool, potentialDTQualifierMaps);
			}
			for (let i = 0; i < MappoolSizes.Qual.FM; i++) {
				qualifierPool = addRandomMapAndRemoveDuplicatesToFrom(qualifierPool, potentialFMQualifierMaps);
			}

			let Ro32Pool = [];

			for (let i = 0; i < MappoolSizes.Ro32.NM; i++) {
				Ro32Pool = addRandomMapAndRemoveDuplicatesToFrom(Ro32Pool, potentialNMRoundOf32Maps);
			}
			for (let i = 0; i < MappoolSizes.Ro32.HD; i++) {
				Ro32Pool = addRandomMapAndRemoveDuplicatesToFrom(Ro32Pool, potentialHDRoundOf32Maps);
			}
			for (let i = 0; i < MappoolSizes.Ro32.HR; i++) {
				Ro32Pool = addRandomMapAndRemoveDuplicatesToFrom(Ro32Pool, potentialHRRoundOf32Maps);
			}
			for (let i = 0; i < MappoolSizes.Ro32.DT; i++) {
				Ro32Pool = addRandomMapAndRemoveDuplicatesToFrom(Ro32Pool, potentialDTRoundOf32Maps);
			}
			for (let i = 0; i < MappoolSizes.Ro32.FM; i++) {
				Ro32Pool = addRandomMapAndRemoveDuplicatesToFrom(Ro32Pool, potentialFMRoundOf32Maps);
			}

			let Ro16Pool = [];

			for (let i = 0; i < MappoolSizes.Ro16.NM; i++) {
				Ro16Pool = addRandomMapAndRemoveDuplicatesToFrom(Ro16Pool, potentialNMRoundOf16Maps);
			}
			for (let i = 0; i < MappoolSizes.Ro16.HD; i++) {
				Ro16Pool = addRandomMapAndRemoveDuplicatesToFrom(Ro16Pool, potentialHDRoundOf16Maps);
			}
			for (let i = 0; i < MappoolSizes.Ro16.HR; i++) {
				Ro16Pool = addRandomMapAndRemoveDuplicatesToFrom(Ro16Pool, potentialHRRoundOf16Maps);
			}
			for (let i = 0; i < MappoolSizes.Ro16.DT; i++) {
				Ro16Pool = addRandomMapAndRemoveDuplicatesToFrom(Ro16Pool, potentialDTRoundOf16Maps);
			}
			for (let i = 0; i < MappoolSizes.Ro16.FM; i++) {
				Ro16Pool = addRandomMapAndRemoveDuplicatesToFrom(Ro16Pool, potentialFMRoundOf16Maps);
			}

			let QuarterfinalPool = [];

			for (let i = 0; i < MappoolSizes.QF.NM; i++) {
				QuarterfinalPool = addRandomMapAndRemoveDuplicatesToFrom(QuarterfinalPool, potentialNMQuarterfinalMaps);
			}
			for (let i = 0; i < MappoolSizes.QF.HD; i++) {
				QuarterfinalPool = addRandomMapAndRemoveDuplicatesToFrom(QuarterfinalPool, potentialHDQuarterfinalMaps);
			}
			for (let i = 0; i < MappoolSizes.QF.HR; i++) {
				QuarterfinalPool = addRandomMapAndRemoveDuplicatesToFrom(QuarterfinalPool, potentialHRQuarterfinalMaps);
			}
			for (let i = 0; i < MappoolSizes.QF.DT; i++) {
				QuarterfinalPool = addRandomMapAndRemoveDuplicatesToFrom(QuarterfinalPool, potentialDTQuarterfinalMaps);
			}
			for (let i = 0; i < MappoolSizes.QF.FM; i++) {
				QuarterfinalPool = addRandomMapAndRemoveDuplicatesToFrom(QuarterfinalPool, potentialFMQuarterfinalMaps);
			}

			let SemifinalPool = [];

			for (let i = 0; i < MappoolSizes.SF.NM; i++) {
				SemifinalPool = addRandomMapAndRemoveDuplicatesToFrom(SemifinalPool, potentialNMSemifinalMaps);
			}
			for (let i = 0; i < MappoolSizes.SF.HD; i++) {
				SemifinalPool = addRandomMapAndRemoveDuplicatesToFrom(SemifinalPool, potentialHDSemifinalMaps);
			}
			for (let i = 0; i < MappoolSizes.SF.HR; i++) {
				SemifinalPool = addRandomMapAndRemoveDuplicatesToFrom(SemifinalPool, potentialHRSemifinalMaps);
			}
			for (let i = 0; i < MappoolSizes.SF.DT; i++) {
				SemifinalPool = addRandomMapAndRemoveDuplicatesToFrom(SemifinalPool, potentialDTSemifinalMaps);
			}
			for (let i = 0; i < MappoolSizes.SF.FM; i++) {
				SemifinalPool = addRandomMapAndRemoveDuplicatesToFrom(SemifinalPool, potentialFMSemifinalMaps);
			}

			let FinalPool = [];

			for (let i = 0; i < MappoolSizes.F.NM; i++) {
				FinalPool = addRandomMapAndRemoveDuplicatesToFrom(FinalPool, potentialNMFinalMaps);
			}
			for (let i = 0; i < MappoolSizes.F.HD; i++) {
				FinalPool = addRandomMapAndRemoveDuplicatesToFrom(FinalPool, potentialHDFinalMaps);
			}
			for (let i = 0; i < MappoolSizes.F.HR; i++) {
				FinalPool = addRandomMapAndRemoveDuplicatesToFrom(FinalPool, potentialHRFinalMaps);
			}
			for (let i = 0; i < MappoolSizes.F.DT; i++) {
				FinalPool = addRandomMapAndRemoveDuplicatesToFrom(FinalPool, potentialDTFinalMaps);
			}
			for (let i = 0; i < MappoolSizes.F.FM; i++) {
				FinalPool = addRandomMapAndRemoveDuplicatesToFrom(FinalPool, potentialFMFinalMaps);
			}

			let GrandfinalPool = [];

			for (let i = 0; i < MappoolSizes.GF.NM; i++) {
				GrandfinalPool = addRandomMapAndRemoveDuplicatesToFrom(GrandfinalPool, potentialNMGrandfinalMaps);
			}
			for (let i = 0; i < MappoolSizes.GF.HD; i++) {
				GrandfinalPool = addRandomMapAndRemoveDuplicatesToFrom(GrandfinalPool, potentialHDGrandfinalMaps);
			}
			for (let i = 0; i < MappoolSizes.GF.HR; i++) {
				GrandfinalPool = addRandomMapAndRemoveDuplicatesToFrom(GrandfinalPool, potentialHRGrandfinalMaps);
			}
			for (let i = 0; i < MappoolSizes.GF.DT; i++) {
				GrandfinalPool = addRandomMapAndRemoveDuplicatesToFrom(GrandfinalPool, potentialDTGrandfinalMaps);
			}
			for (let i = 0; i < MappoolSizes.GF.FM; i++) {
				GrandfinalPool = addRandomMapAndRemoveDuplicatesToFrom(GrandfinalPool, potentialFMGrandfinalMaps);
			}

			// eslint-disable-next-line no-undef
			if (process.env.SERVER !== 'Live') {
				return;
			}

			// Initialize the sheet - doc ID is the long id in the sheets URL
			//Host sheet 
			const doc = new GoogleSpreadsheet(currentElitiriCupHostSheetId);

			// Initialize Auth - see more available options at https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
			await doc.useServiceAccountAuth({
				// eslint-disable-next-line no-undef
				client_email: process.env.GOOGLESHEETSSERVICEACCOUNTMAIL,
				// eslint-disable-next-line no-undef
				private_key: process.env.GOOGLESHEETSSERVICEACCOUNTPRIVATEKEY.replace(/\\n/g, '\n'),
			});

			await doc.loadInfo(); // loads document properties and worksheet

			let sheet = doc.sheetsByTitle['Mappool [All]'];

			await sheet.loadCells('F4:P703');

			sheet = insertPoolIntoSpreadsheet(sheet, qualifierPool, rowOffset);

			rowOffset += 100;
			sheet = insertPoolIntoSpreadsheet(sheet, Ro32Pool, rowOffset);

			rowOffset += 100;
			sheet = insertPoolIntoSpreadsheet(sheet, Ro16Pool, rowOffset);

			rowOffset += 100;
			sheet = insertPoolIntoSpreadsheet(sheet, QuarterfinalPool, rowOffset);

			rowOffset += 100;
			sheet = insertPoolIntoSpreadsheet(sheet, SemifinalPool, rowOffset);

			rowOffset += 100;
			sheet = insertPoolIntoSpreadsheet(sheet, FinalPool, rowOffset);

			rowOffset += 100;
			sheet = insertPoolIntoSpreadsheet(sheet, GrandfinalPool, rowOffset);

			await sheet.saveUpdatedCells();
		}
	}
};

function insertPoolIntoSpreadsheet(sheet, pool, rowOffset) {
	for (let i = 0; i < pool.length; i++) {
		const titleCell = sheet.getCell(rowOffset + i, 5); //getCell(row, column) zero-indexed
		titleCell.value = pool[i].title;

		const artistCell = sheet.getCell(rowOffset + i, 6); //getCell(row, column) zero-indexed
		artistCell.value = pool[i].artist;

		const difficultyCell = sheet.getCell(rowOffset + i, 7); //getCell(row, column) zero-indexed
		difficultyCell.value = pool[i].difficulty;

		const drainLengthSeconds = (pool[i].drainLength % 60) + '';
		const drainLengthMinutes = (pool[i].drainLength - pool[i].drainLength % 60) / 60;
		const drainLength = drainLengthMinutes + ':' + drainLengthSeconds.padStart(2, '0');
		const lengthCell = sheet.getCell(rowOffset + i, 8); //getCell(row, column) zero-indexed
		lengthCell.value = drainLength;

		const csArOdHpCell = sheet.getCell(rowOffset + i, 9); //getCell(row, column) zero-indexed
		csArOdHpCell.value = `${pool[i].circleSize} | ${pool[i].approachRate} | ${pool[i].overallDifficulty} | ${pool[i].hpDrain}`;

		const mapperCell = sheet.getCell(rowOffset + i, 10); //getCell(row, column) zero-indexed
		mapperCell.value = pool[i].mapper;

		const idCell = sheet.getCell(rowOffset + i, 11); //getCell(row, column) zero-indexed
		idCell.value = pool[i].beatmapId;

		const linkCell = sheet.getCell(rowOffset + i, 12); //getCell(row, column) zero-indexed
		linkCell.value = `https://osu.ppy.sh/beatmapsets/${pool[i].beatmapsetId}#osu/${pool[i].beatmapId}`;

		const starRatingCell = sheet.getCell(rowOffset + i, 13); //getCell(row, column) zero-indexed
		starRatingCell.value = Math.round(pool[i].starRating * 100) / 100;

		const bpmCell = sheet.getCell(rowOffset + i, 14); //getCell(row, column) zero-indexed
		bpmCell.value = pool[i].bpm;

		const pickerCell = sheet.getCell(rowOffset + i, 15); //getCell(row, column) zero-indexed
		pickerCell.value = pool[i].osuName;
	}

	return sheet;
}

function addRandomMapAndRemoveDuplicatesToFrom(destPool, originPool) {
	const map = originPool[Math.floor(Math.random() * originPool.length)];
	destPool.push(map);

	removeAllMapDuplicates(map);

	return destPool;
}

function removeAllMapDuplicates(map) {
	let mapId = map.beatmapId;
	//Qualifiers
	for (let i = 0; i < potentialNMQualifierMaps.length; i++) {
		if (mapId === potentialNMQualifierMaps[i].beatmapId) {
			potentialNMQualifierMaps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialHDQualifierMaps.length; i++) {
		if (mapId === potentialHDQualifierMaps[i].beatmapId) {
			potentialHDQualifierMaps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialHRQualifierMaps.length; i++) {
		if (mapId === potentialHRQualifierMaps[i].beatmapId) {
			potentialHRQualifierMaps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialDTQualifierMaps.length; i++) {
		if (mapId === potentialDTQualifierMaps[i].beatmapId) {
			potentialDTQualifierMaps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialFMQualifierMaps.length; i++) {
		if (mapId === potentialFMQualifierMaps[i].beatmapId) {
			potentialFMQualifierMaps.splice(i, 1);
			i--;
		}
	}

	//Round of 32
	for (let i = 0; i < potentialNMRoundOf32Maps.length; i++) {
		if (mapId === potentialNMRoundOf32Maps[i].beatmapId) {
			potentialNMRoundOf32Maps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialHDRoundOf32Maps.length; i++) {
		if (mapId === potentialHDRoundOf32Maps[i].beatmapId) {
			potentialHDRoundOf32Maps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialHRRoundOf32Maps.length; i++) {
		if (mapId === potentialHRRoundOf32Maps[i].beatmapId) {
			potentialHRRoundOf32Maps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialDTRoundOf32Maps.length; i++) {
		if (mapId === potentialDTRoundOf32Maps[i].beatmapId) {
			potentialDTRoundOf32Maps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialFMRoundOf32Maps.length; i++) {
		if (mapId === potentialFMRoundOf32Maps[i].beatmapId) {
			potentialFMRoundOf32Maps.splice(i, 1);
			i--;
		}
	}

	//Round of 16
	for (let i = 0; i < potentialNMRoundOf16Maps.length; i++) {
		if (mapId === potentialNMRoundOf16Maps[i].beatmapId) {
			potentialNMRoundOf16Maps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialHDRoundOf16Maps.length; i++) {
		if (mapId === potentialHDRoundOf16Maps[i].beatmapId) {
			potentialHDRoundOf16Maps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialHRRoundOf16Maps.length; i++) {
		if (mapId === potentialHRRoundOf16Maps[i].beatmapId) {
			potentialHRRoundOf16Maps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialDTRoundOf16Maps.length; i++) {
		if (mapId === potentialDTRoundOf16Maps[i].beatmapId) {
			potentialDTRoundOf16Maps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialFMRoundOf16Maps.length; i++) {
		if (mapId === potentialFMRoundOf16Maps[i].beatmapId) {
			potentialFMRoundOf16Maps.splice(i, 1);
			i--;
		}
	}

	//Quarterfinals
	for (let i = 0; i < potentialNMQuarterfinalMaps.length; i++) {
		if (mapId === potentialNMQuarterfinalMaps[i].beatmapId) {
			potentialNMQuarterfinalMaps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialHDQuarterfinalMaps.length; i++) {
		if (mapId === potentialHDQuarterfinalMaps[i].beatmapId) {
			potentialHDQuarterfinalMaps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialHRQuarterfinalMaps.length; i++) {
		if (mapId === potentialHRQuarterfinalMaps[i].beatmapId) {
			potentialHRQuarterfinalMaps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialDTQuarterfinalMaps.length; i++) {
		if (mapId === potentialDTQuarterfinalMaps[i].beatmapId) {
			potentialDTQuarterfinalMaps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialFMQuarterfinalMaps.length; i++) {
		if (mapId === potentialFMQuarterfinalMaps[i].beatmapId) {
			potentialFMQuarterfinalMaps.splice(i, 1);
			i--;
		}
	}

	//Semifinals
	for (let i = 0; i < potentialNMSemifinalMaps.length; i++) {
		if (mapId === potentialNMSemifinalMaps[i].beatmapId) {
			potentialNMSemifinalMaps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialHDSemifinalMaps.length; i++) {
		if (mapId === potentialHDSemifinalMaps[i].beatmapId) {
			potentialHDSemifinalMaps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialHRSemifinalMaps.length; i++) {
		if (mapId === potentialHRSemifinalMaps[i].beatmapId) {
			potentialHRSemifinalMaps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialDTSemifinalMaps.length; i++) {
		if (mapId === potentialDTSemifinalMaps[i].beatmapId) {
			potentialDTSemifinalMaps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialFMSemifinalMaps.length; i++) {
		if (mapId === potentialFMSemifinalMaps[i].beatmapId) {
			potentialFMSemifinalMaps.splice(i, 1);
			i--;
		}
	}

	//Finals
	for (let i = 0; i < potentialNMFinalMaps.length; i++) {
		if (mapId === potentialNMFinalMaps[i].beatmapId) {
			potentialNMFinalMaps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialHDFinalMaps.length; i++) {
		if (mapId === potentialHDFinalMaps[i].beatmapId) {
			potentialHDFinalMaps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialHRFinalMaps.length; i++) {
		if (mapId === potentialHRFinalMaps[i].beatmapId) {
			potentialHRFinalMaps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialDTFinalMaps.length; i++) {
		if (mapId === potentialDTFinalMaps[i].beatmapId) {
			potentialDTFinalMaps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialFMFinalMaps.length; i++) {
		if (mapId === potentialFMFinalMaps[i].beatmapId) {
			potentialFMFinalMaps.splice(i, 1);
			i--;
		}
	}

	//Finals
	for (let i = 0; i < potentialNMGrandfinalMaps.length; i++) {
		if (mapId === potentialNMGrandfinalMaps[i].beatmapId) {
			potentialNMGrandfinalMaps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialHDGrandfinalMaps.length; i++) {
		if (mapId === potentialHDGrandfinalMaps[i].beatmapId) {
			potentialHDGrandfinalMaps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialHRGrandfinalMaps.length; i++) {
		if (mapId === potentialHRGrandfinalMaps[i].beatmapId) {
			potentialHRGrandfinalMaps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialDTGrandfinalMaps.length; i++) {
		if (mapId === potentialDTGrandfinalMaps[i].beatmapId) {
			potentialDTGrandfinalMaps.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < potentialFMGrandfinalMaps.length; i++) {
		if (mapId === potentialFMGrandfinalMaps[i].beatmapId) {
			potentialFMGrandfinalMaps.splice(i, 1);
			i--;
		}
	}
}

async function createElitiriRoleAssignmentTask() {
	logDatabaseQueries(2, 'processQueueTasks/elitiriCupSignUps.js DBProcessQueue 2');
	const task = await DBProcessQueue.findOne({
		where: { task: 'elitiriRoleAssignment' }
	});
	if (!task) {
		let date = new Date();
		DBProcessQueue.create({
			guildId: 'None', task: 'elitiriRoleAssignment', priority: 3, date: date
		});
	}
}