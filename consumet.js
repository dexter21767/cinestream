const { ANIME, MOVIES } = require("@consumet/extensions");
const Kitsu = require('./kitsu.js');
const tmdb = require('./tmdb');

const NodeCache = require("node-cache");
const SubsCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const EpisodeCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const InfoCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const SearchCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const StreamCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });



async function getMovie(type, id, episode, season) {
    try {
        const meta = await tmdb(type, id);
        if (!meta) throw "error getting tmdb meta data"

        let query = meta.title;

        const promises = [];
        //console.log(keys);
        for (const key in MOVIES) {
            promises.push(scrapper(type, key, query, episode, season));
        }
        const results = await Promise.allSettled(promises)
        let streams = [];
        let subs = [];
        results.forEach(({ status, value }) => {
            //console.log("status", status, "value", value)
            if (status == "fulfilled" && value) {
                if (value.subs) subs = subs.concat(value.subs);
                if (value.sources) streams = streams.concat(value.sources);
            }

        })
        streams.forEach(stream => {
            stream.subtitles = subs
        })
        return streams
    } catch (e) {
        console.error(e);
    }
}

async function getAnime(id, episode) {
    try {

        const meta = await Kitsu(id);
        if (!meta || !meta.slug) throw "error getting kitsu data";
        let query = meta.slug;

        const promises = [];
        //console.log(keys);
        for (const key in ANIME) {
            promises.push(scrapper("anime", key, query, episode));
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
        streams.forEach(stream => {
            stream.subtitles = subs
        })
        return streams
    } catch (e) {
        console.error(e);
    }
}

async function scrapper(type = String, key = String, query = String, ep, season) {
    try {
        //if(!ep) ep = 1;
        //if(!season) season = 1; 
        //console.log(key);
        let Cached, provider, resultInfo, results, episode, id;

        id = `${key}_${query}_${ep}_${season}`;

        Cached = StreamCache.get(id)
        if (Cached) {
            let subtitles = SubsCache.get(id);
            return { Cached, subtitles }
        }
        provider = type == "anime" ? new ANIME[key] : new MOVIES[key];

        id = `${key}_${query}`;

        Cached = SearchCache.get(id)
        if (Cached) results = Cached;
        else results = await provider.search(query);
        if (!results || !results.results) throw `error searching on: ${key}`;
        if (results && !Cached) SearchCache.set(id, results);

        const firstResult = results.results[0];

        if (!firstResult || !firstResult.id) throw `error searching first Result on: ${key}`

        id = `${key}_${firstResult.id}`;
        Cached = InfoCache.get(id)
        if (Cached) resultInfo = Cached;
        else resultInfo = type == "anime" ? await provider.fetchAnimeInfo(firstResult.id) : await provider.fetchMediaInfo(firstResult.id);
        if (!resultInfo || !resultInfo.episodes) throw `error retriving info on: ${key}`
        if (resultInfo && !Cached) InfoCache.set(id, resultInfo);
        const info = resultInfo;
        info.episodes = resultInfo.episodes.filter(x =>
            (x.number == ep || x.episode == ep) && ((season && x.season) ? x.season == season : true)
        );

        if (!info || !info.episodes[0] || !info.episodes[0].id) throw `error finding episode on: ${key}`

        id = `${key}_${info.episodes[0].id}`;
        Cached = EpisodeCache.get(id)
        if (Cached) episode = Cached;
        else episode = key == "FlixHQ" ? await provider.fetchEpisodeSources(info.episodes[0].id, info.id) : await provider.fetchEpisodeSources(info.episodes[0].id);
        if (!episode) throw `error retriving anime episode on: ${key}`;
        if (episode && !Cached) EpisodeCache.set(id, episode);

        //console.log("episode", episode);

        let sources = [], subs = [];
        if (episode.subtitles) subs = episode.subtitles
        if (episode.sources) {
            episode.sources.forEach((source) => {
                //console.log(source);
                let stream = {
                    url: source.url,
                    name: key,
                    description: source.quality || "unknown",
                    behaviorHints: { bingeGroup: `cinestream_${key}_${source.quality}` }
                }
                if (episode.headers) stream.behaviorHints.notWebReady = true; stream.behaviorHints.proxyHeaders = { request: episode.headers };
                sources.push(stream)
            });
        }

        id = `${key}_${query}`;
        if (sources) StreamCache.set(id, sources)
        if (subs) SubsCache.set(id, subs)

        return { sources, subs }
    } catch (e) {
        console.error(e);
    }
}



module.exports = { Anime: getAnime, Movie: getMovie };
