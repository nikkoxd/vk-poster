import { Schema, model } from "mongoose";

export interface IGuild {
  id: string;

  language: string;
  embedColor: string;
  memberRoleId: string | null;
  welcome: {
    channelId: string | null;
    roleId: string | null;
  };
  reactions: {
    yes: string;
    no: string;
  };
  coins: {
    cooldown: string;
    min: number;
    max: number;
  };
  exp: {
    cooldown: string;
    min: number;
    max: number;
  };
  rooms: {
    manager: string;
    category: string;
    name: string;
  };
}

const guildSchema = new Schema<IGuild>({
  id: { type: String, required: true },
  language: { type: String, default: "ru" },
  embedColor: { type: String, default: "D381D2" },
  memberRoleId: { type: String, default: null },
  welcome: {
    type: Object,
    default: {
      channelId: null,
      roleId: null,
    },
  },
  reactions: {
    type: Object,
    default: {
      yes: "✅",
      no: "❎",
    },
  },
  coins: {
    type: Object,
    default: {
      cooldown: "5s",
      min: 50,
      max: 85,
    },
  },
  exp: {
    type: Object,
    default: {
      cooldown: "5s",
      min: 15,
      max: 35,
    },
  },
  rooms: {
    manager: String,
    category: String,
    name: String,
  },
});

export default model<IGuild>("Guild", guildSchema);
