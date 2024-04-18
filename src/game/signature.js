const crypto = require("crypto");

function cdn(data) {
    return hmac256("cqhyz50f3c3j2pxhwo6b1kypxikah0wh", data);
}

function request(data) {
    return hmac256("c338bd36fb8c42b1a431d30add939fc7", "-" + data);
}

function response(psyTime, data) {
    return hmac256("3b932153785842ac927744b292e40e52", psyTime + "-" + data);
}

function hmac256(key, data){
    return crypto.createHmac('sha256', key).update(data).digest("base64");
}

module.exports = {
    cdn,
    request,
    response
}