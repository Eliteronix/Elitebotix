const { DBElitiriCupSignUp } = require('../dbObjects');

module.exports = {
	// eslint-disable-next-line no-unused-vars
	async execute(client, processQueueEntry) {
		//Fetch server
		const guild = await client.guilds.fetch('727407178499096597');

		//Fetch all members
		await guild.members.fetch()
			.then(async (guildMembers) => {

				//Filter members and push into array
				const members = guildMembers.filter(member => member.user.bot !== true).array();

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

				//Iterate through all members
				for (let i = 0; i < members.length; i++) {
					//Find out if they are registered or not
					const registeredPlayer = await DBElitiriCupSignUp.findOne({
						where: { userId: members[i].user.id }
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
							console.log(e);
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