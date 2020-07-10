const express = require('express'),
    _ = require('lodash'),
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

let schedule = db.get('destination').cloneDeep().value();

const stopList = new Set();

const task = async(x) => {
    let result = 2;
    try {
        await util.ping(x.url, x.port);
    } catch (e) {
        console.log(e);
        result = 1
    } finally {
        const now = new Date(),
            lastPingDate = now.toLocaleTimeString(),
            found = schedule.find(y => y.id === x.id);

        if (found) {
            found['lastPingDate'] = lastPingDate;
            found['status'] !== result && (found['lastStatusChange'] = lastPingDate);
            found['status'] = result;
        }
        io.emit('update', found);
    }
}

const stopComplete = (data) => {
    const { status, item, id } = scheduleManager.stopStatus.get(data.id);
    switch (status) {
        case "stop":
            const found = schedule.find(x => x.id === id);
            found.status = 3;
            io.emit('update', found);
            break;
        case "remove":
            db.get('destination').remove({ id }).write();
            schedule = schedule.filter(x => x.id !== id);
            scheduleManager.jobs.delete(id);
            io.emit('remove', id);
            break;
        case "update":
            db.get('destination').find({ id }).assign(item).write();
            schedule = schedule.filter(x => x.id !== id).concat(item);
            stopList.delete(id);
            scheduleManager.jobs.delete(id);
            const success = scheduleManager.add(item);
            success && io.emit('update', {...item, status: 3 });
            break;
    }
    scheduleManager.stopStatus.delete(id);
}

const scheduleManager = new ScheduleManager(task, stopComplete);
scheduleManager.load(schedule);

app.use(express.static('./client'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const addDestination = (item) => {
    const success = scheduleManager.add(item);
    if (success) {
        db.get('destination').cloneDeep().push(item).write();
        schedule = schedule.concat(item);
        io.emit('new', item);
    }
}

const ModifyDestination = ({ id, ...rest }) => {
    const _id = id ? Number(id) : Date.now(),
        result = {...rest, id: _id };
    id ? scheduleManager.update(result) : addDestination(result);
}

const toggleTimer = (id) => {
    if (stopList.has(id)) {
        scheduleManager.start(id);
        stopList.delete(id);
    } else {
        scheduleManager.stop(id);
        stopList.add(id);
    }
}

io.on('connection', (socket) => {
    io.emit('init', schedule.sort((a, b) => b.status - a.status));
    [
        { topic: 'new', func: ModifyDestination },
        { topic: 'remove', func: scheduleManager.remove },
        { topic: 'toggle', func: toggleTimer }
    ].forEach(x => socket.on(x.topic, x.func));
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});