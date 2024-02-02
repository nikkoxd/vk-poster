import { Schema, model } from "mongoose";

export interface IRoleReward {
  id: string;
  level: number;
}

const roleRewardSchema = new Schema<IRoleReward>({
  id: { type: String, required: true },
  level: { type: Number, required: true },
});

export default model<IRoleReward>("RoleReward", roleRewardSchema);
