'use strict';

module.exports = (threadId, data) => {
  console.log('worker', threadId, ': data', data);
  return data;
};
