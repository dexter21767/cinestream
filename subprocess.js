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



console.log("process.env:",process.env);
log.info("process.env:",process.env)

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