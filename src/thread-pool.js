'use strict';

/**
 * need use command: node --experimental-worker xxx.js to start
 */

const path = require('path');
const { Worker } = require('worker_threads');
const { EventEmitter } = require('events');
const uuidv4 = require('uuid/v4');
const WaitNotify = require('wait-notify');
const Msg = require('./define/msg');
const Task = require('./define/task');
const Result = require('./define/result');
const Workers = require('./workers');
const cpuNum = require('os').cpus().length;

class ThreadPool {
  constructor(threadNum = cpuNum, maxRunningTask = 0) {
    this.threadNum = threadNum ? threadNum : cpuNum;
    this.maxRunningTask = maxRunningTask;
    this.workers = new Workers();
    this.queue = [];
    this.canceling = false;
    this.waiting = false;
    this.waitingWN = new WaitNotify();
    this.resultEE = new EventEmitter();
    this.isInit = false;
    this.initWN = new WaitNotify();
    this._init();
  }

  async init(timeout = 0) {
    if (!this.isInit) {
      await this.initWN.wait(timeout);
    }
  }

  async dispatch(file, ...args) {
    if (this.canceling) {
      throw new Error('tasks in canceling');
    }
    const msgID = uuidv4();
    this.queue.push(new Task(file, args, msgID));
    const resultPromise = new Promise((resolve, reject) => {
      this.resultEE.once(msgID, result => {
        result.msgType === Msg.MSG_RUN_ERROR ? reject(result.error) : resolve(result.result);
      });
    });
    this._next();
    return resultPromise;
  }

  async cancel(timeout = 0) {
    this.queue = [];
    this.canceling = true;
    try {
      await this.wait(timeout);
    } finally {
      this.canceling = false;
    }
  }

  async wait(timeout = 0) {
    if (this.workers.runningTasksCount === 0 && this.queue.length === 0) {
      return;
    }
    this.waiting = true;
    try {
      await this.waitingWN.wait(timeout);
    } finally {
      this.waiting = false;
    }
  }

  _next() {
    if (!this.isInit) {
      return;
    }
    if (this.queue.length === 0) {
      return;
    }
    if (this.maxRunningTask && this.workers.runningTasksCount >= this.maxRunningTask) {
      return;
    }
    this._sendTask();
  }

  _addWorker(worker, workerID) {
    this.workers.addWorker(worker, workerID);
    this._next();
  }

  _removeWorker(workerID) {
    const removeRunningTasks = this.workers.removeWorker(workerID);
    removeRunningTasks.forEach(task => {
      this.resultEE.emit(task.msgID, new Result(Msg.MSG_RUN_ERROR, undefined, 'worker ' + workerID + ' being removed', task.msgID, task.workerID));
    });
    if (this.workers.runningTasksCount === 0 && this.queue.length === 0 && this.waiting) {
      this.waitingWN.notify();
    }
    this._next();
  }

  _sendTask() {
    const worker = this.workers.getFreeWorker();
    if (worker) {
      const task = this.queue.shift();
      task.workerID = worker.id;
      worker.sendTask(task);
      this._next();
    }
  }

  _receiveResult(result) {
    this.resultEE.emit(result.msgID, result);
    const worker = this.workers.getWorkerByID(result.workerID);
    if (worker) {
      worker.receiveResult(result);
      if (this.workers.runningTasksCount === 0 && this.queue.length === 0 && this.waiting) {
        this.waitingWN.notify();
      }
      this._next();
    }
  }

  _init() {
    for (let index = 0; index < this.threadNum; index++) {
      const worker = new Worker(path.resolve(__dirname, 'worker-task.js'));
      const workerID = worker.threadId;
      worker.on('exit', () => {
        this._removeWorker(workerID);
      });
      worker.on('error', () => {
        this._removeWorker(workerID);
      });
      worker.on('message', result => {
        this._receiveResult(result);
      });
      worker.on('online', () => {
        if (this.workers.count + 1 >= this.threadNum) {
          this.initWN.notify();
          this.isInit = true;
        }
        this._addWorker(worker, workerID);
      });
    }
  }
}

module.exports = ThreadPool;
