const { DBDiscordUsers } = require('../dbObjects');

module.exports = {
	assignPlayerRoles: async function (client) {
		//Fetch server
		const guild = await client.guilds.fetch('727407178499096597');

		//Fetch all members
		await guild.members.fetch()
			.then(async (guildMembers) => {

				//Filter members and push into array
				const members = guildMembers.filter(member => member.user.bot !== true).array();

				//Set all 4 bracket role ids as a reference
				const bracketRoles = [
					'833313544400535613',
					'833313704136540171',
					'833313763188801578',
					'833313827172646912'
				];

				//Get all 4 bracket role objects
				let bracketRoleObjects = [];

				for (let i = 0; i < bracketRoles.length; i++) {
					const role = await guild.roles.cache.get(bracketRoles[i]);
					bracketRoleObjects.push(role);
				}

				//Fetch standard MOTD role for every registered user
				const MOTDRole = await guild.roles.cache.get('833313361483530261');

				//Iterate through all members
				for (let i = 0; i < members.length; i++) {
					//Find out if they are registered or not
					const registeredPlayer = await DBDiscordUsers.findOne({
						where: { userId: members[i].user.id, osuMOTDRegistered: true }
					});

					if (registeredPlayer && registeredPlayer.osuMOTDMuted && registeredPlayer.osuMOTDmutedUntil === null) {
						let week = new Date();
						week.setUTCDate(week.getUTCDate() + 7);
						registeredPlayer.osuMOTDmutedUntil = week;
						registeredPlayer.save();
					}

					//check for registration
					if (registeredPlayer && !registeredPlayer.osuMOTDMuted) {

						let now = new Date();
						if (registeredPlayer.osuMOTDlastRoundPlayed === null) {
							registeredPlayer.osuMOTDlastRoundPlayed = now;
							registeredPlayer.save();
						}

						if (registeredPlayer.osuMOTDmutedUntil && registeredPlayer.osuMOTDmutedUntil < now) {
							registeredPlayer.osuMOTDMuted = false;
							registeredPlayer.osuMOTDmutedUntil = null;
							registeredPlayer.save();
							try {
								members[i].user.send('The `Maps of the Day` competition is no longer muted for you.\nFeel free to mute it again by using `e!osu-motd mute <#mo/#w/#d/#h>`.');
							} catch {
								//Nothing
							}
						}

						let seasonAgo = new Date();
						seasonAgo.setUTCDate(seasonAgo.getUTCDate() - 90);
						let weeksAgo = new Date();
						weeksAgo.setUTCDate(weeksAgo.getUTCDate() - 14);
						if (seasonAgo > registeredPlayer.osuMOTDlastRoundPlayed) {
							registeredPlayer.osuMOTDRegistered = false;
							registeredPlayer.osuMOTDlastRoundPlayed = null;
							registeredPlayer.osuMOTDMuted = false;
							registeredPlayer.osuMOTDerrorFirstOccurence = null;
							registeredPlayer.osuMOTDmutedUntil = null;
							registeredPlayer.save();
							try {
								members[i].user.send('You were removed from the `Maps of the Day` competition due to inactivity.\nFeel free to register again by using `e!osu-motd register` when you want to play.');
							} catch {
								//Nothing
							}
							continue;
						} else if (registeredPlayer.osuMOTDerrorFirstOccurence && weeksAgo > registeredPlayer.osuMOTDerrorFirstOccurence) {
							registeredPlayer.osuMOTDRegistered = false;
							registeredPlayer.osuMOTDlastRoundPlayed = null;
							registeredPlayer.osuMOTDMuted = false;
							registeredPlayer.osuMOTDerrorFirstOccurence = null;
							registeredPlayer.osuMOTDmutedUntil = null;
							registeredPlayer.save();
							continue;
						}


						//Assign MOTD role if not there yet
						try {
							if (!members[i].roles.cache.has(MOTDRole.id)) {
								//Assign role if not there yet
								await members[i].roles.add(MOTDRole);
							}
						} catch (e) {
							console.log(e);
						}

						//Check which bracket role should be received
						let correctRole = '';
						let BWSRank = Math.round(Math.pow(registeredPlayer.osuRank, Math.pow(0.9937, Math.pow(registeredPlayer.osuBadges, 2))));
						if (BWSRank < 10000) {
							correctRole = '833313544400535613';
						} else if (BWSRank < 50000) {
							correctRole = '833313704136540171';
						} else if (BWSRank < 100000) {
							correctRole = '833313763188801578';
						} else if (BWSRank < 10000000) {
							correctRole = '833313827172646912';
						}

						//Assign or remove needed bracket roles
						for (let j = 0; j < bracketRoles.length; j++) {
							if (correctRole === bracketRoles[j]) {
								try {
									if (!members[i].roles.cache.has(bracketRoles[j])) {
										//Assign role if not there yet
										await members[i].roles.add(bracketRoleObjects[j]);
									}
								} catch (e) {
									console.log(e);
								}
							} else {
								try {
									if (members[i].roles.cache.has(bracketRoles[j])) {
										//Remove role if not removed yet
										await members[i].roles.remove(bracketRoleObjects[j]);
									}
								} catch (e) {
									console.log(e);
								}
							}
						}
					} else {
						//Remove roles from players that aren't signed up anymore
						for (let j = 0; j < bracketRoleObjects.length; j++) {
							try {
								if (members[i].roles.cache.has(bracketRoleObjects[j].id)) {
									//Remove role if not removed yet
									await members[i].roles.remove(bracketRoleObjects[j]);
								}
							} catch (e) {
								console.log(e);
							}
						}
					}
				}
			});
	}
};