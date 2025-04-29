/* eslint-disable no-console */
// eslint-disable-next-line no-console
console.log('Migrating database...');
const { DBOsuMultiMatches } = require('./dbObjects');

(async () => {
	// Update the acronym field in the DBOsuMultiScores table
	// let acronym = match.name.toLowerCase().replace(/:.+/gm, '').trim();
	let updated = await DBOsuMultiMatches.update({
		acronym: DBOsuMultiMatches.sequelize.fn(
			'trim',
			DBOsuMultiMatches.sequelize.fn(
				'substr',
				DBOsuMultiMatches.sequelize.col('matchName'),
				1,
				DBOsuMultiMatches.sequelize.literal('instr(matchName, ":") - 1')
			)
		),
	}, {
		where: {
			acronym: null,
		},
	});

	// Log the number of updated rows
	console.log(`Updated ${updated[0]} rows in the DBOsuMultiMatches table.`);
})();