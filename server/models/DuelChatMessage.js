const mongoose = require("mongoose");

const duelChatMessageSchema = new mongoose.Schema(
  {
    duelId: { type: String, required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    username: { type: String },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DuelChatMessage", duelChatMessageSchema);
