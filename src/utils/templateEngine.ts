/**
 * Template Engine Utilities
 * 处理模板变量的提取和替换
 */

/**
 * 从文本中提取所有 {{variable}} 模板变量
 * @param text 包含模板变量的文本
 * @returns 变量名数组（去重）
 */
export function extractTemplateVariables(text: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const matches = text.matchAll(regex);
  const variables = new Set<string>();
  
  for (const match of matches) {
    variables.add(match[1]);
  }
  
  return Array.from(variables);
}

/**
 * 执行模板替换
 * @param text 包含模板变量的文本
 * @param variables 变量名到值的映射
 * @returns 替换后的文本
 */
export function replaceTemplateVariables(
  text: string,
  variables: Record<string, string>
): string {
  let result = text;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  }
  
  return result;
}

/**
 * 从请求中提取变量值
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

/**
 * 合并自动提取的变量和固定值变量
 * @param autoVariables 从请求中自动提取的变量
 * @param fixedVariables 固定值变量配置
 * @returns 合并后的变量映射
 */
export function mergeVariables(
  autoVariables: Record<string, string>,
  fixedVariables: Record<string, string>
): Record<string, string> {
  // 固定值优先级更高
  return { ...autoVariables, ...fixedVariables };
}

