/**
 * Stream Data Parser
 * 从 streamock-core 重新导出
 */
export {
  parseStreamData,
  isSSEDataLine,
  isSSEDone,
  extractSSEData,
} from 'streamock-core';

export type { ParsedStreamData } from 'streamock-core'; 