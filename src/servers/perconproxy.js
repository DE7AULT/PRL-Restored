const WebSocket = require('ws');

const { escapeEOL } = require('../utils')
const sessions = require('../sessions')
const codec = require('../game/codec')
const config = require('../../config.json')

exports.listen = (port, listener) => {
    const { request, response } = listener;

    let wss = new WebSocket.Server({
        host: config.ipAddress,
        port,
        perMessageDeflate: {
            zlibDeflateOptions: {
                chunkSize: 1024,
                memLevel: 7,
                level: 3
            },
            zlibInflateOptions: {
                chunkSize: 10 * 1024
            },
            clientNoContextTakeover: true,
            serverNoContextTakeover: true,
            serverMaxWindowBits: 10,
            concurrencyLimit: 10,
            threshold: 1024,
        }
    });

    wss.on('connection', (client, req) => {

        const sessionId = req.headers['psysessionid'];
        const steamId = sessions.get(sessionId);

        if (steamId) {
            sessions.del(steamId);

            console.log('WebSocket PlayerID:', steamId);
            console.log('WebSocket SessionID:', sessionId);

            var queue = [];

            client.on('message', async (data) => {
                try {
                    let { headers, body } = codec.decode(data);
    
                    if (request) {
                        await request(headers, body);
                    }
    
                    queue.push(codec.encodeReq({ headers, body }));
                } catch (e) {
                    console.error('Client to Server error:', e);
                    console.error('Data:', escapeEOL(data));
                }
            });
    
            connectPsyNet(req).then(server => {
    
                const queueWorker = setInterval(() => {
                    if (server.readyState !== WebSocket.OPEN) {
                        clearInterval(queueWorker);
                    } else if (queue.length > 0) {
                        queue.forEach(item => server.send(item));
                        queue.length = 0;
                    }
                }, 10);
    
                // Proxy Server => Client
                server.on('message', async (data) => {
                    try {
                        let { headers, body } = codec.decode(data);
    
                        if (response) {
                            await response(headers, body);
                        }
    
                        client.send(codec.encodeRes({ headers, body }));
                    } catch (e) {
                        console.error('Server to Client error:', e);
                        console.error('Data:', escapeEOL(data));
                    }
                });
    
                client.on('close', () => {
                    clearInterval(queueWorker);
                    server.close();
                });
    
                server.on('close', () => {
                    clearInterval(queueWorker);
                    client.close();
                });
    
            });
            
        }
    });
}

function connectPsyNet(req) {
    return new Promise((resolve, reject) => {
        let server = new WebSocket('wss://ws.rlpp.psynet.gg/ws/gc?PsyConnectionType=Player', {
            headers: {
                'PsyToken': req.headers['psytoken'],
                'PsySessionID': req.headers['psysessionid'],
                'PsyBuildID': req.headers['psybuildid'],
                'PsyEnvironment': req.headers['psyenvironment'],
                'User-Agent': req.headers['user-agent'],
            }
        });

        server.on('open', () => {
            console.log('Connected with success!');
            resolve(server);
        });

        server.on('error', (err) => reject(err));
    });
}
