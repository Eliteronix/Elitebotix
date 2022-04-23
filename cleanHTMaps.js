const { DBOsuMultiScores } = require('./dbObjects');
const { Op } = require('sequelize');
const { getMods, getModBits } = require('./utils');

DBOsuMultiScores.findAll({
	where: {
		rawMods: {
			[Op.gt]: 0
		}
	}
}).then(async (faultyHTMaps) => {
	for (let i = 0; i < faultyHTMaps.length; i++) {
		if (getMods(faultyHTMaps[i].rawMods).includes('HT')) {
			let mods = getMods(faultyHTMaps[i].rawMods);

			for (let i = 0; i < mods.length; i++) {
				if (mods[i] === 'HT') {
					mods.splice(i, 1);
					i--;
				}
			}

			faultyHTMaps[i].rawMods = getModBits(mods.join(''));
			faultyHTMaps[i].pp = null;
			await faultyHTMaps[i].save();
			console.log(`Finished ${i + 1} of ${faultyHTMaps.length}`);
		}
	}
});
