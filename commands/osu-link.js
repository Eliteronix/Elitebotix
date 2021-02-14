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
	aliases: ['osu-connect', 'osu-account', 'osu-acc'],
	description: 'Allows you to link your Discord Account to your osu! Account',
	usage: '<connect/current/disconnect/verify> [username ("_" for " ")]',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//guildOnly: true,
	args: true,
	cooldown: 15,
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
			args.shift();
			connect(msg, args, osuApi, discordUser, guildPrefix);
		} else if (args[0] === 'current') {
			current(msg, osuApi, discordUser, guildPrefix);
		} else if (args[0] === 'disconnect') {
			disconnect(msg, args, guildPrefix);
		} else if (args[0] === 'verify') {
			verify(msg, args, osuApi, discordUser, guildPrefix);
		} else {
			connect(msg, args, osuApi, discordUser, guildPrefix);
		}
	},
};

async function connect(msg, args, osuApi, discordUser, guildPrefix) {
	if (args[0]) {
		if (args[1]) {
			args.shift();
			return msg.channel.send(`You provided multiple arguments (\`${args.join('`, `')}\`). If your name has spaces please replace them with an \`_\` like this: \`${args.join('_')}\`.`);
		}

		osuApi.getUser({ u: args[0] })
			.then(async (osuUser) => {
				//get discordUser from db
				const existingVerifiedDiscordUser = await DBDiscordUsers.findOne({
					where: { osuUserId: osuUser.id, osuVerified: true },
				});

				if (existingVerifiedDiscordUser) {
					return msg.channel.send(`There is already a discord account linked and verified for \`${args[0]}\``);
				}

				if (discordUser) {
					const processingMessage = await msg.channel.send('Processing...');
					const verificationCode = Math.random().toString(36).substring(8);

					discordUser.osuUserId = osuUser.id;
					discordUser.osuVerificationCode = verificationCode;
					discordUser.osuVerified = false;
					discordUser.osuPP = osuUser.pp.raw;
					discordUser.osuRank = osuUser.pp.rank;
					discordUser.save();

					await processingMessage.edit('Connecting to bancho...');
					// eslint-disable-next-line no-undef
					const bancho = new Banchojs.BanchoClient({ username: 'Eliteronix', password: process.env.OSUIRC });
					bancho.connect().then(async () => {
						await processingMessage.edit('Getting user...');
						const IRCUser = bancho.getUser(osuUser.name);
						await processingMessage.edit('Sending message...');
						IRCUser.sendMessage(`[Elitebotix]: The Discord account ${msg.author.username}#${msg.author.discriminator} has linked their account to this osu! account. If this was you please send 'e!osu-link verify ${verificationCode}' with the same user to Elitebotix on discord. If this was not you then don't worry, there won't be any consequences and you can just ignore this message.`);
						bancho.disconnect();
						processingMessage.edit(`A verification code has been sent to \`${osuUser.name}\` using osu! dms!`);
					}).catch(console.error);
				} else {
					const processingMessage = await msg.channel.send('Processing...');
					const verificationCode = Math.random().toString(36).substring(8);
					DBDiscordUsers.create({ userId: msg.author.id, osuUserId: osuUser.id, osuVerificationCode: verificationCode, osuPP: osuUser.pp.raw, osuRank: osuUser.pp.rank });

					await processingMessage.edit('Connecting to bancho...');
					// eslint-disable-next-line no-undef
					const bancho = new Banchojs.BanchoClient({ username: 'Eliteronix', password: process.env.OSUIRC });
					bancho.connect().then(async () => {
						await processingMessage.edit('Getting user...');
						const IRCUser = bancho.getUser(osuUser.name);
						await processingMessage.edit('Sending message...');
						IRCUser.sendMessage(`[Elitebotix]: The Discord account ${msg.author.username}#${msg.author.discriminator} has linked their account to this osu! account. If this was you please send 'e!osu-link verify ${verificationCode}' with the same user to Elitebotix on discord. If this was not you then don't worry, there won't be any consequences and you can just ignore this message.`);
						bancho.disconnect();
						processingMessage.edit(`A verification code has been sent to \`${osuUser.name}\` using osu! dms!`);
					}).catch(console.error);
				}
			})
			.catch(err => {
				if (err.message === 'Not found') {
					msg.channel.send(`Could not find osu! account \`${args[0]}\`.`);
				} else {
					console.log(err);
				}
			});
	} else {
		msg.channel.send(`Please specify to which osu! account you want to connect.\nUsage: \`${guildPrefix}osu-link connect <osu! username ("_" for " ")>\``);
	}
}

async function current(msg, osuApi, discordUser, guildPrefix) {
	if (discordUser && discordUser.osuUserId) {
		osuApi.getUser({ u: discordUser.osuUserId })
			.then(osuUser => {
				let verified = 'No';

				if (discordUser.osuVerified) {
					verified = 'Yes';
				}

				discordUser.osuPP = osuUser.pp.raw;
				discordUser.osuRank = osuUser.pp.rank;
				discordUser.save();

				msg.channel.send(`Currently linked osu! account: \`${osuUser.name}\`.\nVerified: \`${verified}\``);
			})
			.catch(err => {
				if (err.message === 'Not found') {
					msg.channel.send(`Could not find osu! account for id \`${discordUser.osuUserId}\`.`);
				} else {
					console.log(err);
				}
			});
	} else {
		linkAccountMessage(msg, guildPrefix);
	}
}

