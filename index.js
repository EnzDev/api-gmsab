const express = require("express");
const elastic = require("elasticsearch");

const app = express();
var server = require("http").createServer(app);
const io = require("socket.io")(server);

const elastic_conf = require("./elastic.conf");

const port = 3000;

var es_client = new elastic.Client({
  host: `${elastic_conf.ip}:${elastic_conf.port}`,
  log: "trace"
});

app.use(function(req, res, next){
  res.header('Access-Control-Allow-Origin', '*')
  next();
});

app.get("/", (_, res) => res.json({ status: "up" }));

app.get("/new", (_, res) => {
  // Get a booting 100 images list
  es_client.search(
    {
      index: "gmsab",
      size: 100
    },
    (e, r) => {
      if (!e) res.json(r.hits.hits.map(it => it._source));
      else res.status(500).json({ status: "Unaccepted by ES" });
    }
  );
});

app.get("/next", (req, res) => {
  // Get a 100 images following :start
  es_client.search(
    {
      index: "gmsab",
      size: 40,
      from: parseInt(req.query.start)
    },
    (e, r) => {
      if (!e) res.json(r.hits.hits.map(it => it._source));
      else res.status(500).json({ status: "Unaccepted by ES" });
    }
  );
});


io.on("connection", function(client) {
  console.log(
    `[IO] New client (${client.conn.id}) connected for Delta subscription`
  );

  client.on("join", function(data) {
    console.log(`[IO] Client (${client.conn.id}) ready for subscription.`);
    console.log(data);
  });
});

server.listen(port, () =>
  console.log(`Example app listening on port ${port}!`)
);
