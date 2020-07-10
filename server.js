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
    db = low(adapter),
    serverStartDate = new Date();

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
        const lastPingDate = new Date(),
            found = schedule.find(y => y.id === x.id);

        if (found) {
            found['lastPingDate'] = lastPingDate;
            found['status'] !== result && (found['lastStatusChange'] = lastPingDate);
            found['status'] = result;
        }
        io.emit('update', found);
    }
}

const cleanSaveObject = (list) => {
    const prop = ["schedule_interval", "url", "port", "id"];
    return list.map(x => prop.reduce((a, c) => ({
        ...a,
        [c]: x[c]
    }), {}));
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
            schedule = schedule.filter(x => x.id !== id);
            db.set('destination', cleanSaveObject(schedule)).write();
            scheduleManager.jobs.delete(id);
            io.emit('remove', id);
            break;
        case "update":
            schedule = schedule.filter(x => x.id !== id).concat(item);
            db.set('destination', cleanSaveObject(schedule)).write();
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
    const result = {...item, id: Date.now() },
        success = scheduleManager.add(result);

    if (success) {
        schedule = schedule.concat(result);
        db.set('destination', cleanSaveObject(schedule)).write();
        io.emit('new', result);
    }
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

const updateDestination = ({ id, ...rest }) => {
    scheduleManager.update({...rest, id: Number(id) });
}

const removeDestination = (id) => {
    scheduleManager.remove(Number(id));
}

io.on('connection', (socket) => {
    socket.emit('init', { serverStartDate, schedule: schedule.sort((a, b) => b.status - a.status) });
    [
        { topic: 'update', func: updateDestination },
        { topic: 'new', func: addDestination },
        { topic: 'remove', func: removeDestination },
        { topic: 'toggle', func: toggleTimer }
    ].forEach(x => socket.on(x.topic, x.func));
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});