#!/usr/bin/env node

const commandLineArgs = require("command-line-args");
const { createDiffFiles } = require("./file-utils");
const { createServer } = require("./server");
const got = require("got");
const open = require("open");

const server_port = 3344;

const optionDefinitions = [
  { name: "verbose", alias: "v", type: Boolean },
  {
    name: "referenceSearchPath",
    alias: "r",
    type: String,
    multiple: false,
    defaultOption: true
  },
  { name: "failedSnapshotDir", alias: "f", type: String, multiple: false }
];

const main = async args => {
  let diffs = createDiffFiles(args);
  if (diffs && diffs.length) {
    await createServer(diffs, server_port);
    open(`http://127.0.0.1:${server_port}/`);
  }
};

if (optionDefinitions.referenceSearchPath && optionDefinitions.failedSnapshotDir) {
  main(commandLineArgs(optionDefinitions));
} else {
  console.log(`must specify arguments: --failedSnapshotDir|-f failed/tests/folder --referenceSearchPath|-f reference/snapshot/folder/tree`)
}
