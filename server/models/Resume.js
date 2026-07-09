const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },

    originalFileName: {
      type: String,
      required: true,
    },

    filePath: {
      type: String,
      required: true,
    },

    fileType: {
      type: String,
      enum: ['pdf', 'docx'],
      required: true,
    },

    fileSize: {
      type: Number,
      required: true,
    },

    // ✅ Processing Status
    status: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending',
    },

    // ✅ AI Extracted Fields
    extracted_name: {
      type: String,
    },

    extracted_skills: {
      type: [String],
      default: [],
    },

    extracted_experience: {
      type: [String],
      default: [],
    },

    extracted_education: {
      type: [String],
      default: [],
    },

    // ✅ NEW — Embedding Vector
    embedding: {
      type: [Number],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resume', resumeSchema);