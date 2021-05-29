const { DBElitiriCupSignUp, DBElitiriCupSubmissions } = require('../dbObjects.js');
const { pause } = require('../utils.js');

module.exports = {
	name: 'ecs2021-admin',
	//aliases: ['osu-map', 'beatmap-info'],
	description: 'Admin control for the Elitiri Cup',
	usage: '<sr> | <message> <everyone/noSubmissions/noAvailability>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'debug',
	prefixCommand: true,
	async execute(msg, args) {
		if (msg.author.id !== '138273136285057025') {
			return;
		}

		if (args[0] === 'sr') {
			const topElitiriSignUps = await DBElitiriCupSignUp.findAll({
				where: { tournamentName: 'Elitiri Cup Summer 2021', bracketName: 'Top Bracket' }
			});

			const middleElitiriSignUps = await DBElitiriCupSignUp.findAll({
				where: { tournamentName: 'Elitiri Cup Summer 2021', bracketName: 'Middle Bracket' }
			});

			const lowerElitiriSignUps = await DBElitiriCupSignUp.findAll({
				where: { tournamentName: 'Elitiri Cup Summer 2021', bracketName: 'Lower Bracket' }
			});

			const beginnerElitiriSignUps = await DBElitiriCupSignUp.findAll({
				where: { tournamentName: 'Elitiri Cup Summer 2021', bracketName: 'Beginner Bracket' }
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
				return msg.channel.send('You didn\'t specify a valid target group. It should be `everyone`, `noAvailibility` or `noSubmissions` instead.');
			} else if (args[0] === 'everyone') {
				targetGroup = 'Every Player';
			} else if (args[0] === 'noAvailability') {
				targetGroup = 'Players with missing availabilities';
			} else if (args[0] === 'noSubmissions') {
				targetGroup = 'Players with missing submissions';
			} else {
				return msg.channel.send(`${args[0]} is not a valid target group. It should be \`everyone\`, \`noAvailability\` or \`noSubmissions\` instead.`);
			}

			if (!args[1]) {
				return msg.channel.send('You didn\'t specify a valid target bracket. It should be `all`, `top`, `middle`, `lower` or `beginner` instead.');
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
				return msg.channel.send(`${args[1]} is not a valid target bracket. It should be \`all\`, \`top\`, \`middle\`, \`lower\` or \`beginner\` instead.`);
			}

			let elitiriSignUps = await DBElitiriCupSignUp.findAll({
				where: { tournamentName: 'Elitiri Cup Summer 2021' }
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
					let submissions = await DBElitiriCupSubmissions.findAll({
						where: { tournamentName: 'Elitiri Cup Summer 2021', osuUserId: elitiriSignUps[i].osuUserId }
					});

					if (submissions.length === 5) {
						elitiriSignUps.splice(i, 1);
						i--;
					}
				}
			}

			args.shift();
			args.shift();

			if (!args[0]) {
				return msg.channel.send('You didn\'t provide a message to send.');
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
							if (j === 2) {
								const channel = await msg.client.channels.fetch('833803740162949191');
								channel.send(`<@${user.id}>, it seems like I can't DM you. Please enable DMs so that I can keep you up to date with the match procedure!`);
							} else {
								await pause(5000);
							}
						} else {
							j = Infinity;
							console.log(error);
						}
					}
				}
			}
		} else if (args[0] === 'createPools') {
			let allMaps;
			if (args[1] === 'top') {
				allMaps = await DBElitiriCupSubmissions.findAll({
					where: { tournamentName: 'Elitiri Cup Summer 2021', bracketName: 'Top Bracket' }
				});
			} else if (args[1] === 'middle') {
				allMaps = await DBElitiriCupSubmissions.findAll({
					where: { tournamentName: 'Elitiri Cup Summer 2021', bracketName: 'Middle Bracket' }
				});
			} else if (args[1] === 'lower') {
				allMaps = await DBElitiriCupSubmissions.findAll({
					where: { tournamentName: 'Elitiri Cup Summer 2021', bracketName: 'Lower Bracket' }
				});
			} else if (args[1] === 'beginner') {
				allMaps = await DBElitiriCupSubmissions.findAll({
					where: { tournamentName: 'Elitiri Cup Summer 2021', bracketName: 'Beginner Bracket' }
				});
			} else {
				return msg.channel.send('Please specify for which bracket the pools should be created. (`top`, `middle`, `lower`, `beginner`)');
			}

			quicksort(allMaps);

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

			let potentialQualifierMaps = [];
			let potentialRoundOf32Maps = [];
			let potentialRoundOf16Maps = [];
			let potentialQuarterfinalMaps = [];
			let potentialSemifinalMaps = [];
			let potentialFinalMaps = [];
			let potentialGrandfinalMaps = [];


		}
	}
};

