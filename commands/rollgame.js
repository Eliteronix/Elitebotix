const { populateMsgFromInteraction } = require('../utils');
const { PermissionsBitField, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'rollgame',
	description: 'Play the rollgame against someone or the bot',
	botPermissions: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks],
	botPermissionsTranslated: 'Send Messages and Embed Links',
	cooldown: 30,
	tags: 'misc',
	data: new SlashCommandBuilder()
		.setName('rollgame')
		.setNameLocalizations({
			'de': 'rollgame',
			'en-GB': 'rollgame',
			'en-US': 'rollgame',
		})
		.setDescription('Play the rollgame against someone or the bot')
		.setDescriptionLocalizations({
			'de': 'Spiele Rollgame gegen jemanden oder gegen den Bot',
			'en-GB': 'Play the rollgame against someone or the bot',
			'en-US': 'Play the rollgame against someone or the bot',
		})
		.setDMPermission(true),
	async execute(interaction, msg) {
		//TODO: Remove message code and replace with interaction code
		//TODO: deferReply
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			try {
				await interaction.reply('Rollgame is being started');
			} catch (error) {
				if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
					console.error(error);
				}
				const timestamps = interaction.client.cooldowns.get(this.name);
				timestamps.delete(interaction.user.id);
				return;
			}
		}

		let players = [msg.author.id];

		const rollgameEmbed = new EmbedBuilder()
			.setColor('#187bcd')
			.setTitle('Rollgame')
			.setDescription('Players take turns rolling the previously rolled number - starting at 1000000.\nFirst to roll 1 wins')
			.setTimestamp();

		//Add playerNames
		for (let i = 0; i < players.length; i++) {
			rollgameEmbed.addFields([{ name: `Player ${i + 1}`, value: `<@${players[i]}>`, inline: true }]);
		}

		rollgameEmbed.addFields([{ name: 'Instructions', value: 'React with 🎲 or type `join` to join the lobby.\nReact with 🎲 or type `start` if you created the lobby.' }]);

		let sentMessage = await msg.channel.send({ embeds: [rollgameEmbed] });
		await sentMessage.react('🎲');

		// `m` is a message object that will be passed through the filter function
		const mFilter = m => ['join', 'start'].includes(m.content.toLowerCase()) && m.author.id !== msg.client.user.id;
		const mCollector = msg.channel.createMessageCollector({ mFilter, time: 3600000 });

		mCollector.on('collect', async (m) => {
			if (!players.includes(m.author.id) && m.content.toLowerCase() === 'join') {
				players.push(m.author.id);
				try {
					await m.delete();
				} catch (e) {
					if (e.message !== 'Unknown Message') {
						console.error(e);
					}
				}
				sentMessage = await updateEmbed(sentMessage, players, [], 'React with 🎲 or type `join` to join the lobby.\nReact with 🎲 or type `start` if you created the lobby.', true);
			} else if (players[0] === m.author.id && m.content.toLowerCase() === 'start') {
				try {
					await m.delete();
				} catch (e) {
					if (e.message !== 'Unknown Message') {
						console.error(e);
					}
				}
				mCollector.stop();
			}
		});

		const rCollector = sentMessage.createReactionCollector({ time: 3600000 });

		rCollector.on('collect', async (reaction, user) => {
			if (!players.includes(user.id) && user.id !== msg.client.user.id && reaction.emoji.name === '🎲') {
				players.push(user.id);
				sentMessage = await updateEmbed(sentMessage, players, [], 'React with 🎲 or type `join` to join the lobby.\nReact with 🎲 or type `start` if you created the lobby.', true);
			} else if (players[0] === user.id && reaction.emoji.name === '🎲') {
				mCollector.stop();
			}
		});

		mCollector.on('end', async () => {
			rCollector.stop();
			try {
				await sentMessage.reactions.removeAll();
			} catch (e) {
				if (e.message !== 'Unknown Message' && e.message !== 'Missing Permissions') {
					console.error(e);
				} else if (e.message !== 'Missing Permissions') {
					return;
				}
			}
			let playersRolled = 0;
			if (players.length === 1) {
				const roll = rollMax(100);
				players.push([msg.client.user.id, roll]);
				playersRolled = 1;
			}
			sentMessage = await updateEmbed(sentMessage, players, [], 'React with 🎲 or type `roll` to determine the seeding.');

			// `m` is a message object that will be passed through the filter function
			const meFilter = m => ['roll'].includes(m.content.toLowerCase()) && m.author.id !== msg.client.user.id;
			const meCollector = msg.channel.createMessageCollector({ meFilter, time: 3600000 });

			meCollector.on('collect', async (m) => {
				//Do the roll for the user
				if (players.includes(m.author.id) && m.content.toLowerCase() === 'roll') {
					try {
						await m.delete();
					} catch (e) {
						if (e.message !== 'Unknown Message') {
							console.error(e);
						}
					}
					const roll = rollMax(100);
					for (let i = 0; i < players.length; i++) {
						if (players[i] === m.author.id) {
							players[i] = [players[i], roll];
							playersRolled++;
							sentMessage = await updateEmbed(sentMessage, players, [], 'React with 🎲 or type `roll` to determine the seeding.', true);
							if (playersRolled === players.length) {
								meCollector.stop();
							}
						}
					}
				}
			});

			const reCollector = sentMessage.createReactionCollector({ time: 3600000 });
			await sentMessage.react('🎲');

			reCollector.on('collect', async (reaction, user) => {
				//Do the roll for the user
				if (players.includes(user.id) && reaction.emoji.name === '🎲') {
					const roll = rollMax(100);
					for (let i = 0; i < players.length; i++) {
						if (players[i] === user.id) {
							players[i] = [players[i], roll];
							playersRolled++;
							sentMessage = await updateEmbed(sentMessage, players, [], 'React with 🎲 or type `roll` to determine the seeding.', true);
							if (playersRolled === players.length) {
								meCollector.stop();
							}
						}
					}
				}
			});

			meCollector.on('end', async () => {
				reCollector.stop();
				try {
					await sentMessage.reactions.removeAll();
				} catch (e) {
					if (e.message !== 'Unknown Message' && e.message !== 'Missing Permissions') {
						console.error(e);
					} else if (e.message !== 'Missing Permissions') {
						return;
					}
				}

				//Roll for the players that didn't roll
				for (let i = 0; i < players.length; i++) {
					if (typeof players[i] === 'string') {
						const roll = rollMax(100);
						players[i] = [players[i], roll];
					}
				}

				players.sort((a, b) => b[1] - a[1]);

				//Do match procedure
				let rounds = [];
				return rollRound(msg, sentMessage, players, rounds);
			});
		});
	},
};

