import { instanceToPlain } from "class-transformer";

export enum StreamAction {
  SUBMIT = 'submit',
  DELETE = 'delete'
}

export class StreamMessage {
  constructor(
    public type: 'streamDataUpdate',
    public action: StreamAction,
    public data?: {
      key?: string
    }
  ) {}

  toString(): string {
    return JSON.stringify(instanceToPlain(this));
  }

  static createSubmitMessage(key: string): StreamMessage {
    return new StreamMessage('streamDataUpdate', StreamAction.SUBMIT, { key });
  }

  static createDeleteMessage(): StreamMessage {
    return new StreamMessage('streamDataUpdate', StreamAction.DELETE);
  }
} 