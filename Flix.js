const axios = require('axios').default;

const NodeCache = require("node-cache");
const SearchCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const MetaCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const StreamCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });

const baseURL = Buffer.from("aHR0cHM6Ly9hcGkuY29uc3VtZXQub3JnL21vdmllcy9mbGl4aHEv", 'base64').toString('ascii');

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

function filter(meta, data) {
    return data.filter(function (el) {
        return el.title == meta['title'] &&
            el.type == (meta['media_type'] ? "TV Series" : "Movie");
    });
}
async function stream(type, meta, season, episode) {

    try {
        id = SearchCache.get(meta.id)
        if (!id) {
            url = `${baseURL}${meta["original_title"]}`;
            data = await request({ methode: "get", url: url })
            if (!data.results) throw "no search results"
            data = data.results;
            title = data.filter(function (el) {
                return el.title == meta['title'] &&
                    el.type == (meta['media_type'] ? "TV Series" : "Movie");
            });
            id = title[0].id
            if (id) SearchCache.set(meta.id, id)
            else throw "error getting flix id"
        }
        episodes = MetaCache.get(id)
        if (!episodes) {
            url = `${baseURL}info?id=${id}`;
            data = await request({ methode: "get", url: url })
            if (!data || !data.episodes) throw "no results"
            episodes = data.episodes;
            MetaCache.set(id, episodes)
        }

        if (type == "series") {
            episodes = episodes.filter(function (el) {
                return el.number == episode &&
                    el.season == season;
            });
        }

        if (!episodes) throw "error"
        ep_id = episodes[0].id
        Stream = StreamCache.get(ep_id)
        if (!Stream) {
            url = `${baseURL}watch?episodeId=${ep_id}&mediaId=${id}`;
            data = await request({ methode: "get", url: url })
            if (!data || !data.sources) throw "no results"
            header = data.headers;
            const streams = []
            for (index in data.sources) {
                let source = data.sources[index]
                streams.push({
                    name: "Flix",
                    url: source.url,
                    title: source.quality,
                    behaviorHints: {
                        notWebReady: true,
                        proxyHeaders: { "request": header }
                    }
                })
            }

            if (streams) StreamCache.set(ep_id, streams)
            return streams
        }

    } catch (e) {
        console.error(e)
        return Promise.reject()
    }
}


module.exports = stream;
