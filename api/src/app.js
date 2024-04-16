const Koa = require('koa');
const { koaBody } = require('koa-body');
const koaLogger = require('koa-logger');
const router = require('./routes.js');
const orm = require('./models');
// const mqtt = require('mqtt');

const app = new Koa();

app.context.orm = orm;

app.use(koaLogger());
app.use(koaBody());

app.use(router.routes());

app.use((ctx) => {
    ctx.body = 'Hello Koa';
  });

module.exports = app;
