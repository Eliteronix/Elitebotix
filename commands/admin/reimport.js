const { DBOsuMultiMatches, DBOsuMultiGameScores, DBOsuMultiGames } = require('../../dbObjects');
const { getIDFromPotentialOsuLink, saveOsuMultiScores, pause, logDatabaseQueries } = require('../../utils');
const osu = require('node-osu');

module.exports = {
	name: 'reimport',
	usage: '<[matchId/link seperated with whitespace]>',
	async execute(interaction) {
		const matchIds = interaction.options.getString('argument').split(/ +/);

		// eslint-disable-next-line no-undef
		const osuApi = new osu.Api(process.env.OSUTOKENV1, {
			// baseUrl: sets the base api url (default: https://osu.ppy.sh/api)
			notFoundAsError: true, // Throw an error on not found instead of returning nothing. (default: true)
			completeScores: false, // When fetching scores also fetch the beatmap they are for (Allows getting accuracy) (default: false)
			parseNumeric: false // Parse numeric values into numbers/floats, excluding ids
		});

		for (let i = 0; i < matchIds.length; i++) {
			await osuApi.getMatch({ mp: getIDFromPotentialOsuLink(matchIds[i]) })
				.then(async (match) => {
					logDatabaseQueries(4, 'commands/admin/reimport.js DBOsuMultiMatches');
					await DBOsuMultiMatches.destroy({ where: { matchId: match.id } });

					logDatabaseQueries(4, 'commands/admin/reimport.js DBOsuMultiGames');
					await DBOsuMultiGames.destroy({ where: { matchId: match.id } });

					logDatabaseQueries(4, 'commands/admin/reimport.js DBOsuMultiGameScores');
					await DBOsuMultiGameScores.destroy({ where: { matchId: match.id } });

					await saveOsuMultiScores(match, interaction.client);

					await interaction.followUp(`Saved match https://osu.ppy.sh/mp/${match.id}`);
				})
				.catch(async () => {
					//Nothing
				});

			await pause(1000);
		}

		try {
			await interaction.followUp(`Imported ${matchIds.length} matches.`);
		} catch (error) {
			await interaction.channel.send(`Imported ${matchIds.length} matches.`);
		}
	},
};