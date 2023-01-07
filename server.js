#!/usr/bin/env node

const app = require('./index.js')
const { serveHTTP, publishToCentral } = require("stremio-addon-sdk");
const addonInterface = require("./addon")
const config = require('./config.js');

//serveHTTP(addonInterface, { sws:true,port: process.env.PORT || 63355,static:'/logs'})

app.listen((config.port), function () {
    console.log(`Addon active on port ${config.port}`);
    console.log(`HTTP addon accessible at: ${config.local}/configure`);
});

if(process.env.NODE_ENV){
    publishToCentral(`${config.local}/manifest.json`)
}