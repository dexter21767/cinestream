const log = require('./lib/logger');
const sources = require('./lib/sources')
 
async function stream(type, id) {
    try {
        console.log("stream", type, id)
        log.info("stream: "+ type +' '+id)
        const promises=[];
        if (id.match(/tt\d+(:\d+)?(:\d+)?/i)){
            const [tmdb_id,season,episode] = id.split(":");
            for (const key in sources) {
                promises.push(sources[key](type,tmdb_id, episode, season).catch(e => { console.error(e) }));
            }  

        }


        return await Promise.allSettled(promises).then(promises=>{
            let streams = []
            promises.forEach(({status,value})=>{
                if(status == "fulfilled"){
                    streams = streams.concat(value)
                } 
            })
            return streams.filter(Boolean);

        });
    } catch (e) {
        console.error(e)
        log.error(e)
    }

}


module.exports = stream;
