const { DBElitiriCupSignUp, DBElitiriCupSubmissions } = require('../dbObjects.js');
const { pause } = require('../utils.js');
const { GoogleSpreadsheet } = require('google-spreadsheet');

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
	name: 'ecs2021-admin',
	//aliases: ['osu-map', 'beatmap-info'],
	description: 'Admin control for the Elitiri Cup',
	usage: '<sr> | <message> <everyone/noSubmissions/noAvailability> <all/top/middle/lower/beginner> | <createPools> <top/middle/lower/beginner> | <prune> <noSubmissions/player> <osuPlayerID>',
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
				return msg.reply('You didn\'t specify a valid target group. It should be `everyone`, `noAvailibility` or `noSubmissions` instead.');
			} else if (args[0] === 'everyone') {
				targetGroup = 'Every Player';
			} else if (args[0] === 'noAvailability') {
				targetGroup = 'Players with missing availabilities';
			} else if (args[0] === 'noSubmissions') {
				targetGroup = 'Players with missing submissions';
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
							console.log(error);
						}
					}
				}
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

			let elitiriSignUps = await DBElitiriCupSignUp.findAll({
				where: { tournamentName: 'Elitiri Cup Summer 2021' }
			});

			if (targetGroup === 'Players with missing submissions') {
				for (let i = 0; i < elitiriSignUps.length; i++) {
					let submissions = await DBElitiriCupSubmissions.findAll({
						where: { tournamentName: 'Elitiri Cup Summer 2021', osuUserId: elitiriSignUps[i].osuUserId }
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
									console.log(error);
								}
							}
						}
						console.log('Player removed from Elitiri Cup');
					}
				}
			} else if (targetGroup === 'A specific player') {
				for (let i = 0; i < elitiriSignUps.length; i++) {
					let submissions = await DBElitiriCupSubmissions.findAll({
						where: { tournamentName: 'Elitiri Cup Summer 2021', osuUserId: elitiriSignUps[i].osuUserId }
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
									console.log(error);
								}
							}
						}
						console.log('Player removed from Elitiri Cup');
					}
				}
			}
		} else if (args[0] === 'placement') {
			const elitiriSignUp = await DBElitiriCupSignUp.findOne({
				where: { osuUserId: args[1], tournamentName: 'Elitiri Cup Summer 2021' }
			});

			if (args[2]) {
				elitiriSignUp.rankAchieved = args[2];
			} else {
				elitiriSignUp.rankAchieved = '';
			}

			elitiriSignUp.save();

			msg.reply(`Placement of \`${elitiriSignUp.osuName}\` set to \`${elitiriSignUp.rankAchieved}\``);
		} else if (args[0] === 'createPools') {
			let allMaps = [];
			let rowOffset;
			if (args[1] === 'top') {
				allMaps = await DBElitiriCupSubmissions.findAll({
					where: { tournamentName: 'Elitiri Cup Summer 2021', bracketName: 'Top Bracket' }
				});
				rowOffset = 78;
			} else if (args[1] === 'middle') {
				allMaps = await DBElitiriCupSubmissions.findAll({
					where: { tournamentName: 'Elitiri Cup Summer 2021', bracketName: 'Middle Bracket' }
				});
				rowOffset = 53;
			} else if (args[1] === 'lower') {
				allMaps = await DBElitiriCupSubmissions.findAll({
					where: { tournamentName: 'Elitiri Cup Summer 2021', bracketName: 'Lower Bracket' }
				});
				rowOffset = 28;
			} else if (args[1] === 'beginner') {
				allMaps = await DBElitiriCupSubmissions.findAll({
					where: { tournamentName: 'Elitiri Cup Summer 2021', bracketName: 'Beginner Bracket' }
				});
				rowOffset = 3;
			} else {
				return msg.reply('Please specify for which bracket the pools should be created. (`top`, `middle`, `lower`, `beginner`)');
			}

			console.log(allMaps);

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

			//Putting NM maps into potential pools
			for (let i = 0; i < allNMMaps.length; i++) {
				let allPercentage = 100 / allNMMaps.length * i;
				if (allPercentage < 100 / MappoolSizes.totalNM * (MappoolSizes.Qual.NM)) {
					potentialNMQualifierMaps.push(allNMMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalNM * (MappoolSizes.Qual.NM + MappoolSizes.Ro32.NM)) {
					potentialNMRoundOf32Maps.push(allNMMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalNM * (MappoolSizes.Qual.NM + MappoolSizes.Ro32.NM + MappoolSizes.Ro16.NM)) {
					potentialNMRoundOf16Maps.push(allNMMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalNM * (MappoolSizes.Qual.NM + MappoolSizes.Ro32.NM + MappoolSizes.Ro16.NM + MappoolSizes.QF.NM)) {
					potentialNMQuarterfinalMaps.push(allNMMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalNM * (MappoolSizes.Qual.NM + MappoolSizes.Ro32.NM + MappoolSizes.Ro16.NM + MappoolSizes.QF.NM + MappoolSizes.SF.NM)) {
					potentialNMSemifinalMaps.push(allNMMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalNM * (MappoolSizes.Qual.NM + MappoolSizes.Ro32.NM + MappoolSizes.Ro16.NM + MappoolSizes.QF.NM + MappoolSizes.SF.NM + MappoolSizes.F.NM)) {
					potentialNMFinalMaps.push(allNMMaps[i]);
				} else {
					potentialNMGrandfinalMaps.push(allNMMaps[i]);
				}
			}

			//Putting HD maps into potential pools
			for (let i = 0; i < allHDMaps.length; i++) {
				let allPercentage = 100 / allHDMaps.length * i;
				if (allPercentage < 100 / MappoolSizes.totalHD * (MappoolSizes.Qual.HD)) {
					potentialHDQualifierMaps.push(allHDMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalHD * (MappoolSizes.Qual.HD + MappoolSizes.Ro32.HD)) {
					potentialHDRoundOf32Maps.push(allHDMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalHD * (MappoolSizes.Qual.HD + MappoolSizes.Ro32.HD + MappoolSizes.Ro16.HD)) {
					potentialHDRoundOf16Maps.push(allHDMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalHD * (MappoolSizes.Qual.HD + MappoolSizes.Ro32.HD + MappoolSizes.Ro16.HD + MappoolSizes.QF.HD)) {
					potentialHDQuarterfinalMaps.push(allHDMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalHD * (MappoolSizes.Qual.HD + MappoolSizes.Ro32.HD + MappoolSizes.Ro16.HD + MappoolSizes.QF.HD + MappoolSizes.SF.HD)) {
					potentialHDSemifinalMaps.push(allHDMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalHD * (MappoolSizes.Qual.HD + MappoolSizes.Ro32.HD + MappoolSizes.Ro16.HD + MappoolSizes.QF.HD + MappoolSizes.SF.HD + MappoolSizes.F.HD)) {
					potentialHDFinalMaps.push(allHDMaps[i]);
				} else {
					potentialHDGrandfinalMaps.push(allHDMaps[i]);
				}
			}

			//Putting HR maps into potential pools
			for (let i = 0; i < allHRMaps.length; i++) {
				let allPercentage = 100 / allHRMaps.length * i;
				if (allPercentage < 100 / MappoolSizes.totalHR * (MappoolSizes.Qual.HR)) {
					potentialHRQualifierMaps.push(allHRMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalHR * (MappoolSizes.Qual.HR + MappoolSizes.Ro32.HR)) {
					potentialHRRoundOf32Maps.push(allHRMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalHR * (MappoolSizes.Qual.HR + MappoolSizes.Ro32.HR + MappoolSizes.Ro16.HR)) {
					potentialHRRoundOf16Maps.push(allHRMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalHR * (MappoolSizes.Qual.HR + MappoolSizes.Ro32.HR + MappoolSizes.Ro16.HR + MappoolSizes.QF.HR)) {
					potentialHRQuarterfinalMaps.push(allHRMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalHR * (MappoolSizes.Qual.HR + MappoolSizes.Ro32.HR + MappoolSizes.Ro16.HR + MappoolSizes.QF.HR + MappoolSizes.SF.HR)) {
					potentialHRSemifinalMaps.push(allHRMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalHR * (MappoolSizes.Qual.HR + MappoolSizes.Ro32.HR + MappoolSizes.Ro16.HR + MappoolSizes.QF.HR + MappoolSizes.SF.HR + MappoolSizes.F.HR)) {
					potentialHRFinalMaps.push(allHRMaps[i]);
				} else {
					potentialHRGrandfinalMaps.push(allHRMaps[i]);
				}
			}

			//Putting DT maps into potential pools
			for (let i = 0; i < allDTMaps.length; i++) {
				let allPercentage = 100 / allDTMaps.length * i;
				if (allPercentage < 100 / MappoolSizes.totalDT * (MappoolSizes.Qual.DT)) {
					potentialDTQualifierMaps.push(allDTMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalDT * (MappoolSizes.Qual.DT + MappoolSizes.Ro32.DT)) {
					potentialDTRoundOf32Maps.push(allDTMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalDT * (MappoolSizes.Qual.DT + MappoolSizes.Ro32.DT + MappoolSizes.Ro16.DT)) {
					potentialDTRoundOf16Maps.push(allDTMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalDT * (MappoolSizes.Qual.DT + MappoolSizes.Ro32.DT + MappoolSizes.Ro16.DT + MappoolSizes.QF.DT)) {
					potentialDTQuarterfinalMaps.push(allDTMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalDT * (MappoolSizes.Qual.DT + MappoolSizes.Ro32.DT + MappoolSizes.Ro16.DT + MappoolSizes.QF.DT + MappoolSizes.SF.DT)) {
					potentialDTSemifinalMaps.push(allDTMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalDT * (MappoolSizes.Qual.DT + MappoolSizes.Ro32.DT + MappoolSizes.Ro16.DT + MappoolSizes.QF.DT + MappoolSizes.SF.DT + MappoolSizes.F.DT)) {
					potentialDTFinalMaps.push(allDTMaps[i]);
				} else {
					potentialDTGrandfinalMaps.push(allDTMaps[i]);
				}
			}

			//Putting FM maps into potential pools
			for (let i = 0; i < allFMMaps.length; i++) {
				let allPercentage = 100 / allFMMaps.length * i;
				if (allPercentage < 100 / MappoolSizes.totalFM * (MappoolSizes.Qual.FM)) {
					potentialFMQualifierMaps.push(allFMMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalFM * (MappoolSizes.Qual.FM + MappoolSizes.Ro32.FM)) {
					potentialFMRoundOf32Maps.push(allFMMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalFM * (MappoolSizes.Qual.FM + MappoolSizes.Ro32.FM + MappoolSizes.Ro16.FM)) {
					potentialFMRoundOf16Maps.push(allFMMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalFM * (MappoolSizes.Qual.FM + MappoolSizes.Ro32.FM + MappoolSizes.Ro16.FM + MappoolSizes.QF.FM)) {
					potentialFMQuarterfinalMaps.push(allFMMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalFM * (MappoolSizes.Qual.FM + MappoolSizes.Ro32.FM + MappoolSizes.Ro16.FM + MappoolSizes.QF.FM + MappoolSizes.SF.FM)) {
					potentialFMSemifinalMaps.push(allFMMaps[i]);
				} else if (allPercentage < 100 / MappoolSizes.totalFM * (MappoolSizes.Qual.FM + MappoolSizes.Ro32.FM + MappoolSizes.Ro16.FM + MappoolSizes.QF.FM + MappoolSizes.SF.FM + MappoolSizes.F.FM)) {
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
			const doc = new GoogleSpreadsheet('1o_4d_b-yRuVkbQNdArlVUwlXFo1oUz7qQTYLjJDxHBI');

			// Initialize Auth - see more available options at https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
			await doc.useServiceAccountAuth({
				// eslint-disable-next-line no-undef
				client_email: process.env.GOOGLESHEETSSERVICEACCOUNTMAIL,
				// eslint-disable-next-line no-undef
				private_key: process.env.GOOGLESHEETSSERVICEACCOUNTPRIVATEKEY.replace(/\\n/g, '\n'),
			});

			await doc.loadInfo(); // loads document properties and worksheet

			let sheet = doc.sheetsByTitle['Mappool Top Secret'];

			await sheet.loadCells('M4:P703');

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
		const link = `https://osu.ppy.sh/beatmapsets/${pool[i].beatmapsetId}#osu/${pool[i].beatmapId}`;
		const linkCell = sheet.getCell(rowOffset + i, 12); //getCell(row, column) zero-indexed
		linkCell.value = link;

		// const starRatingCell = sheet.getCell(rowOffset + i, 13); //getCell(row, column) zero-indexed
		// starRatingCell.value = Math.round(pool[i].starRating * 100) / 100;

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