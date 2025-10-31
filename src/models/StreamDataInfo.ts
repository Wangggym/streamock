import qs from 'qs';
import { Buffer } from 'buffer';
import { instanceToPlain, plainToInstance, Transform, Type } from "class-transformer";

/**
 * 模板变量配置接口
 */
export interface TemplateVariable {
  name: string;              // 变量名，如 "session_id"
  source: 'auto' | 'fixed';  // 来源：自动提取 或 固定值
  value?: string;            // 当 source 为 'fixed' 时的固定值
}

/**
 * 模板变量类（用于序列化）
 */
export class TemplateVariableClass implements TemplateVariable {
  constructor(
    public name: string = "",
    public source: 'auto' | 'fixed' = 'auto',
    public value?: string
  ) {}
}

export class StreamDataInfo {
  @Transform(({ value, obj }) => value || new Date().toLocaleString())
  timestamp: string;

  @Transform(({ value, obj }) => {
    if (value) return value;
    const key = StreamDataInfo.key(
      obj.timestamp,
      obj.domain,
      obj.name,
      obj.combineLine,
      obj.separator
    );
    return StreamDataInfo.encodeKey(key);
  })
  encodedKey: string;

  @Type(() => TemplateVariableClass)
  @Transform(({ value }) => {
    // 确保 variables 被正确序列化和反序列化
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [];
  })
  variables: TemplateVariable[];

  constructor(
    public data: string = "",
    public combineLine: string = "",
    public separator: string = "",
    public domain: string = "",
    public name: string = "",
    timestamp?: string,
    encodedKey?: string,
    variables?: TemplateVariable[]
  ) {
    this.timestamp = timestamp || new Date().toLocaleString();
    this.encodedKey = encodedKey || "";
    this.variables = variables || [];
  }

   toString(): string {
    return JSON.stringify(instanceToPlain(this));
  }

  static fromEncodedKey(encodedKey: string, data: string = ''): StreamDataInfo {
    try {
      const decodedKey = Buffer.from(encodedKey, 'base64').toString();
      const params = qs.parse(decodedKey);
      return plainToInstance(StreamDataInfo, {
        ...params,
        data,
      });
    } catch (error) {
      console.error(`Error parsing encoded key: ${encodedKey}`, error);
      throw error;
    }
  }

  get displayName() {
    const domain = this.domain.trim() || '______';
    const name = this.name.trim() || '______';
    return `${domain} | ${name} | ${this.timestamp}`;
  }

  static key(timestamp: string, domain: string, name: string, combineLine: string, separator: string) {
    return qs.stringify({
      timestamp,
      domain,
      name,
      combineLine,
      separator
    })
  }

  static encodeKey(key: string): string {
    return Buffer.from(key).toString('base64');
  }
}