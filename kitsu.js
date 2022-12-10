const axios = require('axios').default;
require('dotenv').config();
const BaseURL = 'https://kitsu.io/api/edge';
const NodeCache = require("node-cache");
const KitsuCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });

async function request(url = String) {

    return await axios
        .get(url, { timeout: 5000 })
        .catch(error => {
            if (error.response) {
                console.error('error on kitsu.js request:', error.response.status, error.response.statusText, error.config.url);
            } else {
                console.error(error);
            }
        });

}

async function getMeta(id = String) {
    try {
        Cached = KitsuCache.get(id);
        if(Cached) return Cached; 
        let url = `${BaseURL}/anime/${id}`

        let res = await request(url);
        if(!res || !res.data) throw "error getting kitsu data";
        console.log(res.data);
        let attributes = res.data.data.attributes;
        //console.log(attributes)
        meta = { title: attributes.titles, year: attributes.startDate.split("-")[0], slug: attributes.slug };
        if(meta) KitsuCache.set(id,meta);
        return meta
    } catch (e) {
        console.error(e)
    }
}

module.exports = getMeta;