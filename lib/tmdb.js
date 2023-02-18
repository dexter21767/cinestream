const axios = require('axios').default;
const slugify = require('slugify')
const tmdbCache = new NodeCache({ stdTTL: (0.5 * 60 * 60), checkperiod: (1 * 60 * 60) });

require('dotenv').config();

const BaseURL = 'https://api.themoviedb.org/3';

const client = axios.create(
    {
        baseURL: BaseURL,
        timeout: 5000,
        headers: { 'Accept-Encoding': 'gzip,deflate,compress' },
    }
)

async function getMeta(type, id) {
    try {

        const CacheId = `${type}:${id}`;
        let data = tmdbCache.get(CacheId);
        if (data) return data;

        if (type == "movie") {
            const path = `/movie/${id}?api_key=${process.env.API_KEY}`
            let res = await client.get(path);
            if (!res || !res.data) throw "error getting data"
            //console.log(res.data)
            res.data.year = res.data.release_date.split('-')[0];
            data = res.data;

        } else if (type == "series") {
            const path = `/find/${id}?api_key=${process.env.API_KEY}&external_source=imdb_id`
            let res = await client.get(path);
            //console.log(res.data)
            if (!res || !res.data || !res.data.tv_results || !res.data.tv_results[0]) throw "error getting data"
            res = res.data.tv_results[0];
            res["original_title"] = res["original_title"] || res["original_name"]
            res["title"] = res["title"] || res["name"]
            res.year = res.first_air_date.split('-')[0];
            data = res
        }
        if (data) data.slug = slugify(data.title, {
            replacement: '-',  // replace spaces with replacement character, defaults to `-`
            remove: undefined, // remove characters that match regex, defaults to `undefined`
            lower: true,      // convert to lower case, defaults to `false`
            strict: true,     // strip special characters except replacement, defaults to `false`
            locale: 'vi',       // language code of the locale to use
            trim: true         // trim leading and trailing replacement chars, defaults to `true`
        })

        if (data) data.type = type;
        if (data) tmdbCache.set(CacheId, data);
        return data;
    } catch (e) {
        console.error(e);
    }
}


//getMeta("series", 'tt0903747').then(meta => (console.log(meta)))
module.exports = getMeta;