#!/usr/bin/env node

const { program } = require('commander');
const server = require('../src/server');

program
  .version('1.0.0')
  .description('A simple data streaming mock server');

program
  .command('start')
  .description('Start the streaming server')
  .option('-p, --port <number>', 'Port to run the server on', 3001)
  .action((options) => {
    server.start(options.port);
  });

program.parse(process.argv);