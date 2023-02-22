const express = require("express"),
	app = express(),
	cors = require('cors'),
	path = require('path'),
	serveIndex = require('serve-index'),
    config = require('./config.js');


app.set('trust proxy', true)
app.use('/logs', express.static(path.join(__dirname, 'logs'), { etag: false }), serveIndex('logs', { 'icons': true, 'view': 'details ' }))
app.use(cors())


app.listen((config.port), function () {
	console.log("fallback server started");
    console.log(`accessible at: ${config.local}/logs`);
});