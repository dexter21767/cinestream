const { CacheControl } = require('./config.js');

const ErrorHandler = (err, req, res, next) => {
    if (!req.timedout) {
        console.log("Middleware Error Hadnling");
        const errStatus = err.statusCode || 500;
        const errMsg = err.message || 'Something went wrong';
        res.setHeader('Cache-Control', CacheControl.off);
        res.status(errStatus).json({
            success: false,
            status: errStatus,
            message: errMsg,
            stack: process.env.NODE_ENV === 'development' ? err.stack : {}
        })
    } else next()
}

module.exports = ErrorHandler;