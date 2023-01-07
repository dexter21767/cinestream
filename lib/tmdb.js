const axios = require('axios').default;
const slugify = require('slugify')

require('dotenv').config();

const BaseURL = 'https://api.themoviedb.org/3';

async function request(url, header) {

    return await axios
        .get(url, header, { timeout: 5000 })
        .then(res => {
            return res;
        })
        .catch(error => {
            if (error.response) {
                console.error('error on tmdb.js request:', error.response.status, error.response.statusText, error.config.url);
            } else {
                console.error(error);
            }
        });

}
async function getMeta(type, id) {
    try{
        let data;
    if (type == "movie") {
        let url = `${BaseURL}/movie/${id}?api_key=${process.env.API_KEY}`
        let res = await request(url);
        if(!res||!res.data) throw "error getting data"
        //console.log(res.data)
        res.data.year = res.data.release_date.split('-')[0];
        data = res.data;

    } else if (type == "series") {
        let url = `${BaseURL}/find/${id}?api_key=${process.env.API_KEY}&external_source=imdb_id`
        let res = await request(url);
        //console.log(res.data)
        if(!res||!res.data||!res.data.tv_results||!res.data.tv_results[0]) throw "error getting data"
        res = res.data.tv_results[0];
        res["original_title"] = res["original_title"] || res["original_name"]
        res["title"] = res["title"] || res["name"]
        res.year = res.first_air_date.split('-')[0];
        data = res
    }
    if(data) data.slug = slugify(data.title, {
        replacement: '-',  // replace spaces with replacement character, defaults to `-`
        remove: undefined, // remove characters that match regex, defaults to `undefined`
        lower: true,      // convert to lower case, defaults to `false`
        strict: true,     // strip special characters except replacement, defaults to `false`
        locale: 'vi',       // language code of the locale to use
        trim: true         // trim leading and trailing replacement chars, defaults to `true`
      })
      
    if(data) data.type = type;
    return data;
}catch(e){
    console.error(e);
}
}


//getMeta("series", 'tt0903747').then(meta => (console.log(meta)))
module.exports = getMeta;