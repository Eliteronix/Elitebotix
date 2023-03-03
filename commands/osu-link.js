const { DBDiscordUsers } = require('../dbObjects');
const osu = require('node-osu');
const { getIDFromPotentialOsuLink, logDatabaseQueries, getAdditionalOsuInfo } = require('../utils');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'osu-link',
	description: 'Allows you to link your Discord Account to your osu! Account',
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 15,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-link')
		.setNameLocalizations({
			'de': 'osu-verbinden',
			'en-GB': 'osu-link',
			'en-US': 'osu-link',
		})
		.setDescription('Allows you to link your Discord Account to your osu! Account')
		.setDescriptionLocalizations({
			'de': 'Erlaubt es dir, dein Discord-Konto mit deinem osu!-Konto zu verbinden',
			'en-GB': 'Allows you to link your Discord Account to your osu! Account',
			'en-US': 'Allows you to link your Discord Account to your osu! Account',
		})
		.setDMPermission(true)
		.addSubcommand(subcommand =>
			subcommand
				.setName('connect')
				.setNameLocalizations({
					'de': 'verbinden',
					'en-GB': 'connect',
					'en-US': 'connect',
				})
				.setDescription('Connect your discord account to your osu! account')
				.setDescriptionLocalizations({
					'de': 'Verbinde dein Discord-Konto mit deinem osu!-Konto',
					'en-GB': 'Connect your discord account to your osu! account',
					'en-US': 'Connect your discord account to your osu! account',
				})
				.addStringOption(option =>
					option
						.setName('username')
						.setNameLocalizations({
							'de': 'nutzername',
							'en-GB': 'username',
							'en-US': 'username',
						})
						.setDescription('Your osu! username or alternatively id')
						.setDescriptionLocalizations({
							'de': 'Dein osu!-Nutzername oder alternativ deine ID',
							'en-GB': 'Your osu! username or alternatively id',
							'en-US': 'Your osu! username or alternatively id',
						})
						.setRequired(true)
				)
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('current')
				.setNameLocalizations({
					'de': 'aktuell',
					'en-GB': 'current',
					'en-US': 'current',
				})
				.setDescription('Get information on your current connection to an osu! account')
				.setDescriptionLocalizations({
					'de': 'Informationen über deine aktuelle Verbindung zu einem osu!-Konto',
					'en-GB': 'Get information on your current connection to an osu! account',
					'en-US': 'Get information on your current connection to an osu! account',
				})
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('disconnect')
				.setNameLocalizations({
					'de': 'trennen',
					'en-GB': 'disconnect',
					'en-US': 'disconnect',
				})
				.setDescription('Disconnect your discord account from your osu! account')
				.setDescriptionLocalizations({
					'de': 'Trenne dein Discord-Konto von deinem osu!-Konto',
					'en-GB': 'Disconnect your discord account from your osu! account',
					'en-US': 'Disconnect your discord account from your osu! account',
				})
		)
		.addSubcommand(subcommand =>
			subcommand
				.setName('verify')
				.setNameLocalizations({
					'de': 'verifizieren',
					'en-GB': 'verify',
					'en-US': 'verify',
				})
				.setDescription('Resend the verification code ingame or confirm your verification')
				.setDescriptionLocalizations({
					'de': 'Sende den Verifizierungscode erneut im Spiel oder bestätige deine Verifizierung',
					'en-GB': 'Resend the verification code ingame or confirm your verification',
					'en-US': 'Resend the verification code ingame or confirm your verification',
				})
				.addStringOption(option =>
					option
						.setName('code')
						.setNameLocalizations({
							'de': 'code',
							'en-GB': 'code',
							'en-US': 'code',
						})
						.setDescription('The verification code sent to you in osu! DMs')
						.setDescriptionLocalizations({
							'de': 'Der Verifizierungscode, der dir in osu!-DMs gesendet wurde',
							'en-GB': 'The verification code sent to you in osu! DMs',
							'en-US': 'The verification code sent to you in osu! DMs',
						})
						.setRequired(false)
				)
		),
	async execute(msg, args, interaction, additionalObjects) {
		//TODO: Refactor this mess
		if (interaction.options._hoistedOptions[0]) {
			args = [interaction.options.getSubcommand(), interaction.options._hoistedOptions[0].value];
		} else {
			args = [interaction.options.getSubcommand()];
		}

		try {
			await interaction.deferReply({ ephemeral: true });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			const timestamps = interaction.client.cooldowns.get(this.name);
			timestamps.delete(interaction.user.id);
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
		return interaction.editReply(`You already connected and verified your connection of your discord account to the osu! account \`${discordUser.osuName}\`.\nIf you want to disconnect it please use </osu-link disconnect:1064502370710605836>.`);
	}

	if (args[0]) {
		if (args[1]) {
			args.shift();
			for (let i = 0; i < args.length; i++) {
				args[i] = args[i].replace(/`/g, '');
			}

			return interaction.editReply(`You provided multiple arguments (\`${args.join('`, `')}\`). If your name has spaces please replace them with an \`_\` like this: \`${args.join('_')}\`.`);
		}

		// eslint-disable-next-line no-undef
		process.send('osu!API');
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

					return interaction.editReply(`There is already a discord account linked and verified for \`${args[0].replace(/`/g, '')}\`. If this is your osu! account send \`!unlink\` to \`Elitebotix\` ingame.`);
				}

				if (discordUser) {
					let verificationCode = Math.random().toString(36).substring(8);

					while (verificationCode.includes('0') || verificationCode.includes('o') || verificationCode.includes('O')) {
						verificationCode = Math.random().toString(36).substring(8);
					}

					//Remove duplicate discord user if existing and not the same record
					logDatabaseQueries(4, 'commands/osu-link.js DBDiscordUsers 3');
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

					let additionalInfo = await getAdditionalOsuInfo(osuUser.id, interaction.client);
					discordUser.badges = additionalInfo.tournamentBadges.length;

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

					let additionalInfo = await getAdditionalOsuInfo(osuUser.id, interaction.client);

					logDatabaseQueries(4, 'commands/osu-link.js DBDiscordUsers 4');
					let existingDiscordUser = await DBDiscordUsers.findOne({
						where: { osuUserId: osuUser.id },
					});

					//overwrite duplicate discord user if existing else create new
					if (existingDiscordUser) {
						existingDiscordUser.userId = interaction.user.id;
						existingDiscordUser.osuVerificationCode = verificationCode;
						existingDiscordUser.osuName = osuUser.name;
						existingDiscordUser.osuBadges = additionalInfo.tournamentBadges.length;
						existingDiscordUser.osuPP = osuUser.pp.raw;
						existingDiscordUser.osuRank = osuUser.pp.rank;
						existingDiscordUser.save();
					} else {
						logDatabaseQueries(4, 'commands/osu-link.js DBDiscordUsers create');
						DBDiscordUsers.create({ userId: interaction.user.id, osuUserId: osuUser.id, osuVerificationCode: verificationCode, osuName: osuUser.name, osuBadges: additionalInfo.tournamentBadges.length, osuPP: osuUser.pp.raw, osuRank: osuUser.pp.rank });
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
		// eslint-disable-next-line no-undef
		process.send('osu!API');
		osuApi.getUser({ u: discordUser.osuUserId })
			.then(async (osuUser) => {
				let verified = 'No';

				if (discordUser.osuVerified) {
					verified = 'Yes';
				}

				discordUser.osuName = osuUser.name;
				discordUser.osuPP = osuUser.pp.raw;
				discordUser.osuRank = osuUser.pp.rank;

				let additionalInfo = await getAdditionalOsuInfo(osuUser.id, interaction.client);
				discordUser.badges = additionalInfo.tournamentBadges.length;

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

		return interaction.editReply('There is no longer an osu! account linked to your discord account.\nUse </osu-link connect:1064502370710605836> to link an osu! account to your discord account.');
	} else {
		linkAccountMessage(interaction);
	}
}

async function verify(args, interaction, additionalObjects, osuApi, bancho, discordUser) {
	if (!args[1]) {
		if (discordUser) {
			if (discordUser.osuVerified) {
				// eslint-disable-next-line no-undef
				process.send('osu!API');
				osuApi.getUser({ u: discordUser.osuUserId })
					.then(async (osuUser) => {
						discordUser.osuName = osuUser.name;
						discordUser.osuPP = osuUser.pp.raw;
						discordUser.osuRank = osuUser.pp.rank;

						let additionalInfo = await getAdditionalOsuInfo(osuUser.id, interaction.client);
						discordUser.badges = additionalInfo.tournamentBadges.length;

						discordUser.save();
						return interaction.editReply(`Your osu! account \`${osuUser.name}\` is already verified\nIf you need to connect a different account use </osu-link disconnect:1064502370710605836> first.`);
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
					// eslint-disable-next-line no-undef
					process.send('osu!API');
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

							let additionalInfo = await getAdditionalOsuInfo(osuUser.id, interaction.client);
							discordUser.badges = additionalInfo.tournamentBadges.length;

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
				// eslint-disable-next-line no-undef
				process.send('osu!API');
				osuApi.getUser({ u: discordUser.osuUserId })
					.then(async (osuUser) => {
						discordUser.osuVerified = true;
						discordUser.osuName = osuUser.name;
						discordUser.osuPP = osuUser.pp.raw;
						discordUser.osuRank = osuUser.pp.rank;

						let additionalInfo = await getAdditionalOsuInfo(osuUser.id, interaction.client);
						discordUser.badges = additionalInfo.tournamentBadges.length;

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
				// eslint-disable-next-line no-undef
				process.send('osu!API');
				osuApi.getUser({ u: discordUser.osuUserId })
					.then(async (osuUser) => {
						discordUser.osuName = osuUser.name;
						discordUser.osuPP = osuUser.pp.raw;
						discordUser.osuRank = osuUser.pp.rank;

						let additionalInfo = await getAdditionalOsuInfo(osuUser.id, interaction.client);
						discordUser.badges = additionalInfo.tournamentBadges.length;

						discordUser.save();
						return interaction.editReply(`The sent code \`${args[1].replace(/`/g, '')}\` is not the same code which was sent to \`${osuUser.name}\`.\nUse </osu-link verify:1064502370710605836> to resend the code.`);
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
	return interaction.editReply('There is currently no osu! account linked to your discord account.\nPlease use </osu-link connect:1064502370710605836>');
}
