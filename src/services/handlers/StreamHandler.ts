import { injectable, inject } from 'inversify';
import { BaseHandler } from '@services/handlers/BaseHandler';
import { DataService } from '@services/DataService';
import { 
  extractVariablesFromRequest, 
  replaceTemplateVariables,
  extractTemplateVariables 
} from '@/utils/templateEngine';
import type { TemplateVariable } from '@/models/StreamDataInfo';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

@injectable()
export class StreamHandler extends BaseHandler {
  constructor(@inject(DataService) dataService: DataService) {
    super(dataService);
  }

  async handle(req: Request): Promise<Response> {
    const dataService = this.dataService; // 创建一个局部引用
    
    // 1. 获取当前的 StreamDataInfo (包含 variables 配置)
    const streamDataInfo = dataService.streamDataInfo;
    const variablesConfig = streamDataInfo.variables || [];
    
    console.log('🔍 StreamHandler - Variables config:', variablesConfig);
    
    // 2. 准备变量替换映射
    let variableValues: Record<string, string> = {};
    
    // 如果配置了变量，进行提取和合并
    if (variablesConfig.length > 0) {
      // 分离 auto 和 fixed 类型的变量
      const autoVarNames = variablesConfig
        .filter(v => v.source === 'auto')
        .map(v => v.name);
      
      console.log('🔍 Auto variable names:', autoVarNames);
      
      const fixedVarValues: Record<string, string> = {};
      variablesConfig
        .filter(v => v.source === 'fixed' && v.value)
        .forEach(v => {
          fixedVarValues[v.name] = v.value!;
        });
      
      // 从请求中提取 auto 类型的变量
      if (autoVarNames.length > 0) {
        const extractedVars = await extractVariablesFromRequest(req, autoVarNames);
        console.log('🔍 Extracted variables from request:', extractedVars);
        variableValues = { ...extractedVars, ...fixedVarValues };
      } else {
        variableValues = fixedVarValues;
      }
    }
    
    console.log('🔍 Final variable values for replacement:', variableValues);

    const stream = new ReadableStream({
      async start(controller) {
        const lines = dataService.data.split('\n');
        let doneFound = false;

        let startLine: number | undefined, endLine: number | undefined;
        const combineLine = dataService.combineLine;
        if (combineLine) {
          [startLine, endLine] = combineLine.split('-').map(Number);
        }

        for (let i = 0; i < lines.length && !doneFound; i++) {
          let line = lines[i];
          
          // 3. 替换模板变量
          if (Object.keys(variableValues).length > 0) {
            line = replaceTemplateVariables(line, variableValues);
          }
          
          // 输出行（包括空行，以保留原始格式）
          if (startLine && endLine && i + 1 >= startLine && i + 1 <= endLine && line.trim() !== '') {
            let combinedLines = lines.slice(i, endLine).join(dataService.separator || '\n');
            // 也要替换合并后的行
            if (Object.keys(variableValues).length > 0) {
              combinedLines = replaceTemplateVariables(combinedLines, variableValues);
            }
            controller.enqueue(combinedLines + '\n');
            i = endLine - 1;
          } else {
            // 输出所有行，包括空行
            controller.enqueue(line + '\n');
          }
          
          if (line.includes('[DONE]')) {
            doneFound = true;
          }
          await delay(100);
        }

        // // 数据发送完成后，持续发送心跳一分钟
        // const startTime = Date.now();
        // const oneMinute = 10 * 1000;
        // while (Date.now() - startTime < oneMinute) {
        //   controller.enqueue('\n'); // 发送心跳（空行）
        //   await delay(1000); // 每秒发送一次心跳
        // }
        
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