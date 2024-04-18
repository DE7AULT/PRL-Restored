const obj = {}

function set(sessionID, playerID){
    obj[sessionID] = playerID
}

function get(sessionID) {
    return obj[sessionID]
}

function del(sessionID) {
    delete obj[sessionID]
}

module.exports = {
    set,
    get,
    del
}