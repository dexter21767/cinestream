const tmdb = require('./tmdb');
const config = require('../config')
const axios = require('axios').default
const {parse} = require('fast-html-parser')

const NodeCache = require("node-cache");
const SubsCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const EpisodeCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const InfoCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const SearchCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });
const StreamCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });

const baseURL = 'https://www.nollyverse.com';
const sourceName = "NollyVerse";
const client = axios.create({ baseURL: baseURL, timeout: 5000 })

async function request(url) {

    return await client
        .get(url,)
        .then(res => {
            return res;
        })
        .catch(error => {
            if (error.response) {
                console.error('error on nollyverse.js request:', error.response.status, error.response.statusText, error.config.url);
            } else {
                console.error(error);
            }
        });

}
//getStream("series","tt3032476",2,7)
//getStream("movie","tt0499549")
async function getStream(type, tmdb_id, season,episode) {
    try {
        const meta = await tmdb(type, tmdb_id);
        let path; 
        if (type == "series") path = `/serie/${meta.slug}/season-${season}`;
        else if(type == "movie") path = `/movie/${meta.slug}/download/`;
        if(!path) throw "unsuported type";
        console.log(path)
        const res = await request(path);
        if(!res?.data) throw new Error("error getting data");
        const html = parse(res.data);
        let sources;
        if(type == "movie") sources = getMovie(html)
        else if(type == "series") sources = getSeries(html,episode)
        //console.log(sources)
        return sources;
    } catch (e) {
        console.error(e);
    }

}

function getMovie(data){
    const sources = [];
    rows = data.querySelectorAll('table.table.table-striped tbody tr');
    rows.forEach(element => {
        sources.push({
            name: sourceName,
            description:element.querySelectorAll('td')[0].rawText.trim(),
            url:element.querySelector('a').rawAttributes['href'],
        })
    });
    return sources
}
function getSeries(data,episode){
    const episodes = [];
    rows = data.querySelectorAll('table.table.table-striped tbody tr');
    rows.forEach((element,index) => {    

        const qualities = [];
        colomns = element.querySelectorAll('a')
        colomns.forEach(source=>{
            qualities.push({            
                name: sourceName,
                description:source.rawText.trim(),
                url:source.rawAttributes['href'],
             })
        })
        episodes.push({
            episodes: index+1,
            qualities:qualities,
        })
    });
    return episodes[episode-1].qualities
}
module.exports = getStream;
