'use strict';

const ThreadPool = require('../src/thread-pool');
const path = require('path');

const threadPool = new ThreadPool(9, 50);
(async () => {
  for (let i = 0; i < 200; i++) {
    threadPool.dispatch(path.resolve(__dirname, './task.js'), i).then(v => {
      console.log('main: data ', v);
    }).catch(e => {
      console.log('error:', e);
    });
  }
  try {
    await threadPool.wait(3000);
  } catch (e) {
    console.log(e);
  }

  // await threadPool.init();
  // for (let i = 0; i < 1000; i++) {
  //   threadPool.dispatch(path.resolve(__dirname, './task.js'), i);
  // }
  // console.log('start cancel', (new Date()).toISOString());
  // await threadPool.cancel();
  // console.log('end cancel', (new Date()).toISOString());
})();
