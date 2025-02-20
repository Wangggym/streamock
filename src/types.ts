import type { ServeOptions } from "bun";

export const TYPES = {
  Server: Symbol.for('Server'),
  DataService: Symbol.for('DataService')
};

export interface ServerConfig extends ServeOptions {
  port: number;
  fetch: (req: Request) => Response | Promise<Response>;
}

export interface IDataService {
  getData(): string;
  setData(data: string, combineLine: string, separator: string): void;
  getCombineLine(): string;
  getSeparator(): string;
} 