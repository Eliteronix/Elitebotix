//Import Tables
const { DBGuilds, DBDiscordUsers } = require('../dbObjects');

//import the config variables from config.json
const { prefix } = require('../config.json');

//Require node-osu module
const osu = require('node-osu');

module.exports = {
	name: 'osu-link',
	aliases: ['osu-connect'],
	description: 'Allows you to link your Discord Account to your osu! Account',
	usage: '<connect/current/disconnect/resendcode> [osu! username]',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args) {

		//current / Disconnect / Resend //Check for existing users with that osu account //Add e!osu-verify <code>

		if (args[0] === 'connect') {

		} else if (args[0] === 'current') {

		} else if (args[0] === 'disconnect') {

		} else if (args[0] === 'resendcode') {

		} else {
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

			msg.channel.send(`Please specify what you want to do: \`${guildPrefix}osu-link <connect/current/disconnect/resendcode> [osu! username]\``);
		}



		const verificationCode = Math.random().toString(36).substring(2);

		console.log(verificationCode);


		//else
		//get discordUser from db
		const discordUser = await DBDiscordUsers.findOne({
			where: { userId: msg.author.id },
		});

		if (discordUser) {
			if (discordUser.osuUserId) {

			} else {

				discordUser.osuUserId = osuUser.id;
				discordUser.osuVerificationCode = verificationCode;
				discordUser.save();
			}
		} else {
			if (args[0]) {


				DBDiscordUsers.create({ userId: msg.author.id, osuUserId: osuUser.id, osuVerificationCode: verificationCode });
			} else {
				DBDiscordUsers.create({ userId: msg.author.id });
			}
		}

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		if (!args[0]) {//Get profile by author if no argument
			const userDisplayName = msg.guild.member(msg.author).displayName;
			osuApi.getUser({ u: userDisplayName })
				.then(user => {

				})
				.catch(err => {
					if (err.message === 'Not found') {
						msg.channel.send(`Could not find user "${userDisplayName}".`);
					}
					console.log(err);
				});
		} else {
			//Get profile by argument
			const userDisplayName = args[0];
			osuApi.getUser({ u: userDisplayName })
				.then(user => {

				})
				.catch(err => {
					if (err.message === 'Not found') {
						msg.channel.send(`Could not find user "${userDisplayName}".`);
					}
					console.log(err);
				});
		}
	},
};