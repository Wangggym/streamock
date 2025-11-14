#!/usr/bin/env bun
import 'reflect-metadata';
import { Command } from 'commander';
import { getIt } from '@container/index';
import { StreamServer } from '@services/StreamServer';
import { PidManager } from '@/utils/pidManager';
import { checkAndPromptUpdate } from '@/utils/versionChecker';
import { version } from '../package.json';

const program = new Command();

program
  .name('streamock')
  .version(version)
  .description('A simple data streaming mock server');

// Start command (default)
program
  .command('start', { isDefault: true })
  .description('Start the streaming server')
  .option('-p, --port <number>', 'port to run server on', '3001')
  .option('-d, --daemon', 'run server in daemon mode (background)')
  .action(async (options) => {
    try {
      // Check if server is already running
      const status = PidManager.getStatus();
      if (status.running) {
        console.log(`⚠️  Server is already running (PID: ${status.pid})`);
        console.log('💡 Use "streamock stop" to stop it first, or "streamock restart" to restart');
        process.exit(1);
      }

      const port = parseInt(options.port, 10);

      if (options.daemon) {
        // Daemon mode: use shell command to run in background
        console.log('🚀 Starting server in daemon mode...');
        
        const logFile = `/tmp/streamock-${port}.log`;
        const pidFile = `/tmp/streamock-${port}.pid`;
        
        // 获取存储路径信息
        const homeDir = process.env.HOME || process.env.USERPROFILE || '';
        let storagePath = '';
        if (process.platform === 'darwin') {
          const iCloudBase = require('path').join(homeDir, 'Library', 'Mobile Documents', 'com~apple~CloudDocs');
          const fs = require('fs');
          if (fs.existsSync(iCloudBase)) {
            storagePath = require('path').join(iCloudBase, '.streamock-data');
          } else {
            storagePath = require('path').join(homeDir, '.streamock-data');
          }
        } else {
          storagePath = require('path').join(homeDir, '.streamock-data');
        }
        
        // Use nohup to run in background
        const child = Bun.spawn([
          'sh', '-c',
          `nohup bun run ${process.argv[1]} start -p ${port} > ${logFile} 2>&1 & echo $! > ${pidFile}`
        ], {
          stdout: 'pipe',
          stderr: 'pipe',
        });

        await child.exited;
        
        // Read PID from file
        await Bun.sleep(500);
        try {
          const pidText = await Bun.file(pidFile).text();
          const pid = parseInt(pidText.trim(), 10);
          
          if (!isNaN(pid)) {
            PidManager.savePid(pid);
            console.log(`✅ Server started in background (PID: ${pid})`);
            console.log(`🌐 Server running at http://localhost:${port}`);
            console.log(`💾 Data storage: ${storagePath}`);
            console.log(`📝 Logs: ${logFile}`);
            console.log('💡 Use "streamock stop" to stop the server');
          } else {
            throw new Error('Failed to get PID');
          }
        } catch (error) {
          console.error('❌ Failed to start server in daemon mode:', error);
          process.exit(1);
        }
        
        process.exit(0);
      } else {
        // Foreground mode
        const server = getIt(StreamServer);
        const instance = await server.createServer({ port });
        
        // Save PID
        PidManager.savePid(process.pid);
        
        console.log(`✅ Server running at http://localhost:${instance.port}`);
        console.log(`💾 Data storage: ${server.getStoragePath()}`);
        console.log('💡 Press Ctrl+C to stop the server');

        // Cleanup on exit
        process.on('SIGINT', () => {
          console.log('\n🛑 Stopping server...');
          PidManager.removePid();
          process.exit(0);
        });

        process.on('SIGTERM', () => {
          PidManager.removePid();
          process.exit(0);
        });
      }
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  });

// Stop command
program
  .command('stop')
  .alias('kill')
  .description('Stop the running server')
  .option('-p, --port <number>', 'port to stop (default: 3001)', '3001')
  .action(async (options) => {
    try {
      const status = PidManager.getStatus();
      const port = parseInt(options.port, 10);

      console.log('🛑 Stopping server...');

      let killed = false;

      // Try to kill by saved PID first
      if (status.running && status.pid) {
        console.log(`📍 Found running server (PID: ${status.pid})`);
        killed = PidManager.killProcess(status.pid);
        PidManager.removePid();
      }

      // Also try to kill by port
      const killedByPort = await PidManager.killByPort(port);
      
      if (killed || killedByPort) {
        console.log('✅ Server stopped successfully');
      } else {
        console.log('⚠️  No running server found');
      }
    } catch (error) {
      console.error('❌ Failed to stop server:', error);
      process.exit(1);
    }
  });

// Restart command
program
  .command('restart')
  .description('Restart the server')
  .option('-p, --port <number>', 'port to run server on', '3001')
  .action(async (options) => {
    try {
      const status = PidManager.getStatus();
      const port = parseInt(options.port, 10);

      console.log('🔄 Restarting server...');

      // Stop existing server
      if (status.running && status.pid) {
        console.log(`🛑 Stopping server (PID: ${status.pid})...`);
        PidManager.killProcess(status.pid);
        PidManager.removePid();
      }

      // Also kill by port to be safe
      await PidManager.killByPort(port);

      // Wait a bit
      await Bun.sleep(500);

      // Start server in daemon mode
      console.log('🚀 Starting server...');
      
      const logFile = `/tmp/streamock-${port}.log`;
      const pidFile = `/tmp/streamock-${port}.pid`;
      
      // 获取存储路径信息
      const homeDir = process.env.HOME || process.env.USERPROFILE || '';
      let storagePath = '';
      if (process.platform === 'darwin') {
        const iCloudBase = require('path').join(homeDir, 'Library', 'Mobile Documents', 'com~apple~CloudDocs');
        const fs = require('fs');
        if (fs.existsSync(iCloudBase)) {
          storagePath = require('path').join(iCloudBase, '.streamock-data');
        } else {
          storagePath = require('path').join(homeDir, '.streamock-data');
        }
      } else {
        storagePath = require('path').join(homeDir, '.streamock-data');
      }
      
      const child = Bun.spawn([
        'sh', '-c',
        `nohup bun run ${process.argv[1]} start -p ${port} > ${logFile} 2>&1 & echo $! > ${pidFile}`
      ], {
        stdout: 'pipe',
        stderr: 'pipe',
      });

      await child.exited;
      
      // Read PID from file
      await Bun.sleep(500);
      try {
        const pidText = await Bun.file(pidFile).text();
        const pid = parseInt(pidText.trim(), 10);
        
        if (!isNaN(pid)) {
          PidManager.savePid(pid);
          console.log(`✅ Server restarted (PID: ${pid})`);
          console.log(`🌐 Server running at http://localhost:${port}`);
          console.log(`💾 Data storage: ${storagePath}`);
          console.log(`📝 Logs: ${logFile}`);
        } else {
          throw new Error('Failed to get PID');
        }
      } catch (error) {
        console.error('❌ Failed to restart server:', error);
        process.exit(1);
      }
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Failed to restart server:', error);
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Check server status')
  .action(() => {
    const status = PidManager.getStatus();
    
    console.log('📊 Server Status:');
    console.log('─'.repeat(40));
    
    if (status.running && status.pid) {
      console.log('🟢 Status: Running');
      console.log(`📍 PID: ${status.pid}`);
      console.log('💡 Use "streamock stop" to stop');
    } else {
      console.log('🔴 Status: Not running');
      console.log('💡 Use "streamock start" to start');
    }
  });

// Check for updates and auto-update if needed
(async () => {
  await checkAndPromptUpdate(version, {
    autoUpdate: true,  // 自动更新（默认启用）
    force: false,      // 是否强制更新（更新失败时退出）
    silent: false,     // 是否静默模式（不检查版本）
  });
  
  program.parse();
})(); 