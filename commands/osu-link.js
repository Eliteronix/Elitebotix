//Import Tables
const { DBGuilds, DBDiscordUsers } = require('../dbObjects');

//import the config variables from config.json
const { prefix } = require('../config.json');

//Require node-osu module
const osu = require('node-osu');

//Require Banchojs module
const Banchojs = require('bancho.js');

module.exports = {
	name: 'osu-link',
	aliases: ['osu-connect'],
	description: 'Allows you to link your Discord Account to your osu! Account',
	usage: '<connect/current/disconnect/verify> [osu! username/verification code]',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args) {
		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		//get discordUser from db
		const discordUser = await DBDiscordUsers.findOne({
			where: { userId: msg.author.id },
		});

		//Define prefix command
		let guildPrefix;

		//Check if the channel type is not a dm
		if (msg.channel.type === 'dm') {
			//Set prefix to standard prefix
			guildPrefix = prefix;
		} else {
			//Get guild from the db
			const guild = await DBGuilds.findOne({
				where: { guildId: msg.guild.id },
			});

			//Check if a guild record was found
			if (guild) {
				if (guild.customPrefixUsed) {
					guildPrefix = guild.customPrefix;
				} else {
					//Set prefix to standard prefix
					guildPrefix = prefix;
				}
			} else {
				//Set prefix to standard prefix
				guildPrefix = prefix;
			}
		}

		//Check for people that already have their discord account linked to that osu! account

		if (args[0] === 'connect') {
			if (args[1]) {
				osuApi.getUser({ u: args[1] })
					.then(osuUser => {
						if (discordUser) {
							const verificationCode = Math.random().toString(36).substring(2);

							discordUser.osuUserId = osuUser.id;
							discordUser.osuVerificationCode = verificationCode;
							discordUser.osuVerified = false;
							discordUser.save();

							// eslint-disable-next-line no-undef
							const bancho = new Banchojs.BanchoClient({ username: 'Eliteronix', password: process.env.OSUIRC });
							bancho.connect().then(() => {
								const IRCUser = new Banchojs.BanchoUser(bancho, osuUser.name);
								const verifyMessage = new Banchojs.OutgoingBanchoMessage(bancho, IRCUser, `[Elitebotix]: The Discord account ${msg.author.username}#${msg.author.discriminator} has linked their account to this osu! account.\nIf this was you please send 'e!osu-link verify ${verificationCode}' with the same user to Elitebotix on discord.`);
								verifyMessage.send();
								bancho.disconnect();
							}).catch(console.error);

							msg.channel.send('A verification code has been sent to you using osu! dms!');
						} else {
							const verificationCode = Math.random().toString(36).substring(2);
							DBDiscordUsers.create({ userId: msg.author.id, osuUserId: osuUser.id, osuVerificationCode: verificationCode });
						}
					})
					.catch(err => {
						if (err.message === 'Not found') {
							msg.channel.send(`Could not find osu! account \`${args[1]}\`.`);
						}
						console.log(err);
					});
			} else {
				msg.channel.send(`Please specify to which osu! account you want to connect.\nUsage: \`${guildPrefix}osu-link connect <osu! username>\``);
			}
		} else if (args[0] === 'current') {
			if (discordUser) {
				if (discordUser.osuUserId) {
					osuApi.getUser({ u: discordUser.osuUserId })
						.then(osuUser => {
							let verified = 'No';

							if (discordUser.osuVerified) {
								verified = 'yes';
							}

							msg.channel.send(`Currently linked osu! account: \`${osuUser.name}\`.\nVerified: \`${verified}\``);
						})
						.catch(err => {
							if (err.message === 'Not found') {
								msg.channel.send(`Could not find osu! account for id \`${discordUser.osuUserId}\`.`);
							}
							console.log(err);
						});
				} else {
					msg.channel.send(`There is currently no osu! account linked to your discord account.\nPlease use \`${guildPrefix}osu-link <connect> <osu! username>\``);
				}
			} else {
				msg.channel.send(`There is currently no osu! account linked to your discord account.\nPlease use \`${guildPrefix}osu-link <connect> <osu! username>\``);
			}
		} else if (args[0] === 'disconnect') {
			if (discordUser) {
				if (discordUser.osuUserId) {
					discordUser.osuUserId = '';
					discordUser.osuVerificationCode = '';
					discordUser.osuVerified = false;
					discordUser.save();

					msg.channel.send(`There is no longer an osu! account linked to your discord account.\nUse \`${guildPrefix}osu-link <connect> <osu! username>\` to link an osu! account to your discord account.`);
				} else {
					msg.channel.send(`There is currently no osu! account linked to your discord account.\nPlease use \`${guildPrefix}osu-link <connect> <osu! username>\``);
				}
			} else {
				msg.channel.send(`There is currently no osu! account linked to your discord account.\nPlease use \`${guildPrefix}osu-link <connect> <osu! username>\``);
			}
		} else if (args[0] === 'verify') {
			if (!args[1]) {
				if (discordUser) {
					if (discordUser.osuVerified) {
						osuApi.getUser({ u: discordUser.osuUserId })
							.then(osuUser => {
								msg.channel.send(`Your osu! account \`${osuUser.name}\` is already verified\nIf you need to connect a different account use \`${guildPrefix}osu-link <disconnect>\` first.`);
							})
							.catch(err => {
								if (err.message === 'Not found') {
									msg.channel.send(`Could not find osu! account for id \`${discordUser.osuUserId}\`.`);
								}
								console.log(err);
							});
					} else {
						if (discordUser.osuUserId) {
							osuApi.getUser({ u: discordUser.osuUserId })
								.then(osuUser => {
									const verificationCode = Math.random().toString(36).substring(2);

									discordUser.osuVerificationCode = verificationCode;
									discordUser.save();

									// eslint-disable-next-line no-undef
									const bancho = new Banchojs.BanchoClient({ username: 'Eliteronix', password: process.env.OSUIRC });
									bancho.connect().then(() => {
										const IRCUser = new Banchojs.BanchoUser(bancho, osuUser.name);
										const verifyMessage = new Banchojs.OutgoingBanchoMessage(bancho, IRCUser, `[Elitebotix]: The Discord account ${msg.author.username}#${msg.author.discriminator} has linked their account to this osu! account.\nIf this was you please send 'e!osu-verify ${verificationCode}' to Elitebotix.`);
										verifyMessage.send();
										bancho.disconnect();
									}).catch(console.error);

									msg.channel.send('A new verification code has been sent to you using osu! dms!');
								})
								.catch(err => {
									if (err.message === 'Not found') {
										msg.channel.send(`Could not find osu! account for id \`${discordUser.osuUserId}\`.`);
									}
									console.log(err);
								});
						} else {
							msg.channel.send(`There is currently no osu! account linked to your discord account.\nPlease use \`${guildPrefix}osu-link <connect> <osu! username>\``);
						}
					}
				} else {
					msg.channel.send(`There is currently no osu! account linked to your discord account.\nPlease use \`${guildPrefix}osu-link <connect> <osu! username>\``);
				}
			} else {
				if (discordUser) {
					if (discordUser.osuUserId) {
						if (discordUser.osuVerificationCode === args[1]) {
							osuApi.getUser({ u: discordUser.osuUserId })
								.then(osuUser => {
									discordUser.verified = true;
									msg.channel.send(`Your connection to the osu! account \`${osuUser.name}\` is now verified.`);
								})
								.catch(err => {
									if (err.message === 'Not found') {
										msg.channel.send(`Could not find osu! account for id \`${discordUser.osuUserId}\`.`);
									}
									console.log(err);
								});
						} else {
							osuApi.getUser({ u: discordUser.osuUserId })
								.then(osuUser => {
									msg.channel.send(`The sent code \`${args[1]}\` is not the same code which was sent to \`${osuUser.name}\`.`);
								})
								.catch(err => {
									if (err.message === 'Not found') {
										msg.channel.send(`Could not find osu! account for id \`${discordUser.osuUserId}\`.`);
									}
									console.log(err);
								});
						}
					} else {
						msg.channel.send(`There is currently no osu! account linked to your discord account.\nPlease use \`${guildPrefix}osu-link <connect> <osu! username>\``);
					}
				} else {
					msg.channel.send(`There is currently no osu! account linked to your discord account.\nPlease use \`${guildPrefix}osu-link <connect> <osu! username>\``);
				}
			}
		} else {
			msg.channel.send(`Please specify what you want to do: \`${guildPrefix}osu-link <connect/current/disconnect/resendcode> [osu! username]\``);
		}
	},
};
