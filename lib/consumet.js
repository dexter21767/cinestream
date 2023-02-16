const { ANIME, MOVIES } = require("@consumet/extensions");
const _ = require('underscore');
const sub2vtt = require('sub2vtt');
const iso639 = require('./ISO639');
const Kitsu = require('./kitsu');
const tmdb = require('./tmdb');
const log = require('./logger');
const config = require('../config')

const NodeCache = require("node-cache");
const SubsCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const EpisodeCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const InfoCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const SearchCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const StreamCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });

let ProviderCache = {};

for (const key in MOVIES) {
    ProviderCache[key] = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
}

for (const key in ANIME) {
    ProviderCache[key] = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
}

async function getMovie(type, id, episode, season) {
    try {
        const meta = await tmdb(type, id);
        if (!meta) throw "error getting tmdb meta data"

        let query = meta.title;

        const promises = [];
        //console.log(keys);
        for (const key in MOVIES) {
            promises.push(scrapper(type, key, query, meta, episode, season).catch(e => { console.error(e) }));
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
        //console.error(e);
        log.error(e);
    }
}

async function getAnime(id, episode) {
    try {

        const meta = await Kitsu(id);
        if (!meta || !meta.slug) throw `error getting kitsu data ${id}`;
        let query = meta.slug;

        const promises = [];
        //console.log(keys);
        for (const key in ANIME) {
            promises.push(scrapper("anime", key, query, meta, episode).catch(e => { console.error(e) }));
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
        /*
        streams.forEach(stream => {
            stream.subtitles = subs
        })*/
        return streams
    } catch (e) {
        console.error(e);
        log.error(e);
    }
}

async function scrapper(type = String, key = String, query = String, meta = Object, ep, season) {
    try {
        //if(!ep) ep = 1;
        //if(!season) season = 1; 
        //console.log(key);
        let Cached, provider, resultInfo, results, episode, id;

        const StreamCache = ProviderCache[key];

        provider = type == "anime" ? new ANIME[key] : new MOVIES[key];

        if (!provider.isWorking) throw `error provider not working ${key}`

        id = `${key}_${query}`;
        if (ep) id += `_${ep}`;
        if (season) id += `_${season}`;

        Cached = StreamCache.get(id)
        if (Cached) {
            let subtitles = SubsCache.get(id);
            return { sources:Cached, subs:subtitles }
        }
        id = `${key}_${query}`;

        Cached = SearchCache.get(id)
        if (Cached) results = Cached;
        else results = await provider.search(query);
        if (!results || !results.results) throw `error searching on: ${key} ${type} ${query} ${ep} ${season}`;
        if (results && !Cached) SearchCache.set(id, results);
        //console.log(key, "results", results.results[0], "meta", meta.title);

        let filteredResults = filter(results.results, meta)

        //console.log("filteredResults", filteredResults);

        const firstResult = (filteredResults && filteredResults.length) ? filteredResults[0] : {};

        if (!firstResult || !firstResult.id) throw `error searching first Result on: ${key} ${type} ${query} ${ep} ${season}`

        id = `${key}_${firstResult.id}`;
        Cached = InfoCache.get(id)
        if (Cached) resultInfo = Cached;
        else resultInfo = type == "anime" ? await provider.fetchAnimeInfo(firstResult.id) : await provider.fetchMediaInfo(firstResult.id);
        if (!resultInfo || !resultInfo.episodes) throw `error retriving info on: ${key} ${type} ${query} ${ep} ${season}`
        if (resultInfo && !Cached) InfoCache.set(id, resultInfo);
        const info = resultInfo;
        info.episodes = resultInfo.episodes.filter(x =>
            (x.number == ep || x.episode == ep) && ((season && x.season) ? x.season == season : true)
        );

        if (!info || !info.episodes[0] || !info.episodes[0].id) throw `error finding episode on: ${key} ${type} ${query} ${ep} ${season}`

        id = `${key}_${info.episodes[0].id}`;
        Cached = EpisodeCache.get(id)
        if (Cached) episode = Cached;
        else episode = key == "FlixHQ" ? await provider.fetchEpisodeSources(info.episodes[0].id, info.id) : await provider.fetchEpisodeSources(info.episodes[0].id);
        if (!episode) throw `error retriving anime episode on: ${key} ${type} ${query} ${ep} ${season}`;
        if (episode && !Cached) EpisodeCache.set(id, episode);

        //console.log("episode", episode);

        var sources = [], subs = [];

        if (episode.subtitles) subs = getSubs(episode.subtitles,episode.headers)

        if (episode.sources) {
            //console.log(episode);
            episode.sources.forEach((source) => {
                let stream = {
                    url: source.url,
                    name: firstResult.subOrDub?`${provider.name} - ${firstResult.subOrDub}`:provider.name,
                    description: source.quality || "unknown",
                    subtitles: subs,
                    behaviorHints: {}
                }
                if(source.quality) stream.behaviorHints.bingeGroup = `cinestream_${key}_${source.quality}`
                if (episode.headers) stream.behaviorHints.notWebReady = true; stream.behaviorHints.proxyHeaders = { request: episode.headers };
                sources.push(stream)
            });
        }

        id = `${key}_${query}`;
        if (ep) id += `_${ep}`;
        if (season) id += `_${season}`;
        if (sources) StreamCache.set(id, sources)
        if (subs) SubsCache.set(id, subs)

        return { sources, subs }
    } catch (e) {
        return Promise.reject(e);
    }
}
function filter(list = Array, meta = Object) {
    let SortedResults= {sub:[],dub:[]}, 
        filteredResults = {sub:[],dub:[]};
    list.forEach((element, index) => {
        element.sortingRank = 0;
        if (element.releaseDate){
            if(element.releaseDate.toString().match(meta.year)) element.sortingRank++;
            else element.sortingRank--;
        }
        else if (element.type && element.type.toLowerCase().match(meta.type.toLowerCase())) element.sortingRank++;

        if(!element.releaseDate) element.sortingRank--;

        if (element.id?.length && meta.slug?.length && element.id.toLowerCase() == meta.slug.toLowerCase()) element.sortingRank++;
        else if (element.id?.length && meta.slug?.length && element.id.toLowerCase().match(meta.slug.toLowerCase())) element.sortingRank++;
        else element.sortingRank--;

        if (element.title && meta.title && element.title == meta.title) element.sortingRank++;
        if (element.title && meta.title && element.title.toLowerCase() == meta.title.toLowerCase()) element.sortingRank++;
        if (element.title && meta.title && element.title.toLowerCase().match(meta.title.toLowerCase())) element.sortingRank++;
        else element.sortingRank--;

        if (element.title && meta.original_title && element.title.toLowerCase().match(meta.original_title.toLowerCase())) element.sortingRank++;
        else if (meta.titles && meta.titles.length) meta.titles.forEach((el) => {
            if (res.title.toLowerCase().match(el.toLowerCase())) element.sortingRank++;
        })
        else element.sortingRank--;

        if(element.subOrDub) filteredResults[element.subOrDub].push(element);
        else filteredResults.sub.push(element);
        //filteredResults.push(element);
    })
    if(filteredResults.sub) SortedResults.sub= _.sortBy(filteredResults.sub, 'sortingRank').reverse();
    let regex = new RegExp(SortedResults.sub[0]?.id,'i');
    if(filteredResults.dub) SortedResults.dub = filteredResults.dub.filter(function (el) {
        //console.log("SortedResults.sub[0].id",regex)
        if(regex.test(el.id))
        //console.log("SortedResults.sub[0].id.match(el.id)",regex.test(el.id))
        return regex.test(el.id);
      });
    // console.log(SortedResults)
    if(SortedResults.sub?.filter(value=> value.sortingRank>0)?.length) SortedResults.sub = SortedResults.sub.filter(value=> value.sortingRank>0);
    //console.log("SortedResults",filteredResults.dub)
    return SortedResults.sub;
}

function getSubs(subs = Array,proxy){
    let subtitles = [];
    subs.every(({url,lang},index) => {
        if(url.match(/thumbnails|sprite|images/gi)) return false
        let sub = {}
        sub.url = config.local+"/sub.vtt?"+sub2vtt.gerenateUrl(url,proxy);
        iso639.forEach((iso)=>{
            if(iso.name.toLowerCase() == lang.toLowerCase()) sub.lang = iso.iso6393
            else if (lang.toLowerCase().includes(iso.name.toLowerCase())) sub.lang = iso.iso6393
            //else sub.lang = lang;     
        })
        if(!sub.lang) sub.lang = lang
        sub.id = index.toString()
        subtitles.push(sub)
        //subtitles[index].url = subtitle.url 
        return true
    })
    return subtitles
}

module.exports = { Anime: getAnime, Movie: getMovie };
