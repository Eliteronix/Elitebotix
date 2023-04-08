const http = require('http');
const url = require('url');
const fs = require('fs');

// Define the HTTP server
const browserSourceServer = http.createServer(async (req, res) => {
	// Retrieve route from request object
	const route = url.parse(req.url).pathname;

	if (route.startsWith('/duelRating/')) {
		const osuUserId = route.replace('/duelRating/', '');

		if (isNaN(osuUserId)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Invalid osu! user id');
			return;
		}

		// Check if the image exists
		if (!fs.existsSync(`./duelratingcards/${osuUserId}.png`)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Please create the image using /osu-duel rating');
			return;
		}

		// Send the image from the duelratingcards folder
		res.setHeader('Content-Type', 'image/png');
		res.end(fs.readFileSync(`./duelratingcards/${osuUserId}.png`));
	} else if (route.startsWith('/history/')) {
		const osuUserId = route.replace('/history/', '');

		if (isNaN(osuUserId)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Invalid osu! user id');
			return;
		}

		// Check if the image exists
		if (!fs.existsSync(`./historycards/${osuUserId}.png`)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Please create the image using /osu-history');
			return;
		}

		// Send the image from the duelratingcards folder
		res.setHeader('Content-Type', 'image/png');
		res.end(fs.readFileSync(`./historycards/${osuUserId}.png`));
	} else if (route.startsWith('/historywithdetails/')) {
		const osuUserId = route.replace('/historywithdetails/', '');

		if (isNaN(osuUserId)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Invalid osu! user id');
			return;
		}

		// Check if the image exists
		if (!fs.existsSync(`./historycardswithdetails/${osuUserId}.png`)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Please create the image using /osu-history showtournamentdetails:true');
			return;
		}

		// Send the image from the duelratingcards folder
		res.setHeader('Content-Type', 'image/png');
		res.end(fs.readFileSync(`./historycardswithdetails/${osuUserId}.png`));
	} else if (route.startsWith('/wrapped/')) {
		const year = route.replace('/wrapped/', '').split('/')[0];

		if (isNaN(year)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Invalid year');
			return;
		}

		const osuUserId = route.replace('/wrapped/', '').split('/')[1];

		if (isNaN(osuUserId)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Invalid osu! user id');
			return;
		}

		// Check if the image exists
		if (!fs.existsSync(`./wrappedcards/${year}/${osuUserId}.png`)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end(`Please create the image using /osu-wrapped year:${year}`);
			return;
		}

		// Send the image from the duelratingcards folder
		res.setHeader('Content-Type', 'image/png');
		res.end(fs.readFileSync(`./wrappedcards/${year}/${osuUserId}.png`));
	}
});

// Start the HTTP server which exposes the browsersources on http://localhost:80/duelRating/1234
browserSourceServer.listen(80);