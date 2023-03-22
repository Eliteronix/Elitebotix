const { DBElitiriCupSignUp } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'deleteElitiriSignup',
	usage: '<id>',
	async execute(interaction) {
		//TODO: add attributes and logdatabasequeries
		logDatabaseQueries(4, 'commands/admin/deleteElitiriSignup.js DBElitiriCupSignUp');
		let DBElitiriSignup = await DBElitiriCupSignUp.findOne({
			where: {
				id: interaction.options.getString('argument')
			}
		});

		if (DBElitiriSignup) {
			DBElitiriSignup.destroy();
			// eslint-disable-next-line no-console
			await interaction.editReply(`Deleted Elitiri Signup: ${interaction.options.getString('argument')}`);
		} else {
			await interaction.editReply('Signup not found');
		}
	},
};