import { Schema, model } from "mongoose";

export interface IShopItem {
  roleId: string;
  price: number;
  duration: string;
}

const shopItemSchema = new Schema<IShopItem>({
  roleId: { type: String, required: true },
  price: { type: Number, required: true },
  duration: String,
});

export default model<IShopItem>("ShopItem", shopItemSchema);
