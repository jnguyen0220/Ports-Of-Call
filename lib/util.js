const net = require('net');

const addId = (item) => {
    return item.map((x, i) => ({
        ...x,
        id: Date.now() + i
    }))
}

const ping = (url, port) => {
    return new Promise((resolve, reject) => {
        const sock = new net.Socket();
        sock.setTimeout(2500);
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

module.exports = {
    ping,
    addId
};