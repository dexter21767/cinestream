const axios = require('axios').default;
const tmdbAPI = require('./tmdb');
const anime = require("./anime")
const lok =  require("./lok")
const flix = require("./Flix")
const log = require('./logger')
const consumet = require('./consumet');

const NodeCache = require("node-cache");
const AxiosCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const StreamCache = new NodeCache({ stdTTL: (6 * 60 * 60), checkperiod: (3 * 60 * 60) });
const TmdbCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
client = axios.create({
    timeout: 50000
});

async function tmdb(type, tt) {
    cached = TmdbCache.get(tt)
    if (cached) return cached
    meta = await tmdbAPI(type, tt)
    if (meta) TmdbCache.get(tt, meta)
    return meta
}

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

async function stream(type, id) {
    try {
        cached = StreamCache.get(id)
        if (cached) return cached
        console.log("stream", type, id)
        log.info("stream: "+ type +' '+id)
        if (id.match(/tt[^0-9]*/i)){
            const [tmdb_id,season,episode] = id.split(":");
            
            streams = await consumet.Movie(type,tmdb_id,episode,season)

            
            /* 
            meta = await tmdb(type, id.split(":")[0]);
            if (!meta) throw "error getting tmdb id"
            console.log("tmdb id:", meta.id)
            log.info("tmdb id: "+ meta.id)
            promises = [];
            promises.push(lok(type,meta.id, id.split(":")[1], id.split(":")[2]))
            promises.push(flix(type,meta, id.split(":")[1], id.split(":")[2]))
            streams = await Promise.allSettled(promises).then(promises =>{
                var streams = [];
                promises.forEach((element) => {
                    if(element.status == "fulfilled"){
                        //console.log(element.value)
                        streams = streams.concat(element.value)
                    }
                })
                return streams;
            })
            console.log(streams)
            return streams;
            */
        }
        else if(id.match(/kitsu:[0-9]+:[0-9]+/i)){
            const [kitsu_id,episode] = id.match(/\d+/ig);

            streams = await consumet.Anime(kitsu_id,episode)
            //streams = await anime(type, id.split(":")[1],id.split(":")[2]);

        }
        
        if (streams) StreamCache.set(id, streams)
        return streams
    } catch (e) {
        console.error(e)
        log.error(e)
    }

}


module.exports = stream;
