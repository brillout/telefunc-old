const Koa = require("koa");
const Router = require("koa-router");
const Static = require("koa-static");
const bodyParser = require("koa-bodyparser");
const { telefunc } = require("telefunc/server/koa");
const { start, stop } = require("./express");

module.exports = startServer;

async function startServer({
  __INTERNAL_telefuncServer_middleware,
  httpPort,
  staticDir,
}) {
  const app = new Koa();
  const router = new Router();

  router.get("/hey-before", (ctx, next) => {
    ctx.body = "Hello darling";
  });

  app.use(bodyParser());

  app.use(router.routes());

  app.use(telefunc(undefined, { __INTERNAL_telefuncServer_middleware }));

  app.use(Static(staticDir, { extensions: [".html"] }));

  router.post("/hey/after", (ctx, next) => {
    ctx.body = "Hello again";
  });

  // Not sure why `.callback()` is needed
  //  - Source: https://github.com/koajs/koa/pull/1102#issue-154979875
  const server = await start(app.callback(), httpPort);
  return () => stop(server);
}
