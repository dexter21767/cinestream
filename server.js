#!/usr/bin/env node

const { serveHTTP, publishToCentral } = require("stremio-addon-sdk");
const addonInterface = require("./addon")

serveHTTP(addonInterface, { sws:true,port: process.env.PORT || 63355,static:'/logs'})

// when you've deployed your addon, un-comment this line
publishToCentral("https://2ecbbd610840-cinestream.baby-beamup.club/manifest.json")
// for more information on deploying, see: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/deploying/README.md
