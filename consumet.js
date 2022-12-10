const { ANIME,MOVIES } = require("@consumet/extensions");
const Kitsu = require('./kitsu.js');
const tmdb = require('./tmdb');

const NodeCache = require("node-cache");
const SubsCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const EpisodeCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const InfoCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const SearchCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const StreamCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });



async function getMovie(type,id,episode) {
    try {
        const meta = await tmdb(type, id);
        if (!meta) throw "error getting tmdb meta data"

        let query = meta.slug;

        const promises = [];
        //console.log(keys);
        for (const key in ANIME) {
            promises.push(scrapper(type,key, query, episode));
        }
        const results = await Promise.allSettled(promises)
        let streams = [];
        let subs = [];
        results.forEach(({ status, value }) => {
            console.log("status", status, "value", value)
            if (status == "fulfilled" && value) {
                if (value.subs) subs = subs.concat(value.subs);
                if (value.sources) streams = streams.concat(value.sources);
            }

        })
        streams.forEach(stream =>{
            stream.subtitles=subs
        })
        return streams
    } catch (e) {
        console.error(e);
    }
}


async function getAnime(id,episode) {
    try {

        const meta = await Kitsu(id);
        if(!meta ||!meta.slug) throw "error getting kitsu data";
        let query = meta.slug;

        const promises = [];
        //console.log(keys);
        for (const key in ANIME) {
            promises.push(scrapper("Anime",key, query, episode));
        }
        const results = await Promise.allSettled(promises)
        let streams = [];
        let subs = [];
        results.forEach(({ status, value }) => {
            console.log("status", status, "value", value)
            if (status == "fulfilled" && value) {
                if (value.subs) subs = subs.concat(value.subs);
                if (value.sources) streams = streams.concat(value.sources);
            }

        })
        streams.forEach(stream =>{
            stream.subtitles=subs
        })
        return streams
    } catch (e) {
        console.error(e);
    }
}


async function scrapper(type = String, key = String, query = String, ep) {
    try {
        //console.log(key);
        let Cached,provider,resultInfo,results,episode,id;
        
        id = `${key}_${query}`;
        
        Cached = StreamCache.get(id)
        if(Cached){
            sources = Cached
            subs = SubsCache.get(id);
            return { sources, subs }
        }
        if(type == "Anime") provider = new ANIME[key];
        else provider = new MOVIES[key]
        
        Cached = SearchCache.get(id)
        if(!Cached) results = await provider.search(query);
        if (!results && !results.results) throw `error searching on: ${key}`;
        if(results && !Cached) SearchCache.set(id,results);

        const firstResult = results.results[0];
        if (!firstResult || !firstResult.id) throw `error searching first Result on: ${key}`
        
        id = `${key}_${firstResult.id}`;
        Cached = InfoCache.get(id)
        if(!Cached) resultInfo = await provider.fetchresultInfo(firstResult.id);
        if (!resultInfo || !resultInfo.episodes) throw `error retriving info on: ${key}`
        const info = resultInfo.episodes.filter( x => x.number == ep );
        if ( !info || !info[0] || !info[0].id) throw `error finding episode on: ${key}`
        
        if(info && !Cached) InfoCache.set(id,info);
        
        id = `${key}_${info[0].id}`;
        Cached = EpisodeCache.get(id)
        if(!Cached) episode = await provider.fetchEpisodeSources(info[0].id);
        if (!episode) throw `error retriving anime episode on: ${key}`;
        if(episode && !Cached) EpisodeCache.set(id,episode);

        //console.log("episode", episode);

        let sources = [], subs = [];
        if (episode.subtitles) subs = episode.subtitles
        if (episode.sources) {
            episode.sources.forEach((source) => {
                //console.log(source);
                let stream = {
                    url: source.url,
                    name: key,
                    description: source.quality||"unknown",
                    behaviorHints: {bingeGroup:`cinestream_${key}_${source.quality}`} 
                }
                if (episode.headers) stream.behaviorHints.notWebReady= true; stream.behaviorHints.proxyHeaders= { request: episode.headers };
                sources.push(stream)
            });
        }

        id = `${key}_${query}`;
        if(sources) StreamCache.set(id,sources)
        if(subs) SubsCache.set(id,subs)

        return { sources, subs }
    } catch (e) {
        console.error(e);
    }
}

//getAnime("one piece", 1);

module.exports = {Anime:getAnime,Movie:getMovie};
