const { DBDiscordUsers } = require('../dbObjects');

module.exports = {
	assignPlayerRoles: async function (client) {
		const guild = await client.guilds.fetch('727407178499096597');

		await guild.members.fetch()
			.then(async (guildMembers) => {

				const members = guildMembers.filter(member => member.user.bot !== true).array();

				const bracketRoles = [
					'833313544400535613',
					'833313704136540171',
					'833313763188801578',
					'833313827172646912'
				];

				let bracketRoleObjects = [];

				for (let i = 0; i < bracketRoles.length; i++) {
					const role = await guild.roles.cache.get(bracketRoles[i]);
					bracketRoleObjects.push(role);
				}

				for (let i = 0; i < members.length; i++) {
					const registeredPlayer = await DBDiscordUsers.findOne({
						where: { userId: members[i].user.id, osuMOTDRegistered: true }
					});

					if (registeredPlayer) {
						const MOTDRole = await guild.roles.cache.get('833313361483530261');
						try {
							if (!members[i].roles.cache.has(MOTDRole.id)) {
								//Assign role if not there yet
								await members[i].roles.add(MOTDRole);
							}
						} catch (e) {
							return console.log(e);
						}

						let correctRole = '';
						if (parseInt(registeredPlayer.osuRank) < 10000) {
							correctRole = '833313544400535613';
						} else if (parseInt(registeredPlayer.osuRank) < 50000) {
							correctRole = '833313704136540171';
						} else if (parseInt(registeredPlayer.osuRank) < 100000) {
							correctRole = '833313763188801578';
						} else if (parseInt(registeredPlayer.osuRank) < 1000000) {
							correctRole = '833313827172646912';
						}

						for (let j = 0; j < bracketRoles.length; j++) {
							if (correctRole === bracketRoles[j]) {
								try {
									if (!members[i].roles.cache.has(bracketRoles[j])) {
										//Assign role if not there yet
										await members[i].roles.add(bracketRoleObjects[j]);
									}
								} catch (e) {
									return console.log(e);
								}
							} else {
								try {
									if (members[i].roles.cache.has(bracketRoles[j])) {
										//Remove role if not removed yet
										await members[i].roles.remove(bracketRoleObjects[j]);
									}
								} catch (e) {
									return console.log(e);
								}
							}
						}
					}
				}
			});
	}
};