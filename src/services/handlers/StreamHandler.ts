import { injectable, inject } from 'inversify';
import { IDataService } from '@types';
import { BaseHandler } from '@services/handlers/BaseHandler';
import { DataService } from '@services/DataService';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

@injectable()
export class StreamHandler extends BaseHandler {
  constructor(@inject(DataService) dataService: IDataService) {
    super(dataService);
  }

  async handle(req: Request): Promise<Response> {
    const dataService = this.dataService; // 创建一个局部引用

    const stream = new ReadableStream({
      async start(controller) {
        const lines = dataService.getData().split('\n');
        let doneFound = false;

        let startLine: number | undefined, endLine: number | undefined;
        const combineLine = dataService.getCombineLine();
        if (combineLine) {
          [startLine, endLine] = combineLine.split('-').map(Number);
        }

        for (let i = 0; i < lines.length && !doneFound; i++) {
          const line = lines[i];
          if (line.trim() !== '') {
            if (startLine && endLine && i + 1 >= startLine && i + 1 <= endLine) {
              const combinedLines = lines.slice(i, endLine).join(dataService.getSeparator() || '\n');
              controller.enqueue(combinedLines + '\n');
              i = endLine - 1;
            } else {
              controller.enqueue(line + '\n');
            }
          }
          if (line.includes('[DONE]')) {
            doneFound = true;
          }
          await delay(100);
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });
  }
} 