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
```
const ThreadPool = require('@mcjxy/node-thread-pool');
const threadPool = new ThreadPool(undefined, 10);
(async () => {
  for (let i = 0; i < 100; i++) {
    threadPool.dispatch(data => {
      console.log('worker: data', data);
      return data;
    }, i).then(v => {
      console.log('main: data ', v);
    }).catch(e => {
      console.log(e);
    });
  }
  await threadPool.wait();

  for (let i = 0; i < 1000; i++) {
    threadPool.dispatch(data => {
      console.log('worker: data', data);
      return data;
    }, i);
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
- `threadNum` :  integer Thread number of the pool
- `maxRunningTask` : integer Max running tasks of all threads

### ThreadPool.dispatch(method, ...args)
dispatch a task
- `method` :  function It can be a normal function or a promise function, function accept two parameter, method(threadID, ...args)
- `args` : A list of args which will be trans to the method
- `return` : promise<any> You can use this to get task return data

### ThreadPool.wait()
wait until all the tasks run end

### ThreadPool.cancel()
cancel the tasks which are not running, and wait until all the running tasks run end

## License

The project is licensed under the MIT License. See the [LICENSE](https://github.com/machenjie/node-thread-pool/blob/master/LICENSE) file for more details