function rollMax(max) {
	return Math.floor(Math.random() * max) + 1;
}

async function updateEmbed(embedMessage, players, rounds, instructions, edit) {
	const rollgameEmbed = new EmbedBuilder()
		.setColor('#187bcd')
		.setTitle('Rollgame')
		.setDescription('Players take turns rolling the previously rolled number - starting at 1000000.\nFirst to roll 1 wins')
		.setTimestamp();

	//Keep track of amount of fields
	let fieldAmount = 0;

	//Add playerNames
	for (let i = 0; i < players.length; i++) {
		if (typeof players[i] === 'string') {
			rollgameEmbed.addFields([{ name: `Player ${i + 1}`, value: `<@${players[i]}>`, inline: true }]);
			fieldAmount++;
		} else {
			rollgameEmbed.addFields([{ name: `Player ${i + 1}`, value: `<@${players[i][0]}> (${players[i][1]})`, inline: true }]);
			fieldAmount++;
		}
	}

	//Add rounds
	if (rounds.length) {
		rollgameEmbed.addFields([{ name: 'Start', value: '1000000' }]);
		fieldAmount++;
	}

	//Calculate how many rounds can be shown
	let startValue = (fieldAmount + 1 + rounds.length) - 25;
	if (startValue < 0) {
		startValue = 0;
	}

	for (let i = startValue; i < rounds.length; i++) {
		rollgameEmbed.addFields([{ name: `Round ${i + 1}`, value: `<@${players[i % players.length][0]}> - ${rounds[i]}` }]);
	}

	if (rounds.length && rounds[rounds.length - 1] === 1) {
		rollgameEmbed.addFields([{ name: 'Winner', value: instructions }]);
	} else {
		rollgameEmbed.addFields([{ name: 'Instructions', value: instructions }]);
	}

	if (edit) {
		return await embedMessage.edit({ embeds: [rollgameEmbed] });
	} else {
		setTimeout(async () => await embedMessage.delete(), 80);
		return await embedMessage.channel.send({ embeds: [rollgameEmbed] });
	}
}

async function rollRound(msg, sentMessage, players, rounds) {
	let currentRound = rounds.length;
	let toRoll = 1000000;
	if (rounds.length) {
		toRoll = rounds[rounds.length - 1];
	}

	sentMessage = await updateEmbed(sentMessage, players, rounds, `<@${players[rounds.length % players.length][0]}>, react with 🎲 or type \`roll ${toRoll}\`.`);

	// `m` is a message object that will be passed through the filter function
	const mFilter = m => m.content.toLowerCase() === `roll ${toRoll}`;
	const mCollector = sentMessage.channel.createMessageCollector({ mFilter, time: 3600000 });

	mCollector.on('collect', async (m) => {
		if (m.author.id === players[rounds.length % players.length][0] && m.content.toLowerCase() === `roll ${toRoll}`) {
			try {
				await m.delete();
			} catch (e) {
				if (e.message !== 'Unknown Message') {
					console.error(e);
				}
			}
			const roll = rollMax(toRoll);
			rounds.push(roll);
			mCollector.stop();
		}
	});

	const rCollector = sentMessage.createReactionCollector({ time: 3600000 });

	rCollector.on('collect', async (reaction, user) => {
		if (user.id === players[rounds.length % players.length][0]) {
			const roll = rollMax(toRoll);
			rounds.push(roll);
			mCollector.stop();
		}
	});

	mCollector.on('end', async () => {
		rCollector.stop();
		await sentMessage.reactions.removeAll();

		if (currentRound === rounds.length) {
			const roll = rollMax(toRoll);
			rounds.push(roll);
		}

		if (rounds[rounds.length - 1] === 1) {
			//avoiding another if statement with players.length condition by just checking first 2 player ID's
			if (players[0][0] == msg.client.user.id || players[1][0] == msg.client.user.id) {

				sentMessage = await updateEmbed(sentMessage, players, rounds, `<@${players[(rounds.length - 1) % players.length][0]}> won the roll game!`);
				return await msg.channel.send('gg');
			} else {
				return sentMessage = await updateEmbed(sentMessage, players, rounds, `<@${players[(rounds.length - 1) % players.length][0]}> won the roll game!`);
			}
		}
		return rollRound(msg, sentMessage, players, rounds);
	});

	await sentMessage.react('🎲');
}