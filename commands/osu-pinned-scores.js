const Discord = require('discord.js');
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const Canvas = require('@napi-rs/canvas');
const { DBDiscordUsers } = require('../dbObjects');
const { getIDFromPotentialOsuLink, logOsuAPICalls, fitTextOnMiddleCanvas, roundedRect, humanReadable, getRankImage, getModImage} = require('../utils.js');
const osu = require('node-osu');

module.exports = {
    name: 'osu-pinned-scores',
    description: 'Sends list of pinned scores for the specified player',
    integration_types: [0, 1], // 0 for guild, 1 for user
    contexts: [0, 1, 2], // 0 for guilds, 1 for bot DMs, 2 for user DMs
    botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles],
    botPermissionsTranslated: 'Send Messages and Attach Files',
    cooldown: 5,
    tags: 'osu',
    data: new SlashCommandBuilder()
        .setName('osu-pinned-scores')
        .setNameLocalizations({
            'de': 'osu-pinned-scores',
            'en-GB': 'osu-pinned-scores',
            'en-US': 'osu-pinned-scores',
        })
        .setDescription('Sends list of pinned scores for the specified player')
        .setDescriptionLocalizations({
            'de': 'Sendet eine Liste der angepinnten Scores für den angegebenen Spieler',
            'en-GB': 'Sends list of pinned scores for the specified player',
            'en-US': 'Sends list of pinned scores for the specified player',
        })
        .setDMPermission(true)
        .addStringOption(option =>
            option.setName('username')
                .setNameLocalizations({
                    'de': 'nutzername',
                    'en-GB': 'username',
                    'en-US': 'username',
                })
                .setDescription('The username, id or link of the player')
                .setDescriptionLocalizations({
                    'de': 'Der Nutzername, die ID oder der Link des Spielers',
                    'en-GB': 'The username, id or link of the player',
                    'en-US': 'The username, id or link of the player',
                })
                .setRequired(false)
        )
        .addIntegerOption(option =>
			option.setName('amount')
				.setNameLocalizations({
					'de': 'anzahl',
					'en-GB': 'amount',
					'en-US': 'amount',
				})
				.setDescription('The amount of pinned scores to be displayed')
				.setDescriptionLocalizations({
					'de': 'Die Anzahl der anzuzeigenden angepinnten Scores',
					'en-GB': 'The amount of pinned scores to be displayed',
					'en-US': 'The amount of pinned scores to be displayed',
				})
				.setRequired(false)
				.setMinValue(1)
				.setMaxValue(100)
		),

    async execute(interaction) {
        try {
            await interaction.deferReply();
        } catch (error) {
            if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
                console.error(error);
            }
            const timestamps = interaction.client.cooldowns.get(this.name);
            timestamps.delete(interaction.user.id);
            return;
        }

        let limit = interaction.options.getInteger('amount');

        if (!limit) {
            limit = 5;
        } else if (limit <= 1) {
            limit = 1;
        } else if (limit >= 100) {
            limit = 100;
        }

        let username = interaction.options.getString('username');

        const commandUser = await DBDiscordUsers.findOne({
            attributes: ['osuUserId', 'osuMainMode', 'osuMainServer'],
            where: {
                userId: interaction.user.id
            },
        });
        // CHECK THIS PART!!1
        if (!username) {
            //Get profile by author if no argument
            if (commandUser && commandUser.osuUserId) {
                try {
                    commandUser.osuUserId.replace(/`/g, '');
                } catch (err) {
                    console.error('Error replacing backticks in osuUserId:', commandUser, commandUser.osuUserId, err);
                }
                await getPinnedScoresUser(interaction, commandUser.osuUserId, limit, false);
            } else {
                let userDisplayName = interaction.user.username;

                if (interaction.member) {
                    userDisplayName = interaction.member.displayName;
                }
                await getPinnedScoresUser(interaction, userDisplayName, limit, false);
            }
        } else {
            if (username.startsWith('<@') && username.endsWith('>')) {
                const discordUser = await DBDiscordUsers.findOne({
					attributes: ['osuUserId'],
					where: {
						userId: username.replace('<@', '').replace('>', '').replace('!', '')
					},
                });
                
                if (discordUser && discordUser.osuUserId) {
					await getPinnedScoresUser(interaction, discordUser.osuUserId, limit, false);
				} else {
					await interaction.followUp(`\`${username.replace(/`/g, '')}\` doesn't have their osu! account connected.\nPlease use their username or wait until they connected their account by using </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}>.`);
					await getPinnedScoresUser(interaction, username, limit, true);
				}
            } else {
                if (username.length === 1 && !(username.startsWith('<@')) && !(username.endsWith('>'))) {
					if (!(commandUser) || commandUser && !(commandUser.osuUserId)) {
						await getPinnedScoresUser(interaction, getIDFromPotentialOsuLink(username), limit, true);
					} else {
						await getPinnedScoresUser(interaction, getIDFromPotentialOsuLink(username), limit, false);
					}
				} else {
					await getPinnedScoresUser(interaction, getIDFromPotentialOsuLink(username), limit, false);
				}
            }
        }
    },
};


