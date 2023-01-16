const { DBDiscordUsers } = require('../dbObjects');
const osu = require('node-osu');
const { getOsuBadgeNumberById, getIDFromPotentialOsuLink, logDatabaseQueries } = require('../utils');
const { Permissions } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'osu-link',
	description: 'Allows you to link your Discord Account to your osu! Account',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: Permissions.FLAGS.SEND_MESSAGES,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 15,
	tags: 'osu',
	async execute(msg, args, interaction, additionalObjects) {
		//TODO: Refactor this mess
		if (interaction.options._hoistedOptions[0]) {
			args = [interaction.options._subcommand, interaction.options._hoistedOptions[0].value];
		} else {
			args = [interaction.options._subcommand];
		}

		try {
			await interaction.deferReply({ ephemeral: true });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
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
			where: { userId: interaction.user.id },
		});

		//Check for people that already have their discord account linked to that osu! account
		if (args[0] === 'connect') {
			args.shift();
			connect(args, interaction, additionalObjects, osuApi, bancho, discordUser);
		} else if (args[0] === 'current') {
			current(osuApi, interaction, additionalObjects, discordUser);
		} else if (args[0] === 'disconnect') {
			disconnect(interaction, additionalObjects, discordUser);
		} else if (args[0] === 'verify') {
			verify(args, interaction, additionalObjects, osuApi, bancho, discordUser);
		} else {
			connect(args, interaction, additionalObjects, osuApi, bancho, discordUser);
		}
	},
};

async function connect(args, interaction, additionalObjects, osuApi, bancho, discordUser) {
	if (discordUser && discordUser.osuVerified) {
		return interaction.editReply(`You already connected and verified your connection of your discord account to the osu! account \`${discordUser.osuName}\`.\nIf you want to disconnect it please use </osu-link disconnect:1023849632599658496>.`);
	}

	if (args[0]) {
		if (args[1]) {
			args.shift();
			for (let i = 0; i < args.length; i++) {
				args[i] = args[i].replace(/`/g, '');
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
					if (existingVerifiedDiscordUser.userId === interaction.user.id) {

						return interaction.editReply(`You already connected and verified your connection of your discord account to the osu! account \`${args[0].replace(/`/g, '')}\``);
					}

					return interaction.editReply(`There is already a discord account linked and verified for \`${args[0].replace(/`/g, '')}\``);
				}

				if (discordUser) {
					let verificationCode = Math.random().toString(36).substring(8);

					while (verificationCode.includes('0') || verificationCode.includes('o') || verificationCode.includes('O')) {
						verificationCode = Math.random().toString(36).substring(8);
					}

					//Remove duplicate discord user if existing and not the same record
					let existingDiscordUser = await DBDiscordUsers.findOne({
						where: { osuUserId: osuUser.id },
					});

					if (existingDiscordUser && existingDiscordUser.id !== discordUser.id) {
						existingDiscordUser.destroy();
					}

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
					IRCUser.sendMessage(`The Discord account ${interaction.user.username}#${interaction.user.discriminator} has linked their account to this osu! account. If this was you please send '/osu-link verify code:${verificationCode}' with the same user to Elitebotix on discord. If this was not you then don't worry, there won't be any consequences and you can just ignore this message.`);
					interaction.editReply(`A verification code has been sent to \`${osuUser.name}\` using osu! dms!\nIf you did not receive a message then open your game client and try again.\nIf that didn't work make sure to have messages by non-friends enabled.`);
				} else {
					let verificationCode = Math.random().toString(36).substring(8);

					while (verificationCode.includes('0') || verificationCode.includes('o') || verificationCode.includes('O')) {
						verificationCode = Math.random().toString(36).substring(8);
					}

					let badges = await getOsuBadgeNumberById(osuUser.id);

					let existingDiscordUser = await DBDiscordUsers.findOne({
						where: { osuUserId: osuUser.id },
					});

					//overwrite duplicate discord user if existing else create new
					if (existingDiscordUser) {
						existingDiscordUser.userId = interaction.user.id;
						existingDiscordUser.osuVerificationCode = verificationCode;
						existingDiscordUser.osuName = osuUser.name;
						existingDiscordUser.osuBadges = badges;
						existingDiscordUser.osuPP = osuUser.pp.raw;
						existingDiscordUser.osuRank = osuUser.pp.rank;
						existingDiscordUser.save();
					} else {
						DBDiscordUsers.create({ userId: interaction.user.id, osuUserId: osuUser.id, osuVerificationCode: verificationCode, osuName: osuUser.name, osuBadges: badges, osuPP: osuUser.pp.raw, osuRank: osuUser.pp.rank });
					}

					try {
						await bancho.connect();
					} catch (error) {
						if (!error.message === 'Already connected/connecting') {
							throw (error);
						}
					}

					const IRCUser = bancho.getUser(osuUser.name);
					IRCUser.sendMessage(`The Discord account ${interaction.user.username}#${interaction.user.discriminator} has linked their account to this osu! account. If this was you please send '/osu-link verify code:${verificationCode}' with the same user to Elitebotix on discord. If this was not you then don't worry, there won't be any consequences and you can just ignore this message.`);

					interaction.editReply(`A verification code has been sent to \`${osuUser.name}\` using osu! dms!\nIf you did not receive a message then open your game client and try again.\nIf that didn't work make sure to have messages by non-friends enabled.`);
				}
			})
			.catch(err => {
				if (err.message === 'Not found') {
					return interaction.editReply(`Could not find an osu! account \`${args[0].replace(/`/g, '')}\`.`);
				} else {
					console.error(err);
				}
			});
	}
}

