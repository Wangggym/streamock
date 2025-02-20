import 'reflect-metadata';
import type { ServerConfig } from './types';
import { container } from './container';
import { IStreamServer, TYPES } from './types';

export const start = async (config?: Partial<ServerConfig>) => {
  try {
    const server = container.get<IStreamServer>(TYPES.Server);
    const instance = await server.createServer(config);
    if (instance) {
      console.log(`Server running at http://localhost:${instance.port}`);
    }
  } catch (error: any) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

export default { start }; 