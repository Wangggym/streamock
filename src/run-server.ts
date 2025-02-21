import 'reflect-metadata';
import { getIt } from '@container/index';
import { StreamServer } from '@services/StreamServer';

async function main() {
  try {
    const server = getIt(StreamServer);
    const instance = await server.createServer();
    console.log(`Server running at http://localhost:${instance.port}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main(); 