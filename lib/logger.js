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

/*
transport.on('rotate', function (oldFilename, newFilename) {
  // do something fun
});*/


const { combine, timestamp, printf } = winston.format;

const myFormat = printf(({ level, message, timestamp }) => {
  
  timestamp = new Date(timestamp).toTimeString();
  //console.log(timestamp)
  return `'${timestamp}' ${level}: ${message}`;
});

var logger = winston.createLogger({
  format: combine(
    timestamp(),
    myFormat
  ),
  transports: transports
});



module.exports = logger;