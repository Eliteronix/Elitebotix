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
	cooldown: 30,
	// noCooldownMessage: true,
	tags: 'misc',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		if (interaction) {
			msg = await populateMsgFromInteraction(interaction);

			await interaction.reply('Rollgame is being started');
		}

		let players = [msg.author.id];

		const rollgameEmbed = new MessageEmbed()
			.setColor('#187bcd')
			.setTitle('Rollgame')
			.setDescription('Players take turns rolling the previously rolled number - starting at 1000000.\nFirst to roll 1 wins')
			.setTimestamp();

		//Add playerNames
		for (let i = 0; i < players.length; i++) {
			rollgameEmbed.addField(`Player ${i + 1}`, `<@${players[i]}>`, true);
		}

		rollgameEmbed.addField('Instructions', 'React with 🎲 or type `join` to join the lobby.\nReact with 🎲 or type `start` if you created the lobby.');

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
						console.log(e);
					}
				}
				sentMessage = await updateEmbed(sentMessage, players, [], 'React with 🎲 or type `join` to join the lobby.\nReact with 🎲 or type `start` if you created the lobby.');
			} else if (players[0] === m.author.id && m.content.toLowerCase() === 'start') {
				try {
					await m.delete();
				} catch (e) {
					if (e.message !== 'Unknown Message') {
						console.log(e);
					}
				}
				mCollector.stop();
			}
		});

		const rCollector = sentMessage.createReactionCollector({ time: 3600000 });

		rCollector.on('collect', async (reaction, user) => {
			if (!players.includes(user.id) && user.id !== msg.client.user.id && reaction.emoji.name === '🎲') {
				players.push(user.id);
				sentMessage = await updateEmbed(sentMessage, players, [], 'React with 🎲 or type `join` to join the lobby.\nReact with 🎲 or type `start` if you created the lobby.');
			} else if (players[0] === user.id && reaction.emoji.name === '🎲') {
				mCollector.stop();
			}
		});

		mCollector.on('end', async () => {
			rCollector.stop();
			await sentMessage.reactions.removeAll();
			let playersRolled = 0;
			if (players.length === 1) {
				const roll = rollMax(100);
				players.push([msg.client.user.id, roll]);
				playersRolled = 1;
			}
			sentMessage = await updateEmbed(sentMessage, players, [], 'React with 🎲 or type `roll` to determine the seeding.');
			await sentMessage.react('🎲');

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
							console.log(e);
						}
					}
					const roll = rollMax(100);
					for (let i = 0; i < players.length; i++) {
						if (players[i] === m.author.id) {
							players[i] = [players[i], roll];
							playersRolled++;
							sentMessage = await updateEmbed(sentMessage, players, [], 'React with 🎲 or type `roll` to determine the seeding.');
							if (playersRolled === players.length) {
								meCollector.stop();
							}
						}
					}
				}
			});

			const reCollector = sentMessage.createReactionCollector({ time: 3600000 });

			reCollector.on('collect', async (reaction, user) => {
				//Do the roll for the user
				if (players.includes(user.id) && reaction.emoji.name === '🎲') {
					const roll = rollMax(100);
					for (let i = 0; i < players.length; i++) {
						if (players[i] === user.id) {
							players[i] = [players[i], roll];
							playersRolled++;
							sentMessage = await updateEmbed(sentMessage, players, [], 'React with 🎲 or type `roll` to determine the seeding.');
							if (playersRolled === players.length) {
								meCollector.stop();
							}
						}
					}
				}
			});

			meCollector.on('end', async () => {
				reCollector.stop();
				await sentMessage.reactions.removeAll();

				//Roll for the players that didn't roll
				for (let i = 0; i < players.length; i++) {
					if (typeof players[i] === 'string') {
						const roll = rollMax(100);
						players[i] = [players[i], roll];
					}
				}
				quicksort(players);

				//Do match procedure
				let rounds = [];
				return rollRound(sentMessage, players, rounds);
			});
		});
	},
};

function rollMax(max) {
	return Math.floor(Math.random() * max) + 1;
}

async function updateEmbed(embedMessage, players, rounds, instructions) {
	const rollgameEmbed = new MessageEmbed()
		.setColor('#187bcd')
		.setTitle('Rollgame')
		.setDescription('Players take turns rolling the previously rolled number - starting at 1000000.\nFirst to roll 1 wins')
		.setTimestamp();

	//Keep track of amount of fields
	let fieldAmount = 0;

	//Add playerNames
	for (let i = 0; i < players.length; i++) {
		if (typeof players[i] === 'string') {
			rollgameEmbed.addField(`Player ${i + 1}`, `<@${players[i]}>`, true);
			fieldAmount++;
		} else {
			rollgameEmbed.addField(`Player ${i + 1}`, `<@${players[i][0]}> (${players[i][1]})`, true);
			fieldAmount++;
		}
	}

	//Add rounds
	if (rounds.length) {
		rollgameEmbed.addField('Start', '1000000');
		fieldAmount++;
	}

	//Calculate how many rounds can be shown
	let startValue = (fieldAmount + 1 + rounds.length) - 25;
	if (startValue < 0) {
		startValue = 0;
	}

	for (let i = startValue; i < rounds.length; i++) {
		rollgameEmbed.addField(`Round ${i + 1}`, `<@${players[i % players.length][0]}> - ${rounds[i]}`);
	}

	if (rounds.length && rounds[rounds.length - 1] === 1) {
		rollgameEmbed.addField('Winner', instructions);
	} else {
		rollgameEmbed.addField('Instructions', instructions);
	}
	setTimeout(() => embedMessage.delete(), 80);
	return await embedMessage.channel.send({ embeds: [rollgameEmbed] });
}

function partition(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j][1]) >= parseFloat(pivot[1])) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksort(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partition(list, start, end);
		quicksort(list, start, p - 1);
		quicksort(list, p + 1, end);
	}
	return list;
}

async function rollRound(sentMessage, players, rounds) {
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
					console.log(e);
				}
			}
			const roll = rollMax(toRoll);
			rounds.push(roll);
			mCollector.stop();
		}
	});

	const rCollector = sentMessage.createReactionCollector({ time: 3600000 });
	await sentMessage.react('🎲');

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
			return sentMessage = await updateEmbed(sentMessage, players, rounds, `<@${players[(rounds.length - 1) % players.length][0]}> won the roll game!`);
		}
		return rollRound(sentMessage, players, rounds);
	});
}