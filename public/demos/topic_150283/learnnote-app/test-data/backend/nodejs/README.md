# Node.js 异步编程

## Promise
异步编程的优雅解决方案。

```javascript
const promise = new Promise((resolve, reject) => {
  setTimeout(() => resolve('success'), 1000);
});
```

## async/await
基于 Promise 的语法糖，让异步代码看起来像同步代码。

## Event Loop
理解 Node.js 的事件循环机制：宏任务队列、微任务队列。

## Express 框架
快速构建 Web 应用的 Node.js 框架。

## Koa 框架
Express 原班人马打造，更现代的设计。