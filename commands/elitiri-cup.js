const { DBDiscordUsers, DBElitiriCupSignUp, DBProcessQueue } = require('../dbObjects');
const { getGuildPrefix, logDatabaseQueries, populateMsgFromInteraction } = require('../utils');
const { currentElitiriCup, currentElitiriCupEndOfRegs } = require('../config.json');
const Discord = require('discord.js');

module.exports = {
	name: 'elitiri-cup',
	description: `Allows you to sign up for the \`${currentElitiriCup}\` tournament!`,
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	cooldown: 10,
	tags: 'elitiri',
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		//TODO: Remove message code and replace with interaction code
		//TODO: deferReply
		//TODO: Update logdatabasequeries
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			args = [interaction.options.getSubcommand()];

			if (interaction.options.getSubcommand() === 'register') {
				let upperlimit;
				let lowerlimit;
				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					if (interaction.options._hoistedOptions[i].name === 'upperlimit') {
						upperlimit = interaction.options._hoistedOptions[i].value;
					} else {
						lowerlimit = interaction.options._hoistedOptions[i].value;
					}
				}
				args.push(lowerlimit);
				args.push(upperlimit);
			} else if (interaction.options.getSubcommand() === 'availability') {
				let earlysaturday;
				let latesaturday;
				let earlysunday;
				let latesunday;
				for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
					if (interaction.options._hoistedOptions[i].name === 'earlysaturday') {
						earlysaturday = interaction.options._hoistedOptions[i].value;
					} else if (interaction.options._hoistedOptions[i].name === 'latesaturday') {
						latesaturday = interaction.options._hoistedOptions[i].value;
					} else if (interaction.options._hoistedOptions[i].name === 'earlysunday') {
						earlysunday = interaction.options._hoistedOptions[i].value;
					} else {
						latesunday = interaction.options._hoistedOptions[i].value;
					}
				}
				args.push(`${earlysaturday}-${latesaturday}`);
				args.push(`${earlysunday}-${latesunday}`);
			}
		}
		if (args[0].toLowerCase() === 'server') {
			await sendMessage(msg, interaction, 'The discord server for the competition can be found here: <https://discord.com/invite/Asz5Gfe>\nAfter joining be sure to head to <#727987472772104272> and assign yourself the Elitiri Cup role!\nEverything else will be done automatically when you registered!');
		} else if (args[0].toLowerCase() === 'register') {
			let now = new Date();
			let endOfRegs = new Date();
			endOfRegs.setUTCMilliseconds(999);
			endOfRegs.setUTCSeconds(59);
			endOfRegs.setUTCMinutes(59);
			endOfRegs.setUTCHours(23);
			endOfRegs.setUTCDate(currentElitiriCupEndOfRegs.day);
			endOfRegs.setUTCMonth(currentElitiriCupEndOfRegs.zeroIndexMonth); //Zero Indexed
			endOfRegs.setUTCFullYear(currentElitiriCupEndOfRegs.year);
			if (now > endOfRegs) {
				if (msg.id) {
					return msg.reply('The registration period has ended.');
				}
				return await interaction.reply({ content: 'The registration period has ended.', ephemeral: true });
			}

			let guildPrefix = await getGuildPrefix(msg);
			if (!msg.id) {
				guildPrefix = '/';
			}
			//get elitiriSignUp from db
			//TODO: Attributes
			logDatabaseQueries(4, 'commands/osu-elitiri-cup.js DBElitiriCupSignUp 1');
			const elitiriSignUp = await DBElitiriCupSignUp.findOne({
				where: { userId: msg.author.id, tournamentName: currentElitiriCup },
			});

			if (elitiriSignUp) {
				return await sendMessage(msg, interaction, `You are already registered for the \`${currentElitiriCup}\` tournament.\nBe sure to join the server if you didn't already. (\`${guildPrefix}${this.name} server\`)\nOther than that be sure to have DMs open for me so that I can send you updates for the tournament!\n\nAlso please **be sure to set your availabilities** by using \`${guildPrefix}${this.name} availability\``);
			}

			//get discordUser from db
			//TODO: Attributes
			logDatabaseQueries(4, 'commands/osu-elitiri-cup.js DBDiscordUsers');
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
						return await sendMessage(msg, interaction, `Your BWS rank is #${BWSRank} and you are not able to join any of the brackets because of that.`);
					}

					if (!args[2]) {
						return await sendMessage(msg, interaction, `You didn't provide valid difficulty boundaries for your sign up. Please provide a number between 0 and 10 for your desired difficulties of the mappools.\nUsage: \`${guildPrefix}${this.name} register <lower SR between 0-10> <upper SR between 0-10>\``);
					}

					if (isNaN(args[1]) || args[1] < 0 || args[1] > 10) {
						return await sendMessage(msg, interaction, `${args[1]} is not a valid number. Please provide a number between 0 and 10 for your desired lower difficulty of the mappools.\nUsage: \`${guildPrefix}${this.name} register <lower SR between 0-10> <upper SR between 0-10>\``);
					}

					if (isNaN(args[2]) || args[2] < 0 || args[2] > 10) {
						return await sendMessage(msg, interaction, `${args[2]} is not a valid number. Please provide a number between 0 and 10 for your desired upper difficulty of the mappools.\nUsage: \`${guildPrefix}${this.name} register <lower SR between 0-10> <upper SR between 0-10>\``);
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
						tournamentName: currentElitiriCup
					});
					await sendMessage(msg, interaction, `You successfully registered for the \`${currentElitiriCup}\` tournament.\nBe sure to join the server and read <#727987472772104272> if you didn't already. (\`${guildPrefix}${this.name} server\`)\nOther than that be sure to have DMs open for me so that I can send you updates for the tournament!\n\nAlso please **be sure to set your availabilities** by using \`${guildPrefix}${this.name} availability\``);
					createProcessQueueTask(bracketName);
				} else {
					await sendMessage(msg, interaction, `It seems like you don't have your connected osu! account verified.\nPlease use \`${guildPrefix}osu-link verify\` to send a verification code to your osu! dms, follow the instructions and try again afterwards.`);
				}
			} else {
				await sendMessage(msg, interaction, `It seems like you don't have your osu! account connected to the bot.\nPlease use \`${guildPrefix}osu-link osu-username\` to connect you account and verify it.`);
			}
		} else if (args[0].toLowerCase() === 'unregister') {
			let now = new Date();
			let endOfRegs = new Date();
			endOfRegs.setUTCMilliseconds(999);
			endOfRegs.setUTCSeconds(59);
			endOfRegs.setUTCMinutes(59);
			endOfRegs.setUTCHours(23);
			endOfRegs.setUTCDate(currentElitiriCupEndOfRegs.day);
			endOfRegs.setUTCMonth(currentElitiriCupEndOfRegs.zeroIndexMonth); //Zero Indexed
			endOfRegs.setUTCFullYear(currentElitiriCupEndOfRegs.year);
			if (now > endOfRegs) {
				if (msg.id) {
					return msg.reply('The registration period has ended and signups can\'t be changed anymore.');
				}
				return await interaction.reply({ content: 'The registration period has ended and signups can\'t be changed anymore.', ephemeral: true });
			}

			const guildPrefix = await getGuildPrefix(msg);
			//get elitiriSignUp from db
			//TODO: Attributes
			logDatabaseQueries(4, 'commands/osu-elitiri-cup.js DBElitiriCupSignUp 2');
			const elitiriSignUp = await DBElitiriCupSignUp.findOne({
				where: { userId: msg.author.id },
			});

			if (elitiriSignUp) {
				elitiriSignUp.destroy();
				await sendMessage(msg, interaction, `You have been unregistered from the \`${currentElitiriCup}\` tournament.\nStill thank you for showing interest!\nYou can register again by using \`${guildPrefix}${this.name} register\`!`);
				createProcessQueueTask(elitiriSignUp.bracketName);
			} else {
				await sendMessage(msg, interaction, `You aren't signed up for the \`${currentElitiriCup}\` tournament at the moment.\nYou can register by using \`${guildPrefix}${this.name} register\`!`);
			}
		} else if (args[0].toLowerCase() === 'availability') {
			const guildPrefix = await getGuildPrefix(msg);
			//get elitiriSignUp from db
			//TODO: Attributes
			logDatabaseQueries(4, 'commands/osu-elitiri-cup.js DBElitiriCupSignUp 3');
			const elitiriSignUp = await DBElitiriCupSignUp.findOne({
				where: {
					userId: msg.author.id,
					tournamentName: currentElitiriCup
				},
			});

			if (elitiriSignUp) {
				if (!args[1]) {
					if (elitiriSignUp.saturdayEarlyAvailability === null) {
						return await sendMessage(msg, interaction, `You currently don't have any availabilities set.\nUsage: \`${guildPrefix}${this.name} availability xx-xx xx-xx\`\nExample: \`${guildPrefix}${this.name} availability 14-21 16-20\``);
					}
					return await sendMessage(msg, interaction, `Your current \`${currentElitiriCup}\` availabilities are:\nSaturday: ${elitiriSignUp.saturdayEarlyAvailability} - ${elitiriSignUp.saturdayLateAvailability} UTC\nSunday: ${elitiriSignUp.sundayEarlyAvailability} - ${elitiriSignUp.sundayLateAvailability} UTC\nUsage: \`${guildPrefix}${this.name} availability xx-xx xx-xx\`\nExample: \`${guildPrefix}${this.name} availability 14-21 16-20\``);
				}
				if (!args[2]) {
					return await sendMessage(msg, interaction, `You used the wrong format for submitting your availability in UTC.\nUsage: \`${guildPrefix}${this.name} availability xx-xx xx-xx\`\nExample: \`${guildPrefix}${this.name} availability 14-21 16-20\``);
				}
				let saturdayAvailability = args[1].split('-');
				let sundayAvailability = args[2].split('-');
				if (saturdayAvailability.length < 2 || sundayAvailability.length < 2
					|| isNaN(saturdayAvailability[0]) || saturdayAvailability[0] < 0 || saturdayAvailability[0] > 24
					|| isNaN(saturdayAvailability[1]) || saturdayAvailability[1] < 0 || saturdayAvailability[1] > 24
					|| isNaN(sundayAvailability[0]) || sundayAvailability[0] < 0 || sundayAvailability[0] > 24
					|| isNaN(sundayAvailability[1]) || sundayAvailability[1] < 0 || sundayAvailability[1] > 24) {
					return await sendMessage(msg, interaction, `You used the wrong format for submitting your availability in UTC.\nUsage: \`${guildPrefix}${this.name} availability xx-xx xx-xx\`\nExample: \`${guildPrefix}${this.name} availability 14-21 16-20\``);
				}
				elitiriSignUp.saturdayEarlyAvailability = parseInt(saturdayAvailability[0]);
				elitiriSignUp.saturdayLateAvailability = parseInt(saturdayAvailability[1]);
				elitiriSignUp.sundayEarlyAvailability = parseInt(sundayAvailability[0]);
				elitiriSignUp.sundayLateAvailability = parseInt(sundayAvailability[1]);
				await elitiriSignUp.save();
				await sendMessage(msg, interaction, `Your \`${currentElitiriCup}\` availabilities have been updated.\nYour new availabilities are:\nSaturday: ${elitiriSignUp.saturdayEarlyAvailability} - ${elitiriSignUp.saturdayLateAvailability} UTC\nSunday: ${elitiriSignUp.sundayEarlyAvailability} - ${elitiriSignUp.sundayLateAvailability} UTC`);
				createProcessQueueTask(elitiriSignUp.bracketName);
			} else {
				await sendMessage(msg, interaction, `You are not yet registered for the \`${currentElitiriCup}\` tournament.\nYou can register by using \`${guildPrefix}${this.name} register\`!`);
			}
		} else {
			msg.reply('Please specify what you want to do: `server`, `register`, `unregister`, `availability`');
		}
	},
};

async function sendMessage(msg, interaction, content) {
	if (msg.id) {
		return await msg.author.send(content)
			.then(() => {
				if (msg.channel.type === Discord.ChannelType.DM) return;
				msg.reply('I\'ve sent you a DM with some info!');
			})
			.catch(() => {
				msg.reply('it seems like I can\'t DM you! Do you have DMs disabled?');
			});
	}
	return await interaction.reply({ content: content, ephemeral: true });
}

async function createProcessQueueTask(bracketName) {
	//TODO: Attributes
	logDatabaseQueries(4, 'commands/osu-elitiri-cup.js DBProcessQueue');
	const task = await DBProcessQueue.findOne({
		where: { task: 'elitiriCupSignUps', beingExecuted: false, additions: bracketName }
	});
	if (!task) {
		let date = new Date();
		date.setUTCMinutes(date.getUTCMinutes() + 1);
		DBProcessQueue.create({ guildId: 'None', task: 'elitiriCupSignUps', priority: 3, date: date, additions: bracketName });
	}
}