'use strict';

/**
 * need use command: node --experimental-worker xxx.js to start
 */

const path = require('path');
const { Worker } = require('worker_threads');
const { EventEmitter } = require('events');
const uuidv4 = require('uuid/v4');
const MsgDefine = require('./msg-define');
const cpuNum = require('os').cpus().length;

class ThreadPool {
  constructor(threadNum = cpuNum, maxRunningTask = 0) {
    this.workerDealInfo = [];
    this.ee = new EventEmitter();
    this.queue = [];
    this.running = [];
    this.canceling = false;
    this.waiting = false;
    this.threadNum = threadNum ? threadNum : cpuNum;
    this.maxRunningTask = maxRunningTask;
    this._start();
  }

  async dispatch(file, ...args) {
    if (this.canceling) {
      throw new Error('tasks in canceling');
    }
    const msgID = uuidv4();
    this.queue.push({ file, args, msgID });
    const promise = new Promise((resolve, reject) => {
      this.ee.once(msgID, result => {
        result.error ? reject(result.error) : resolve(result.result);
      });
    });
    this._next();
    return promise;
  }

  async cancel() {
    this.queue = [];
    this.canceling = true;
    await this.wait();
    this.canceling = false;
  }

  async wait() {
    if (this.running.length === 0 && this.queue.length === 0) {
      return;
    }
    this.waiting = true;
    await new Promise(resolve => {
      this.ee.once(MsgDefine.MSG_ALL_TASK_END, () => {
        resolve();
      });
    });
    this.waiting = false;
  }

  _start() {
    if (this.workerDealInfo.length === 0) {
      for (let index = 0; index < this.threadNum; index++) {
        const currentIndex = index;
        const worker = new Worker(__dirname + path.sep + 'worker-task.js');
        worker.on('exit', () => {
          this.workerDealInfo.splice(currentIndex, 1);
        });
        worker.on('message', msg => {
          this.workerDealInfo[currentIndex].count--;
          switch (msg.type) {
            case MsgDefine.MSG_RUN_RESULT:
            case MsgDefine.MSG_RUN_ERROR:
              this.ee.emit(msg.msgID, {
                result: msg.result,
                error: msg.error,
              });
              this.running = this.running.filter(task => task.msgID !== msg.msgID);
              if (this.running.length === 0 && this.queue.length === 0 && this.waiting) {
                this.ee.emit(MsgDefine.MSG_ALL_TASK_END);
              }
              this._next();
              break;
            default:
              throw new Error('unknown msg type: ' + msg.type);
          }
        });
        this.workerDealInfo.push({
          worker,
          count: 0,
        });
      }
    }
  }

  _next() {
    if (this.queue.length === 0) {
      return;
    }
    const freeIndex = this._getFreeWorkerIndex();
    if (freeIndex === -1) {
      return;
    }
    const task = this.queue.shift();
    this.running.push(task);
    this.workerDealInfo[freeIndex].count++;
    this.workerDealInfo[freeIndex].worker.postMessage(task);
  }

  _getFreeWorkerIndex() {
    if (this.maxRunningTask && this.running.length >= this.maxRunningTask) {
      return -1;
    }
    let dealWorkerIndex = 0;
    for (let index = 0; index < this.workerDealInfo.length; index++) {
      if (this.workerDealInfo[index].count < this.workerDealInfo[dealWorkerIndex].count) {
        dealWorkerIndex = index;
      }
    }
    return dealWorkerIndex;
  }
}

module.exports = ThreadPool;
