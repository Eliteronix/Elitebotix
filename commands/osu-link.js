const { DBDiscordUsers } = require('../dbObjects');
const osu = require('node-osu');
const { getGuildPrefix, getOsuBadgeNumberById, getIDFromPotentialOsuLink, populateMsgFromInteraction, logDatabaseQueries } = require('../utils');
const { Permissions } = require('discord.js');

module.exports = {
	name: 'osu-link',
	aliases: ['osu-connect', 'osu-account', 'osu-acc'],
	description: 'Allows you to link your Discord Account to your osu! Account',
	usage: '<connect/current/disconnect/verify> [username ("_" for " ")]',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: Permissions.FLAGS.SEND_MESSAGES,
	botPermissionsTranslated: 'Send Messages',
	//guildOnly: true,
	args: true,
	cooldown: 15,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args, interaction, additionalObjects) {
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			if (interaction.options._hoistedOptions[0]) {
				args = [interaction.options._subcommand, interaction.options._hoistedOptions[0].value];
			} else {
				args = [interaction.options._subcommand];
			}

			await interaction.deferReply();
		}

		const bancho = additionalObjects[1];

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		//get discordUser from db
		logDatabaseQueries(4, 'commands/osu-link.js DBDiscordUsers 1');
		const discordUser = await DBDiscordUsers.findOne({
			where: { userId: msg.author.id },
		});

		let guildPrefix = await getGuildPrefix(msg);

		//Check for people that already have their discord account linked to that osu! account

		if (args[0] === 'connect') {
			args.shift();
			connect(msg, args, interaction, additionalObjects, osuApi, bancho, discordUser, guildPrefix);
		} else if (args[0] === 'current') {
			current(msg, osuApi, interaction, additionalObjects, discordUser, guildPrefix);
		} else if (args[0] === 'disconnect') {
			disconnect(msg, interaction, additionalObjects, discordUser, guildPrefix);
		} else if (args[0] === 'verify') {
			verify(msg, args, interaction, additionalObjects, osuApi, bancho, discordUser, guildPrefix);
		} else {
			connect(msg, args, interaction, additionalObjects, osuApi, bancho, discordUser, guildPrefix);
		}
	},
};

