const express = require("express");
const serveIndex = require('serve-index');
const app = express();
const cors = require('cors');
const path = require('path');
const swStats = require('swagger-stats')
const sub2vtt = require('sub2vtt');

const stream = require("./source");
const manifest = require("./manifest.json");
const ErrorHandler = require("./ErrorHandler.js");

app.use((req, res, next) => {
    req.setTimeout(150 * 1000); // timeout time
    req.socket.removeAllListeners('timeout'); 
    req.socket.once('timeout', () => {
        req.timedout = true;
        res.status(504).end();
    });
	if (!req.timedout) next()
});

app.set('trust proxy', true)

app.use('/logs', express.static(path.join(__dirname, 'logs')), serveIndex('logs', {'icons': true}))

app.use('/', express.static(path.join(__dirname, 'vue', 'dist')));
app.use('/assets', express.static(path.join(__dirname, 'vue', 'dist', 'assets')));

app.use(cors())

app.use(swStats.getMiddleware({
	name: manifest.name,
	version: manifest.version,
	authentication: true,
	onAuthenticate: function (req, username, password) {
		// simple check for username and password
		const User = process.env.USER?process.env.USER:'stremio'
		const Pass = process.env.PASS?process.env.PASS:'stremioIsTheBest'
		return ((username === User
			&& (password === Pass)))
	}
}))


app.get('/manifest.json', (_, res) => {
	res.setHeader('Cache-Control', 'max-age=86400, public');
	res.setHeader('Content-Type', 'application/json');
	res.send(manifest);
	res.end();
});

app.get('/stream/:type/:id/:extra?.json', async (req, res) => {
	try{
		//res.setHeader('Cache-Control', 'max-age=86400, public');
		res.setHeader('Content-Type', 'application/json');
		const args = req.params;
		let streams = [];
		console.log("addon.js streams:", args);
		if (args.id.match(/tt[^0-9]*/i)||args.id.match(/kitsu:[^0-9]*/i)) {
			streams = await Promise.resolve(stream(args.type, args.id,))
		} 
		if(streams){
			res.setHeader('Cache-Control', 'max-age=3600, must-revalidate, stale-while-revalidate=1800, stale-if-error=1800, public');
			res.send({ streams: streams }); 
		} else {
			res.send({ streams: [] });
		}
	}catch(e){
		log.error(e);
		next(e);
	}
	
})

app.get('/sub.vtt', async (req, res) => {
	try {

		res.setHeader('Cache-Control', 'max-age=3600, must-revalidate, stale-while-revalidate=1800, stale-if-error=1800, public');
		let url,proxy;
		if (req?.query?.proxy) proxy = JSON.parse(Buffer.from(req.query.proxy, 'base64').toString());
		if (req?.query?.from) url = req.query.from
		else throw 'error: no url';
		console.log("url", url,"proxy",proxy)
		generated = sub2vtt.gerenateUrl(url,{referer:"someurl"});
		console.log(generated);
		let sub = new sub2vtt(url ,proxy);
		//console.log(await sub.CheckUrl()) 
		let file = await sub.getSubtitle();
		//console.log(file)
		if (!file?.subtitle) throw file.status
		res.setHeader('Content-Type', 'text/vtt;charset=UTF-8');
		res.send(file.subtitle);
		res.end;
	} catch (err) {
		console.error(err);
		next(err);
	}
})

app.use(ErrorHandler)

module.exports = app