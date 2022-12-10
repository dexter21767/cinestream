const { ANIME } = require("@consumet/extensions");
const Kitsu = require('./kitsu.js');

const NodeCache = require("node-cache");
const SubsCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const EpisodeCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const InfoCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const SearchCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const StreamCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });



async function getAnime(id,episode) {
    try {

        const meta = await Kitsu(id);
        if(!meta ||!meta.slug) throw "error getting kitsu data";
        let query = meta.slug;

        const promises = [];
        //console.log(keys);
        for (const key in ANIME) {
            promises.push(scrapper(key, query, episode));
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


async function scrapper(key = String, query = String, episode) {
    try {
        //console.log(key);
        let Cached,animeInfo,results,episodes,id;
        
        id = `${key}_${query}`;
        
        Cached = StreamCache.get(id)
        if(Cached){
            sources = Cached
            subs = SubsCache.get(id);
            return { sources, subs }
        }

        const provider = new ANIME[key];
        
        Cached = SearchCache.get(id)
        if(!Cached) results = await provider.search(query);
        if (!results && !results.results) throw `error searching on: ${key}`;
        if(results && !Cached) SearchCache.set(id,results);

        const firstAnime = results.results[0];
        if (!firstAnime || !firstAnime.id) throw `error retriving anime info on: ${key}`
        
        id = `${key}_${firstAnime.id}`;
        Cached = InfoCache.get(id)
        if(!Cached) animeInfo = await provider.fetchAnimeInfo(firstAnime.id);
        if (!animeInfo || !animeInfo.episodes) throw `error retriving anime info on: ${key}`
        const info = animeInfo.episodes.filter( x => x.number == episode );
        if ( !info || !info[0] || !info[0].id) throw `error finding anime episode on: ${key}`
        
        if(info && !Cached) InfoCache.set(id,info);
        
        id = `${key}_${info[0].id}`;
        Cached = EpisodeCache.get(id)
        if(!Cached) episodes = await provider.fetchEpisodeSources(info[0].id);
        if (!episodes) throw `error retriving anime episodes on: ${key}`;
        if(episodes && !Cached) EpisodeCache.set(id,episodes);

        //console.log("episodes", episodes);

        let sources = [], subs = [];
        if (episodes.subtitles) subs = episodes.subtitles
        if (episodes.sources) {
            episodes.sources.forEach((source) => {
                //console.log(source);
                let stream = {
                    url: source.url,
                    name: key,
                    description: source.quality||"unknown",
                    behaviorHints: {bingeGroup:`cinestream_${key}_${source.quality}`} 
                }
                if (episodes.headers) stream.behaviorHints.notWebReady= true; stream.behaviorHints.proxyHeaders= { request: episodes.headers };
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

module.exports = {Anime:getAnime};
