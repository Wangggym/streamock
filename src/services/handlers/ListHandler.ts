import { StreamDataInfoRepository } from '@services/StreamDataInfoRepository';

export class ListHandler {
  constructor(
    private readonly repository: StreamDataInfoRepository
  ) {}

  async handle(req: Request): Promise<Response> {
    try {
      const list = await this.repository.listAll();
      return new Response(JSON.stringify(list), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
  }
} 