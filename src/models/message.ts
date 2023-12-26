import { ObjectId } from "mongodb";

interface Embed {
  id?: number;
  title: string;
  description: string;
  color: number;
  fields: Field[];
}

interface Field {
  id?: number;
  name: string;
  value: string;
}

export default class Message {
  constructor(
    public name: string,
    public content?: string,
    public tts?: boolean,
    public embeds?: Embed[],
    public attachments?: string[],
    public id?: ObjectId,
  ) {}
}
