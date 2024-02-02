import { Schema, model } from "mongoose";

export interface IMember {
  memberId: string;
  exp: number;
  level: number;
  coins: number;
  roles: IRole[];
}

interface IRole {
  guildId: string;
  roleId: string;
  expiryDate: number;
}

const memberSchema = new Schema<IMember>({
  memberId: { type: String, required: true },
  exp: { type: Number, default: 0, required: true },
  level: { type: Number, default: 0, required: true },
  coins: { type: Number, default: 0, required: true },
  roles: Array<IRole>,
});

export default model<IMember>("Member", memberSchema);
