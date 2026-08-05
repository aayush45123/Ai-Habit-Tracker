import mongoose from "mongoose";

const fieldSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "textarea", "number", "select", "boolean", "rating"],
      default: "text",
    },
    options: {
      type: [String],
      default: [],
    },
    required: {
      type: Boolean,
      default: false,
    },
    defaultValue: {
      type: mongoose.Schema.Types.Mixed,
      default: "",
    },
  },
  { _id: false }
);

const journalTemplateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null = system default template available for all users
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      enum: ["System", "Student", "Developer", "Fitness", "Business", "Personal", "Custom"],
      default: "Custom",
    },
    icon: {
      type: String,
      default: "FiBookOpen",
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    fields: [fieldSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("JournalTemplate", journalTemplateSchema);