async function disconnect(msg, discordUser, guildPrefix) {
	if (discordUser && discordUser.osuUserId) {
		discordUser.osuUserId = '';
		discordUser.osuVerificationCode = '';
		discordUser.osuVerified = false;
		discordUser.osuPP = '';
		discordUser.osuRank = '';
		discordUser.save();

		msg.channel.send(`There is no longer an osu! account linked to your discord account.\nUse \`${guildPrefix}osu-link <connect> <osu! username ("_" for " ")>\` to link an osu! account to your discord account.`);
	} else {
		linkAccountMessage(msg, guildPrefix);
	}
}

async function verify(msg, args, osuApi, discordUser, guildPrefix) {
	if (!args[1]) {
		if (discordUser) {
			if (discordUser.osuVerified) {
				osuApi.getUser({ u: discordUser.osuUserId })
					.then(osuUser => {
						discordUser.osuPP = osuUser.pp.raw;
						discordUser.osuRank = osuUser.pp.rank;
						discordUser.save();
						msg.channel.send(`Your osu! account \`${osuUser.name}\` is already verified\nIf you need to connect a different account use \`${guildPrefix}osu-link <disconnect>\` first.`);
					})
					.catch(err => {
						if (err.message === 'Not found') {
							msg.channel.send(`Could not find osu! account for id \`${discordUser.osuUserId}\`.`);
						} else {
							console.log(err);
						}
					});
			} else {
				if (discordUser.osuUserId) {
					osuApi.getUser({ u: discordUser.osuUserId })
						.then(async (osuUser) => {
							const processingMessage = await msg.channel.send('Processing...');
							const verificationCode = Math.random().toString(36).substring(8);

							discordUser.osuVerificationCode = verificationCode;
							discordUser.osuPP = osuUser.pp.raw;
							discordUser.osuRank = osuUser.pp.rank;
							discordUser.save();

							await processingMessage.edit('Connecting to bancho...');
							// eslint-disable-next-line no-undef
							const bancho = new Banchojs.BanchoClient({ username: 'Eliteronix', password: process.env.OSUIRC });
							bancho.connect().then(async () => {
								await processingMessage.edit('Getting user...');
								const IRCUser = bancho.getUser(osuUser.name);
								await processingMessage.edit('Sending message...');
								IRCUser.sendMessage(`[Elitebotix]: The Discord account ${msg.author.username}#${msg.author.discriminator} has linked their account to this osu! account. If this was you please send 'e!osu-link verify ${verificationCode}' with the same user to Elitebotix on discord. If this was not you then don't worry, there won't be any consequences and you can just ignore this message.`);
								bancho.disconnect();
								processingMessage.edit(`A verification code has been sent to ${osuUser.name} using osu! dms!`);
							}).catch(console.error);
						})
						.catch(err => {
							if (err.message === 'Not found') {
								msg.channel.send(`Could not find osu! account for id \`${discordUser.osuUserId}\`.`);
							} else {
								console.log(err);
							}
						});
				} else {
					linkAccountMessage(msg, guildPrefix);
				}
			}
		} else {
			linkAccountMessage(msg, guildPrefix);
		}
	} else {
		if (discordUser && discordUser.osuUserId) {
			if (discordUser.osuVerificationCode === args[1]) {
				osuApi.getUser({ u: discordUser.osuUserId })
					.then(osuUser => {
						discordUser.osuVerified = true;
						discordUser.osuPP = osuUser.pp.raw;
						discordUser.osuRank = osuUser.pp.rank;
						discordUser.save();
						msg.channel.send(`Your connection to the osu! account \`${osuUser.name}\` is now verified.`);
					})
					.catch(err => {
						if (err.message === 'Not found') {
							msg.channel.send(`Could not find osu! account for id \`${discordUser.osuUserId}\`.`);
						} else {
							console.log(err);
						}
					});
			} else {
				osuApi.getUser({ u: discordUser.osuUserId })
					.then(osuUser => {
						discordUser.osuPP = osuUser.pp.raw;
						discordUser.osuRank = osuUser.pp.rank;
						discordUser.save();
						msg.channel.send(`The sent code \`${args[1]}\` is not the same code which was sent to \`${osuUser.name}\`.\nUse \`${guildPrefix}osu-link verify\` to resend the code.`);
					})
					.catch(err => {
						if (err.message === 'Not found') {
							msg.channel.send(`Could not find osu! account for id \`${discordUser.osuUserId}\`.`);
						} else {
							console.log(err);
						}
					});
			}
		} else {
			linkAccountMessage(msg, guildPrefix);
		}
	}
}

function linkAccountMessage(msg, guildPrefix){
	msg.channel.send(`There is currently no osu! account linked to your discord account.\nPlease use \`${guildPrefix}osu-link <connect> <username ("_" for " ")>\``);
}