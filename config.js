var env = process.env.NODE_ENV ? 'beamup':'local';

var config = {
  CacheControl :{
	  on: 'max-age=3600, must-revalidate, stale-while-revalidate=1800, stale-if-error=1800, public',
	  off: 'no-cache, no-store, must-revalidate'
  }
}

switch (env) {
    case 'beamup':
		config.port = process.env.PORT
        config.local = "https://2ecbbd610840-cinestream.baby-beamup.club"
        break;

    case 'local':
		config.port = 63563
        config.local = "http://127.0.0.1:" + config.port;
        break;
}

module.exports = config;