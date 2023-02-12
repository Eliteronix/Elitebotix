const { DBOsuForumPosts } = require('../../dbObjects');
const { logDatabaseQueries } = require('../../utils');

module.exports = {
	name: 'clearForumPosts',
	usage: 'None',
	async execute(interaction) {
		logDatabaseQueries(4, 'commands/admin/clearForumPosts.js DBOsuForumPosts clearForumPosts');
		let forumPosts = await DBOsuForumPosts.findAll();
		for (let i = 0; i < forumPosts.length; i++) {
			await forumPosts[i].destroy();
		}

		await interaction.editReply('Cleared all forum posts');
	},
};

