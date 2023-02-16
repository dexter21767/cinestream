const log = require('./lib/logger');
const sources = require('./lib/sources')
 
async function stream(type, id) {
    try {
        console.log("stream", type, id)
        log.info("stream: "+ type +' '+id)
        const promises=[];
        if (id.match(/tt\d+(:\d+)?(:\d+)?/i)){
            const [tmdb_id,season,episode] = id.split(":");
            for (const key in sources.movies) {
                promises.push(sources.movies[key](type,tmdb_id, episode, season).catch(e => { console.error(e) }));
            }  

        }
        else if(id.match(/kitsu:\d+(:\d+)?/i)){
            const [kitsu_id,episode] = id.match(/\d+/ig);
            console.log(kitsu_id,episode)
            for (const key in sources.anime) {
                promises.push(sources.anime[key](kitsu_id,episode).catch(e => { console.error(e) }));
            }  
        }


        let streams = await Promise.allSettled(promises).then(promises=>{
            let streams = []
            promises.forEach(({status,value})=>{
                if(status == "fulfilled"){
                    streams = streams.concat(value)
                } 
            })
            return streams.filter(Boolean);

        });
        return streams
    } catch (e) {
        console.error(e)
        log.error(e)
    }

}


module.exports = stream;
