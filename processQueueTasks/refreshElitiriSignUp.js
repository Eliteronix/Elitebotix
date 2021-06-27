const { DBDiscordUsers, DBProcessQueue, DBElitiriCupSignUp } = require('../dbObjects');

module.exports = {
	async execute(client, processQueueEntry) {
		let now = new Date();
		let endOfRegs = new Date();
		endOfRegs.setUTCMilliseconds(999);
		endOfRegs.setUTCSeconds(59);
		endOfRegs.setUTCMinutes(59);
		endOfRegs.setUTCHours(23);
		endOfRegs.setUTCDate(27);
		endOfRegs.setUTCMonth(5); //Zero Indexed
		endOfRegs.setUTCFullYear(2021);
		if (now > endOfRegs) {
			return;
		}

		const discordUser = await DBDiscordUsers.findOne({
			where: { osuUserId: processQueueEntry.additions }
		});

		const elitiriSignUp = await DBElitiriCupSignUp.findOne({
			where: { osuUserId: processQueueEntry.additions, tournamentName: 'Elitiri Cup Summer 2021' }
		});

		if (discordUser && elitiriSignUp) {
			elitiriSignUp.osuName = discordUser.osuName;
			elitiriSignUp.osuBadges = discordUser.osuBadges;
			elitiriSignUp.osuPP = discordUser.osuPP;
			elitiriSignUp.osuRank = discordUser.osuRank;

			let bracketName = '';
			let BWSRank = Math.round(Math.pow(discordUser.osuRank, Math.pow(0.9937, Math.pow(discordUser.osuBadges, 2))));

			if (BWSRank > 999 && BWSRank < 10000) {
				bracketName = 'Top Bracket';
			} else if (BWSRank > 9999 && BWSRank < 50000) {
				bracketName = 'Middle Bracket';
			} else if (BWSRank > 49999 && BWSRank < 100000) {
				bracketName = 'Lower Bracket';
			} else if (BWSRank > 99999) {
				bracketName = 'Beginner Bracket';
			}

			if (bracketName === '') {
				await elitiriSignUp.destroy();
				const user = await client.users.fetch(discordUser.userId);
				try {
					user.send(`Your BWS Rank has dropped below 1000 (${BWSRank}) and you have therefore been removed from the signups for the \`Elitiri Cup Summer 2021\`.\nYou can re-register if you drop above 1000 again.`);
				} catch {
					//Nothing
				}
				return;
			}

			const user = await client.users.fetch(discordUser.userId);

			if (elitiriSignUp.bracketName !== bracketName) {
				const task = await DBProcessQueue.findOne({
					where: { guildId: 'None', task: 'elitiriCupSignUps', additions: elitiriSignUp.bracketName }
				});

				if (!task) {
					let date = new Date();
					date.setUTCMinutes(date.getUTCMinutes() + 1);
					DBProcessQueue.create({ guildId: 'None', task: 'elitiriCupSignUps', priority: 3, additions: elitiriSignUp.bracketName, date: date });
				}

				try {
					user.send(`Your bracket for the \`Elitiri Cup Summer 2021\` has been automatically changed to ${bracketName}. (Used to be ${elitiriSignUp.bracketName})`);
				} catch {
					//Nothing
				}
			}

			elitiriSignUp.bracketName = bracketName;

			elitiriSignUp.discordTag = `${user.username}#${user.discriminator}`;

			await elitiriSignUp.save();

			const task = await DBProcessQueue.findOne({
				where: { guildId: 'None', task: 'elitiriCupSignUps', additions: elitiriSignUp.bracketName }
			});

			if (!task) {
				let date = new Date();
				date.setUTCMinutes(date.getUTCMinutes() + 1);
				DBProcessQueue.create({ guildId: 'None', task: 'elitiriCupSignUps', priority: 3, additions: elitiriSignUp.bracketName, date: date });
			}
		}
	},
};