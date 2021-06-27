const { DBMOTDPoints } = require('../dbObjects.js');
const { initializeMOTD } = require('../MOTD/initializeMOTD.js');

module.exports = {
	name: 'osu-motd-admin',
	//aliases: ['osu-map', 'beatmap-info'],
	description: 'Admin control for the Maps of the Day Competition',
	usage: '<sr> | <message> <everyone/noSubmissions/noAvailability>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	args: true,
	cooldown: 5,
	//noCooldownMessage: true,
	tags: 'debug',
	prefixCommand: true,
	async execute(msg, args, additionalObjects) {
		if (msg.author.id !== '138273136285057025') {
			return;
		}
		const bancho = additionalObjects[0];

		if (args[0] === 'recalculate') {
			const pointDatasets = await DBMOTDPoints.findAll();

			for (let i = 0; i < pointDatasets.length; i++) {
				if (pointDatasets[i].createdAt === pointDatasets[i].updatedAt) {
					pointDatasets[i].maxQualifierPoints = pointDatasets[i].qualifierPlayers;
					pointDatasets[i].knockoutRound = getKnockoutRound(parseInt(pointDatasets[i].knockoutPlayers), parseInt(pointDatasets[i].knockoutRank));
					pointDatasets[i].knockoutPoints = Math.round(parseInt(pointDatasets[i].qualifierPlayers) * (parseInt(pointDatasets[i].knockoutRound) / 10 * 2));
					pointDatasets[i].totalPoints = parseInt(pointDatasets[i].qualifierPoints) + parseInt(pointDatasets[i].knockoutPoints);
					pointDatasets[i].save();
				} else {
					let maxpoints = parseInt(pointDatasets[i].qualifierPlayers);
					while (maxpoints - 16 >= parseInt(pointDatasets[i].qualifierPoints)) {
						maxpoints = maxpoints - 16;
					}
					pointDatasets[i].maxQualifierPoints = maxpoints;
					pointDatasets[i].knockoutRound = getKnockoutRound(parseInt(pointDatasets[i].knockoutPlayers), parseInt(pointDatasets[i].knockoutRank));
					pointDatasets[i].knockoutPoints = Math.round(parseInt(pointDatasets[i].qualifierPlayers) * (parseInt(pointDatasets[i].knockoutRound) / 10 * 2));
					pointDatasets[i].totalPoints = parseInt(pointDatasets[i].qualifierPoints) + parseInt(pointDatasets[i].knockoutPoints);
					pointDatasets[i].save();
				}
			}
		} else if (args[0] === 'fix') {
			const points1071 = await DBMOTDPoints.findOne({
				where: { id: 1071 }
			});
			points1071.knockoutPoints = Math.round(7 * (10 / 10 * 2));
			points1071.knockoutRank = 2;
			points1071.knockoutPlayers = 10;
			points1071.knockoutRound = 10;
			points1071.maxQualifierPoints = 10;
			points1071.save();

			const points1072 = await DBMOTDPoints.findOne({
				where: { id: 1072 }
			});
			points1072.knockoutPoints = Math.round(7 * (11 / 10 * 2));
			points1072.knockoutRank = 1;
			points1072.knockoutPlayers = 10;
			points1072.knockoutRound = 11;
			points1072.maxQualifierPoints = 10;
			points1072.save();

			const points1073 = await DBMOTDPoints.findOne({
				where: { id: 1073 }
			});
			points1073.knockoutPoints = Math.round(7 * (8 / 10 * 2));
			points1073.knockoutRank = 4;
			points1073.knockoutPlayers = 10;
			points1073.knockoutRound = 8;
			points1073.maxQualifierPoints = 10;
			points1073.save();

			const points1074 = await DBMOTDPoints.findOne({
				where: { id: 1074 }
			});
			points1074.knockoutPoints = Math.round(7 * (9 / 10 * 2));
			points1074.knockoutRank = 3;
			points1074.knockoutPlayers = 10;
			points1074.knockoutRound = 9;
			points1074.maxQualifierPoints = 10;
			points1074.save();
		} else if (args[0] === 'start') {
			initializeMOTD(msg.client, bancho, true);
		}
	}
};

function getKnockoutRound(knockoutPlayers, knockoutRank) {
	if (knockoutPlayers < 12) {
		return (12 - knockoutRank);
	}

	if (knockoutRank < 8) {
		return (12 - knockoutRank);
	}

	if (knockoutRank === 16) {
		return 1;
	}

	if (knockoutRank === 15) {
		if (knockoutPlayers >= 15) {
			return 1;
		}
	}

	if (knockoutRank === 14) {
		if (knockoutPlayers >= 15) {
			return 2;
		}
		if (knockoutPlayers >= 14) {
			return 1;
		}
	}

	if (knockoutRank === 13) {
		if (knockoutPlayers >= 15) {
			return 2;
		}
		if (knockoutPlayers >= 13) {
			return 1;
		}
	}

	if (knockoutRank === 12) {
		if (knockoutPlayers >= 15) {
			return 3;
		}
		if (knockoutPlayers >= 13) {
			return 2;
		}
		if (knockoutPlayers >= 12) {
			return 1;
		}
	}

	if (knockoutRank === 11) {
		if (knockoutPlayers >= 15) {
			return 3;
		}
		if (knockoutPlayers >= 13) {
			return 2;
		}
		if (knockoutPlayers >= 11) {
			return 1;
		}
	}

	if (knockoutRank === 10) {
		if (knockoutPlayers >= 15) {
			return 4;
		}
		if (knockoutPlayers >= 13) {
			return 3;
		}
		if (knockoutPlayers >= 11) {
			return 2;
		}
	}

	if (knockoutRank === 9) {
		if (knockoutPlayers >= 15) {
			return 4;
		}
		if (knockoutPlayers >= 13) {
			return 3;
		}
		if (knockoutPlayers >= 11) {
			return 2;
		}
		if (knockoutPlayers >= 9) {
			return 1;
		}
	}

	if (knockoutRank === 8) {
		if (knockoutPlayers >= 15) {
			return 5;
		}
		if (knockoutPlayers >= 13) {
			return 4;
		}
		if (knockoutPlayers >= 11) {
			return 3;
		}
		if (knockoutPlayers >= 9) {
			return 2;
		}
	}
}