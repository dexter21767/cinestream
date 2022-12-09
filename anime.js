const axios = require('axios').default;
const map = require("./map.json");
const log = require('./logger')

const NodeCache = require("node-cache");
const ShowCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const StreamCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });

const baseURL = Buffer.from("aHR0cHM6Ly9hcGkuY29uc3VtZXQub3JnL21ldGEvYW5pbGlzdC8=", 'base64').toString('ascii');

client = axios.create({
    timeout: 5000
});

async function request(options) {

    return await client(options)
        .then(res => {
            return res.data;
        })
        .catch(error => {
            if (error.response) {
                console.error('error on source.js request:', error.response.status, error.response.statusText, error.config.url);
            } else {
                console.error(error);
            }
        });

}


function ID(kitsuID) {
    var id;
    objects = map.anilist;
    Object.keys(objects).forEach(function (k) {
        if (objects[k].toString() == kitsuID) { id = k; return k }
    });
    return id
}

async function Stream(type, kitsuID, episode) {
    try {
        const id = ID(kitsuID)
        if (!id) throw "no id"
        if (!episode) episode = 1;
        return await getAnime(id, episode)
    } catch (e) {
        console.log(e)
    }
}
async function getAnime(id, episode) {
    try {
        const cacheID = `${id}_${episode}`
        let cached = StreamCache.get(cacheID)
        if(cached) return cached
        
        cached = ShowCache.get(id)
        if(cached) return cached
        url = baseURL + "episodes/" + id;
        console.log(url)
        
        data = await request({ methode: "get", url: url })
        if(data) ShowCache.set(id,data); 
        if(!data) throw "error loading data"
        let ep = data.filter(function (el) {
            return el.number == episode;
        })
        if(!ep || !ep.length) throw "can't find episode"
        url = baseURL + "watch/" + ep[0].id;
        data = await request({ methode: "get", url: url })
        if(!data) throw "error loading data"
        header = data.headers;

        const streams = []
        for (index in data.sources) {
            let source = data.sources[index]
            streams.push({
                name: "anilist",
                url: source.url,
                title: source.quality,
                behaviorHints: {
                    notWebReady: true,
                    proxyHeaders: { "request": header }
                }
            })
        }
        if(streams) StreamCache.set(cacheID,streams)

        return streams
    } catch (e) {
        console.log(e)
    }
}

module.exports = Stream;