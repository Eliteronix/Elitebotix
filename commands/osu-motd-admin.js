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
			const points620 = await DBMOTDPoints.findOne({
				where: { id: 620 }
			});
			points620.knockoutPoints = Math.round(7 * (11 / 10 * 2));
			points620.knockoutRank = 1;
			points620.knockoutPlayers = 16;
			points620.knockoutRound = 11;
			points620.maxQualifierPoints = 18;
			points620.save();

			const points630 = await DBMOTDPoints.findOne({
				where: { id: 630 }
			});
			points630.knockoutPoints = Math.round(7 * (10 / 10 * 2));
			points630.knockoutRank = 2;
			points630.knockoutPlayers = 16;
			points630.knockoutRound = 10;
			points630.maxQualifierPoints = 18;
			points630.save();

			const points638 = await DBMOTDPoints.findOne({
				where: { id: 638 }
			});
			points638.knockoutPoints = Math.round(7 * (11 / 10 * 2));
			points638.knockoutRank = 1;
			points638.knockoutPlayers = 7;
			points638.knockoutRound = 11;
			points638.maxQualifierPoints = 7;
			points638.save();

			const points639 = await DBMOTDPoints.findOne({
				where: { id: 639 }
			});
			points639.knockoutPoints = Math.round(7 * (10 / 10 * 2));
			points639.knockoutRank = 2;
			points639.knockoutPlayers = 7;
			points639.knockoutRound = 10;
			points639.maxQualifierPoints = 7;
			points639.save();

			const points640 = await DBMOTDPoints.findOne({
				where: { id: 640 }
			});
			points640.knockoutPoints = Math.round(7 * (9 / 10 * 2));
			points640.knockoutRank = 3;
			points640.knockoutPlayers = 7;
			points640.knockoutRound = 9;
			points640.maxQualifierPoints = 7;
			points640.save();

			const points641 = await DBMOTDPoints.findOne({
				where: { id: 641 }
			});
			points641.knockoutPoints = Math.round(7 * (8 / 10 * 2));
			points641.knockoutRank = 4;
			points641.knockoutPlayers = 7;
			points641.knockoutRound = 8;
			points641.maxQualifierPoints = 7;
			points641.save();

			const points642 = await DBMOTDPoints.findOne({
				where: { id: 642 }
			});
			points642.knockoutPoints = Math.round(7 * (7 / 10 * 2));
			points642.knockoutRank = 5;
			points642.knockoutPlayers = 7;
			points642.knockoutRound = 7;
			points642.maxQualifierPoints = 7;
			points642.save();

			const points643 = await DBMOTDPoints.findOne({
				where: { id: 643 }
			});
			points643.knockoutPoints = Math.round(7 * (6 / 10 * 2));
			points643.knockoutRank = 6;
			points643.knockoutPlayers = 7;
			points643.knockoutRound = 6;
			points643.maxQualifierPoints = 7;
			points643.save();

			const points644 = await DBMOTDPoints.findOne({
				where: { id: 644 }
			});
			points644.knockoutPoints = Math.round(7 * (5 / 10 * 2));
			points644.knockoutRank = 7;
			points644.knockoutPlayers = 7;
			points644.knockoutRound = 5;
			points644.maxQualifierPoints = 7;
			points644.save();
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