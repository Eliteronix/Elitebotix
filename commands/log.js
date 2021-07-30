const { DBOsuMultiScores } = require('../dbObjects');

module.exports = {
	name: 'log',
	//aliases: ['developer'],
	description: 'Logs the message in the console',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	noCooldownMessage: true,
	tags: 'debug',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		console.log(msg);

		//recalculate existing scores in the db
		const allScores = await DBOsuMultiScores.findAll();

		for (let i = 0; i < allScores.length; i++) {
			let gameScores = [];
			let gameId = allScores[i].gameId;
			for (let j = 0; j < allScores.length; j++) {
				if (allScores[j].gameId === gameId) {
					gameScores.push(allScores[j]);
					allScores.splice(j, 1);
					j--;
				}
			}

			if (gameScores.length > 1) {
				quicksort(gameScores);

				let sortedScores = [];
				for (let j = 0; j < gameScores.length; j++) {
					sortedScores.push(gameScores[j].score);
				}

				const middleScore = getMiddleScore(sortedScores);

				for (let j = 0; j < gameScores.length; j++) {
					gameScores[j].evaluation = 1 / parseInt(middleScore) * parseInt(gameScores[j].score);
					await gameScores[j].save();
				}
			}
			console.log('GameId done:', gameId);
		}
		console.log('Done');
	},
};

function partition(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].score) >= parseFloat(pivot.score)) {
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

function getMiddleScore(scores) {
	if (scores.length % 2) {
		//Odd amount of scores
		const middleIndex = scores.length - Math.round(scores.length / 2);
		return scores[middleIndex];
	}

	while (scores.length > 2) {
		scores.splice(0, 1);
		scores.splice(scores.length - 1, 1);
	}

	return (parseInt(scores[0]) + parseInt(scores[1])) / 2;
}