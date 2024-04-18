
const fs = require('fs')
const axios = require('axios');
const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');

const signature = require('../game/signature');
const config = require('../../config.json')

const privateKey = fs.readFileSync('ssl/key.txt', 'utf8');
const certificate = fs.readFileSync('ssl/cert.crt', 'utf8');
const credentials = { key: privateKey, cert: certificate };

const app = express();

app.disable('x-powered-by');
app.disable('etag');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

app.get('/v2/Config/BattleCars/:buildid/Prod/Steam/INT/', async (req, res) => {
    const buildid = req.params.buildid;

    const staticResponse = await axios.get(`https://config.psynet.gg/v2/Config/BattleCars/${buildid}/Prod/Steam/INT/`, {
        transformResponse: []
    });
    
    const json = JSON.parse(staticResponse.data);

    json['PsyNetUrl']['URL'] = `http://${config.ipPublic}:8123/Services`;

    const responseJson = JSON.stringify(json, null, 2);
    const psySignature = signature.cdn(responseJson);

    return res.status(200)
        .header('Content-Type', 'application/json')
        .header('PsySignature', psySignature)
        .send(responseJson);
});

/** Deprecated */
app.get('/v1/Config/rl/:buildid/Prod/Steam/INT/', (req, res) => {
    return res.status(200).json({
        URL: `http://${config.ipPublic}:8123/Static.json?Platform=Steam&Language=INT&BuildID=${req.params.buildid}&Environment=Prod`
    })
});

exports.listen = () => {
    https.createServer(credentials, app).listen(443, config.ipAddress);
    console.log('HTTPS Server running.');
}
