import { Schema, model } from "mongoose";

export interface IMember {
  memberId: string;
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
  coins: { type: Number, required: true },
  roles: Array<IRole>,
});

export default model<IMember>("Member", memberSchema);
