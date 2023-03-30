const { PermissionsBitField, SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');
const { DBDiscordUsers, DBOsuBattlepass, DBOsuQuests } = require('../dbObjects');
const { logDatabaseQueries } = require('../utils.js');
const Canvas = require('canvas');
const { Op } = require('sequelize');

module.exports = {
	name: 'osu-battlepass',
	description: 'Allows you to view and manage your battlepass',
	botPermissions: PermissionsBitField.Flags.SendMessages,
	botPermissionsTranslated: 'Send Messages',
	cooldown: 5,
	tags: 'osu',
	data: new SlashCommandBuilder()
		.setName('osu-battlepass')
		.setNameLocalizations({
			'de': 'osu-battlepass',
			'en-GB': 'osu-battlepass',
			'en-US': 'osu-battlepass',
		})
		.setDescription('Allows you to view and manage your battlepass')
		.setDescriptionLocalizations({
			'de': 'Erlaubt es dir, deinen Battlepass anzuzeigen und zu verwalten',
			'en-GB': 'Allows you to view and manage your battlepass',
			'en-US': 'Allows you to view and manage your battlepass',
		})
		.setDMPermission(true),
	async execute(msg, args, interaction) {
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

		logDatabaseQueries(4, 'commands/osu-battlepass.js DBDiscordUsers');
		let discordUser = await DBDiscordUsers.findOne({
			attributes: ['osuUserId', 'osuVerified', 'osuName'],
			where: {
				userId: interaction.user.id
			}
		});

		if (!discordUser || !discordUser.osuUserId || !discordUser.osuVerified) {
			return await interaction.editReply('Please connect and verify your account first by using </osu-link connect:1064502370710605836>.');
		}

		// Draw the image
		const canvasWidth = 1000;
		const canvasHeight = 500;

		Canvas.registerFont('./other/Comfortaa-Bold.ttf', { family: 'comfortaa' });

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

		logDatabaseQueries(4, 'commands/osu-battlepass.js DBOsuBattlepass');
		let battlepass = await DBOsuBattlepass.findOne({
			attributes: ['experience'],
			where: {
				osuUserId: discordUser.osuUserId
			}
		});

		if (!battlepass) {
			// Create a new battlepass
			logDatabaseQueries(4, 'commands/osu-battlepass.js DBOsuBattlepass create');
			battlepass = await DBOsuBattlepass.create({
				osuUserId: discordUser.osuUserId,
				experience: 0,
			});
		}

		// Draw the title
		ctx.font = '50px comfortaa';
		ctx.fillStyle = '#FFFFFF';
		ctx.textAlign = 'center';

		let possessive = '\'s';
		if (discordUser.osuName.endsWith('s') || discordUser.osuName.endsWith('x')) {
			possessive = '\'';
		}

		ctx.fillText(`${discordUser.osuName}${possessive} Battlepass`, 500, 75);

		let levelOffset = 0;

		if (battlepass.experience > 100) {
			let level = Math.floor(battlepass.experience / 100);

			levelOffset = level - 1;
		}

		// Draw the next levels
		for (let i = 0; i < 5; i++) {
			// Draw a grey border
			ctx.strokeStyle = '#EEEEEE';
			ctx.lineWidth = 2;
			ctx.strokeRect(37.5 + 185 * i, 125, 180, 180);

			// Draw the experience bars
			ctx.fillStyle = '#EEEEEE';
			ctx.globalAlpha = 0.5;
			ctx.fillRect(37.5 + 185 * i, 310, 180, 10);
			ctx.globalAlpha = 1;

			// Draw the level number
			ctx.font = '50px comfortaa';
			ctx.fillStyle = '#FFFFFF';
			ctx.textAlign = 'center';
			ctx.fillText(i + 1 + levelOffset, 60 + 185 * i, 175);

			// Draw the level reward
			ctx.font = '20px comfortaa';
			ctx.fillStyle = '#FFFFFF';
			ctx.textAlign = 'center';
			ctx.fillText('Reward:', 37.5 + 185 * i + 90, 210);

			let reward1 = 'Random Profile';
			let reward2 = 'Border';

			if ((i + 1 + levelOffset) % 3 === 0) {
				reward1 = 'Random Rating';
				reward2 = 'Boost';
			}

			ctx.fillText(reward1, 37.5 + 185 * i + 90, 235);
			ctx.fillText(reward2, 37.5 + 185 * i + 90, 260);
		}

		ctx.fillStyle = '#00FFFF';
		if (battlepass.experience <= 100) {
			// Draw the progress bar in cyan on the first bar
			ctx.fillRect(37.5, 310, 180 * (battlepass.experience / 100), 10);
		} else {
			// Draw the progress bar in cyan on the first bar
			ctx.fillRect(37.5, 310, 180, 10);

			// Draw the progress bar in cyan on the second bar
			ctx.fillRect(37.5 + 185, 310, 180 * ((battlepass.experience % 100) / 100), 10);
		}

		// Draw the Quests title
		ctx.font = '30px comfortaa';
		ctx.fillStyle = '#FFFFFF';
		ctx.textAlign = 'left';
		ctx.fillText('Quests', 37.5, 360);

		logDatabaseQueries(4, 'commands/osu-battlepass.js DBOsuQuests');
		let quests = await DBOsuQuests.findAll({
			attributes: ['id', 'type', 'progress'],
			where: {
				osuUserId: discordUser.osuUserId,
				progress: {
					[Op.lt]: 100
				}
			}
		});

		// while (quests.length) {
		// 	await quests[0].destroy();

		// 	quests.splice(0, 1);
		// }

		// Create new quests if needed
		while (quests.length < 3) {
			let questTypes = [
				// 'Use an item', // TODO:
				// 'Use 3 items', // TODO:
				'Queue for and play a 1v1 ETX match',
				'Queue for and play a 1v1 ETX match',
				'Win a 1v1 ETX match',
				'Play 7 maps in ETX matches',
				'Play 3 maps NM in ETX matches',
				'Play HD on 3 maps in ETX matches',
				'Play HR on 3 maps in ETX matches',
				'Play DT on 2 maps in ETX matches',
				'Win 4 maps in ETX matches',
				'Use \'/osu-duel rating\'',
				'Follow somebody using \'/osu-follow follow\'',
				'Play a round in an autohost lobby using \'/osu-autohost\'',
				'Check your skills with \'/osu-skills\'',
				'Get a most recent play using \'/osu-recent\' (You can type \'/rec\')',
				'Send /np to the bot ingame to get pp values',
				'Send !r to the bot ingame to get a random map',
				'/hug another user',
			];

			// Remove quests that are already in the list
			for (let i = 0; i < quests.length; i++) {
				questTypes = questTypes.filter(e => e !== quests[i].type);
			}

			// Create a new quest
			logDatabaseQueries(4, 'commands/osu-battlepass.js DBOsuQuests create');
			let newQuest = await DBOsuQuests.create({
				osuUserId: discordUser.osuUserId,
				type: questTypes[Math.floor(Math.random() * questTypes.length)],
				progress: 0,
			});

			quests.push(newQuest);
		}

		// Draw the Quests
		ctx.font = '26px comfortaa';
		ctx.fillStyle = '#FFFFFF';
		ctx.textAlign = 'left';
		for (let i = 0; i < quests.length; i++) {
			ctx.fillText(`- ${quests[i].type} (${quests[i].progress}%)`, 37.5, 400 + 35 * i);
		}

		// Write the footer
		let today = new Date().toLocaleDateString();

		ctx.font = '12px comfortaa, sans-serif';
		ctx.fillStyle = '#FFFFFF';
		ctx.textAlign = 'right';
		ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - 5, canvas.height - 5);

		// Create as an attachment
		const files = [new AttachmentBuilder(canvas.toBuffer(), { name: 'battlepass.png' })];

		await interaction.editReply({ content: 'Your current battlepass progress and quests can be seen below.', files: files });
	},
};