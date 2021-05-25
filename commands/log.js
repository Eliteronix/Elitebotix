module.exports = {
	name: 'log',
	//aliases: ['developer'],
	description: 'Logs the message in the console',
	//usage: '<bug/feature/request> <description>',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	//botPermissions: 'MANAGE_ROLES',
	//botPermissionsTranslated: 'Manage Roles',
	//guildOnly: true,
	//args: true,
	cooldown: 5,
	noCooldownMessage: true,
	tags: 'debug',
	prefixCommand: true,
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args) {
		console.log(msg);

		const { GoogleSpreadsheet } = require('google-spreadsheet');

		// Initialize the sheet - doc ID is the long id in the sheets URL
		const doc = new GoogleSpreadsheet('1jjZm93sA0XQs6Zfgh1Ev-46IuNunobDiW80uQMM8K2k');

		// Initialize Auth - see more available options at https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
		await doc.useServiceAccountAuth({
			// eslint-disable-next-line no-undef
			client_email: process.env.GOOGLESHEETSSERVICEACCOUNTMAIL,
			// eslint-disable-next-line no-undef
			private_key: process.env.GOOGLESHEETSSERVICEACCOUNTPRIVATEKEY.replace(/\\n/g, '\n'),
		});

		await doc.loadInfo(); // loads document properties and worksheet

		console.log(doc);
	},
};