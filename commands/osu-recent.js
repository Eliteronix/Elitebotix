//Import Tables
const { DBDiscordUsers } = require('../dbObjects');

//Require discord.js module
const Discord = require('discord.js');

//Require node-osu module
const osu = require('node-osu');

module.exports = {
	name: 'osu-recent',
	aliases: ['ors', 'o-rs'],
	description: 'Sends an info card about the last score of the specified player',
	usage: '[username] [username] ... (Use "_" instead of spaces)',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'osu',
	prefixCommand: true,
	async execute(msg, args) {
		if (!args[0]) {//Get profile by author if no argument
			//get discordUser from db
			const discordUser = await DBDiscordUsers.findOne({
				where: { userId: msg.author.id },
			});

			if (discordUser && discordUser.osuUserId) {
				getScore(msg, discordUser.osuUserId);
			} else {
				const userDisplayName = msg.guild.member(msg.author).displayName;
				getScore(msg, userDisplayName);
			}
		} else {
			//Get profiles by arguments
			let i;
			for (i = 0; i < args.length; i++) {
				if (args[i].startsWith('<@!') && args[i].endsWith('>')) {
					const discordUser = await DBDiscordUsers.findOne({
						where: { userId: args[i].replace('<@!','').replace('>','') },
					});

					if (discordUser && discordUser.osuUserId) {
						getScore(msg, discordUser.osuUserId);
					} else {
						msg.channel.send(`${args[i]} doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using \`e!osu-link <username>\`.`);
						getScore(msg, args[i]);
					}
				} else {
					getScore(msg, args[i]);
				}
			}
		}
	},
};