// module.exports = {
// 	// eslint-disable-next-line no-unused-vars
// 	async execute(client, processQueueEntry) {
// 		if (processQueueEntry.additions === 'Top Bracket') {
// 			await updateSheet('1FeGwyeI-GLLej4HxfOJ0R4A9ZAnJ7ofdMPgKrgnpBG8', processQueueEntry.additions);
// 		} else if (processQueueEntry.additions === 'Middle Bracket') {
// 			await updateSheet('1swtWHJoO5vdUq6LPS4-eXziIDc4dZ2QJIRhNWyU9PVE', processQueueEntry.additions);
// 		} else if (processQueueEntry.additions === 'Lower Bracket') {
// 			await updateSheet('1jjZm93sA0XQs6Zfgh1Ev-46IuNunobDiW80uQMM8K2k', processQueueEntry.additions);
// 		} else if (processQueueEntry.additions === 'Beginner Bracket') {
// 			await updateSheet('1AIyEGG2_X2gwy01XQl2pINc2yYU8XicrdfyOEvZYY-Q', processQueueEntry.additions);
// 		}
// 	},
// };

// async function updateSheet(spreadsheetID, bracketName) {
// 	// eslint-disable-next-line no-undef
// 	// if (process.env.SERVER !== 'Live') {
// 	// 	return;
// 	// }
// 	// Initialize the sheet - doc ID is the long id in the sheets URL
// 	const doc = new GoogleSpreadsheet(spreadsheetID);

// 	// Initialize Auth - see more available options at https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
// 	await doc.useServiceAccountAuth({
// 		// eslint-disable-next-line no-undef
// 		client_email: process.env.GOOGLESHEETSSERVICEACCOUNTMAIL,
// 		// eslint-disable-next-line no-undef
// 		private_key: process.env.GOOGLESHEETSSERVICEACCOUNTPRIVATEKEY.replace(/\\n/g, '\n'),
// 	});

// 	await doc.loadInfo(); // loads document properties and worksheet

// 	const sheet = doc.sheetsByTitle['Player List'];

// 	let bracketPlayers = await DBElitiriCupSignUp.findAll({
// 		where: {
// 			tournamentName: 'Elitiri Cup Summer 2021',
// 			bracketName: bracketName
// 		}
// 	});

// 	quicksort(bracketPlayers);

// 	await sheet.loadCells('B4:J500');
// 	for (let i = 0; i < 496; i++) {
// 		let numberValue = '';
// 		let playerName = '';
// 		let playerID = '';
// 		let playerRank = '';
// 		let discordTag = '';
// 		let time = '';
// 		let connected = '';
// 		let badges = '';
// 		if (bracketPlayers[i]) {
// 			numberValue = i + 1;
// 			playerName = bracketPlayers[i].osuName;
// 			playerID = bracketPlayers[i].osuUserId;
// 			playerRank = bracketPlayers[i].osuRank;
// 			discordTag = bracketPlayers[i].discordTag;
// 			if (bracketPlayers[i].saturdayEarlyAvailability) {
// 				time = `${bracketPlayers[i].saturdayEarlyAvailability} - ${bracketPlayers[i].saturdayLateAvailability} UTC | ${bracketPlayers[i].sundayEarlyAvailability} - ${bracketPlayers[i].sundayLateAvailability} UTC`;
// 			} else {
// 				time = 'No availabilities set';
// 			}
// 			connected = 'Yes';
// 			badges = bracketPlayers[i].osuBadges;
// 		}

// 		const NumberCell = sheet.getCell(3 + i, 1); //getCell(row, column) zero-indexed
// 		if (NumberCell.value !== numberValue) {
// 			NumberCell.value = numberValue;
// 		}

// 		const PlayerNameCell = sheet.getCell(3 + i, 2); //getCell(row, column) zero-indexed
// 		if (PlayerNameCell.value !== playerName) {
// 			PlayerNameCell.value = playerName;
// 		}

// 		const PlayerIDCell = sheet.getCell(3 + i, 3); //getCell(row, column) zero-indexed
// 		if (PlayerIDCell.value !== playerID) {
// 			PlayerIDCell.value = playerID;
// 		}


// 		const RankCell = sheet.getCell(3 + i, 4); //getCell(row, column) zero-indexed
// 		if (RankCell.value !== playerRank) {
// 			RankCell.value = playerRank;
// 		}

// 		const DiscordTagCell = sheet.getCell(3 + i, 5); //getCell(row, column) zero-indexed
// 		if (DiscordTagCell.value !== discordTag) {
// 			DiscordTagCell.value = discordTag;
// 		}

// 		const TimeCell = sheet.getCell(3 + i, 6); //getCell(row, column) zero-indexed
// 		if (TimeCell.value !== time) {
// 			TimeCell.value = time;
// 		}

// 		const ConnectedCell = sheet.getCell(3 + i, 8); //getCell(row, column) zero-indexed
// 		if (ConnectedCell.value !== connected) {
// 			ConnectedCell.value = connected;
// 		}

// 		const BadgesCell = sheet.getCell(3 + i, 9); //getCell(row, column) zero-indexed
// 		if (BadgesCell.value !== badges) {
// 			BadgesCell.value = badges;
// 		}
// 		if (i % 150 === 0 || i === 495) {
// 			await sheet.saveUpdatedCells();
// 		}
// 	}

// 	const task = await DBProcessQueue.findOne({
// 		where: { task: 'elitiriRoleAssignment' }
// 	});
// 	if (!task) {
// 		DBProcessQueue.create({
// 			guildId: 'None', task: 'elitiriRoleAssignment', priority: 3
// 		});
// 	}
// }

function partition(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].starRating) <= parseFloat(pivot.starRating)) {
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