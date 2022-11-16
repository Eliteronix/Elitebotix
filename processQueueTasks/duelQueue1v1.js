const { DBProcessQueue, DBDiscordUsers } = require('../dbObjects');
const { createDuelMatch, updateQueueChannels } = require('../utils');

module.exports = {
	async execute(client, bancho, twitchClient, processQueueEntry) {
		// console.log('duelQueue1v1');
		let args = processQueueEntry.additions.split(';');

		let currentUser = args[0];
		let starRating = parseFloat(args[1]);
		let difficultyArea = parseFloat(args[2]);

		let otherQueueTasks = await DBProcessQueue.findAll({
			where: {
				task: 'duelQueue1v1',
			}
		});

		for (let i = 0; i < otherQueueTasks.length; i++) {
			let taskArgs = otherQueueTasks[i].additions.split(';');

			let taskUser = taskArgs[0];
			let taskStarRating = parseFloat(taskArgs[1]);
			let taskDifficultyArea = parseFloat(taskArgs[2]);

			//Check if it is the same user
			if (taskUser === currentUser) {
				otherQueueTasks.splice(i, 1);
				i--;
				continue;
			}

			//Check if the task is in reach for the current task
			if (starRating + difficultyArea < taskStarRating || starRating - difficultyArea > taskStarRating) {
				otherQueueTasks.splice(i, 1);
				i--;
				continue;
			}

			//Check if the current task is in reach for the task
			if (taskStarRating + taskDifficultyArea < starRating || taskStarRating - taskDifficultyArea > starRating) {
				otherQueueTasks.splice(i, 1);
				i--;
				continue;
			}
		}

		if (otherQueueTasks.length > 0) {
			let otherQueueTask = otherQueueTasks[0];

			//Get the oldest other task
			for (let i = 0; i < otherQueueTasks.length; i++) {
				if (otherQueueTasks[i].createdAt < otherQueueTask.createdAt) {
					otherQueueTask = otherQueueTasks[i];
				}
			}

			let firstUser = await DBDiscordUsers.findOne({
				where: {
					osuUserId: currentUser
				}
			});

			let secondUser = await DBDiscordUsers.findOne({
				where: {
					osuUserId: otherQueueTask.additions.split(';')[0]
				}
			});

			let averageStarRating = (parseFloat(firstUser.osuDuelStarRating) + parseFloat(secondUser.osuDuelStarRating)) / 2;

			let lowerBound = averageStarRating - 0.125;
			let upperBound = averageStarRating + 0.125;

			createDuelMatch(client, bancho, null, averageStarRating, lowerBound, upperBound, 7, false, [firstUser, secondUser], true);

			await processQueueEntry.destroy();
			await otherQueueTask.destroy();
			updateQueueChannels(client);
		} else {
			let date = new Date();
			date.setUTCMinutes(date.getUTCMinutes() + 1);
			processQueueEntry.date = date;

			processQueueEntry.beingExecuted = false;

			let newDifficultyArea = difficultyArea + 0.025;
			if (newDifficultyArea > 0.5) {
				newDifficultyArea = 0.5;
			}

			processQueueEntry.additions = `${currentUser};${starRating};${newDifficultyArea}`;
			processQueueEntry.save();
		}
	},
};