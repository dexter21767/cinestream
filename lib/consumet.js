const { ANIME, MOVIES } = require("@consumet/extensions");
const _ = require('underscore');
const sub2vtt = require('sub2vtt');
const iso639 = sub2vtt.ISO();
const { kitsu, tmdb } = require('./meta');
const config = require('../config')

const NodeCache = require("node-cache");
const EpisodeCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (0.25 * 60 * 60) });
const InfoCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (0.25 * 60 * 60) });
const SearchCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (0.25 * 60 * 60) });
const StreamCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (0.25 * 60 * 60) });

const removedProivders = ["Fmovies", "Crunchyroll", "DramaCool", "ViewAsian"];

async function getMovie(type, id, episode, season) {
    try {
        const meta = await tmdb(type, id);
        if (!meta) throw "error getting tmdb meta data"

        let query = meta.title;

        const promises = [];
        //console.log(keys);
        for (const key in MOVIES) {
            promises.push(scrapper(id, type, key, query, meta, episode, season).catch(e => { console.error(e) }));
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

        const meta = await kitsu(id);
        if (!meta || !meta.slug) throw `error getting kitsu data ${id}`;
        let query = meta.slug;

        const promises = [];
        //console.log(keys);
        for (const key in ANIME) {
            promises.push(scrapper(id, "anime", key, query, meta, episode).catch(e => { console.error(e) }));
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
    }
}

async function scrapper(id, type = String, key = String, query = String, meta = Object, ep, season) {
    try {
        let Cached, provider, resultInfo, results, episode;
        if (removedProivders.includes(key)) return;

        else provider = type == "anime" ? new ANIME[key] : new MOVIES[key];

        if (!provider.isWorking) throw `error provider not working ${key}`

        let CacheId = `${key}_${type}_${id}`;
        if (ep) CacheId += `_${ep}`;
        if (season) CacheId += `_${season}`;

        console.log('StreamCache', CacheId)
        Cached = StreamCache.get(CacheId)
        if (Cached?.sources?.length) return Cached;

        let SearchCacheId = `${key}_${type}_${id}`;

        console.log('SearchCache', SearchCacheId)
        Cached = SearchCache.get(SearchCacheId)
        if (Cached) results = Cached;
        else results = await provider.search(query);
        if (!results || !results.results) throw `error searching on: ${key} ${type} ${query} ${ep} ${season}`;
        if (results && !Cached) SearchCache.set(SearchCacheId, results);
        //console.log(key, "results", results.results[0], "meta", meta.title);

        let filteredResults = filter(results.results, meta)

        //console.log("filteredResults", filteredResults);

        const firstResult = (filteredResults && filteredResults.length) ? filteredResults[0] : {};

        if (!firstResult || !firstResult.id) throw `error searching first Result on: ${key} ${type} ${query} ${ep} ${season}`
        //console.log('firstResult',firstResult);
        const InfoCacheId = `${key}_${firstResult.id}`;
        console.log('InfoCache', InfoCacheId)
        Cached = InfoCache.get(InfoCacheId)
        if (Cached) resultInfo = Cached;
        else resultInfo = type == "anime" ? await provider.fetchAnimeInfo(firstResult.id) : await provider.fetchMediaInfo(firstResult.id);
        if (!resultInfo || !resultInfo.episodes) throw `error retriving info on: ${key} ${type} ${query} ${ep} ${season}`
        if (resultInfo && !Cached) InfoCache.set(InfoCacheId, resultInfo);
        const info = resultInfo;
        //console.log('info',info);
        info.episodes = resultInfo.episodes.filter(x => {
            if (!x.number && !x.episode) [x.number, x.episode] = x.id.split('-');
            return (x.number == ep || x.episode == ep) && ((season && x.season) ? x.season == season : true)
        }
        );
        if (!info || !info.episodes[0] || !info.episodes[0].id) throw `error finding episode on: ${key} ${type} ${query} ${ep} ${season}`
        //console.log('info',info);

        const EpisodeCacheId = `${key}_${info.episodes[0].id}`;
        console.log('EpisodeCache', EpisodeCacheId)
        Cached = EpisodeCache.get(EpisodeCacheId)
        console.log('fetchEpisodeSources', info.episodes[0].id, info.id.slice(1))
        if (Cached) episode = Cached;
        else episode = (key == "FlixHQ" || key == "Fmovies") ? await provider.fetchEpisodeSources(info.episodes[0].id, info.id) : await provider.fetchEpisodeSources(info.episodes[0].id);
        if (!episode) throw `error retriving anime episode on: ${key} ${type} ${query} ${ep} ${season}`;
        if (episode && !Cached) EpisodeCache.set(EpisodeCacheId, episode);

        //console.log("episode", episode);

        var sources = [], subs = [];

        if (episode.subtitles) subs = getSubs(episode.subtitles, episode.headers)

        if (episode.sources) {
            //console.log(episode);
            episode.sources.forEach((source) => {
                let stream = {
                    url: source.url,
                    name: firstResult.subOrDub ? `${provider.name} - ${firstResult.subOrDub}` : provider.name,
                    description: source.quality || "unknown",
                    subtitles: subs,
                    behaviorHints: {}
                }
                if (source.quality) stream.behaviorHints.bingeGroup = `cinestream_${key}_${source.quality}`
                if (episode.headers) stream.behaviorHints.notWebReady = true; stream.behaviorHints.proxyHeaders = { request: episode.headers };
                sources.push(stream)
            });
        }
        const streams = { sources: sources || [], subs: subs || [] };

        if (sources) StreamCache.set(CacheId, streams)
        return streams

    } catch (e) {
        console.error(e);
        return Promise.reject(e);
    }
}


function filter(list = Array, meta = Object) {
    let SortedResults = { sub: [], dub: [] },
        filteredResults = { sub: [], dub: [] };
    list.forEach((element) => {

        let titles = [meta.title, meta.original_title]
        if (meta.titles?.length) titles = titles.concat(meta.titles)

        element.filterScore = titleCompare(element.title, titles)
        if (element.subOrDub) filteredResults[element.subOrDub].push(element);
        else filteredResults.sub.push(element);
    })

    if (filteredResults.sub) {
        filteredResults.sub = filteredResults.sub.filter(element => element.filterScore > 0.5);
        SortedResults.sub = _.sortBy(filteredResults.sub, 'filterScore').reverse();
    }
    let regex = new RegExp(SortedResults.sub[0]?.id, 'i');

    if (filteredResults.dub){
        filteredResults.dub = filteredResults.dub.filter(element => element.filterScore > 0.5);
        SortedResults.dub = _.sortBy(filteredResults.dub, 'filterScore').reverse();

    } 

    console.log(SortedResults)
    //if (SortedResults.sub?.filter(value => value.filterScore > 0)?.length) SortedResults.sub = SortedResults.sub.filter(value => value.filterScore > 0);
    //console.log("SortedResults",filteredResults.dub)
    return SortedResults.sub;
}

/*function filter(list = Array, meta = Object) {
    let SortedResults = { sub: [], dub: [] },
        filteredResults = { sub: [], dub: [] };
    list.forEach((element, index) => {
        element.sortingRank = 0;
        let titles = [meta.title,meta.original_title]
        if (element.releaseDate) {
            if (element.releaseDate.toString().match(meta.year)) element.sortingRank++;
            else element.sortingRank--;
        }
        else if (element.type && element.type.toLowerCase().match(meta.type.toLowerCase())) element.sortingRank++;

        if (!element.releaseDate) element.sortingRank--;

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

        if (element.subOrDub) filteredResults[element.subOrDub].push(element);
        else filteredResults.sub.push(element);
        //filteredResults.push(element);
    })
    if (filteredResults.sub) SortedResults.sub = _.sortBy(filteredResults.sub, 'sortingRank').reverse();
    let regex = new RegExp(SortedResults.sub[0]?.id, 'i');
    if (filteredResults.dub) SortedResults.dub = filteredResults.dub.filter(function (el) {
        //console.log("SortedResults.sub[0].id",regex)
        if (regex.test(el.id))
            //console.log("SortedResults.sub[0].id.match(el.id)",regex.test(el.id))
            return regex.test(el.id);
    });
    // console.log(SortedResults)
    if (SortedResults.sub?.filter(value => value.sortingRank > 0)?.length) SortedResults.sub = SortedResults.sub.filter(value => value.sortingRank > 0);
    //console.log("SortedResults",filteredResults.dub)
    return SortedResults.sub;
}*/

function getSubs(subs = Array, proxy) {
    let subtitles = [];
    //console.log("subs",subs)
    subs.every(({ url, lang }, index) => {
        if (url.match(/thumbnails|sprite|images/gi)) return false
        let sub = {}
        sub.url = config.local + "/sub.vtt?" + sub2vtt.gerenateUrl(url, proxy);
        iso639.forEach((iso) => {
            iso.eng.forEach((name) => {
                if (name.toLowerCase() == lang.toLowerCase()) sub.lang = iso["639-2"]
                else if (!sub.lang && lang.toLowerCase().includes(name.toLowerCase())) sub.lang = iso["639-2"]
            })
            //else sub.lang = lang;     
        })
        if (!sub.lang) sub.lang = lang
        sub.id = index.toString()
        subtitles.push(sub)
        //subtitles[index].url = subtitle.url 
        return true
    })
    //console.log("subtitles",subtitles)
    return subtitles
}

function titleCompare(ref, texts = []) {
    const scores = []
    texts.forEach(text => {
        if (!text) return;
        scores.push(levenshteinDistance(ref, text))
    })
    return Math.max(...scores);

}
function levenshteinDistance(s1, s2) {

    function editDistance(s1, s2) {
        s1 = s1.toLowerCase()
        s2 = s2.toLowerCase()

        var costs = new Array()

        for (var i = 0; i <= s1.length; i++) {
            var lastValue = i
            for (var j = 0; j <= s2.length; j++) {
                if (i == 0)
                    costs[j] = j
                else {
                    if (j > 0) {
                        var newValue = costs[j - 1]
                        if (s1.charAt(i - 1) != s2.charAt(j - 1))
                            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
                        costs[j - 1] = lastValue
                        lastValue = newValue
                    }
                }
            }
            if (i > 0)
                costs[s2.length] = lastValue
        }
        return costs[s2.length]
    }

    var longer = s1
    var shorter = s2

    if (s1.length < s2.length) {
        longer = s2
        shorter = s1
    }

    var longerLength = longer.length

    if (longerLength == 0)
        return 1.0

    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength)
}


module.exports = { Anime: getAnime, Movie: getMovie };