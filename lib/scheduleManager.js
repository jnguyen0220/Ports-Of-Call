"use strict";
import cron from 'cron';
const { CronJob } = cron;

export class ScheduleManager {
    constructor(stopComplete) {
        this.stopComplete = stopComplete;
        this.stopStatus = new Map();
        this.jobs = new Map();
    }

    remove = (id) => {
        const job = this.getJobById(id);
        this.stopStatus.set(id, { id, status: 'remove' });
        job.stop();
    }

    update = (item) => {
        const job = this.getJobById(item.id);
        this.stopStatus.set(item.id, { id: item.id, item, status: 'update' });
        job.stop();
    }

    load = (jobs) => {
        jobs.forEach(this.add);
    }

    add = ({ data, task }) => {
        let result = true;
        try {
            const job = new CronJob(data.scheduleInterval, () => task(data), () => this.stopComplete(data), true, 'America/Los_Angeles');
            this.jobs.set(data.id, job);
        } catch (e) {
            result = false
            console.log(e);
        } finally {
            return result;
        }
    }

    stop = (id) => {
        const job = this.getJobById(id);
        this.stopStatus.set(id, { id, status: 'stop' });
        job.stop();
    }

    start = (id) => {
        this.getJobById(id).start();
    }

    getJobById = (id) => {
        return this.jobs.get(id);
    }
}