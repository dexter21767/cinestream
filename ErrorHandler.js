const ErrorHandler = (err, req, res, next) => {
    if(!req.timedout){
    console.log("Middleware Error Hadnling");
    console.log("err",err);
    const errStatus = err.statusCode || 500;
    const errMsg = err.message || 'Something went wrong';
    res.status(errStatus).json({
        success: false,
        status: errStatus,
        message: errMsg,
        stack: process.env.NODE_ENV === 'development' ? err.stack : {}
    })
    }else{
        next();
    }
}

module.exports = ErrorHandler;