const express = require('express'),
    app = express(),
    http = require('http').createServer(app),
    io = require('socket.io')(http),
    util = require('./lib/util.js'),
    ScheduleManager = require('./lib/scheduleManager'),
    low = require('lowdb'),
    FileSync = require('lowdb/adapters/FileSync'),
    adapter = new FileSync('./lib/db.json'),
    db = low(adapter);

db.defaults({ destination: [] }).write();

let schedule = db.get('destination').value().map(x => ({...x }));

const task = async(x) => {
    let result = true;
    try {
        await util.ping(x.url, x.port);
    } catch (e) {
        console.log(e);
        result = false;
    } finally {
        const now = new Date(),
            lastPingDate = now.toLocaleTimeString(),
            found = schedule.find(y => y.id === x.id);

        if (found) {
            found['lastPingDate'] = lastPingDate
            found['status'] = result;
        }
        io.emit('update', { id: x.id, lastPingDate, status: result });
    }
}

const scheduleManager = new ScheduleManager(task);
scheduleManager.load(schedule);

app.use(express.static('./client'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const addDestination = (msg) => {
    const result = {...msg, id: Date.now() },
        success = scheduleManager.add(result);
    if (success) {
        db.get('destination').push(result).write();
        schedule = schedule.concat(result);
        io.emit('new', result);
    }
}

const removeDestination = (id) => {
    db.get('destination').remove({ id }).write();
    schedule = schedule.filter(x => x.id !== id);
    scheduleManager.remove(id);
    io.emit('remove', id);
}

io.on('connection', (socket) => {
    io.emit('init', schedule);
    [
        { topic: 'new', func: addDestination },
        { topic: 'remove', func: removeDestination }
    ].forEach(x => socket.on(x.topic, x.func));
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});