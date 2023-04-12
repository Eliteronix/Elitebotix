module.exports = {
	name: 'removeSlashCommand',
	usage: '<commandId>',
	async execute(interaction) {
		interaction.client.application.commands.fetch(interaction.options.getString('argument'))
			.then(command => {
				interaction.followUp(`Fetched command ${command.name}`);
				command.delete();
				interaction.followUp(`Deleted command ${command.name}`);
			});
	},
};