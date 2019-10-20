'use strict';

module.exports = class {
  constructor(file, args, msgID, workerID = -1) {
    this.file = file;
    this.args = args;
    this.msgID = msgID;
    this.workerID = workerID;
  }
};
