const { PermissionsBitField } = require('discord.js');
const { DBDiscordUsers, DBBirthdayGuilds } = require('../dbObjects');
const { Op } = require('sequelize');
const { showUnknownInteractionError } = require('../config.json');

module.exports = {
	name: 'birthday',
	description: 'Set your birthday',
	//permissions: 'MANAGE_GUILD',
	//permissionsTranslated: 'Manage Server',
	botPermissions: [PermissionsBitField.Flags.SendMessages],
	botPermissionsTranslated: 'Send Messages',
	cooldown: 10,
	tags: 'misc',
	// eslint-disable-next-line no-unused-vars
	async execute(msg, args, interaction, additionalObjects) {
		try {
			await interaction.deferReply({ ephemeral: true });
		} catch (error) {
			if (error.message === 'Unknown interaction' && showUnknownInteractionError || error.message !== 'Unknown interaction') {
				console.error(error);
			}
			return;
		}

		if (interaction.options._subcommand === 'set') {
			let date = new Date();
			date.setUTCSeconds(0);
			date.setUTCHours(0);
			date.setUTCMinutes(0);
			date.setUTCMilliseconds(0);
			date.setUTCFullYear(0);

			for (let i = 0; i < interaction.options._hoistedOptions.length; i++) {
				if (interaction.options._hoistedOptions[i].name === 'date') {
					date.setUTCDate(interaction.options._hoistedOptions[i].value);
				} else if (interaction.options._hoistedOptions[i].name === 'month') {
					date.setUTCMonth(interaction.options._hoistedOptions[i].value - 1);
				}
			}

			let user = await DBDiscordUsers.findOne({
				where: {
					userId: interaction.member.user.id,
				},
			});

			if (!user) {
				user = await DBDiscordUsers.create({
					userId: interaction.member.user.id,
				});
			}

			user.birthday = date;
			user.save();

			let guilds = await DBBirthdayGuilds.findAll({
				where: {
					userId: interaction.member.user.id,
				}
			});

			let now = new Date();

			while (date < now) {
				date.setUTCFullYear(date.getUTCFullYear() + 1);
			}

			for (let i = 0; i < guilds.length; i++) {
				guilds[i].birthdayTime = date;
				await guilds[i].save();
			}

			// date string in the following format "Full Month Name, Day"
			let dateString = date.toLocaleDateString('en-US', {
				month: 'long',
				day: 'numeric',
			});
			return await interaction.editReply({ content: `Your birthday has been set for \`${dateString}\``, ephemeral: true });
		} else if (interaction.options._subcommand === 'enable') {

			let currentGuild = await DBBirthdayGuilds.findOne({
				where: {
					guildId: interaction.guild.id,
					userId: interaction.member.user.id,
				},
			});

			if (currentGuild) {
				return await interaction.editReply({ content: `You are already sharing your birthday on ${interaction.guild.name}`, ephemeral: true });
			}

			let dbDiscordUser = await DBDiscordUsers.findOne({
				where: {
					userId: interaction.member.user.id,
					birthday: {
						[Op.ne]: null,
					}
				},
			});

			if (!dbDiscordUser || dbDiscordUser && !dbDiscordUser.birthday) {
				return await interaction.editReply({ content: 'You currently don\'t have your birthday set. Please set your birthday first by using </birthday set:1064501937875202091>', ephemeral: true });
			}

			let now = new Date();
			let nextBirthday = dbDiscordUser.birthday;

			while (nextBirthday < now) {
				nextBirthday.setUTCFullYear(nextBirthday.getUTCFullYear() + 1);
			}

			await DBBirthdayGuilds.create({
				guildId: interaction.guild.id,
				userId: interaction.member.user.id,
				birthdayTime: nextBirthday,
			});

			return await interaction.editReply({ content: `Your birthday will now be shared on ${interaction.guild.name}`, ephemeral: true });
		} else if (interaction.options._subcommand === 'disable') {
			let currentGuild = await DBBirthdayGuilds.findOne({
				where: {
					guildId: interaction.guild.id,
					userId: interaction.member.user.id,
				},
			});

			//No guild found
			if (!currentGuild) {
				return await interaction.editReply({ content: 'You were not sharing your birthday on this server.', ephemeral: true });
			}

			//Delete guild
			await currentGuild.destroy();
			return await interaction.editReply({ content: `Your birthday will no longer be shared on ${interaction.guild.name}`, ephemeral: true });
		}
	}
};