'use strict';

const ThreadPool = require('../src/thread-pool');
const path = require('path');

const threadPool = new ThreadPool(9, 200);
(async () => {
  process.setMaxListeners(0);
  for (let i = 0; i < 200; i++) {
    threadPool.dispatch(path.resolve(__dirname, './task.js'), i).then(v => {
      console.log('main: data ', v);
    }).catch(e => {
      console.log('error:', e);
    });
  }
  await threadPool.wait();

  for (let i = 0; i < 1000; i++) {
    threadPool.dispatch(path.resolve(__dirname, './task.js'), i);
  }
  console.log('start cancel', (new Date()).toISOString());
  await threadPool.cancel();
  console.log('end cancel', (new Date()).toISOString());
})();
