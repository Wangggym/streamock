import qs from 'qs';

export class StreamDataInfo {
    constructor(
      public data: string = "",
      public combineLine: string = "",
      public separator: string = "",
      public domain: string = "",
      public name: string = "",
      public uuid: string | undefined = undefined
    ) {
      if(this.uuid === undefined) {
        this.uuid = crypto.randomUUID();
      }
    }

    static fromEncodedKey(encodedKey: string, data: string = ''): StreamDataInfo {
      try {
        const decodedKey = Buffer.from(encodedKey, 'base64').toString();
        const params = qs.parse(decodedKey);
        return new StreamDataInfo(
          data,
          params.combineLine as string,
          params.separator as string,
          params.domain as string,
          params.name as string,
          params.uuid as string
        );
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
        data: this.data,
        combineLine: this.combineLine,
        separator: this.separator
      })
    }

    get encodedKey() {
      return StreamDataInfo.encodeKey(this.key)
    }

    static encodeKey(key: string): string {
      return Buffer.from(key).toString('base64');
    }
  }