const mongoose = require('mongoose');

const hsCodeSuggestionSchema = new mongoose.Schema({
  productDescription: {
    type: String,
    required: true
  },
  additionalInfo: {
    type: String
  },
  suggestions: [{
    code: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100
    },
    category: String,
    dutyRate: String,
    restrictions: [String],
    similarProducts: [String]
  }],
  processingTime: {
    type: Number
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // AI Processing Results
  aiMetadata: {
    type: mongoose.Schema.Types.Mixed // Metadata from AI provider
  },
  reasoning: {
    type: String // AI's reasoning for the suggestions
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HSCodeSuggestion', hsCodeSuggestionSchema); 