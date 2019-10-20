'use strict';

module.exports = class {
  constructor(msgType, result, error, msgID, workerID) {
    this.msgType = msgType;
    this.result = result;
    this.error = error;
    this.msgID = msgID;
    this.workerID = workerID;
  }
};