async function connect(msg, args, interaction, additionalObjects, osuApi, bancho, discordUser, guildPrefix) {
	if (discordUser.osuVerified) {
		if (msg.id) {
			return msg.reply(`You already connected and verified your connection of your discord account to the osu! account \`${discordUser.osuName}\`.\nIf you want to disconnect it please use \`${guildPrefix}osu-link disconnect\`.`);
		}
		return interaction.editReply(`You already connected and verified your connection of your discord account to the osu! account \`${discordUser.osuName}\`.\nIf you want to disconnect it please use \`${guildPrefix}osu-link disconnect\`.`);
	}

	if (args[0]) {
		if (args[1]) {
			args.shift();
			for (let i = 0; i < args.length; i++) {
				args[i] = args[i].replace(/`/g, '');
			}
			if (msg.id) {
				return msg.reply(`You provided multiple arguments (\`${args.join('`, `')}\`). If your name has spaces please replace them with an \`_\` like this: \`${args.join('_')}\`.`);
			}

			return interaction.editReply(`You provided multiple arguments (\`${args.join('`, `')}\`). If your name has spaces please replace them with an \`_\` like this: \`${args.join('_')}\`.`);
		}

		osuApi.getUser({ u: getIDFromPotentialOsuLink(args[0]) })
			.then(async (osuUser) => {
				//get discordUser from db
				logDatabaseQueries(4, 'commands/osu-link.js DBDiscordUsers 2');
				const existingVerifiedDiscordUser = await DBDiscordUsers.findOne({
					where: { osuUserId: osuUser.id, osuVerified: true },
				});

				if (existingVerifiedDiscordUser) {
					if (existingVerifiedDiscordUser.userId === msg.author.id) {
						if (msg.id) {
							return msg.reply(`You already connected and verified your connection of your discord account to the osu! account \`${args[0].replace(/`/g, '')}\``);
						}

						return interaction.editReply(`You already connected and verified your connection of your discord account to the osu! account \`${args[0].replace(/`/g, '')}\``);
					}
					if (msg.id) {
						return msg.reply(`There is already a discord account linked and verified for \`${args[0].replace(/`/g, '')}\``);
					}

					return interaction.editReply(`There is already a discord account linked and verified for \`${args[0].replace(/`/g, '')}\``);
				}

				if (discordUser) {
					let processingMessage = null;
					if (msg.id) {
						processingMessage = await msg.reply('Processing...');
					} else {
						await interaction.editReply('Processing...');
					}
					const verificationCode = Math.random().toString(36).substring(8);

					discordUser.osuUserId = osuUser.id;
					discordUser.osuVerificationCode = verificationCode;
					discordUser.osuVerified = false;
					discordUser.osuName = osuUser.name;
					discordUser.osuPP = osuUser.pp.raw;
					discordUser.osuRank = osuUser.pp.rank;
					discordUser.badges = await getOsuBadgeNumberById(discordUser.osuUserId);
					discordUser.save();

					try {
						await bancho.connect();
					} catch (error) {
						if (!error.message === 'Already connected/connecting') {
							throw (error);
						}
					}

					const IRCUser = bancho.getUser(osuUser.name);
					IRCUser.sendMessage(`[Elitebotix]: The Discord account ${msg.author.username}#${msg.author.discriminator} has linked their account to this osu! account. If this was you please send 'e!osu-link verify ${verificationCode}' with the same user to Elitebotix on discord. If this was not you then don't worry, there won't be any consequences and you can just ignore this message.`);
					if (msg.id) {
						processingMessage.edit(`A verification code has been sent to \`${osuUser.name}\` using osu! dms!\nIf you did not receive a message then open your game client and try again.\nIf that didn't work make sure to have messages by non-friends enabled.`);
					} else {
						interaction.editReply(`A verification code has been sent to \`${osuUser.name}\` using osu! dms!\nIf you did not receive a message then open your game client and try again.\nIf that didn't work make sure to have messages by non-friends enabled.`);
					}
				} else {
					let processingMessage = null;
					if (msg.id) {
						processingMessage = await msg.reply('Processing...');
					} else {
						await interaction.editReply('Processing...');
					}
					const verificationCode = Math.random().toString(36).substring(8);
					let badges = await getOsuBadgeNumberById(osuUser.id);
					DBDiscordUsers.create({ userId: msg.author.id, osuUserId: osuUser.id, osuVerificationCode: verificationCode, osuName: osuUser.name, osuBadges: badges, osuPP: osuUser.pp.raw, osuRank: osuUser.pp.rank });

					try {
						await bancho.connect();
					} catch (error) {
						if (!error.message === 'Already connected/connecting') {
							throw (error);
						}
					}

					const IRCUser = bancho.getUser(osuUser.name);
					IRCUser.sendMessage(`[Elitebotix]: The Discord account ${msg.author.username}#${msg.author.discriminator} has linked their account to this osu! account. If this was you please send 'e!osu-link verify ${verificationCode}' with the same user to Elitebotix on discord. If this was not you then don't worry, there won't be any consequences and you can just ignore this message.`);
					if (msg.id) {
						processingMessage.edit(`A verification code has been sent to \`${osuUser.name}\` using osu! dms!\nIf you did not receive a message then open your game client and try again.\nIf that didn't work make sure to have messages by non-friends enabled.`);
					} else {
						interaction.editReply(`A verification code has been sent to \`${osuUser.name}\` using osu! dms!\nIf you did not receive a message then open your game client and try again.\nIf that didn't work make sure to have messages by non-friends enabled.`);
					}
				}
			})
			.catch(err => {
				if (err.message === 'Not found') {
					if (msg.id) {
						return msg.reply(`Could not find an osu! account \`${args[0].replace(/`/g, '')}\`.`);
					} else {
						return interaction.editReply(`Could not find an osu! account \`${args[0].replace(/`/g, '')}\`.`);
					}
				} else {
					console.log(err);
				}
			});
	} else {
		if (msg.id) {
			return msg.reply(`Please specify to which osu! account you want to connect.\nUsage: \`${guildPrefix}osu-link connect <osu! username ("_" for " ")>\``);
		} else {
			return interaction.editReply('Please specify to which osu! account you want to connect.\nUsage: `/osu-link connect <osu! username ("_" for " ")>`');
		}
	}
}

