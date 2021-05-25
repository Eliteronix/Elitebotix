const { DBDiscordUsers, DBElitiriCupSignUp } = require('../dbObjects');
const { getGuildPrefix } = require('../utils');

module.exports = {
	name: 'osu-elitiri-cup',
	aliases: ['elitiri-cup', 'elitiri-cup-summer', 'elitiri-cup-summer-2021', 'ecs', 'ecs2021'],
	description: 'Allows you to sign up for the `Elitiri Cup Summer 2021` tournament!',
	usage: '<server/register/unregister>',
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
			sendMessage(msg, 'The discord server for the competition can be found here: <https://discord.com/invite/Asz5Gfe>\nAfter joining be sure to head to <#801000891750547496> and assign yourself the Elitiri Cup role!\nEverything else will be done automatically when you registered!');
		} else if (args[0].toLowerCase() === 'register') {
			const guildPrefix = await getGuildPrefix(msg);
			//get elitiriSignUp from db
			const elitiriSignUp = await DBElitiriCupSignUp.findOne({
				where: { userId: msg.author.id },
			});

			if (elitiriSignUp) {
				return sendMessage(msg, `You are already registered for the \`Elitiri Cup Summer 2021\` tournament.\nBe sure to join the server if you didn't already. (\`${guildPrefix}${this.name} server\`)\nOther than that be sure to have DMs open for me so that I can send you updates for the tournament!`);
			}

			//get discordUser from db
			const discordUser = await DBDiscordUsers.findOne({
				where: { userId: msg.author.id },
			});

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
				sendMessage(msg, `Your BWS rank is #${BWSRank} and you are not able to join any of the brackets because of that.`);
			}

			if (discordUser && discordUser.osuUserId) {
				if (discordUser.osuVerified) {
					DBElitiriCupSignUp.create({
						userId: msg.author.id,
						discordTag: `${msg.author.username}#${msg.author.discriminator}`,
						osuUserId: discordUser.osuUserId,
						osuName: discordUser.osuName,
						osuBadges: discordUser.osuBadges,
						osuPP: discordUser.osuPP,
						osuRank: discordUser.osuRank,
						bracketName: bracketName,
					});
					// 		saturdayEarlyAvailability: {
					// 			type: DataTypes.INTEGER,
					// 		},
					// 		saturdayLateAvailability: {
					// 			type: DataTypes.INTEGER,
					// 		},
					// 		sundayEarlyAvailability: {
					// 			type: DataTypes.INTEGER,
					// 		},
					// 		sundayLateAvailability: {
					// 			type: DataTypes.INTEGER,
					// 		},
					// 		lowerDifficulty: {
					// 			type: DataTypes.FLOAT,
					// 		},
					// 		upperDifficulty: {
					// 			type: DataTypes.FLOAT,
					// 		},			
					sendMessage(msg, `You successfully registered for the \`Elitiri Cup Summer 2021\` torunament.\nBe sure to join the server and read <#834833321438740490> if you didn't already. (\`${guildPrefix}${this.name} server\`)\nOther than that be sure to have DMs open for me so that I can send you updates for the tournament!`);
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
				sendMessage(msg, `You have been unregistered from the \`Elitiri Cup Summer 2021\` torunament.\nStill thank you for showing interest!\nYou can register again by using \`${guildPrefix}${this.name} register\`!`);
			} else {
				sendMessage(msg, `You aren't signed up for the \`Elitiri Cup Summer 2021\` tournament at the moment.\nYou can register by using \`${guildPrefix}${this.name} register\`!`);
			}
		} else {
			msg.channel.send('Please specify what you want to do: `server`, `register`, `unregister`');
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