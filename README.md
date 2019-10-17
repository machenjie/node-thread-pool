# node-thread-pool
Run out of the computer resource just in on process!

Use the **--experimental-worker** flag to run correctly, since this resource still experimental in NodeJs.

## Introduction
If you want to run out of the computer resource, you need this.

## Prerequisites
* [NodeJs](https://nodejs.org/en/) (v 10.15.0 or later)
* [Npm](https://www.npmjs.com/)


## Installation

```sh
$ npm install @mcjxy/node-thread-pool [--save]
```

## Examples
[test.js](https://github.com/machenjie/node-thread-pool/blob/master/test/test.js)
```
const ThreadPool = require('@mcjxy/node-thread-pool');
const path = require('path');

const threadPool = new ThreadPool(9, 200);
(async () => {
  process.setMaxListeners(0);
  for (let i = 0; i < 200; i++) {
    threadPool.dispatch(path.resolve(__dirname, './task.js'), i).then(v => {
      console.log('main: data ', v);
    }).catch(e => {
      console.log(e);
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
```
Note: if the thread count is more than 10, after you use the console.log in every thread, you will get a warnning: (node:9768) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 error listeners added. Use emitter.setMaxListeners() to increase limit. You can add "--trace-warnings" start option to check more information.
## API

### ThreadPool(threadNum, maxRunningTask)
the constructor, after you call this, thread pool are ready
- `threadNum` :  integer Thread number of the pool. default is cpu number
- `maxRunningTask` : integer Max running tasks of all threads. 0 for unlimited. default is 0

### ThreadPool.dispatch(file, ...args)
dispatch a task
- `file` :  string Javascript absolute file path, it should export a function which accept two parameter, method(threadID, ...args)
- `args` : A list of args which will be trans to the method of the js file
- `return` : promise<any> You can use this to get task return data

### ThreadPool.wait()
wait until all the tasks run end

### ThreadPool.cancel()
cancel the tasks which are not running, and wait until all the running tasks run end

## License

The project is licensed under the MIT License. See the [LICENSE](https://github.com/machenjie/node-thread-pool/blob/master/LICENSE) file for more details
