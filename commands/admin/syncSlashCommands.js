module.exports = {
	name: 'syncSlashCommands',
	usage: 'None',
	async execute(interaction) {
		const { REST, Routes } = require('discord.js');
		const fs = require('node:fs');

		const commands = [];
		// Grab all the command files from the commands directory you created earlier
		const commandFiles = fs.readdirSync('./commands');

		// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
		for (const file of commandFiles) {
			if (!file.endsWith('.js')) {
				continue;
			}

			const command = require(`../../commands/${file}`);

			if (command.tags !== 'debug' && command.data || command.name === 'admin') {
				commands.push(command.data.toJSON());
			}
		}

		// eslint-disable-next-line no-undef
		const rest = new REST({ version: '10' }).setToken(process.env.BOTTOKEN);

		(async () => {
			try {
				interaction.followUp(`Started refreshing ${commands.length} application (/) commands.`);

				const data = await rest.put(
					Routes.applicationCommands(interaction.client.user.id),
					{ body: commands },
				);

				interaction.followUp(`Successfully reloaded ${data.length} application (/) commands.`);

				interaction.client.slashCommandData = data;
			} catch (error) {
				console.error(error);
			}
		})();
	},
};