const { DBMOTDPoints } = require('../dbObjects.js');
const { initializeMOTD } = require('../MOTD/initializeMOTD.js');
const { developers } = require('../config.json');

module.exports = {
	name: 'osu-motd-admin',
	//aliases: ['osu-map', 'beatmap-info'],
	description: 'Admin control for the Maps of the Day Competition',
	usage: '<recalculate/fix/start/createLeaderboard>',
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
	async execute(msg, args, interaction, additionalObjects) {
		if (!developers.includes(msg.author.id)) {
			return;
		}
		const bancho = additionalObjects[1];

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
			await DBMOTDPoints.create({
				userId: '244892643316858881',
				osuUserId: '9665206',
				osuRank: '376',
				totalPoints: '4',
				qualifierPoints: '2',
				qualifierRank: '1',
				qualifierPlayers: '2',
				knockoutPoints: '2',
				knockoutRank: '2',
				knockoutPlayers: '1',
				knockoutRound: '10',
				maxQualifierPoints: '1',
				matchDate: 1626112800000
			});

			await DBMOTDPoints.create({
				userId: '244526413888094209',
				osuUserId: '12296128',
				osuRank: '2079',
				totalPoints: '3',
				qualifierPoints: '1',
				qualifierRank: '2',
				qualifierPlayers: '2',
				knockoutPoints: '2',
				knockoutRank: '1',
				knockoutPlayers: '1',
				knockoutRound: '11',
				maxQualifierPoints: '1',
				matchDate: 1626112800000
			});

			await DBMOTDPoints.create({
				userId: '149635950463549440',
				osuUserId: '962519',
				osuRank: '80258',
				totalPoints: '13',
				qualifierPoints: '4',
				qualifierRank: '1',
				qualifierPlayers: '4',
				knockoutPoints: '9',
				knockoutRank: '1',
				knockoutPlayers: '4',
				knockoutRound: '11',
				maxQualifierPoints: '4',
				matchDate: 1626112800000
			});

			await DBMOTDPoints.create({
				userId: '422331306643292160',
				osuUserId: '15774143',
				osuRank: '98016',
				totalPoints: '11',
				qualifierPoints: '3',
				qualifierRank: '2',
				qualifierPlayers: '4',
				knockoutPoints: '8',
				knockoutRank: '2',
				knockoutPlayers: '4',
				knockoutRound: '10',
				maxQualifierPoints: '4',
				matchDate: 1626112800000
			});

			await DBMOTDPoints.create({
				userId: '677670575350480906',
				osuUserId: '15631422',
				osuRank: '87534',
				totalPoints: '8',
				qualifierPoints: '2',
				qualifierRank: '3',
				qualifierPlayers: '4',
				knockoutPoints: '6',
				knockoutRank: '4',
				knockoutPlayers: '4',
				knockoutRound: '8',
				maxQualifierPoints: '4',
				matchDate: 1626112800000
			});

			await DBMOTDPoints.create({
				userId: '725524775304167484',
				osuUserId: '4824446',
				osuRank: '57320',
				totalPoints: '8',
				qualifierPoints: '1',
				qualifierRank: '4',
				qualifierPlayers: '4',
				knockoutPoints: '7',
				knockoutRank: '3',
				knockoutPlayers: '4',
				knockoutRound: '9',
				maxQualifierPoints: '4',
				matchDate: 1626112800000
			});

			await DBMOTDPoints.create({
				userId: '499374303805046795',
				osuUserId: '12920152',
				osuRank: '15590',
				totalPoints: '16',
				qualifierPoints: '5',
				qualifierRank: '1',
				qualifierPlayers: '5',
				knockoutPoints: '11',
				knockoutRank: '1',
				knockoutPlayers: '5',
				knockoutRound: '11',
				maxQualifierPoints: '5',
				matchDate: 1626112800000
			});

			await DBMOTDPoints.create({
				userId: '238326691896885248',
				osuUserId: '772295',
				osuRank: '11590',
				totalPoints: '14',
				qualifierPoints: '4',
				qualifierRank: '2',
				qualifierPlayers: '5',
				knockoutPoints: '10',
				knockoutRank: '2',
				knockoutPlayers: '5',
				knockoutRound: '10',
				maxQualifierPoints: '5',
				matchDate: 1626112800000
			});

			await DBMOTDPoints.create({
				userId: '138273136285057025',
				osuUserId: '4520333',
				osuRank: '26777',
				totalPoints: '10',
				qualifierPoints: '3',
				qualifierRank: '3',
				qualifierPlayers: '5',
				knockoutPoints: '7',
				knockoutRank: '5',
				knockoutPlayers: '5',
				knockoutRound: '7',
				maxQualifierPoints: '5',
				matchDate: 1626112800000
			});

			await DBMOTDPoints.create({
				userId: '480382946851815452',
				osuUserId: '13222659',
				osuRank: '45811',
				totalPoints: '10',
				qualifierPoints: '2',
				qualifierRank: '4',
				qualifierPlayers: '5',
				knockoutPoints: '8',
				knockoutRank: '4',
				knockoutPlayers: '5',
				knockoutRound: '8',
				maxQualifierPoints: '5',
				matchDate: 1626112800000
			});

			await DBMOTDPoints.create({
				userId: '458196977939906562',
				osuUserId: '3148418',
				osuRank: '12096',
				totalPoints: '10',
				qualifierPoints: '1',
				qualifierRank: '5',
				qualifierPlayers: '5',
				knockoutPoints: '9',
				knockoutRank: '3',
				knockoutPlayers: '5',
				knockoutRound: '9',
				maxQualifierPoints: '5',
				matchDate: 1626112800000
			});

			await DBMOTDPoints.create({
				userId: '213704622659862529',
				osuUserId: '8880119',
				osuRank: '209248',
				totalPoints: '12',
				qualifierPoints: '4',
				qualifierRank: '1',
				qualifierPlayers: '4',
				knockoutPoints: '8',
				knockoutRank: '2',
				knockoutPlayers: '4',
				knockoutRound: '10',
				maxQualifierPoints: '4',
				matchDate: 1626112800000
			});

			await DBMOTDPoints.create({
				userId: '414110552919375874',
				osuUserId: '15233100',
				osuRank: '105476',
				totalPoints: '12',
				qualifierPoints: '3',
				qualifierRank: '2',
				qualifierPlayers: '4',
				knockoutPoints: '9',
				knockoutRank: '1',
				knockoutPlayers: '4',
				knockoutRound: '11',
				maxQualifierPoints: '4',
				matchDate: 1626112800000
			});

			await DBMOTDPoints.create({
				userId: '312981329476321282',
				osuUserId: '12442952',
				osuRank: '100004',
				totalPoints: '9',
				qualifierPoints: '2',
				qualifierRank: '3',
				qualifierPlayers: '4',
				knockoutPoints: '7',
				knockoutRank: '3',
				knockoutPlayers: '4',
				knockoutRound: '9',
				maxQualifierPoints: '4',
				matchDate: 1626112800000
			});

			await DBMOTDPoints.create({
				userId: '371638091275829258',
				osuUserId: '19236425',
				osuRank: '128658',
				totalPoints: '7',
				qualifierPoints: '1',
				qualifierRank: '4',
				qualifierPlayers: '4',
				knockoutPoints: '6',
				knockoutRank: '4',
				knockoutPlayers: '4',
				knockoutRound: '8',
				maxQualifierPoints: '4',
				matchDate: 1626112800000
			});
		} else if (args[0] === 'start') {
			initializeMOTD(msg.client, bancho, true, false);
		} else if (args[0] === 'createLeaderboard') {
			initializeMOTD(msg.client, bancho, false, true);
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