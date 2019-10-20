'use strict';

let count = 0;

module.exports = async (threadId, data) => {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('worker', threadId, ': data', data, 'count:', count++);
      resolve(data);
    }, 1000);
  });
};
