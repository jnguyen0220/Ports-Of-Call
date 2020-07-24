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

let schedule = util.addId(db.get('destination').value());

const config = {
    required: ['protocol', 'scheduleInterval', 'timeout', 'url', 'port', 'requestMethod', 'headers', 'body', 'timeout', 'successWhen', 'successStatus']
}

const getAssignTask = (protocol) => {
    return protocol === 'TCP' ? pingTask : httpTask;
}

const assignTask = (data) => {
    return data.map(x => ({
        data: x,
        task: getAssignTask(x.protocol)
    }));
}

const stopList = new Set();

const uptime = new Map();

const calculateUptime = (id, status) => {
    !uptime.has(id) && uptime.set(id, [0, 0]);
    const record = uptime.get(id);
    record[status === 1 ? 0 : 1] += 1;
    return (record[1] / (record[0] + record[1]) * 100).toFixed(0);
}

const pingTask = async(x) => {
    let result = 2;
    try {
        await util.ping(x);
    } catch (e) {
        console.log(e);
        result = 1
    } finally {
        requestCompleted(x.id, result);
    }
}

const httpTask = async(x) => {
    let result = 2;
    try {
        const { status } = await util.http(x);
        result = validate(x.successWhen, x.successStatus, status.toString()) ? 2 : 1;
    } catch (e) {
        console.log(e);
        result = 1
    } finally {
        requestCompleted(x.id, result);
    }
}

const validateWildCard = (exp, value) => {
    const hasWildCard = exp.includes('*');
    return hasWildCard ? exp[0] === value[0] : exp === value;
}

const validate = (successWhen, successStatus, value) => {
    const status = successStatus.split(',');
    const result = status.some(x => validateWildCard(x, value));
    return successWhen === "1" ? result : !result;
}

const requestCompleted = (id, result) => {
    const lastPingDate = new Date(),
        found = schedule.find(x => x.id === id);

    if (found) {
        found['lastPingDate'] = lastPingDate;
        found['uptime'] = calculateUptime(id, result);
        found['status'] !== result && (found['lastStatusChange'] = lastPingDate);
        found['status'] = result;
    }
    io.emit('update', found);
};

const cleanSaveObject = (list) => {
    return list.map(x => config.required.reduce((a, c) => ({
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
            const success = scheduleManager.add({
                data: item,
                task: getAssignTask(item.protocol)
            });
            success && io.emit('update', {...item, status: 3 });
            break;
    }
    scheduleManager.stopStatus.delete(id);
}

const scheduleManager = new ScheduleManager(stopComplete);
scheduleManager.load(assignTask(schedule));

static_config = [
    { client_path: "/", server_path: "./client" },
    { client_path: "/lighterhtml", server_path: "./node_modules/lighterhtml" }
].forEach(x => app.use(x.client_path, express.static(x.server_path)))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const addDestination = (item) => {
    const result = {...item, id: Date.now() },
        success = scheduleManager.add({ data: result, task: getAssignTask(result.protocol) });

    if (success) {
        schedule = schedule.concat(result);
        db.set('destination', cleanSaveObject(schedule)).write();
        io.emit('add', [result]);
    }
}

const toggleTimer = (ids) => {
    ids.forEach(x => {
        if (stopList.has(x)) {
            scheduleManager.start(x);
            stopList.delete(x);
        } else {
            scheduleManager.stop(x);
            stopList.add(x);
        }
    });
}

const updateDestination = ({ id, ...rest }) => {
    scheduleManager.update({...rest, id: Number(id) });
}

const removeDestination = (ids) => {
    ids.forEach(x => scheduleManager.remove(Number(x)));
}

const importData = (data) => {
    const result = util.addId(data);
    schedule = schedule.concat(result);
    scheduleManager.load(assignTask(result));
    db.set('destination', cleanSaveObject(schedule)).write();
    io.emit('add', result);
}

io.on('connection', (socket) => {
    socket.emit('init', { serverStartDate, schedule: schedule.sort((a, b) => b.status - a.status) });
    [
        { topic: 'edit', func: updateDestination },
        { topic: 'add', func: addDestination },
        { topic: 'clone', func: addDestination },
        { topic: 'remove', func: removeDestination },
        { topic: 'toggle', func: toggleTimer },
        { topic: 'import', func: importData }
    ].forEach(x => socket.on(x.topic, x.func));
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});