async function getPinnedScoresUser(interaction, username, limit, noLinkedAccount) {

    const osuApi = new osu.Api(process.env.OSUTOKENV1, {
        // baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
        notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
        completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
        parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
    });

    logOsuAPICalls('commands/osu-pinned-scores.js getUser Bancho');
    osuApi.getUser({ u: username })
        .then(async (user) => {

            const url = `https://osu.ppy.sh/users/${user.id}/scores/pinned?mode=osu&limit=${limit}&`
            const response = await fetch(url);
            const data = await response.json();

            if (data.length === 0) {
                return interaction.followUp(`User \`${user.name}\` has no pinned scores.`);
            }

            if (data.length < limit) {
                limit = data.length;
            }

            const canvasWidth = 1000;
            const canvasHeight = 83 + limit * 41.66666;

            Canvas.GlobalFonts.registerFromPath('./other/Comfortaa-Bold.ttf', 'comfortaa');
            Canvas.GlobalFonts.registerFromPath('./other/arial unicode ms.otf', 'arial');

            //Create Canvas
            const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

            //Get context and load the image
            const ctx = canvas.getContext('2d');
            const background = await Canvas.loadImage('./other/osu-background.png');
            for (let i = 0; i < canvas.height / background.height; i++) {
                for (let j = 0; j < canvas.width / background.width; j++) {
                    ctx.drawImage(background, j * background.width, i * background.height, background.width, background.height);
                }
            }

            let elements = [canvas, ctx, user];

            elements = await drawTitle(elements);

            elements = await drawPinnedScores(elements, data);

            await drawFooter(elements);

            const files = [new Discord.AttachmentBuilder(canvas.toBuffer('image/png'), { name: `osu-pinned-scores-${user.id}.png` })];


            const linkedUser = await DBDiscordUsers.findOne({
					attributes: ['userId'],
					where: {
					osuUserId: user.id
                }
            });

            if (linkedUser && linkedUser.userId) {
				noLinkedAccount = false;
            }
            
            let sentMessage;
            // CHeCK THIS PART
            try {
                if (noLinkedAccount) {
                    sentMessage = await interaction.followUp({ content: `\`${user.name}\`: <https://osu.ppy.sh/users/${user.id}}>\nFeel free to use </osu-link connect:${interaction.client.slashCommandData.find(command => command.name === 'osu-link').id}> if the specified account is yours.`, files: files });
                } else {
                    sentMessage = await interaction.followUp({ content: `\`${user.name}\`: <https://osu.ppy.sh/users/${user.id}}>`, files: files });
                }
            } catch (err) {
                if (err.message === 'Invalid Webhook Token') {
                    sentMessage = await interaction.channel.send({ content: `\`${user.name}\`: <https://osu.ppy.sh/users/${user.id}}>`, files: files });
                } else if (err.message !== 'Unknown Message') {
                    console.error(err);
                }
            }

            try {
                await sentMessage.react('👤');
            } catch (err) {
                //Nothing
            }

        })
        .catch(async (err) => {
            if (err.message === 'Not found') {
                try {
                    await interaction.followUp(`Could not find user \`${username.replace(/`/g, '')}\`.`);
                } catch (e) {
                    if (e.message === 'Cannot read properties of undefined (reading \'replace\')') {
                        console.log(interaction, e);
                    }
                }
            } else {
                console.error(err);
            }
    });
}

async function drawTitle(input) {
	let canvas = input[0];
	let ctx = input[1];
	let user = input[2];

   let title = `✰ ${user.name}'s Pinned Scores ✰`;

	roundedRect(ctx, canvas.width / 2 - title.length * 8.5, 500 / 50, title.length * 17, 500 / 12, 5, '28', '28', '28', 0.75);

	// Write the title of the player
	ctx.font = '30px comfortaa, arial';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	fitTextOnMiddleCanvas(ctx, title, 30, 'comfortaa, arial', 41, canvas.width, 25);

	const output = [canvas, ctx, user];
	return output;
}

async function drawFooter(input) {
    let canvas = input[0];
    let ctx = input[1];
    let user = input[2];

    let today = new Date().toLocaleDateString();

    try {
        ctx.font = '12px comfortaa, arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'right';
        ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - canvas.width / 140, canvas.height - 5);
    } catch (err) {
        console.error(input);
        console.error(err);
    }

    const output = [canvas, ctx, user];
    return output;
}


