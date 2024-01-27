import { Schema, model } from "mongoose";

interface IMember {
  memberId: string;
  coins: number;
}

const memberSchema = new Schema<IMember>({
  memberId: { type: String, required: true },
  coins: { type: Number, required: true },
});

export default model<IMember>("Member", memberSchema);
