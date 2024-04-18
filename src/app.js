const utils = require('./utils');
const configServer = require('./routes/config');
const servicesServer = require('./routes/services');
const percon = require('./servers/perconproxy');

const tags = require('../tags.json')
const commands = require('../commands.json')
const config = require('../config.json')
                                                                                                   
const productRequests = [];
const redeemCodeRequest = {};

percon.listen(8124, {
    async request(headers, body) {
        if (body) {
            if (body[0].Service === 'Products/GetPlayerProducts') {
                if (config.advancedDebug) {
                    console.log('PRODUCT REQUEST')
                    console.log(JSON.stringify(headers))
                    console.log(JSON.stringify(body))
                }

                productRequests.push(headers.PsyRequestID)
            }

            if (body[0].Service === 'Codes/RedeemCode') {
                let code = body[0].Params.Code.toLowerCase()
                //let steamId = BigInt(body[0].Params.PlayerID.split('|', 3)[1]);

                if (code.startsWith('!')) {
                    code = code.substring(1).replace(' ', '_')
                    redeemCodeRequest[headers.PsyRequestID] = code
                }
            }
        }
    },

    async response(headers, body) {
        if (productRequests.includes(headers.PsyResponseID)) {
            if (config.advancedDebug) {
                console.log('PRODUCT RESPONSE')
                console.log('')
                console.log(JSON.stringify(headers))
                console.log(JSON.stringify(body))
            }

            productRequests.splice(productRequests.indexOf(headers.PsyResponseID), 1)

            let productData = body.Responses[0].Result.ProductData

            tags.forEach(tag => {
                let product = productData.find(p => p.ProductID == tag.ProductID)

                if (product) {
                    console.log(`PRODUCT ${product.ProductID} REMAPPED TO TITLE ${tag.TitleID}`)

                    product.ProductID = 3036
                    product.Attributes = [{
                        "Key": "TitleID",
                        "Value": tag.TitleID
                    }]
                }
            })
        } else if (redeemCodeRequest[headers.PsyResponseID]) {
            let code = redeemCodeRequest[headers.PsyResponseID]
            delete redeemCodeRequest[headers.PsyResponseID]
            let id = body.Responses[0].ID
    
            let command = commands.find(cmd => cmd.name.toLowerCase() === code)
            if (command) {
                let items = command.items.map(item => {
                    return {
                        "ProductID": item.ProductID,
                        "InstanceID": item.InstanceID || utils.randomInt64(),
                        "Attributes": item.Attributes || [],
                        "SeriesID": item.SeriesID || 0,
                        "AddedTimestamp": item.AddedTimestamp || utils.unixTimestamp(),
                        "UpdatedTimestamp": item.UpdatedTimestamp || utils.unixTimestamp(),
                    }
                })
                body.Responses[0] = utils.createDrops(items)(id)
            }
        }
    } 
})

configServer.listen();
servicesServer.listen();
