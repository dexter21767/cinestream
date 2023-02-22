var winston = require('winston');
require('winston-daily-rotate-file');

var transports = [
  new winston.transports.DailyRotateFile({
    filename: 'combined-%DATE%.log',
    dirname: "logs",
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: false,
    maxSize: '20m',
    maxFiles: '14d'
  }),
  new winston.transports.DailyRotateFile({
    filename: 'error-%DATE%.log',
    dirname: "logs",
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: false,
    maxSize: '20m',
    maxFiles: '14d',
    level: 'error'
  }),
]

const { combine, timestamp, printf } = winston.format;

const myFormat = printf(({ level, message, timestamp }) => {

  timestamp = new Date(timestamp).toTimeString().split(' ')[0];
  return `'${timestamp}' ${level}: ${message}`;
});

var log = winston.createLogger({
  format: combine(
    timestamp(),
    myFormat
  ),
  transports: transports
});

//log.info(JSON.stringify(process.env))


const { spawn } = require('node:child_process');

let count = 0;
let time = Date.now(); 
const respawn = spawned => {
  spawned.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    log.error(`child process exited with code ${code}`);
    
    if(((Date.now() - time)/(1000*60)) >= 60 ){
      count = 0;
      time = Date.now();
    }
    
    if(((Date.now() - time)/(1000*60)) < 60 && count<20) {
      respawn(spawn('node', ['server.js']));
      count++;
    }

  })

  spawned.stdout.on('data', (data) => {
    console.log(`${data}`);
    log.info(`${data}`);
  });

  spawned.stderr.on('data', (data) => {
    console.error(`${data}`);
    log.error(`${data}`);
  });
}

respawn(spawn('node', ['server.js']))
