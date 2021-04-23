const { DBDiscordUsers, DBMOTDPoints } = require('../dbObjects');
const Discord = require('discord.js');
const Canvas = require('canvas');
const { humanReadable } = require('../utils.js');

module.exports = {
	createLeaderboard: async function (client, since, topAmount, title, channelID) {
		const channel = await client.channels.fetch(channelID);
		channel.messages.fetch({ limit: 100 })
			.then(async (messages) => {
				const messagesArray = messages.filter(m => m.content === 'Daily Update').array();

				for (let i = 0; i < messagesArray.length; i++) {
					messagesArray[i].delete();
				}
			});

		const allBrackets = await getPlayers(client);

		for (let i = 0; i < allBrackets.length; i++) {
			let bracketPlayers = allBrackets[i];

			let bracketPlayerResults = [];

			for (let j = 0; j < bracketPlayers.length; j++) {
				let playerResults = await DBMOTDPoints.findAll({
					where: { userId: bracketPlayers[j].userId, osuUserId: bracketPlayers[j].osuUserId }
				});

				for (let k = 0; k < playerResults.length; k++) {
					if (playerResults[k].matchDate < since || //Time
						i === 0 && playerResults[k].osuRank > 9999 //Top Bracket
						|| i === 1 && (playerResults[k].osuRank < 10000 || playerResults[k].osuRank > 49999) // Middle Bracket
						|| i === 2 && (playerResults[k].osuRank < 50000 || playerResults[k].osuRank > 99999) // Lower Bracket
						|| i === 3 && playerResults[k].osuRank < 100000) { //Beginner Bracket
						playerResults.splice(k, 1);
						k--;
					}
				}

				if (playerResults.length === 0) {
					bracketPlayers.splice(j, 1);
					j--;
				} else {
					quicksort(playerResults);

					let totalPlayerPoints = 0;
					let qualifierPlayerPoints = 0;
					let knockoutPlayerPoints = 0;
					let playedRounds = 0;

					for (let k = 0; k < playerResults.length && k < topAmount; k++) {
						totalPlayerPoints += parseInt(playerResults[k].totalPoints);
						qualifierPlayerPoints += parseInt(playerResults[k].qualifierPoints);
						knockoutPlayerPoints += parseInt(playerResults[k].knockoutPoints);
						playedRounds++;
					}

					let playerResult = {
						userId: bracketPlayers[j].userId,
						osuUserId: bracketPlayers[j].osuUserId,
						osuName: bracketPlayers[j].osuName,
						totalPoints: totalPlayerPoints,
						qualifierPoints: qualifierPlayerPoints,
						knockoutPoints: knockoutPlayerPoints,
						playedRounds: playedRounds
					};

					bracketPlayerResults.push(playerResult);
				}
			}

			quicksort(bracketPlayerResults);

			//Create leaderboard
			const canvasWidth = 1000;
			const canvasHeight = 125 + 20 + bracketPlayerResults.length * 90;

			//Create Canvas
			const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);

			//Get context and load the image
			const ctx = canvas.getContext('2d');
			const background = await Canvas.loadImage('./other/osu-background.png');
			for (let i = 0; i < canvas.height / 500; i++) {
				ctx.drawImage(background, 0, i * 500, 1000, 500);
			}

			let bracketName = 'Top-Bracket';

			if (i === 1) {
				bracketName = 'Middle-Bracket';
			} else if (i === 2) {
				bracketName = 'Lower-Bracket';
			} else if (i === 3) {
				bracketName = 'Beginner-Bracket';
			}

			let elements = [canvas, ctx, bracketPlayerResults];

			elements = await drawTitle(elements, title, bracketName);

			elements = await drawAccounts(elements);

			await drawFooter(elements);

			//Create as an attachment
			const attachment = new Discord.MessageAttachment(canvas.toBuffer(), `osu-MOTD-leaderboard-${bracketName}-${title}.png`);

			let content = 'Daily Update';

			let today = new Date();
			let tomorrow = new Date();
			tomorrow.setUTCDate(today.getUTCDate() + 1);

			const todayFormatted = `${today.getUTCDate()}.${today.getUTCMonth().toString().padStart(2, '0')}.${today.getUTCFullYear()}`;

			if (title === 'Daily') {
				content = `Leaderboard from \`${todayFormatted}\``;
			} else if (title === 'Weekly' && today.getUTCDay() === 7) { //Sunday
				content = `Leaderboard from \`${todayFormatted}\``;
			} else if (title === 'Monthly' && tomorrow.getUTCDate() === 1) { //1st of the month is tomorrow
				content = `Leaderboard from \`${todayFormatted}\``;
			} else if (title === 'Quarter Yearly' && tomorrow.getUTCDate() === 1 && (tomorrow.getUTCMonth() === 1 || tomorrow.getUTCMonth() === 4 || tomorrow.getUTCMonth() === 7 || tomorrow.getUTCMonth() === 10)) {
				content = `Leaderboard from \`${todayFormatted}\``;
			} else if (title === 'All Time') {
				content = `Leaderboard from \`${todayFormatted}\``;
			}

			//Send attachment
			await channel.send(content, attachment);
		}
	}
};

