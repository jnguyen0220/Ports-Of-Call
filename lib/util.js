const net = require('net');
const axios = require('axios');

const addId = (item) => {
    return item.map((x, i) => ({
        ...x,
        id: Date.now() + i
    }))
}

const ping = ({ url, port, timeout }) => {
    return new Promise((resolve, reject) => {
        const sock = new net.Socket();
        sock.setTimeout(timeout);
        sock.connect(port, url, () => {
            sock.destroy();
            resolve(true);
        });
        ['error', 'timeout'].forEach(x => sock.on(x, (e) => {
            sock.destroy();
            reject({ error: e, url, port });
        }));
    })
}

const http = ({ url, requestMethod, timeout, headers, body, protocol }) => {
    const config = {
        method: requestMethod,
        url: `${protocol.toLowerCase()}://${url}`,
        timeout,
        ...(headers ? { headers: JSON.parse(headers) } : null),
        ...(body ? { data: JSON.parse(body) } : null)
    }
    return axios(config);
}

module.exports = {
    ping,
    http,
    addId
}