/*
const config = require('./config.js');

const path = require('path');
const express = require("express");
const serveIndex = require('serve-index');
const app = express();

app.use('/logs', express.static(path.join(__dirname, 'logs')), serveIndex('logs', {'icons': true}))

app.listen((config.port), function () {
    console.log(`subprocess active on port 63562`);
});



/*
while (true){
    
        console.log("starting")
        const addon = spawnSync('node', ['server.js']);
        
        console.log("addon", Buffer.from(addon.stderr).toString());
        log.error(`child process terminated \n  ${Buffer.from(addon.stderr).toString()}`);

}

function run(addon){
    addon.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
        log.info(`stdout: ${data}`);
    });
    
    addon.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
        log.error(`stderr: ${data}`);
    });
    
    addon.on('close', (code) => {
        status = code;
        console.log(`child process exited with code ${code}`);
        log.info(`child process exited with code ${code}`);
    
        console.log(`restarting child process ...`);
        log.info(`restarting child process ...`);
       return; 
    });
}

*/


const log = require('./lib/logger');

const { spawn } = require('node:child_process');

const respawn = spawned => {
    spawned.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        log.error(`child process exited with code ${code}`);
      respawn(spawn('node', ['server.js']))

    })
    spawned.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
        log.info(`stdout: ${data}`);
    });
    
    spawned.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
        log.error(`stderr: ${data}`);
    });
  }
  respawn(spawn('node', ['server.js']))
