#!/usr/bin/env node

const app = require('./index.js')
const { publishToCentral } = require("stremio-addon-sdk");
const config = require('./config.js');


app.listen((config.port), function () {
    console.log(`Addon active on port ${config.port}`);
    console.log(`HTTP addon accessible at: ${config.local}/configure`);
});

if(process.env.NODE_ENV){
    publishToCentral(`${config.local}/manifest.json`)
}