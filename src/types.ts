import type { ServeOptions } from "bun";
import type { Server } from "bun";

export interface ServerConfig extends ServeOptions {
  port: number;
  fetch: (req: Request) => Response | Promise<Response>;
}

export abstract class IDataService {
  abstract getData(): string;
  abstract setData(data: string, combineLine: string, separator: string): void;
  abstract getCombineLine(): string;
  abstract getSeparator(): string;
}

export interface IHandler {
  handle(req: Request): Promise<Response>;
}

export interface IStreamServer {
  createServer(config?: Partial<ServerConfig>): Promise<Server>;
} 