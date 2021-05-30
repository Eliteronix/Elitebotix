const { DBMOTDPoints } = require('../dbObjects.js');

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
	async execute(msg, args) {
		if (msg.author.id !== '138273136285057025') {
			return;
		}

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