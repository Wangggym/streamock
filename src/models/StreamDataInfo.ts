import qs from 'qs';

export class StreamDataInfo {
    uuid: string;
    constructor(
      public data: string = "",
      public combineLine: string = "",
      public separator: string = "",
      public domain?: string,
      public name?: string
    ) {
      this.uuid = crypto.randomUUID();
    }
  
    get displayName() {
      return `${this.domain}_${this.name || "default"}`
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
  }