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
		}
	}
};