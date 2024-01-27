import { Schema, model } from "mongoose";

interface IMessage {
  name: string;
  content: string;
  tts: boolean;
  embeds: IEmbed[];
  attachments: string[];
}

export interface IEmbed {
  id: number;
  title: string;
  description: string;
  color: number;
  field: IEmbedField[];
}

export interface IEmbedField {
  id: number;
  name: string;
  value: string;
}

const messageSchema = new Schema<IMessage>({
  name: { type: String, required: true },
  content: String,
  tts: Boolean,
  embeds: Array<IEmbed>,
  attachments: Array<String>,
});

export default model<IMessage>("Message", messageSchema);
