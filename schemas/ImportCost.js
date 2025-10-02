const mongoose = require('mongoose');

const importCostSchema = new mongoose.Schema({
  importShipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ImportShipment',
    required: true
  },
  importer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  goodsValue: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD',
    required: true
  },
  exchangeRate: {
    type: Number,
    required: true
  },
  localCurrencyValue: {
    type: Number,
    required: true
  },
  duties: {
    basicDuty: {
      type: Number,
      default: 0
    },
    additionalDuty: {
      type: Number,
      default: 0
    },
    antiDumpingDuty: {
      type: Number,
      default: 0
    },
    countervailingDuty: {
      type: Number,
      default: 0
    },
    safeguardDuty: {
      type: Number,
      default: 0
    },
    totalDuty: {
      type: Number,
      default: 0
    }
  },
  taxes: {
    gst: {
      type: Number,
      default: 0
    },
    cgst: {
      type: Number,
      default: 0
    },
    sgst: {
      type: Number,
      default: 0
    },
    igst: {
      type: Number,
      default: 0
    },
    cess: {
      type: Number,
      default: 0
    },
    totalTax: {
      type: Number,
      default: 0
    }
  },
  fees: {
    customsFee: {
      type: Number,
      default: 0
    },
    handlingFee: {
      type: Number,
      default: 0
    },
    examinationFee: {
      type: Number,
      default: 0
    },
    storageFee: {
      type: Number,
      default: 0
    },
    demurrageFee: {
      type: Number,
      default: 0
    },
    detentionFee: {
      type: Number,
      default: 0
    },
    totalFees: {
      type: Number,
      default: 0
    }
  },
  logistics: {
    freight: {
      type: Number,
      default: 0
    },
    insurance: {
      type: Number,
      default: 0
    },
    portCharges: {
      type: Number,
      default: 0
    },
    terminalCharges: {
      type: Number,
      default: 0
    },
    documentationFee: {
      type: Number,
      default: 0
    },
    totalLogistics: {
      type: Number,
      default: 0
    }
  },
  other: {
    bankCharges: {
      type: Number,
      default: 0
    },
    inspectionFee: {
      type: Number,
      default: 0
    },
    testingFee: {
      type: Number,
      default: 0
    },
    certificationFee: {
      type: Number,
      default: 0
    },
    miscellaneous: {
      type: Number,
      default: 0
    },
    totalOther: {
      type: Number,
      default: 0
    }
  },
  totals: {
    totalDutyTax: {
      type: Number,
      required: true
    },
    totalFees: {
      type: Number,
      required: true
    },
    totalLogistics: {
      type: Number,
      required: true
    },
    totalOther: {
      type: Number,
      required: true
    },
    grandTotal: {
      type: Number,
      required: true
    }
  },
  payment: {
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'overdue'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['letter_of_credit', 'bank_transfer', 'cash', 'cheque', 'other']
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    remainingAmount: {
      type: Number,
      default: 0
    },
    paymentDate: Date,
    paymentReference: String,
    bankDetails: {
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      swiftCode: String
    }
  },
  calculations: {
    dutyRate: {
      type: Number,
      required: true
    },
    taxRate: {
      type: Number,
      required: true
    },
    totalRate: {
      type: Number,
      required: true
    },
    calculationMethod: {
      type: String,
      enum: ['manual', 'automated', 'ai_calculated'],
      default: 'automated'
    },
    calculatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    calculatedAt: {
      type: Date,
      default: Date.now
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  status: {
    type: String,
    enum: ['draft', 'calculated', 'approved', 'paid', 'disputed'],
    default: 'draft'
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Create indexes for better performance
importCostSchema.index({ importShipment: 1 });
importCostSchema.index({ importer: 1 });
importCostSchema.index({ status: 1 });
importCostSchema.index({ 'payment.status': 1 });
importCostSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ImportCost', importCostSchema);