async function current(osuApi, interaction, additionalObjects, discordUser) {
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

				return interaction.editReply(`Currently linked osu! account: \`${osuUser.name}\`.\nVerified: \`${verified}\``);
			})
			.catch(err => {
				if (err.message === 'Not found') {
					return interaction.editReply(`Could not find an osu! account for id \`${discordUser.osuUserId}\`.`);
				} else {
					console.error(err);
				}
			});
	} else {
		linkAccountMessage(interaction);
	}
}

async function disconnect(interaction, additionalObjects, discordUser) {
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

		return interaction.editReply('There is no longer an osu! account linked to your discord account.\nUse </osu-link connect:1023849632599658496> to link an osu! account to your discord account.');
	} else {
		linkAccountMessage(interaction);
	}
}

async function verify(args, interaction, additionalObjects, osuApi, bancho, discordUser) {
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
						return interaction.editReply(`Your osu! account \`${osuUser.name}\` is already verified\nIf you need to connect a different account use </osu-link disconnect:1023849632599658496> first.`);
					})
					.catch(err => {
						if (err.message === 'Not found') {
							return interaction.editReply(`Could not find an osu! account for id \`${discordUser.osuUserId}\`.`);
						} else {
							console.error(err);
						}
					});
			} else {
				if (discordUser.osuUserId) {
					osuApi.getUser({ u: discordUser.osuUserId })
						.then(async (osuUser) => {
							let verificationCode = Math.random().toString(36).substring(8);

							while (verificationCode.includes('0') || verificationCode.includes('o') || verificationCode.includes('O')) {
								verificationCode = Math.random().toString(36).substring(8);
							}

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
							IRCUser.sendMessage(`The Discord account ${interaction.user.username}#${interaction.user.discriminator} has linked their account to this osu! account. If this was you please send '/osu-link verify code:${verificationCode}' with the same user to Elitebotix on discord. If this was not you then don't worry, there won't be any consequences and you can just ignore this message.`);
							interaction.editReply(`A verification code has been sent to \`${osuUser.name}\` using osu! dms!\nIf you did not receive a message then open your game client and try again.\nIf that didn't work make sure to have messages by non-friends enabled.`);
						})
						.catch(err => {
							if (err.message === 'Not found') {
								return interaction.editReply(`Could not find an osu! account for id \`${discordUser.osuUserId}\`.`);
							} else {
								console.error(err);
							}
						});
				} else {
					linkAccountMessage(interaction);
				}
			}
		} else {
			linkAccountMessage(interaction);
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
						return interaction.editReply(`Your connection to the osu! account \`${osuUser.name}\` is now verified.`);
					})
					.catch(err => {
						if (err.message === 'Not found') {
							return interaction.editReply(`Could not find an osu! account for id \`${discordUser.osuUserId}\`.`);
						} else {
							console.error(err);
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
						return interaction.editReply(`The sent code \`${args[1].replace(/`/g, '')}\` is not the same code which was sent to \`${osuUser.name}\`.\nUse </osu-link verify:1023849632599658496> to resend the code.`);
					})
					.catch(err => {
						if (err.message === 'Not found') {
							return interaction.editReply(`Could not find an osu! account for id \`${discordUser.osuUserId}\`.`);
						} else {
							console.error(err);
						}
					});
			}
		} else {
			linkAccountMessage(interaction);
		}
	}
}

function linkAccountMessage(interaction) {
	return interaction.editReply('There is currently no osu! account linked to your discord account.\nPlease use </osu-link connect:1023849632599658496>');
}
