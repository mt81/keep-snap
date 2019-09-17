const mustacheExpress = require("mustache-express");
const express = require("express");
const { existsSync } = require("fs");
const { swap, diffImage } = require("./file-utils");

module.exports.createServer = async (diffs, port) => {
  var app = express();

  let db = {};
  diffs.forEach(v => {
    db[v.id] = v;
  });

  // Register '.mustache' extension with The Mustache Express
  app.engine("html", mustacheExpress());
  app.set("view engine", "html");
  app.set("views", __dirname + "/views");

  app.get("/", function(req, res) {
    res.render("hello.html", { diffs: Object.values(db).filter(v => !!v) });
  });

  app.get("/refImage", function(req, res) {
    let { id } = req.query;
    if (id && db[id]) {
      res.download(db[id].refSnap, "");
    } else {
      res.status(404).send("Not found");
    }
  });

  app.get("/testImage", function(req, res) {
    let { id } = req.query;
    if (id && db[id]) {
      res.download(db[id].testSnap, "");
    } else {
      res.status(404).send("Not found");
    }
  });

  app.get("/diffImage", async function(req, res) {
    let { id } = req.query;

    try {
      if (id && db[id]) {
        if (!existsSync(db[id].diffSnap)) {
          diffImage(db[id]);
        }
        res.download(db[id].diffSnap, "");
      } else {
        res.status(404).send("Not found");
      }
    } catch (err) {
      res.send(err);
    }
  });

  app.get("/keep", function(req, res) {
    let { id } = req.query;
    const diff = db[id];
    db[id] = undefined;
    swap(diff);
    res.redirect("/");
  });

  app.get("/done", function(req, res) {
    process.exit(0);
  });

  let foo = await app.listen(port);
  console.log(`Example app listening on http://127.0.0.1:${port}/`);

  return foo;
};
