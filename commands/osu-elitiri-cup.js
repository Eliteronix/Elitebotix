const { DBDiscordUsers, DBElitiriCupSignUp, DBProcessQueue } = require('../dbObjects');
const { getGuildPrefix } = require('../utils');

module.exports = {
	name: 'osu-elitiri-cup',
	aliases: ['elitiri-cup', 'elitiri-cup-summer', 'elitiri-cup-summer-2021', 'ecs', 'ecs2021'],
	description: 'Allows you to sign up for the `Elitiri Cup Summer 2021` tournament!',
	usage: '<register> <desired upper SR limit> <desired lower SR limit> | <unregister> | <server> | <availability>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	args: true,
	cooldown: 10,
	//noCooldownMessage: true,
	tags: 'ecs2021',
	prefixCommand: true,
	async execute(msg, args) {
		if (args[0].toLowerCase() === 'server') {
			sendMessage(msg, 'The discord server for the competition can be found here: <https://discord.com/invite/Asz5Gfe>\nAfter joining be sure to head to <#727987472772104272> and assign yourself the Elitiri Cup role!\nEverything else will be done automatically when you registered!');
		} else if (args[0].toLowerCase() === 'register') {
			const guildPrefix = await getGuildPrefix(msg);
			//get elitiriSignUp from db
			const elitiriSignUp = await DBElitiriCupSignUp.findOne({
				where: { userId: msg.author.id, tournamentName: 'Elitiri Cup Summer 2021' },
			});

			if (elitiriSignUp) {
				return sendMessage(msg, `You are already registered for the \`Elitiri Cup Summer 2021\` tournament.\nBe sure to join the server if you didn't already. (\`${guildPrefix}${this.name} server\`)\nOther than that be sure to have DMs open for me so that I can send you updates for the tournament!`);
			}

			//get discordUser from db
			const discordUser = await DBDiscordUsers.findOne({
				where: { userId: msg.author.id },
			});

			if (discordUser && discordUser.osuUserId) {
				if (discordUser.osuVerified) {
					let bracketName = '';
					let BWSRank = Math.round(Math.pow(discordUser.osuRank, Math.pow(0.9937, Math.pow(discordUser.osuBadges, 2))));

					if (BWSRank > 999 && BWSRank < 10000) {
						bracketName = 'Top Bracket';
					} else if (BWSRank > 9999 && BWSRank < 50000) {
						bracketName = 'Middle Bracket';
					} else if (BWSRank > 49999 && BWSRank < 100000) {
						bracketName = 'Lower Bracket';
					} else if (BWSRank > 99999) {
						bracketName = 'Beginner Bracket';
					}

					if (bracketName === '') {
						return sendMessage(msg, `Your BWS rank is #${BWSRank} and you are not able to join any of the brackets because of that.`);
					}

					if (!args[2]) {
						return sendMessage(msg, `You didn't provide valid difficulty boundaries for your sign up. Please provide a number between 0 and 10 for your desired difficulties of the mappools.\nUsage: \`${guildPrefix}${this.name} register <lower SR between 0-10> <upper SR between 0-10>\``);
					}

					if (isNaN(args[1]) || args[1] < 0 || args[1] > 10) {
						return sendMessage(msg, `${args[1]} is not a valid number. Please provide a number between 0 and 10 for your desired lower difficulty of the mappools.\nUsage: \`${guildPrefix}${this.name} register <lower SR between 0-10> <upper SR between 0-10>\``);
					}

					if (isNaN(args[2]) || args[2] < 0 || args[2] > 10) {
						return sendMessage(msg, `${args[2]} is not a valid number. Please provide a number between 0 and 10 for your desired upper difficulty of the mappools.\nUsage: \`${guildPrefix}${this.name} register <lower SR between 0-10> <upper SR between 0-10>\``);
					}

					await DBElitiriCupSignUp.create({
						userId: msg.author.id,
						discordTag: `${msg.author.username}#${msg.author.discriminator}`,
						osuUserId: discordUser.osuUserId,
						osuName: discordUser.osuName,
						osuBadges: discordUser.osuBadges,
						osuPP: discordUser.osuPP,
						osuRank: discordUser.osuRank,
						bracketName: bracketName,
						lowerDifficulty: parseFloat(args[1]),
						upperDifficulty: parseFloat(args[2]),
						saturdayEarlyAvailability: null,
						saturdayLateAvailability: null,
						sundayEarlyAvailability: null,
						sundayLateAvailability: null,
						tournamentName: 'Elitiri Cup Summer 2021'
					});
					sendMessage(msg, `You successfully registered for the \`Elitiri Cup Summer 2021\` tournament.\nBe sure to join the server and read <#727987472772104272> if you didn't already. (\`${guildPrefix}${this.name} server\`)\nOther than that be sure to have DMs open for me so that I can send you updates for the tournament!`);
					createProcessQueueTask(elitiriSignUp.bracketName);
				} else {
					sendMessage(msg, `It seems like you don't have your connected osu! account verified.\nPlease use \`${guildPrefix}osu-link verify\` to send a verification code to your osu! dms, follow the instructions and try again afterwards.`);
				}
			} else {
				sendMessage(msg, `It seems like you don't have your osu! account connected to the bot.\nPlease use \`${guildPrefix}osu-link osu-username\` to connect you account and verify it.`);
			}
		} else if (args[0].toLowerCase() === 'unregister') {
			const guildPrefix = await getGuildPrefix(msg);
			//get elitiriSignUp from db
			const elitiriSignUp = await DBElitiriCupSignUp.findOne({
				where: { userId: msg.author.id },
			});

			if (elitiriSignUp) {
				elitiriSignUp.destroy();
				sendMessage(msg, `You have been unregistered from the \`Elitiri Cup Summer 2021\` tournament.\nStill thank you for showing interest!\nYou can register again by using \`${guildPrefix}${this.name} register\`!`);
				createProcessQueueTask(elitiriSignUp.bracketName);
			} else {
				sendMessage(msg, `You aren't signed up for the \`Elitiri Cup Summer 2021\` tournament at the moment.\nYou can register by using \`${guildPrefix}${this.name} register\`!`);
			}
		} else if (args[0].toLowerCase() === 'availability') {
			const guildPrefix = await getGuildPrefix(msg);
			//get elitiriSignUp from db
			const elitiriSignUp = await DBElitiriCupSignUp.findOne({
				where: { userId: msg.author.id },
			});

			if (elitiriSignUp) {
				if (!args[1]) {
					if (elitiriSignUp.saturdayEarlyAvailability === null) {
						return sendMessage(msg, `You currently don't have any availabilities set.\nUsage: \`${guildPrefix}${this.name} availability xx-xx xx-xx\`\nExample: \`${guildPrefix}${this.name} availability 14-21 16-20\``);
					}
					return sendMessage(msg, `Your current \`Elitiri Cup Summer 2021\` availabilities are:\nSaturday: ${elitiriSignUp.saturdayEarlyAvailability} - ${elitiriSignUp.saturdayLateAvailability} UTC\nSunday: ${elitiriSignUp.sundayEarlyAvailability} - ${elitiriSignUp.sundayLateAvailability} UTC\nUsage: \`${guildPrefix}${this.name} availability xx-xx xx-xx\`\nExample: \`${guildPrefix}${this.name} availability 14-21 16-20\``);
				}
				if (!args[2]) {
					return sendMessage(msg, `You used the wrong format for submitting your availability in UTC.\nUsage: \`${guildPrefix}${this.name} availability xx-xx xx-xx\`\nExample: \`${guildPrefix}${this.name} availability 14-21 16-20\``);
				}
				let saturdayAvailability = args[1].split('-');
				let sundayAvailability = args[2].split('-');
				if (saturdayAvailability.length < 2 || sundayAvailability.length < 2
					|| isNaN(saturdayAvailability[0]) || saturdayAvailability[0] < 0 || saturdayAvailability[0] > 24
					|| isNaN(saturdayAvailability[1]) || saturdayAvailability[1] < 0 || saturdayAvailability[1] > 24
					|| isNaN(sundayAvailability[0]) || sundayAvailability[0] < 0 || sundayAvailability[0] > 24
					|| isNaN(sundayAvailability[1]) || sundayAvailability[1] < 0 || sundayAvailability[1] > 24) {
					return sendMessage(msg, `You used the wrong format for submitting your availability in UTC.\nUsage: \`${guildPrefix}${this.name} availability xx-xx xx-xx\`\nExample: \`${guildPrefix}${this.name} availability 14-21 16-20\``);
				}
				elitiriSignUp.saturdayEarlyAvailability = parseInt(saturdayAvailability[0]);
				elitiriSignUp.saturdayLateAvailability = parseInt(saturdayAvailability[1]);
				elitiriSignUp.sundayEarlyAvailability = parseInt(sundayAvailability[0]);
				elitiriSignUp.sundayLateAvailability = parseInt(sundayAvailability[1]);
				await elitiriSignUp.save();
				sendMessage(msg, `Your \`Elitiri Cup Summer 2021\` availabilities have been updated.\nYour new availabilities are:\nSaturday: ${elitiriSignUp.saturdayEarlyAvailability} - ${elitiriSignUp.saturdayLateAvailability} UTC\nSunday: ${elitiriSignUp.sundayEarlyAvailability} - ${elitiriSignUp.sundayLateAvailability} UTC`);
				createProcessQueueTask(elitiriSignUp.bracketName);
			} else {
				sendMessage(msg, `You are not yet registered for the \`Elitiri Cup Summer 2021\` tournament.\nYou can register by using \`${guildPrefix}${this.name} register\`!`);
			}
		} else {
			msg.channel.send('Please specify what you want to do: `server`, `register`, `unregister`, `availability`');
		}
	},
};

function sendMessage(msg, content) {
	msg.author.send(content)
		.then(() => {
			if (msg.channel.type === 'dm') return;
			msg.reply('I\'ve sent you a DM with some info!');
		})
		.catch(() => {
			msg.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
		});
}

async function createProcessQueueTask(bracketName) {
	const task = await DBProcessQueue.findOne({
		where: { task: 'elitiriCupSignUps', beingExecuted: false, additions: bracketName }
	});
	if (!task) {
		let date = new Date();
		date.setUTCMinutes(date.getUTCMinutes() + 1);
		DBProcessQueue.create({ guildId: 'None', task: 'elitiriCupSignUps', priority: 3, date: date, additions: bracketName });
	}
}