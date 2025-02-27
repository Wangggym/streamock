#!/usr/bin/env bun
import 'reflect-metadata';
import { Command } from 'commander';
import { getIt } from '@container/index';
import { StreamServer } from '@services/StreamServer';
import { version } from '../package.json';

const program = new Command();

program
  .version(version)
  .description('A simple data streaming mock server')
  .option('-p, --port <number>', 'port to run server on', '3001')
  .action(async (options) => {
    try {
      const server = getIt(StreamServer);
      const instance = await server.createServer({
        port: parseInt(options.port, 10)
      });
      console.log(`Server running at http://localhost:${instance.port}`);
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  });

program.parse(); 