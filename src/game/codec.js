const eol = '\r\n';
const signature = require('./signature');

function renameProperty(object, oldName, newName) {
    if (oldName === newName) {
        return object;
    }
    if (object.hasOwnProperty(oldName)) {
        object[newName] = object[oldName];
        delete object[oldName];
    }
    return object;
}

function decode(message) {
    const headers = {};
    const split = message.split(eol+eol, 2);

    // Parse Headers
    split[0].split(eol).forEach(item => {
        item = item.split(/:\s/, 2);
        headers[item[0]] = item[1].trim();
    });

    // Apply workaround
    renameProperty(headers, 'Psyconnectionid', 'PsyConnectionID');
    renameProperty(headers, 'Psyrequestuid', 'PsyRequestUID');
    renameProperty(headers, 'Psysig', 'PsySig');
    renameProperty(headers, 'Psytime', 'PsyTime');

    if (split[1]) {
        return {headers, body: JSON.parse(split[1])};
    }

    return {headers};
}

function encode(message, request = true) {
    return request ? encodeReq(message) : encodeRes(message);
}

function encodeHead(headers) {
    return Object.keys(headers).map(i => `${i}: ${headers[i]}`).join(eol) + eol + eol;
}

function encodeReq(message) {
    const { headers, body } = message;

    if (body) {
        const json = JSON.stringify(body);

        if (headers.hasOwnProperty('PsySig')) {
            headers['PsySig'] = signature.request(json);
        }

        return encodeHead(headers) + json;
    }

    return encodeHead(headers);
}

function encodeRes(message) {
    const { headers, body } = message;

    if (body) {
        const json = JSON.stringify(body);

        if (headers.hasOwnProperty('PsySig') && headers.hasOwnProperty('PsyTime')) {
            headers['PsySig'] = signature.response(headers['PsyTime'], json);
        }

        return encodeHead(headers) + json;
    }

    return encodeHead(headers);
}

module.exports = {
    decode,
    encode,
    encodeReq,
    encodeRes
}