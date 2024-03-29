const express = require("express");
const serveIndex = require('serve-index');
const app = express();
const cors = require('cors');
const path = require('path');
const sub2vtt = require('sub2vtt');

const stream = require("./source");
const manifest = require("./manifest.json");
const ErrorHandler = require("./ErrorHandler.js");
const {CacheControl} = require('./config.js');




const swStats = require('swagger-stats');
const { NewsParser } = require("@consumet/extensions/dist/models");
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

app.use((req, res, next) => {
    req.setTimeout(15 * 1000); // timeout time
    req.socket.removeAllListeners('timeout'); 
    req.socket.once('timeout', () => {
        req.timedout = true;
		//res.setHeader('Cache-Control', CacheControl.off);
        res.status(504).end();
    });
	if (!req.timedout) next()
});

app.set('trust proxy', true)

app.use('/logs',
	(req, res, next) => {
		res.set('Cache-Control', 'no-store');
		next();
	},
	express.static(path.join(__dirname, 'logs'), {etag: false }),
	serveIndex('logs', { 'icons': true, 'view': 'details' })
)

/*
app.use('/dir', 
	(req, res, next) => {
		res.set('Cache-Control', 'no-store');
		next();
	},
	express.static("/",{dotfiles:'allow', etag: false}), 
	serveIndex("/", {'icons': true, 'hidden':true, 'view':'details'})
)
*/

app.use('/', express.static(path.join(__dirname, 'vue', 'dist')));
app.use('/assets', express.static(path.join(__dirname, 'vue', 'dist', 'assets')));

app.use(cors())

app.get('/manifest.json', (_, res) => {
	res.setHeader('Cache-Control', CacheControl.on);
	res.setHeader('Content-Type', 'application/json');
	res.send(manifest);
	res.end();
});

app.get('/stream/:type/:id/:extra?.json', async (req, res,next) => {
	try{
		console.log("addon.js streams:", req.params);

		const {type,id} = req.params;
		let streams = [];

		if (id.match(/tt[^0-9]*/i)||id.match(/kitsu:[^0-9]*/i)) {
			streams = await Promise.resolve(stream(type, id))
		} 

		if(streams?.length){
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Cache-Control', CacheControl.on);
			res.send({ streams: streams }); 
		} else {
			res.setHeader('Content-Type', 'application/json');
			res.setHeader('Cache-Control', CacheControl.off);
			res.send({ streams: [] });
		}
	}catch(e){
		console.error(e);
		//next(e);
	}
	
})

app.get('/sub.vtt', async (req, res,next) => {
	try {

		let url,proxy;
		
		if (req?.query?.proxy) proxy = JSON.parse(Buffer.from(req.query.proxy, 'base64').toString());
		if (req?.query?.from) url = req.query.from
		else throw 'error: no url';

		console.log("url", url,"proxy",proxy)

		generated = sub2vtt.gerenateUrl(url,{referer:"someurl"});
		console.log(generated);
		
		let sub = new sub2vtt(url ,proxy);
		
		let file = await sub.getSubtitle();
		
		if (!file?.subtitle?.length) throw file.status
		res.setHeader('Cache-Control', CacheControl.on);
		res.setHeader('Content-Type', 'text/vtt;charset=UTF-8');
		res.send(file.subtitle);
		res.end;
	} catch (e) {
		console.error(e);
		//next(e);
	}
})

app.get('/CineNexa', async (req, res,next) => {
	try {

		console.log(req.query)
		const {type,season, episode, imdbId, tmdbId, traktId, name, releaseYear} = req.query;
		
		const stremioType = type == "show"? "series":"movie";
		let id = imdbId;
		if(season && episode) id += `:${season}:${episode}`;
		let streams = [];
		console.log("id",id);
		if (imdbId && id) {
			streams = await Promise.resolve(stream(stremioType, id))
		} 

		if(streams?.length){
			res.setHeader('Content-Type', 'text/html');
			res.setHeader('Cache-Control', CacheControl.on);
			res.send(JSON.stringify({ streams: streams })); 
		} else {
			res.setHeader('Content-Type', 'text/html');
			res.setHeader('Cache-Control', CacheControl.off);
			res.send(JSON.stringify({ streams: [] }));
		}
		res.end;
	} catch (e) {
		console.error(e);
		//next(e);
	}
})
 
//app.use(ErrorHandler)

module.exports = app