import { Schema, model } from "mongoose";

interface IMessage {
  name: string;
  content: string;
  tts: boolean;
  embeds: IEmbed[];
  rows: IRow[];
  attachments: string[];
}

interface IEmbed {
  title: string;
  description: string;
  color: number;
  fields: IEmbedField[];
}

interface IEmbedField {
  name: string;
  value: string;
}

interface IRow {
  buttons: IButton[];
  selectMenus: ISelect[];
}

interface IButton {
  customId: string;
  label: string;
  style: number;
  emoji: string;
  url: string;
  disabled: boolean;
}

interface ISelect {
  customId: string;
  placeholder: string;
  min: number;
  max: number;
  options: IOption[];
}

interface IOption {
  label: string;
  value: string;
  description: string;
  emoji: string;
  default: boolean;
}

const messageSchema = new Schema<IMessage>({
  name: { type: String, required: true },
  content: String,
  tts: Boolean,
  embeds: Array<IEmbed>,
  rows: Array<IRow>,
  attachments: Array<String>,
});

export default model<IMessage>("Message", messageSchema);
