const { addonBuilder } = require("stremio-addon-sdk");

const stream = require("./source");
// Docs: https://github.com/Stremio/stremio-addon-sdk/blob/master/docs/api/responses/manifest.md
const manifest = require("./manifest");
const builder = new addonBuilder(manifest)

builder.defineStreamHandler((args) => {
	console.log("addon.js streams:", args);
	if (args.id.match(/tt[^0-9]*/i)) {
		return Promise.resolve(stream(args.type, args.id,))
		.then((streams) => ({ streams: streams }));
		//return Promise.resolve({ streams: [] });
	} else {
		console.log('stream reject');
		return Promise.resolve({ streams: [] });
	}
});

module.exports = builder.getInterface()