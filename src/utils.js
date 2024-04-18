
function getSteamID(connectionID) {
    return BigInt(connectionID.split('|', 3)[1]);
}

function randomToken(bytes = 16) {
    return require('crypto').randomBytes(bytes).toString('hex');
}

function randomInt64() {
    return Math.floor(Math.random() * 1000000000);
}

function unixTimestamp() {
    return Math.floor(new Date / 1000);
}

function escapeEOL(str) {
    return str.replace(/\r/g, '\\r').replace(/\n/g, '\\n');
}

function createDrops(drops) {

    function build(id) {
        return {
            "ID": id,
            "Result": {
                "Drops": drops
            }
        }
    }

    return build;
}

module.exports = {
    getSteamID,
    randomToken,
    randomInt64,
    escapeEOL,
    unixTimestamp,
    createDrops,
}