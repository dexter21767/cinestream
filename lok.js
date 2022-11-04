const axios = require('axios').default;
const log = require('./logger')
const NodeCache = require("node-cache");
const AxiosCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });

const api = Buffer.from("aHR0cHM6Ly9zb3JhLW1vdmllLnZlcmNlbC5hcHA=", 'base64').toString('ascii');

const randomUseragent = require('random-useragent');



async function request(methode, url, referer) {

    id = Buffer.from(url).toString('base64')
    let cached = AxiosCache.get(url);
    if (cached) {
        return cached
    } else {
        console.log(url)
        log.info(url)
        return await client({ methode: methode, url: url, headers: { referer: referer ? referer : api, "user-agent": randomUseragent.getRandom() } })
            .then(res => {
                if (res && res.data) AxiosCache.set(url, res.data);
                return res.data;
            })
            .catch(error => {
                if (error.response) {
                    console.error('error on source.js request:', error.response.status, error.response.statusText, error.config.url);
                    log.error('error on source.js request:', error.response.status, error.response.statusText, error.config.url);
                } else {
                    console.error(error);
                    log.error(error);
                }
            });
    }
}

async function getMovie(id) {
    url = `${api}/movies/${id}/watch?_data=routes/movies/\$movieId.watch`
    referer = `${api}/movies/${id}/watch`
    console.log("url", url)
    log.info("url: "+ url)
    console.log("referer", referer)
    log.info("referer: "+ referer)
    await request("head", referer)
    res = (await request("get", url, referer))
    if (!res) throw "error requesting data"
    if (!res.sources) {
        AxiosCache.del(url);
        AxiosCache.del(referer);
        throw "error getting sources";
    }
    const streams = [];
    for (let source of res.sources) {
        streams.push({ name: "kolkol", description: source.quality, url: source.url, subtitles: res.subtitles })
    }
    return streams
}

async function getSeries(id, season, episode) {
    url = `${api}/tv-shows/${id}/season/${season}/episode/${episode}?_data=routes/tv-shows/\$tvId.season.\$seasonId.episode.\$episodeId`
    referer = `${api}/tv-shows/${id}/season/${season}/episode/${episode}`
    console.log("url", url)
    log.info("url: "+ url)
    console.log("referer", referer)
    log.info("referer: "+ referer)
    await request("head", referer)
    res = (await request("get", url, referer))
    if (!res) throw "error requesting data"
    if (!res.sources) {
        AxiosCache.del(url);
        AxiosCache.del(referer);
        throw "error getting sources";
    }
    const streams = [];
    for (let source of res.sources) {
        streams.push({ name: "kolkol", description: source.quality, url: source.url, subtitles: res.subtitles })
    }
    return streams

}


async function stream(type, id,season,episode) {
    try {
        console.log("lok stream", type, id)
            if (type == "movie") streams = await getMovie(id)
            if (type == "series") streams = await getSeries(id, season,episode)

            return streams
    } catch (e) {
        console.error(e)
        return Promise.reject()
    }

}

module.exports = stream;
