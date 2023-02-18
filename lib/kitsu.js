const axios = require('axios').default;
require('dotenv').config();
const BaseURL = 'https://kitsu.io/api/edge';
const NodeCache = require("node-cache");
const KitsuCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (0.5 * 60 * 60) });

const client = axios.create(
    { 
        baseURL: BaseURL,
        timeout: 5000,
        headers: {  'Accept-Encoding': 'gzip,deflate,compress'} ,
    }
)

async function getMeta(id = String) {
    try {
        const Cached = KitsuCache.get(id);
        if(Cached) return Cached; 
        const Path = `/anime/${id}`
        const res = await client.get(Path);
        if(!res || !res.data) throw "error getting kitsu data";
        //console.log(res.data);
        const attributes = res.data.data.attributes;
        //console.log(attributes)
        const meta = { title: attributes.canonicalTitle,titles: attributes.titles,type:"anime", year: attributes.startDate.split("-")[0], slug: attributes.slug };
        if(meta) KitsuCache.set(id,meta);
        return meta
    } catch (e) {
        console.error(e)
    }
}
//getMeta(1);
module.exports = getMeta;