function partition(list, start, end) {
	const pivot = list[end];
	let i = start;
	for (let j = start; j < end; j += 1) {
		if (parseFloat(list[j].totalPoints) >= parseFloat(pivot.totalPoints)) {
			[list[j], list[i]] = [list[i], list[j]];
			i++;
		}
	}
	[list[i], list[end]] = [list[end], list[i]];
	return i;
}

function quicksort(list, start = 0, end = undefined) {
	if (end === undefined) {
		end = list.length - 1;
	}
	if (start < end) {
		const p = partition(list, start, end);
		quicksort(list, start, p - 1);
		quicksort(list, p + 1, end);
	}
	return list;
}

async function getPlayers(client) {
	const registeredUsers = await DBDiscordUsers.findAll({
		where: { osuMOTDRegistered: 1 }
	});

	let topBracketPlayers = [];
	let middleBracketPlayers = [];
	let lowerBracketPlayers = [];
	let beginnerBracketPlayers = [];

	for (let i = 0; i < registeredUsers.length; i++) {
		if (registeredUsers[i].osuUserId) {
			if (registeredUsers[i].osuRank < 10000) {
				topBracketPlayers.push(registeredUsers[i]);
			} else if (registeredUsers[i].osuRank < 50000) {
				middleBracketPlayers.push(registeredUsers[i]);
			} else if (registeredUsers[i].osuRank < 100000) {
				lowerBracketPlayers.push(registeredUsers[i]);
			} else if (registeredUsers[i].osuRank < 10000000) {
				beginnerBracketPlayers.push(registeredUsers[i]);
			}
		} else {
			registeredUsers[i].osuMOTDRegistered = 0;
			await registeredUsers[i].save();

			client.users.fetch(registeredUsers[i].userId)
				.then(async (user) => {
					user.send('It seems like you removed your connected osu! account and have been removed as a player for the `Maps of the Day` competition because of that.\nIf you want to take part again please reconnect your osu! account and use `e!osu-motd register` again.');
				});
		}
	}

	let allPlayers = [];
	allPlayers.push(topBracketPlayers);
	allPlayers.push(middleBracketPlayers);
	allPlayers.push(lowerBracketPlayers);
	allPlayers.push(beginnerBracketPlayers);

	return allPlayers;
}

async function drawTitle(input, title, bracketName) {
	let canvas = input[0];
	let ctx = input[1];
	let playerResults = input[2];

	// Write the title of the map
	ctx.font = 'bold 35px sans-serif';
	ctx.fillStyle = '#ffffff';
	ctx.textAlign = 'center';
	ctx.fillText(`osu! ${title} MOTD leaderboard for ${bracketName}`, canvas.width / 2, 50);

	const output = [canvas, ctx, playerResults];
	return output;
}

async function drawAccounts(input) {
	let canvas = input[0];
	let ctx = input[1];
	let playerResults = input[2];

	// Write the players
	ctx.textAlign = 'left';

	for (let i = 0; i < playerResults.length; i++) {
		if (i === 0) {
			ctx.fillStyle = '#E2B007';
		} else if (i === 1) {
			ctx.fillStyle = '#C4CACE';
		} else if (i === 2) {
			ctx.fillStyle = '#CC8E34';
		} else {
			ctx.fillStyle = '#ffffff';
		}

		ctx.font = 'bold 25px sans-serif';
		ctx.fillText(`${i + 1}.`, canvas.width / 1000 * 125, 125 + i * 90);
		ctx.fillText(playerResults[i].osuName, canvas.width / 1000 * 200, 125 + i * 90);
		ctx.font = '25px sans-serif';
		ctx.fillText(`Points: ${humanReadable(playerResults[i].totalPoints.toString())} (${humanReadable(playerResults[i].qualifierPoints.toString())} from Qualifiers | ${humanReadable(playerResults[i].knockoutPoints.toString())} from Knockout | ${humanReadable(playerResults[i].playedRounds.toString())} Rounds)`, canvas.width / 1000 * 200, 160 + i * 90);
	}

	const output = [canvas, ctx, playerResults];
	return output;
}

async function drawFooter(input) {
	let canvas = input[0];
	let ctx = input[1];
	let playerResults = input[2];

	let today = new Date().toLocaleDateString();

	ctx.font = 'bold 15px sans-serif';
	ctx.fillStyle = '#ffffff';

	ctx.textAlign = 'right';
	ctx.fillText(`Made by Elitebotix on ${today}`, canvas.width - canvas.width / 140, canvas.height - 10);

	const output = [canvas, ctx, playerResults];
	return output;
}