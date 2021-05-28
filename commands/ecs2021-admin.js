const { DBElitiriCupSignUp } = require('../dbObjects.js');

module.exports = {
	name: 'ecs2021-admin',
	//aliases: ['osu-map', 'beatmap-info'],
	description: 'Admin control for the Elitiri Cup',
	usage: '<sr>',
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
		if (args[0] === 'sr') {
			const topElitiriSignUps = await DBElitiriCupSignUp.findAll({
				where: { tournamentName: 'Elitiri Cup Summer 2021', bracketName: 'Top Bracket' }
			});

			const middleElitiriSignUps = await DBElitiriCupSignUp.findAll({
				where: { tournamentName: 'Elitiri Cup Summer 2021', bracketName: 'Middle Bracket' }
			});

			const lowerElitiriSignUps = await DBElitiriCupSignUp.findAll({
				where: { tournamentName: 'Elitiri Cup Summer 2021', bracketName: 'Lower Bracket' }
			});

			const beginnerElitiriSignUps = await DBElitiriCupSignUp.findAll({
				where: { tournamentName: 'Elitiri Cup Summer 2021', bracketName: 'Beginner Bracket' }
			});

			let topLowerDiff = 0;
			let topUpperDiff = 0;
			let middleLowerDiff = 0;
			let middleUpperDiff = 0;
			let lowerLowerDiff = 0;
			let lowerUpperDiff = 0;
			let beginnerLowerDiff = 0;
			let beginnerUpperDiff = 0;

			for (let i = 0; i < topElitiriSignUps.length; i++) {
				topLowerDiff += parseFloat(topElitiriSignUps[i].lowerDifficulty);
				topUpperDiff += parseFloat(topElitiriSignUps[i].upperDifficulty);
			}

			for (let i = 0; i < middleElitiriSignUps.length; i++) {
				middleLowerDiff += parseFloat(middleElitiriSignUps[i].lowerDifficulty);
				middleUpperDiff += parseFloat(middleElitiriSignUps[i].upperDifficulty);
			}

			for (let i = 0; i < lowerElitiriSignUps.length; i++) {
				lowerLowerDiff += parseFloat(lowerElitiriSignUps[i].lowerDifficulty);
				lowerUpperDiff += parseFloat(lowerElitiriSignUps[i].upperDifficulty);
			}

			for (let i = 0; i < beginnerElitiriSignUps.length; i++) {
				beginnerLowerDiff += parseFloat(beginnerElitiriSignUps[i].lowerDifficulty);
				beginnerUpperDiff += parseFloat(beginnerElitiriSignUps[i].upperDifficulty);
			}

			topLowerDiff = topLowerDiff / topElitiriSignUps.length;
			topUpperDiff = topUpperDiff / topElitiriSignUps.length;
			middleLowerDiff = middleLowerDiff / middleElitiriSignUps.length;
			middleUpperDiff = middleUpperDiff / middleElitiriSignUps.length;
			lowerLowerDiff = lowerLowerDiff / lowerElitiriSignUps.length;
			lowerUpperDiff = lowerUpperDiff / lowerElitiriSignUps.length;
			beginnerLowerDiff = beginnerLowerDiff / beginnerElitiriSignUps.length;
			beginnerUpperDiff = beginnerUpperDiff / beginnerElitiriSignUps.length;


			const eliteronixUser = await msg.client.users.fetch('138273136285057025');
			eliteronixUser.send(`Top Bracket: \`${Math.round(topLowerDiff * 100) / 100} - ${Math.round(topUpperDiff * 100) / 100}\`\nMiddle Bracket: \`${Math.round(middleLowerDiff * 100) / 100} - ${Math.round(middleUpperDiff * 100) / 100}\`\nLower Bracket: \`${Math.round(lowerLowerDiff * 100) / 100} - ${Math.round(lowerUpperDiff * 100) / 100}\`\nBeginner Bracket: \`${Math.round(beginnerLowerDiff * 100) / 100} - ${Math.round(beginnerUpperDiff * 100) / 100}\``);
		}
	}
};