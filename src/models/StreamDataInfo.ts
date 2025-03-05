import qs from 'qs';
import { Buffer } from 'buffer';
import { instanceToPlain, plainToInstance, Transform } from "class-transformer";

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

  constructor(
    public data: string = "",
    public combineLine: string = "",
    public separator: string = "",
    public domain: string = "",
    public name: string = "",
    timestamp?: string,
    encodedKey?: string
  ) {
    this.timestamp = timestamp || new Date().toLocaleString();
    this.encodedKey = encodedKey || "";
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