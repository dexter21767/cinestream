const log = require('./logger');
const consumet = require('./consumet');

const NodeCache = require("node-cache");
const StreamCache = new NodeCache({ stdTTL: (6 * 60 * 60), checkperiod: (3 * 60 * 60) });

 
async function stream(type, id) {
    try {
        cached = StreamCache.get(id)
        if (cached) return cached
        console.log("stream", type, id)
        log.info("stream: "+ type +' '+id)
        let streams;
        if (id.match(/tt\d+(:\d+)?(:\d+)?/i)){
            const [tmdb_id,season,episode] = id.split(":");
            
            streams = await consumet.Movie(type,tmdb_id,episode,season)

        }
        else if(id.match(/kitsu:\d+(:\d+)?/i)){
            const [kitsu_id,episode] = id.match(/\d+/ig);
            console.log(kitsu_id,episode)
            streams = await consumet.Anime(kitsu_id,episode)

        }
        
        if (streams) StreamCache.set(id, streams)
        return streams
    } catch (e) {
        console.error(e)
        log.error(e)
    }

}


module.exports = stream;
