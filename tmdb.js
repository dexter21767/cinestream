const axios = require('axios').default;
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
        data = res.data;
    } else if (type == "series") {
        let url = `${BaseURL}/find/${id}?api_key=${process.env.API_KEY}&external_source=imdb_id`
        let res = await request(url);
        if(!res||!res.data) throw "error getting data"
        res.data.tv_results[0]["original_title"] = res.data.tv_results[0]["original_title"] || res.data.tv_results[0]["original_name"]
        res.data.tv_results[0]["title"] = res.data.tv_results[0]["title"] || res.data.tv_results[0]["name"]
        data = res.data.tv_results[0]
    }
    return data;
}catch(e){
    console.error(e);
}
}


//getMeta("series", 'tt0903747').then(meta => (console.log(meta)))
module.exports = getMeta;