const log = require('./lib/logger');

const { spawn } = require('node:child_process');
const ls = spawn('node', ['server.js']);

ls.stdout.on('data', (data) => {
  log.info(`stdout: ${data}`);
});

ls.stderr.on('data', (data) => {
  log.error(`stderr: ${data}`);
});

ls.on('close', (code) => {
  log.info(`child process exited with code ${code}`);
});