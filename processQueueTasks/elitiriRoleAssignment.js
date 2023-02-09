module.exports = {
	// eslint-disable-next-line no-unused-vars
	async execute(client, bancho, processQueueEntry) {
		// console.log('elitiriRoleAssignment');
		// eslint-disable-next-line no-undef
		if (process.env.SERVER !== 'Live') {
			return processQueueEntry.destroy();
		}

		// eslint-disable-next-line no-empty-pattern
		client.shard.broadcastEval(async (c, { }) => {
			//Fetch server
			const guild = await c.guilds.cache.get('727407178499096597');

			if (guild) {
				// eslint-disable-next-line no-undef
				const { DBElitiriCupSignUp, DBDiscordUsers, DBElitiriCupStaff } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\dbObjects`);
				// eslint-disable-next-line no-undef
				const { logDatabaseQueries } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\utils`);
				// eslint-disable-next-line no-undef
				const { currentElitiriCup } = require(`${__dirname.replace(/Elitebotix\\.+/gm, '')}Elitebotix\\config.json`);

				//Fetch all members
				await guild.members.fetch()
					.then(async (guildMembers) => {
						//Filter members and push into array
						const members = [];
						guildMembers.filter(member => member.user.bot !== true).each(member => members.push(member));

						//Set all 4 bracket role ids as a reference
						const bracketRoles = [
							'803217634165391390', //Top
							'803217866631413801', //Middle
							'803217971782352907', //Lower
							'803218142453170226' //Beginner
						];

						//Get all 4 bracket role objects
						let bracketRoleObjects = [];

						for (let i = 0; i < bracketRoles.length; i++) {
							const role = await guild.roles.cache.get(bracketRoles[i]);
							bracketRoleObjects.push(role);
						}

						//Fetch standard Elitiri role for every registered user
						const ElitiriRole = await guild.roles.cache.get('798862219335958569');

						//Fetch alumni role for every staff member
						const alumniRole = await guild.roles.cache.get('937322283633111070');

						//Fetch host role for every staff member
						const hostRole = await guild.roles.cache.get('851356668415311963');

						//Fetch streamer role for every staff member
						const streamerRole = await guild.roles.cache.get('812832570777534538');

						//Fetch commentator role for every staff member
						const commentatorRole = await guild.roles.cache.get('812832829196730389');

						//Fetch referee role for every staff member
						const refereeRole = await guild.roles.cache.get('798865525483765781');

						//Fetch referee role for every staff member
						const replayerRole = await guild.roles.cache.get('866776520928264252');

						//Iterate through all members
						for (let i = 0; i < members.length; i++) {
							logDatabaseQueries(2, 'processQueueTasks/elitiriRoleAssignment.js DBElitiriCupSignUp');
							//Find out if they are registered or not
							const registeredPlayer = await DBElitiriCupSignUp.findOne({
								where: { userId: members[i].user.id, tournamentName: currentElitiriCup }
							});

							//check for registration
							if (registeredPlayer) {
								//Assign Elitiri role if not there yet
								try {
									if (!members[i].roles.cache.has(ElitiriRole.id) && !registeredPlayer.rankAchieved) {
										//Assign role if not there yet
										await members[i].roles.add(ElitiriRole);
									}
								} catch (e) {
									console.error(e);
								}

								//Check which bracket role should be received
								let correctRole = '';
								if (registeredPlayer.bracketName === 'Top Bracket') {
									correctRole = '803217634165391390';
								} else if (registeredPlayer.bracketName === 'Middle Bracket') {
									correctRole = '803217866631413801';
								} else if (registeredPlayer.bracketName === 'Lower Bracket') {
									correctRole = '803217971782352907';
								} else if (registeredPlayer.bracketName === 'Beginner Bracket') {
									correctRole = '803218142453170226';
								}

								if (registeredPlayer.rankAchieved) {
									correctRole = '';
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
											console.error(e);
										}
									} else {
										try {
											if (members[i].roles.cache.has(bracketRoles[j])) {
												//Remove role if not removed yet
												await members[i].roles.remove(bracketRoleObjects[j]);
											}
										} catch (e) {
											console.error(e);
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
										console.error(e);
									}
								}
							}

							logDatabaseQueries(2, 'processQueueTasks/elitiriRoleAssignment.js DBDiscordUsers');
							//Get the user from the DBDiscordUsers
							const discordUser = await DBDiscordUsers.findOne({
								where: { userId: members[i].user.id }
							});

							if (discordUser && discordUser.osuUserId && discordUser.osuVerified) {
								//Find out if they are registered or not
								logDatabaseQueries(2, 'processQueueTasks/elitiriRoleAssignment.js DBElitiriCupStaff');
								const staffSignups = await DBElitiriCupStaff.findAll({
									where: { osuUserId: discordUser.osuUserId }
								});

								if (staffSignups.length > 0) {
									//Assign Alumni role if not there yet
									try {
										if (!members[i].roles.cache.has(alumniRole.id)) {
											//Assign role if not there yet
											await members[i].roles.add(alumniRole);
										}
									} catch (e) {
										console.error(e);
									}
								}

								let currentIterationRecordExists = false;

								for (let j = 0; j < staffSignups.length; j++) {
									if (staffSignups[j].tournamentName === currentElitiriCup) {
										currentIterationRecordExists = true;
										if (staffSignups[j].host) {
											//Assign host role if not there yet
											try {
												if (!members[i].roles.cache.has(hostRole.id)) {
													//Assign role if not there yet
													await members[i].roles.add(hostRole);
												}
											} catch (e) {
												console.error(e);
											}
										} else {
											//Remove host role if not removed yet
											try {
												if (members[i].roles.cache.has(hostRole.id)) {
													//Remove role if not removed yet
													await members[i].roles.remove(hostRole);
												}
											} catch (e) {
												console.error(e);
											}
										}

										if (staffSignups[j].streamer) {
											//Assign streamer role if not there yet
											try {
												if (!members[i].roles.cache.has(streamerRole.id)) {
													//Assign role if not there yet
													await members[i].roles.add(streamerRole);
												}
											} catch (e) {
												console.error(e);
											}
										} else {
											//Remove streamer role if not removed yet
											try {
												if (members[i].roles.cache.has(streamerRole.id)) {
													//Remove role if not removed yet
													await members[i].roles.remove(streamerRole);
												}
											} catch (e) {
												console.error(e);
											}
										}

										if (staffSignups[j].commentator) {
											//Assign commentator role if not there yet
											try {
												if (!members[i].roles.cache.has(commentatorRole.id)) {
													//Assign role if not there yet
													await members[i].roles.add(commentatorRole);
												}
											} catch (e) {
												console.error(e);
											}
										} else {
											//Remove commentator role if not removed yet
											try {
												if (members[i].roles.cache.has(commentatorRole.id)) {
													//Remove role if not removed yet
													await members[i].roles.remove(commentatorRole);
												}
											} catch (e) {
												console.error(e);
											}
										}

										if (staffSignups[j].referee) {
											//Assign referee role if not there yet
											try {
												if (!members[i].roles.cache.has(refereeRole.id)) {
													//Assign role if not there yet
													await members[i].roles.add(refereeRole);
												}
											} catch (e) {
												console.error(e);
											}
										} else {
											//Remove referee role if not removed yet
											try {
												if (members[i].roles.cache.has(refereeRole.id)) {
													//Remove role if not removed yet
													await members[i].roles.remove(refereeRole);
												}
											} catch (e) {
												console.error(e);
											}
										}

										if (staffSignups[j].replayer) {
											//Assign replayer role if not there yet
											try {
												if (!members[i].roles.cache.has(replayerRole.id)) {
													//Assign role if not there yet
													await members[i].roles.add(replayerRole);
												}
											} catch (e) {
												console.error(e);
											}
										} else {
											//Remove replayer role if not removed yet
											try {
												if (members[i].roles.cache.has(replayerRole.id)) {
													//Remove role if not removed yet
													await members[i].roles.remove(replayerRole);
												}
											} catch (e) {
												console.error(e);
											}
										}
									}
								}

								if (!currentIterationRecordExists) {
									//Remove all roles if no record exists
									try {
										if (members[i].roles.cache.has(hostRole.id)) {
											//Remove role if not removed yet
											await members[i].roles.remove(hostRole);
										}
									} catch (e) {
										console.error(e);
									}

									try {
										if (members[i].roles.cache.has(streamerRole.id)) {
											//Remove role if not removed yet
											await members[i].roles.remove(streamerRole);
										}
									} catch (e) {
										console.error(e);
									}

									try {
										if (members[i].roles.cache.has(commentatorRole.id)) {
											//Remove role if not removed yet
											await members[i].roles.remove(commentatorRole);
										}
									}
									catch (e) {
										console.error(e);
									}

									try {
										if (members[i].roles.cache.has(refereeRole.id)) {
											//Remove role if not removed yet
											await members[i].roles.remove(refereeRole);
										}
									} catch (e) {
										console.error(e);
									}

									try {
										if (members[i].roles.cache.has(replayerRole.id)) {
											//Remove role if not removed yet
											await members[i].roles.remove(replayerRole);
										}
									} catch (e) {
										console.error(e);
									}
								}
							}
						}
					});
			}
		}, {
			context: {}
		});

		processQueueEntry.destroy();
	}
};