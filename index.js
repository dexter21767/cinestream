const express = require("express");
const app = express();
const cors = require('cors');
const path = require('path');
const stream = require("./source");
const manifest = require("./manifest.json");
const sub2vtt = require('sub2vtt');

app.set('trust proxy', true)

app.use('/configure', express.static(path.join(__dirname, 'vue', 'dist')));
app.use('/assets', express.static(path.join(__dirname, 'vue', 'dist', 'assets')));

app.use(cors())


app.get('/', (_, res) => {
	res.redirect('/configure')
	res.end();
});


app.get('/manifest.json', (_, res) => {
	res.setHeader('Cache-Control', 'max-age=86400, public');
	res.setHeader('Content-Type', 'application/json');
	res.send(manifest);
	res.end();
});

app.get('/stream/:type/:id/:extra?.json', async (req, res) => {
	res.setHeader('Cache-Control', 'max-age=86400, public');
	res.setHeader('Content-Type', 'application/json');
	const args = req.params;

	console.log("addon.js streams:", args);
	if (args.id.match(/tt[^0-9]*/i)||req.id.match(/kitsu:[^0-9]*/i)) {
		return Promise.resolve(stream(args.type, args.id,))
		.then((streams) => {res.send({ streams: streams }); });
		//return Promise.resolve({ streams: [] });
	} else {
		res.send(Promise.resolve({ streams: [] }));
	}	
	res.end();
})

app.get('/sub.vtt', async (req, res) => {
	try {

		res.setHeader('Cache-Control', 'max-age=86400,staleRevalidate=stale-while-revalidate, staleError=stale-if-error, public');
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
		/*//console.log("file",file)*/
		if (!file?.subtitle) throw file.status
		res.setHeader('Content-Type', 'text/vtt;charset=UTF-8');
		res.end(file.subtitle)
		res.end()

	} catch (err) {
		res.setHeader('Content-Type', 'application/json');
		res.end()

		console.error(err);
	}
})


module.exports = app
