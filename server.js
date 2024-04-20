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
	} else if (route.startsWith('/mappack/')) {
		const mappackId = route.replace('/mappack/', '');

		if (!mappackId) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Invalid mappack id');
			return;
		}

		// Check if the zip exists
		if (!fs.existsSync(`./mappacks/${mappackId}.zip`)) {
			res.setHeader('Content-Type', 'text/plain');
			res.end('Please create the mappack using /osu-mappool mappack');
			return;
		}

		// Provide the zip file
		res.setHeader('Content-Type', 'application/zip');
		res.end(fs.readFileSync(`./mappacks/${mappackId}.zip`));
	}
});

// Start the HTTP server which exposes the browsersources on http://localhost:80/duelRating/1234
browserSourceServer.listen(80);

// Start the HTTPS server which exposes the browsersources on https://localhost:443/duelRating/1234
// browserSourceServer.listen(443);