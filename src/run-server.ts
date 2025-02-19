import { start } from './server';
start().catch(error => {
  console.error('Server startup failed:', error);
  process.exit(1);
}); 