async function getScore(msg, username) {
	// eslint-disable-next-line no-undef
	const osuApi = new osu.Api(process.env.OSUTOKENV1, {
		// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
		notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
		completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
		parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
	});
	osuApi.getUserRecent({ u: username })
		.then(scores => {
			if (!(scores[0])) {
				return msg.channel.send(`Couldn't find any recent scores for ${username}`);
			}
			osuApi.getBeatmaps({ b: scores[0].beatmapId })
				.then(async (beatmaps) => {
					const user = await osuApi.getUser({ u: username });

					let linkMode;
					if (beatmaps[0].mode === 'Standard') {
						linkMode = 'osu';
					} else if (beatmaps[0].mode === 'Taiko') {
						linkMode = 'taiko';
					} else if (beatmaps[0].mode === 'Mania') {
						linkMode = 'mania';
					} else if (beatmaps[0].mode === 'Catch the Beat') {
						linkMode = 'fruits';
					}

					let mods = '';
					let modsBits = scores[0].raw_mods;
					let PFpossible = false;
					let hasNC = false;
					if (modsBits >= 16384) {
						PFpossible = true;
						modsBits = modsBits - 16384;
					}
					if (modsBits >= 8192) {
						mods = 'AP';
						modsBits = modsBits - 8192;
					}
					if (modsBits >= 4096) {
						mods = 'SO' + mods;
						modsBits = modsBits - 4096;
					}
					if (modsBits >= 2048) {
						modsBits = modsBits - 2048;
					}
					if (modsBits >= 1024) {
						mods = 'FL' + mods;
						modsBits = modsBits - 1024;
					}
					if (modsBits >= 512) {
						hasNC = true;
						mods = 'NC' + mods;
						modsBits = modsBits - 512;
					}
					if (modsBits >= 256) {
						mods = 'HT' + mods;
						modsBits = modsBits - 256;
					}
					if (modsBits >= 128) {
						mods = 'RX' + mods;
						modsBits = modsBits - 128;
					}
					if (modsBits >= 64) {
						if (!(hasNC)) {
							mods = 'DT' + mods;
						}
						modsBits = modsBits - 64;
					}
					if (modsBits >= 32) {
						if (PFpossible) {
							mods = 'PF' + mods;
						} else {
							mods = 'SD' + mods;
						}
						modsBits = modsBits - 32;
					}
					if (modsBits >= 16) {
						mods = 'HR' + mods;
						modsBits = modsBits - 16;
					}
					if (modsBits >= 8) {
						mods = 'HD' + mods;
						modsBits = modsBits - 8;
					}
					if (modsBits >= 4) {
						mods = 'TD' + mods;
						modsBits = modsBits - 4;
					}
					if (modsBits >= 2) {
						mods = 'EZ' + mods;
						modsBits = modsBits - 2;
					}
					if (modsBits >= 1) {
						mods = 'NF' + mods;
						modsBits = modsBits - 1;
					}

					let modsReadable = '';
					for (let i = 0; i < mods.length; i++) {
						if (i > 0 && (mods.length - i) % 2 === 0) {
							modsReadable = modsReadable + ',';
						}
						modsReadable = modsReadable + mods.charAt(i);
					}
					if (modsReadable === '') {
						modsReadable = 'NoMod';
					}

					//Rank
					let grade = scores[0].rank;
					if (grade === 'X') {
						grade = 'SS';
					} else if (grade === 'XH') {
						grade = 'Silver SS';
					} else if (grade === 'SH') {
						grade = 'Silver S';
					}

					//Make Score Human readable
					let score = '';
					for (let i = 0; i < scores[0].score.length; i++) {
						if (i > 0 && (scores[0].score.length - i) % 3 === 0) {
							score = score + '.';
						}
						score = score + scores[0].score.charAt(i);
					}

					//PP
					let pp = 'None';
					if (scores[0].pp) {
						pp = scores[0].pp;
					}

					//Calculate accuracy
					const accuracy = (scores[0].counts[300] * 100 + scores[0].counts[100] * 33.33 + scores[0].counts[50] * 16.67) / (parseInt(scores[0].counts[300]) + parseInt(scores[0].counts[100]) + parseInt(scores[0].counts[50]) + parseInt(scores[0].counts.miss));

					//Send embed
					const scoresInfoEmbed = new Discord.MessageEmbed()
						.setColor('#FF66AB')
						.setTitle(`${beatmaps[0].artist} - ${beatmaps[0].title}`)
						.setURL(`https://osu.ppy.sh/beatmapsets/${beatmaps[0].beatmapSetId}#${linkMode}/${beatmaps[0].id}`)
						.setThumbnail(`https://b.ppy.sh/thumb/${beatmaps[0].beatmapSetId}.jpg`)
						.addFields(
							{ name: 'Mode', value: `${beatmaps[0].mode}`, inline: true },
							{ name: 'Difficulty', value: `${beatmaps[0].version}`, inline: true },
							{ name: 'Mods', value: `${modsReadable}`, inline: true },
							{ name: 'Player', value: `${user.name}`, inline: true },
							{ name: 'BPM', value: `${beatmaps[0].bpm}`, inline: true },
							{ name: 'Grade', value: `${grade}`, inline: true },
							{ name: 'Score', value: `${score}`, inline: true },
							{ name: 'PP', value: `${pp}`, inline: true },
							{ name: 'Accuracy', value: `${accuracy.toFixed(2)}%`, inline: true },
							{ name: 'Combo', value: `${scores[0].maxCombo}/${beatmaps[0].maxCombo}`, inline: true },
							{ name: '300', value: `${scores[0].counts[300]}`, inline: true },
							{ name: '100', value: `${scores[0].counts[100]}`, inline: true },
							{ name: '50', value: `${scores[0].counts[50]}`, inline: true },
							{ name: 'Miss', value: `${scores[0].counts.miss}`, inline: true },
						)
						.setTimestamp();

					msg.channel.send(scoresInfoEmbed);
				})
				.catch(err => {
					console.log(err);
				});
		})
		.catch(err => {
			if (err.message === 'Not found') {
				msg.channel.send(`Could not find user "${username}".`);
			} else {
				console.log(err);
			}
		});
}