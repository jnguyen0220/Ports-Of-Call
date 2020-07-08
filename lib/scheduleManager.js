"use strict";
const CronJob = require('cron').CronJob;

class ScheduleManager {
    constructor(func) {
        this.func = func
        this.jobs = new Map();
    }

    remove = (id) => {
        const job = this.getJobById(id);
        job.stop();
        this.jobs.delete(id);
    }

    load = (jobs) => {
        jobs.forEach(this.add);
    }

    add = (item) => {
        let result = true;
        try {
            const job = new CronJob(item.schedule_interval, () => this.func(item), null, true, 'America/Los_Angeles');
            this.jobs.set(item.id, job);
        } catch (e) {
            result = false
            console.log(e);
        } finally {
            return result;
        }
    }

    stop = (id) => {
        this.getJobById(id).stop();
    }

    start = (id) => {
        this.getJobById(id).start();
    }

    getJobById = (id) => {
        return this.jobs.get(id);
    }
}

module.exports = ScheduleManager