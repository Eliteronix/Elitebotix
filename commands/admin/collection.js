const fs = require('fs');

module.exports = {
	name: 'collection',
	usage: 'None',
	async execute(interaction) {
		// Open the collection.db file from ../../other/collection.db

		fs.readFile('./other/collection.db', 'hex', function (err, data) {
			if (err) {
				return console.log(err);
			}
			console.log(data);

			console.log(data.substring(0, 8));

			console.log(data.substring(8, 16));

			// String indicator check
			console.log(data.substring(16, 18));

			// String length check
			console.log(data.substring(18, 20));

			// log the next 5 bytes
			console.log(data.substring(20, 30));

			//Convert the next 5 bytes to utf8
			// eslint-disable-next-line no-undef
			console.log(Buffer.from(data.substring(20, 30), 'hex').toString('utf8'));

			// log the amount of maps
			console.log(data.substring(30, 38));

			// Another string indicator check
			console.log(data.substring(38, 40));

			// Another string length check
			console.log(data.substring(40, 42));

			// log the next 32 bytes
			console.log(data.substring(42, 106));

			//Convert the next 32 bytes to utf8
			// eslint-disable-next-line no-undef
			console.log(Buffer.from(data.substring(42, 106), 'hex').toString('utf8'));
		});

		await interaction.editReply('Check the console for the collection.db file');
	},
};