async function drawPinnedScores(input, data) {

    let canvas = input[0];
    let ctx = input[1];
    let user = input[2];

    for (let i = 0; i < data.length; i++) {
        let score = data[i];

        // IN CASE WE NEED TO ADD SCORE MAPS TO THE DB USE THESE:
        // score.beatmap_id => map id
        // score.beatmap.beatmapset_id => mapset id

        roundedRect(ctx, canvas.width / 70, 500 / 8 + (500 / 12) * i, canvas.width - canvas.width / 35, 500 / 13, 500 / 70, '70', '57', '63', 0.75);

        const rankImage = await Canvas.loadImage(getRankImage(score.rank));
        ctx.drawImage(rankImage, canvas.width / 35, 500 / 8 + (500 / 12) * i + 500 / 13 / 2 - 500 / 31.25 / 2, 32, 16);
        
        ctx.font = 'bold 18px comfortaa, arial';
        ctx.fillStyle = '#FF66AB';
        ctx.textAlign = 'right';
        if (score.pp === null) {
            ctx.font = 'bold 22px comfortaa, arial';
            ctx.fillText(`-`, (canvas.width / 36) * 34, 500 / 8 + (500 / 12) * i + 500 / 13 / 2 + 500 / 70);
        } else {
            ctx.fillText(humanReadable(Math.round(score.pp)) + 'pp', (canvas.width / 35) * 34, 500 / 8 + (500 / 12) * i + 500 / 13 / 2 + 500 / 70);
        }

        let beatmapTitle = `${score.beatmapset.title} by ${score.beatmapset.artist}`;
        const maxSize = canvas.width / 250 * 19;
        if (beatmapTitle.length > maxSize) {
            beatmapTitle = beatmapTitle.substring(0, maxSize - 3) + '...';
        }

        //Write Difficulty per map
        ctx.font = 'bold 10px comfortaa, arial';
        ctx.fillStyle = '#FFCC22';
        ctx.textAlign = 'left';
        ctx.fillText(score.beatmap.version, (canvas.width / 35) * 3, 500 / 8 + (500 / 12) * i + 500 / 12 / 2 + 500 / 35);

        // Write accuracy and combo per map
		combo = `(${score.max_combo}/${score.maximum_statistics.great + score.maximum_statistics.legacy_combo_increase})`;

		ctx.font = 'bold 10px comfortaa, arial';
		ctx.fillStyle = '#FFCC22';
		ctx.textAlign = 'right';
		ctx.fillText(combo, (canvas.width / 28) * 23.4, 500 / 8 + (500 / 12) * i + 500 / 12 / 2 + 500 / 35);
		ctx.fillText(Math.round(score.accuracy * 100 * 100) / 100 + '%', (canvas.width / 28) * 24.75, 500 / 8 + (500 / 12) * i + 500 / 12 / 2 + 500 / 35);
            
        //Write achieved on per map
        let today = new Date();
        const todayMilliseconds = today.getTime();	//Get the time (milliseconds since January 1, 1970)
        const scoreMilliseconds = Date.parse(score.ended_at); //Get the time (milliseconds since January 1, 1970)
        let timeDifference = todayMilliseconds - scoreMilliseconds;
        let achievedTime = new Date().toLocaleDateString();

        if (timeDifference < 60000) { //if achieved in the last minute
            achievedTime = `${Math.round(timeDifference / 1000)} second(s) ago`;
        } else if (timeDifference < 3600000) { //if achieved in the last hour
            achievedTime = `${Math.round(timeDifference / 60000)} minute(s) ago`;
        } else if (timeDifference < 86400000) { //if achieved in the last 24 hours
            achievedTime = `${Math.round(timeDifference / 3600000)} hour(s) ago`;
        } else if (timeDifference < 2678400000) { //if achieved in the last 31 days
            achievedTime = `${Math.round(timeDifference / 86400000)} day(s) ago`;
        } else if (timeDifference < 31536000000) { //if achieved in the last year
            achievedTime = `${Math.round(timeDifference / 2678400000)} month(s) ago`;
        } else { //else achieved years ago
            achievedTime = `${Math.round(timeDifference / 31536000000)} year(s) ago`;
        }

		ctx.font = 'bold 10px comfortaa, arial';
		ctx.fillStyle = '#A08C95';
		ctx.textAlign = 'left';
		ctx.fillText(achievedTime, (canvas.width / 35) * 3 + ctx.measureText(score.beatmap.version).width + canvas.width / 100, 500 / 8 + (500 / 12) * i + 500 / 12 / 2 + 500 / 35);        
        
        //Write beatmap title per map
        ctx.font = 'bold 15px comfortaa, arial';
		ctx.fillStyle = '#FFFFFF';
		ctx.textAlign = 'left';
        ctx.fillText(beatmapTitle, (canvas.width / 35) * 3, 500 / 8 + (500 / 12) * i + 500 / 12 / 2);

        //Write mods per map
        score.mods = score.mods.map(mod => mod.acronym);
		for (let j = 0; j < score.mods.length; j++) {
			const modImage = await Canvas.loadImage(getModImage(score.mods[score.mods.length - j - 1]));
			ctx.drawImage(modImage, (canvas.width / 28) * 24.75 - (canvas.width / 1000 * 23) * (j + 1), 500 / 8 + (500 / 12) * i + (500 / 12) / 5, canvas.width / 1000 * 23, 500 / 125 * 4);
		}
    }
    const output = [canvas, ctx, user];
    return output
}