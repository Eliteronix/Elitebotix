module.exports = {
	name: 'guildCommands',
	usage: '<[commandnames seperated with whitespace]>',
	async execute(interaction) {
		const { REST, Routes } = require('discord.js');
		const fs = require('fs');

		const commands = [];
		// Grab all the command files from the commands directory you created earlier
		const commandFiles = fs.readdirSync('./commands');

		// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
		for (const file of commandFiles) {
			if (!file.endsWith('.js')) {
				continue;
			}

			const command = require(`../${file}`);

			if (interaction.options.getString('argument').includes(command.name)) {
				commands.push(command.data.toJSON());
			}
		}

		// Construct and prepare an instance of the REST module
		// eslint-disable-next-line no-undef
		const rest = new REST({ version: '10' }).setToken(process.env.BOTTOKEN);

		// and deploy your commands!
		return (async () => {
			try {
				await interaction.followUp({ content: `Started adding ${commands.length} application (/) commands.` });

				// The put method is used to fully refresh all commands in the guild with the current set
				await rest.put(
					Routes.applicationGuildCommands(interaction.client.user.id, interaction.guildId),
					{ body: commands },
				);

				await interaction.followUp({ content: `Successfully added ${commands.length} application (/) commands.` });
			} catch (error) {
				// And of course, make sure you catch and log any errors!
				console.error(error);
			}
		})();
	},
};