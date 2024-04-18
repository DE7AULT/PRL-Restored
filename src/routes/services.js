
const axios = require('axios')
const express = require('express')
const bodyParser = require('body-parser')
const sessions = require('../sessions')
const config = require('../../config.json')
const signature = require('../game/signature')

const server = express();

server.use('/Services', bodyParser.text({type:"application/x-www-form-urlencoded"}));
server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.json());
server.use(bodyParser.raw());

server.disable('x-powered-by');
server.disable('etag');

server.post('/Services', async (req, res) => {
    delete req.headers.host;

    const serviceRequestJson = JSON.parse(req.body);
    const playerId = serviceRequestJson[0]["Params"]["PlayerID"];
    
    if (config.advancedDebug) {
        console.log("");
        console.log("Service Request");
        console.log("PLAYER ID:", playerId);
        console.log(JSON.stringify(serviceRequestJson));
    }

    /*if (serviceRequestJson[0].Service === 'Auth/AuthPlayer') {
        if (!await db.canInjectProxy(playerId)) {
            return res.status(401).end();
        }
    }*/

    const psyResponse = await axios.post('https://api.rlpp.psynet.gg/Services',req.body,{
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': req.headers['user-agent'],
            'Cache-Control': 'no-cache',
            'PsySig': req.headers['psysig'],
            'PsyRequestID': req.headers['psyrequestid'],
            'PsyBuildID': req.headers['psybuildid'],
            'PsyEnvironment': 'Prod'
        },
        transformResponse: []
    });

    const data = JSON.parse(psyResponse.data);

    if (config.advancedDebug) {
        console.log(" ");
        console.log(`Service Response (Code: ${psyResponse.status})`);
        console.log(JSON.stringify(data));
    }

    if (!data['Responses'][0]['Error']) {
        data['Responses'][0]['Result']['PerConURL'] = `ws://${config.ipPublic}:8124`;

        let sessionId = data.Responses[0].Result.SessionID;
        sessions.set(sessionId, playerId);

        console.log(`[Player ID: ${playerId}] Proxy injetado com sucesso`);
    } else {
        console.log(`[Player ID: ${playerId}] Falha ao injetar o proxy`);
    }

    const dataJson = JSON.stringify(data);
    const sig = signature.response(psyResponse.headers['psytime'], dataJson);

    res = res.status(psyResponse.status)
        .set(psyResponse.headers)
        .header("PsySig", sig);

    res.removeHeader("connection");
    return res.send(dataJson);
});

exports.listen = () => {
    server.listen(8123, config.ipAddress);
    console.log('PsyFake HTTP Server running.');
}
