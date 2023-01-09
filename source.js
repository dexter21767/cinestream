const log = require('./logger');
const consumet = require('./lib/consumet');
const noyyverse = require('./lib/nollyverse')
const sources = require('./lib/sources')

const NodeCache = require("node-cache");
const { restart } = require('nodemon');
const StreamCache = new NodeCache({ stdTTL: (6 * 60 * 60), checkperiod: (3 * 60 * 60) });

 
async function stream(type, id) {
    try {
        cached = StreamCache.get(id)
        if (cached) return cached
        console.log("stream", type, id)
        log.info("stream: "+ type +' '+id)
        let streams;
        const promises=[];
        if (id.match(/tt\d+(:\d+)?(:\d+)?/i)){
            const [tmdb_id,season,episode] = id.split(":");
            for (const key in sources.movies) {
                promises.push(sources.movies[key](type,tmdb_id, episode, season).catch(e => { console.error(e) }));
            }  
            streams = await consumet.Movie(type,tmdb_id,episode,season)

        }
        else if(id.match(/kitsu:\d+(:\d+)?/i)){
            const [kitsu_id,episode] = id.match(/\d+/ig);
            console.log(kitsu_id,episode)
            for (const key in sources.anime) {
                promises.push(sources.anime[key](kitsu_id,episode).catch(e => { console.error(e) }));
            }  
            streams = await consumet.Anime(kitsu_id,episode)

        }
        streams = await Promise.allSettled(promises).then(promises=>{
            let streams = []
            promises.forEach(({status,value})=>{
                if(status == "fulfilled"){
                    streams = streams.concat(value)
                } 
            })
            return streams
            
        });
        if (streams) StreamCache.set(id, streams)
        return streams
    } catch (e) {
        console.error(e)
        log.error(e)
    }

}


module.exports = stream;
