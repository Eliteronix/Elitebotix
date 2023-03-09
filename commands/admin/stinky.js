module.exports = {
	name: 'stinky',
	usage: 'None',
	async execute(interaction) {
		let loon = await interaction.client.users.fetch('333607086065713154');

		loon.send('Loon stinky <:SCP939:1013476426541969419>');

		return await interaction.editReply('Called loon stinky <:SCP939:1013476426541969419>');
	},
};