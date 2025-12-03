/**
 * Template Engine Utilities
 * 从 streamock-core 重新导出，并添加运行时相关函数
 */

// 从 streamock-core 重新导出核心函数
export {
  extractTemplateVariables,
  replaceTemplateVariables,
  mergeVariables,
  generateVariableValue,
  generateDefaultVariables,
} from 'streamock-core';

/**
 * 从请求中提取变量值（运行时相关，保留在本地）
 * 优先级：POST body > Query params
 * @param req 请求对象
 * @param variableNames 需要提取的变量名列表
 * @returns 变量名到值的映射
 */
export async function extractVariablesFromRequest(
  req: Request,
  variableNames: string[]
): Promise<Record<string, string>> {
  const variables: Record<string, string> = {};
  
  // 1. 从 URL query params 提取
  const url = new URL(req.url);
  for (const name of variableNames) {
    const value = url.searchParams.get(name);
    if (value) {
      variables[name] = value;
    }
  }
  
  // 2. 从 POST body 提取（优先级更高）
  if (req.method === 'POST' || req.method === 'PUT') {
    try {
      const contentType = req.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        // 克隆请求以避免消耗原始 body
        const clonedReq = req.clone();
        const body = await clonedReq.json();
        
        for (const name of variableNames) {
          if (body[name] !== undefined) {
            variables[name] = String(body[name]);
          }
        }
      }
    } catch (error) {
      // 如果解析失败，继续使用 query params 的值
      console.error('Error parsing request body:', error);
    }
  }
  
  return variables;
}

