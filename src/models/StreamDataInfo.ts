import qs from 'qs';
import { Buffer } from 'buffer';
import { plainToInstance, Transform } from "class-transformer";

export class StreamDataInfo {
  @Transform(({ value, obj }) => value || crypto.randomUUID())
  uuid: string;

  @Transform(({ value, obj }) => {
    if (value) return value;
    const key = StreamDataInfo.key(
      obj.uuid,
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
    uuid?: string,
    encodedKey?: string
  ) {
    this.uuid = uuid || crypto.randomUUID();
    this.encodedKey = encodedKey || "";
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
    return `${this.domain}_${this.name || this.uuid}`;
  }

  static key(uuid: string, domain: string, name: string, combineLine: string, separator: string) {
    return qs.stringify({
      uuid,
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