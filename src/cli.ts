#!/usr/bin/env bun
import { Command } from 'commander';
import { start } from './server';

const program = new Command();

program
  .version('2.0.2')
  .description('A simple data streaming mock server')
  .command('start')
  .description('Start the streaming mock server')
  .action(() => {
    start();
  });

program.parse(); 