async function current(msg, osuApi, interaction, additionalObjects, discordUser, guildPrefix) {
	if (discordUser && discordUser.osuUserId) {
		osuApi.getUser({ u: discordUser.osuUserId })
			.then(async (osuUser) => {
				let verified = 'No';

				if (discordUser.osuVerified) {
					verified = 'Yes';
				}

				discordUser.osuName = osuUser.name;
				discordUser.osuPP = osuUser.pp.raw;
				discordUser.osuRank = osuUser.pp.rank;
				discordUser.badges = await getOsuBadgeNumberById(discordUser.osuUserId);
				discordUser.save();

				if (msg.id) {
					return msg.reply(`Currently linked osu! account: \`${osuUser.name}\`.\nVerified: \`${verified}\``);
				} else {
					return interaction.editReply(`Currently linked osu! account: \`${osuUser.name}\`.\nVerified: \`${verified}\``);
				}
			})
			.catch(err => {
				if (err.message === 'Not found') {
					if (msg.id) {
						return msg.reply(`Could not find an osu! account for id \`${discordUser.osuUserId}\`.`);
					} else {
						return interaction.editReply(`Could not find an osu! account for id \`${discordUser.osuUserId}\`.`);
					}
				} else {
					console.log(err);
				}
			});
	} else {
		linkAccountMessage(msg, interaction, additionalObjects, guildPrefix);
	}
}

async function disconnect(msg, interaction, additionalObjects, discordUser, guildPrefix) {
	if (discordUser && discordUser.osuUserId) {
		discordUser.osuUserId = null;
		discordUser.osuVerificationCode = null;
		discordUser.osuVerified = false;
		discordUser.osuName = null;
		discordUser.osuBadges = 0;
		discordUser.osuPP = null;
		discordUser.osuRank = null;
		discordUser.taikoPP = null;
		discordUser.taikoRank = null;
		discordUser.catchPP = null;
		discordUser.catchRank = null;
		discordUser.maniaPP = null;
		discordUser.maniaRank = null;
		discordUser.save();

		if (msg.id) {
			return msg.reply(`There is no longer an osu! account linked to your discord account.\nUse \`${guildPrefix}osu-link <connect> <osu! username ("_" for " ")>\` to link an osu! account to your discord account.`);
		} else {
			return interaction.editReply('There is no longer an osu! account linked to your discord account.\nUse `/osu-link connect <osu! username ("_" for " ")>` to link an osu! account to your discord account.');
		}
	} else {
		linkAccountMessage(msg, interaction, additionalObjects, guildPrefix);
	}
}

