'use strict';

const isPromise = require('is-promise');
const { parentPort, threadId } = require('worker_threads');
const MsgDefine = require('./msg-define');

parentPort.on('message', msg => {
  const postResultMessage = result => {
    parentPort.postMessage({
      type: MsgDefine.MSG_RUN_RESULT,
      result,
      msgID: msg.msgID,
    });
  };
  const postErrorMessage = error => {
    parentPort.postMessage({
      type: MsgDefine.MSG_RUN_ERROR,
      error,
      msgID: msg.msgID,
    });
  };

  try {
    // eslint-disable-next-line no-eval
    const method = eval(`(${msg.method})`);
    const result = method(threadId, ...msg.args);

    if (isPromise(result)) {
      result.then(result => {
        postResultMessage(result);
      }).catch(e => {
        postErrorMessage(e);
      });
    } else {
      postResultMessage(result);
    }
  } catch (e) {
    postErrorMessage(e);
  }
});
