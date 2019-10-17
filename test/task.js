'use strict';

let count = 0;

module.exports = (threadId, data) => {
  console.log('worker', threadId, ': data', data, 'count:', count++);
  return data;
};