async function verify(msg, args, interaction, additionalObjects, osuApi, bancho, discordUser, guildPrefix) {
	if (!args[1]) {
		if (discordUser) {
			if (discordUser.osuVerified) {
				osuApi.getUser({ u: discordUser.osuUserId })
					.then(async (osuUser) => {
						discordUser.osuName = osuUser.name;
						discordUser.osuPP = osuUser.pp.raw;
						discordUser.osuRank = osuUser.pp.rank;
						discordUser.badges = await getOsuBadgeNumberById(discordUser.osuUserId);
						discordUser.save();
						if (msg.id) {
							return msg.reply(`Your osu! account \`${osuUser.name}\` is already verified\nIf you need to connect a different account use \`${guildPrefix}osu-link <disconnect>\` first.`);
						} else {
							return interaction.editReply(`Your osu! account \`${osuUser.name}\` is already verified\nIf you need to connect a different account use \`/osu-link disconnect\` first.`);
						}
					})
					.catch(err => {
						if (err.message === 'Not found') {
							if (msg.id) {
								return msg.reply(`Could not find an osu! account for id \`${discordUser.osuUserId}\`.`);
							} else {
								return interaction.editReply(`Could not find an osu! account for id \`${discordUser.osuUserId}\`.`);
							}
						} else {
							console.log(err);
						}
					});
			} else {
				if (discordUser.osuUserId) {
					osuApi.getUser({ u: discordUser.osuUserId })
						.then(async (osuUser) => {
							let processingMessage = null;
							if (msg.id) {
								processingMessage = await msg.reply('Processing...');
							} else {
								await interaction.editReply('Processing...');
							}
							const verificationCode = Math.random().toString(36).substring(8);

							discordUser.osuVerificationCode = verificationCode;
							discordUser.osuName = osuUser.name;
							discordUser.osuPP = osuUser.pp.raw;
							discordUser.osuRank = osuUser.pp.rank;
							discordUser.badges = await getOsuBadgeNumberById(discordUser.osuUserId);
							discordUser.save();

							try {
								await bancho.connect();
							} catch (error) {
								if (!error.message === 'Already connected/connecting') {
									throw (error);
								}
							}

							const IRCUser = bancho.getUser(osuUser.name);
							IRCUser.sendMessage(`[Elitebotix]: The Discord account ${msg.author.username}#${msg.author.discriminator} has linked their account to this osu! account. If this was you please send 'e!osu-link verify ${verificationCode}' with the same user to Elitebotix on discord. If this was not you then don't worry, there won't be any consequences and you can just ignore this message.`);
							if (msg.id) {
								processingMessage.edit(`A verification code has been sent to \`${osuUser.name}\` using osu! dms!\nIf you did not receive a message then open your game client and try again.\nIf that didn't work make sure to have messages by non-friends enabled.`);
							} else {
								interaction.editReply(`A verification code has been sent to \`${osuUser.name}\` using osu! dms!\nIf you did not receive a message then open your game client and try again.\nIf that didn't work make sure to have messages by non-friends enabled.`);
							}
						})
						.catch(err => {
							if (err.message === 'Not found') {
								if (msg.id) {
									return msg.reply(`Could not find an osu! account for id \`${discordUser.osuUserId}\`.`);
								} else {
									return interaction.editReply(`Could not find an osu! account for id \`${discordUser.osuUserId}\`.`);
								}
							} else {
								console.log(err);
							}
						});
				} else {
					linkAccountMessage(msg, interaction, additionalObjects, guildPrefix);
				}
			}
		} else {
			linkAccountMessage(msg, interaction, additionalObjects, guildPrefix);
		}
	} else {
		if (discordUser && discordUser.osuUserId) {
			if (discordUser.osuVerificationCode === args[1]) {
				osuApi.getUser({ u: discordUser.osuUserId })
					.then(async (osuUser) => {
						discordUser.osuVerified = true;
						discordUser.osuName = osuUser.name;
						discordUser.osuPP = osuUser.pp.raw;
						discordUser.osuRank = osuUser.pp.rank;
						discordUser.badges = await getOsuBadgeNumberById(discordUser.osuUserId);
						discordUser.save();
						if (msg.id) {
							return msg.reply(`Your connection to the osu! account \`${osuUser.name}\` is now verified.`);
						} else {
							return interaction.editReply(`Your connection to the osu! account \`${osuUser.name}\` is now verified.`);
						}
					})
					.catch(err => {
						if (err.message === 'Not found') {
							if (msg.id) {
								return msg.reply(`Could not find an osu! account for id \`${discordUser.osuUserId}\`.`);
							} else {
								return interaction.editReply(`Could not find an osu! account for id \`${discordUser.osuUserId}\`.`);
							}
						} else {
							console.log(err);
						}
					});
			} else {
				osuApi.getUser({ u: discordUser.osuUserId })
					.then(async (osuUser) => {
						discordUser.osuName = osuUser.name;
						discordUser.osuPP = osuUser.pp.raw;
						discordUser.osuRank = osuUser.pp.rank;
						discordUser.badges = await getOsuBadgeNumberById(discordUser.osuUserId);
						discordUser.save();
						if (msg.id) {
							return msg.reply(`The sent code \`${args[1].replace(/`/g, '')}\` is not the same code which was sent to \`${osuUser.name}\`.\nUse \`${guildPrefix}osu-link verify\` to resend the code.`);
						} else {
							return interaction.editReply(`The sent code \`${args[1].replace(/`/g, '')}\` is not the same code which was sent to \`${osuUser.name}\`.\nUse \`/osu-link verify\` to resend the code.`);
						}
					})
					.catch(err => {
						if (err.message === 'Not found') {
							if (msg.id) {
								return msg.reply(`Could not find an osu! account for id \`${discordUser.osuUserId}\`.`);
							} else {
								return interaction.editReply(`Could not find an osu! account for id \`${discordUser.osuUserId}\`.`);
							}
						} else {
							console.log(err);
						}
					});
			}
		} else {
			linkAccountMessage(msg, interaction, additionalObjects, guildPrefix);
		}
	}
}

function linkAccountMessage(msg, interaction, additionalObjects, guildPrefix) {
	if (msg.id) {
		return msg.reply(`There is currently no osu! account linked to your discord account.\nPlease use \`${guildPrefix}osu-link <connect> <username ("_" for " ")>\``);
	} else {
		return interaction.editReply('There is currently no osu! account linked to your discord account.\nPlease use `/osu-link connect <username ("_" for " ")>`');
	}
}
