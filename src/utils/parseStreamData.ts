/**
 * 解析流式返回的数据并提取卡片信息
 * @param streamData - 流式返回的原始数据
 * @returns 解析后的卡片配置信息
 */
export interface ParsedStreamData {
  content?: string;
  role?: string;
  [key: string]: any;
}

export function parseStreamData(streamData: string): ParsedStreamData | null {
  try {
    // 存储所有解析后的数据
    const parsedData: ParsedStreamData = {};
    let currentJson: Record<string, any> = {};

    // 按行分割数据
    const lines = streamData.split('\n');

    // 处理每一行数据
    lines.forEach(line => {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6); // 移除 'data: ' 前缀

        try {
          const data = JSON.parse(jsonStr);

          // 检查是否有 delta 内容
          if (data.choices && data.choices[0].delta) {
            const delta = data.choices[0].delta;

            // 处理 content
            if (delta.content) {
              // 检查是否是 JSON 对象
              if (delta.content.startsWith('{') || delta.content.startsWith(' ')) {
                try {
                  const contentJson = JSON.parse(delta.content);
                  currentJson = { ...currentJson, ...contentJson };
                } catch (e) {
                  // 如果不是有效的 JSON，则作为普通内容处理
                  if (!parsedData.content) {
                    parsedData.content = '';
                  }
                  parsedData.content += delta.content;
                }
              } else {
                // 普通文本内容
                if (!parsedData.content) {
                  parsedData.content = '';
                }
                parsedData.content += delta.content;
              }
            }

            // 处理 role
            if (delta.role) {
              parsedData.role = delta.role;
            }
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    });

    // 如果存在 JSON 内容，尝试解析它
    if (parsedData.content) {
      try {
        const contentJson = JSON.parse(parsedData.content);
        return {
          ...parsedData,
          ...contentJson
        };
      } catch (e) {
        // 如果解析失败，返回原始内容
        return parsedData;
      }
    }

    return parsedData;
  } catch (error) {
    console.error('Error parsing stream data:', error);
    return null;
  }
}

/**
 * 使用示例：
 * const streamData = `data: {"id": "chatcmpl-xxx", "object": "chat.completion.chunk", "choices": [{"delta": {"content": "{"}}]}
 * data: {"choices": [{"delta": {"content": " "}}]}
 * data: {"choices": [{"delta": {"content": "\"Cards To Use\":"}}]}
 * ...`;
 *
 * const result = parseStreamData(streamData);
 * console.log(result);
 */ 