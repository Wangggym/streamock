import qs from 'qs';
import { Buffer } from 'buffer';
import { plainToInstance } from "class-transformer";

export class StreamDataInfo {
  constructor(
    public data: string = "",
    public combineLine: string = "",
    public separator: string = "",
    public domain: string = "",
    public name: string = "",
    public uuid: string | undefined = undefined,
    public encodedKey: string = ""
  ) {
    if (this.uuid === undefined) {
      this.uuid = crypto.randomUUID();
    }
    if(this.encodedKey === "") {
      this.encodedKey = StreamDataInfo.encodeKey(this.key);
    }
  }

  static fromEncodedKey(encodedKey: string, data: string = ''): StreamDataInfo {
    try {
      const decodedKey = Buffer.from(encodedKey, 'base64').toString();
      const params = qs.parse(decodedKey);
      return plainToInstance(StreamDataInfo, {
        ...params,
        encodedKey,
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

  get key() {
    return qs.stringify({
      uuid: this.uuid,
      domain: this.domain,
      name: this.name,
      combineLine: this.combineLine,
      separator: this.separator
    })
  }


  static encodeKey(key: string): string {
    return Buffer.from(key).toString('base64');
  }
}