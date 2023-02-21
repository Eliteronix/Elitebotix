const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

module.exports = {
	name: 'huismetbenen',
	usage: '<osuUserId>',
	async execute(interaction) {

		let res = await fetch(`https://api.huismetbenen.nl/player/nl/${interaction.options.getString('argument')}/topranks?mods=&mode=osu&sort=pp&order=desc`);

		res = await res.json();

		let mapIds = [];

		for (let i = 0; i < res.length; i++) {
			mapIds.push(res[i].beatmap.map_id);
		}

		let resLength = res.length;
		let lastUid = res[res.length - 1].uid;

		while (resLength === 50) {
			res = await fetch(`https://api.huismetbenen.nl/player/nl/${interaction.options.getString('argument')}/topranks?mods=&mode=osu&sort=pp&order=desc&page=next&uid=${lastUid}`);

			res = await res.json();

			resLength = res.length;

			lastUid = res[res.length - 1].uid;

			for (let i = 0; i < res.length; i++) {
				mapIds.push(res[i].beatmap.map_id);
			}
		}

		await interaction.editReply('Maps: ```' + mapIds.join(' ') + '```');
	},
};