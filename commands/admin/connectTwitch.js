const { DBDiscordUsers, DBElitebotixBanchoProcessQueue } = require('../../dbObjects');
const { logBroadcastEval } = require('../../config.json');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'connectTwitch',
	usage: '<discordId> <twitchName>',
	async execute(interaction) {
		let args = interaction.options.getString('argument').split(/ +/);

		let discordId = args[0];

		logDatabaseQueries(4, 'commands/admin/connectTwitch.js DBDiscordUsers');
		let discordUser = await DBDiscordUsers.findOne({
			attributes: ['id', 'twitchName', 'twitchId', 'twitchVerified'],
			where: {
				userId: discordId
			}
		});

		if (!discordUser) {
			discordUser = await DBDiscordUsers.create({
				userId: discordId,
			});

			await interaction.followUp(`Created a discord entry for discord user <@${discordId}>`);
		}

		let twitchName = args[1];

		let response = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, {
			method: 'POST',
		});

		let json = await response.json();

		let accessToken = json.access_token;

		// Do a GET https://api.twitch.tv/helix/users?login=USERNAME
		response = await fetch(`https://api.twitch.tv/helix/users?login=${twitchName}`, {
			headers: {
				'Client-ID': process.env.TWITCH_CLIENT_ID,
				'Authorization': `Bearer ${accessToken}`
			}
		});

		if (response.status === 200) {
			let json = await response.json();
			if (json.data.length > 0) {
				discordUser.twitchName = json.data[0].login;
				discordUser.twitchId = json.data[0].id;
				discordUser.twitchVerified = true;
				await discordUser.save();

				if (logBroadcastEval) {
					// eslint-disable-next-line no-console
					console.log('Broadcasting commands/admin/connectTwitch.js to shards...');
				}

				// await interaction.client.shard.broadcastEval(async (c, { channelName }) => {
				// 	if (c.shardId === 0) {
				// 		c.twitchClient.join(channelName);
				// 	}
				// }, { context: { channelName: discordUser.twitchName } });

				await DBElitebotixBanchoProcessQueue.create({
					task: 'joinTwitchChannel',
					additions: discordUser.twitchName,
					date: new Date(),
				});

				await interaction.followUp('The twitch account has been connected.');
			} else {
				await interaction.editReply('The twitch account you entered does not exist.');
			}
		} else {
			console.error(response);
			await interaction.editReply('There was an error connecting the twitch account. Please try again later.');
		}
	},
};