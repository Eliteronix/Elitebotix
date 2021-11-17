const { populateMsgFromInteraction } = require('../utils');
const { Permissions, MessageEmbed } = require('discord.js');

module.exports = {
	name: 'rollgame',
	// aliases: ['dice', 'ouo'],
	description: 'Play the rollgame against someone or the bot',
	// usage: '[Number]',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS],
	botPermissionsTranslated: 'Send Messages and Embed Links',
	// guildOnly: true,
	//args: true,
	cooldown: 5,
	// noCooldownMessage: true,
	tags: 'misc',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			if (interaction.options._hoistedOptions[0]) {
				args = [interaction.options._hoistedOptions[0].value];
			}
		}

		// let max = 100;
		// if (args[0] && !isNaN(args[0]) && args[0] > 1) {
		// 	max = parseInt(args[0]);
		// }

		// const result = Math.floor(Math.random() * max) + 1;

		let players = [`<@${msg.author.id}>`];

		const rollgameEmbed = new MessageEmbed()
			.setColor('#187bcd')
			.setTitle('Rollgame')
			.setDescription('First to roll 1 wins')
			.setTimestamp();

		//Add playerNames
		for (let i = 0; i < players.length; i++) {
			rollgameEmbed.addField(`Player ${i + 1}`, players[i], true);
		}

		rollgameEmbed.addField('Instructions', 'React with 🎲 or type `join` to join the lobby.\nReact with 🎲 or type `start` if you created the lobby.');

		let sentMessage = await msg.channel.send({ embeds: [rollgameEmbed] });
		await sentMessage.react('🎲');

		// `m` is a message object that will be passed through the filter function
		const mFilter = m => ['join', 'start'].includes(m.content.toLowerCase()) && m.author.id !== msg.client.user.id;
		const mCollector = msg.channel.createMessageCollector({ mFilter, time: 30000 });

		mCollector.on('collect', async (m) => {
			if (!players.includes(`<@${m.author.id}>`) && m.content.toLowerCase() === 'join') {
				players.push(`<@${m.author.id}>`);
				m.delete();
				sentMessage = await updateEmbed(sentMessage, players, [], 'React with 🎲 or type `join` to join the lobby.\nReact with 🎲 or type `start` if you created the lobby.');
			} else if (players[0] === `<@${m.author.id}>` && m.content.toLowerCase() === 'start') {
				m.delete();
				mCollector.stop();
			}
		});

		const rCollector = sentMessage.createReactionCollector({ time: 30000 });

		rCollector.on('collect', async (reaction, user) => {
			if (!players.includes(`<@${user.id}>`) && user.id !== msg.client.user.id && reaction.emoji.name === '🎲') {
				players.push(`<@${user.id}>`);
				sentMessage = await updateEmbed(sentMessage, players, [], 'React with 🎲 or type `join` to join the lobby.\nReact with 🎲 or type `start` if you created the lobby.');
			} else if (players[0] === `<@${user.id}>` && reaction.emoji.name === '🎲') {
				mCollector.stop();
			}
		});

		mCollector.on('end', async () => {
			rCollector.stop();
			await sentMessage.reactions.removeAll();
			sentMessage = await updateEmbed(sentMessage, players, [], 'React with 🎲 or type `roll` to determine the seeding.');
			await sentMessage.react('🎲');

			// `m` is a message object that will be passed through the filter function
			const mFilter = m => ['roll'].includes(m.content.toLowerCase()) && m.author.id !== msg.client.user.id;
			const mCollector = msg.channel.createMessageCollector({ mFilter, time: 30000 });

			mCollector.on('collect', async (m) => {
			});

			const rCollector = sentMessage.createReactionCollector({ time: 30000 });

			rCollector.on('collect', async (reaction, user) => {
			});

			mCollector.on('end', async () => {
				rCollector.stop();
			});
		});
	},
};

function roll(max) {
	return Math.floor(Math.random() * max) + 1;
}

async function updateEmbed(embedMessage, players, rounds, instructions) {
	const rollgameEmbed = new MessageEmbed()
		.setColor('#187bcd')
		.setTitle('Rollgame')
		.setDescription('First to roll 1 wins')
		.setTimestamp();

	//Add playerNames
	for (let i = 0; i < players.length; i++) {
		rollgameEmbed.addField(`Player ${i + 1}`, players[i], true);
	}

	rollgameEmbed.addField('Instructions', instructions);

	return await embedMessage.edit({ embeds: [rollgameEmbed] });
}