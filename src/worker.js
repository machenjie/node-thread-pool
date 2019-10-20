'use strict';

module.exports = class {
  constructor(worker, id) {
    this._worker = worker;
    this._id = id;
    this._count = 0;
    this._runningTasks = [];
  }

  get count() {
    return this._count;
  }

  get id() {
    return this._id;
  }

  get runningTasks() {
    return [ ...this._runningTasks ];
  }

  sendTask(task) {
    this._worker.postMessage(task);
    this._runningTasks.push(task);
    this._count++;
  }

  receiveResult(result) {
    this._count--;
    this._runningTasks = this._runningTasks.filter(task => task.msgID !== result.msgID);
  }
};
