const axios = require('axios').default;

async function request(options) {

        return await client(options)
            .then(res => {
                if (res && res.data) AxiosCache.set(url, res.data);
                return res.data;
            })
            .catch(error => {
                if (error.response) {
                    console.error('error on source.js request:', error.response.status, error.response.statusText, error.config.url);
                    log.error('error on source.js request:', error.response.status, error.response.statusText, error.config.url);
                } else {
                    console.error(error);
                    log.error(error);
                }
            });
    
}

async function anilist(MALid) {
    try {
        let query = `query($id: Int, $type: MediaType){Media(idMal: $id, type: $type){siteUrl}}`;

        let variables = {
            'id': MALid,
            'type': "ANIME"
        }

        let url = 'https://graphql.anilist.co';
        let options = {
            url: url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            data: JSON.stringify({
                query: query,
                variables: variables
            })
        };

        data = await request(options);
        if(!data) throw "error getting data"
        return data.data
    } catch (e) {
        console.error(e)
    }
}

async function kitsu(kistuid){

    let url = 'https://kitsu.io/api/edge/anime/'+kistuid;

    let options = {
        url: url,
        method: 'GET',
        headers: {
            "Accept": "application/vnd.api+json",
            "Content-Type": "application/vnd.api+json"
        }
    };
    data = await request(options);
    console.log(data)

}


kitsu("8671");