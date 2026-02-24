
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'USER'], default: 'USER' },
  aadhaarNumber: { type: String },
  aadhaarImages: {
    frontSide: { url: String, publicId: String },
    backSide: { url: String, publicId: String }
  },
  accountStatus: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  loanDetails: {
    hasActiveLoan: { type: Boolean, default: false },
    principalAmount: { type: Number },
    interestRate: { type: Number }, 
    startDate: { type: Date },
    endDate: { type: Date },
    dailyPayableAmount: { type: Number }, 
    totalPayableWithInterest: { type: Number },
    extensions: [{
      extendedOn: { type: Date, default: Date.now },
      oldEndDate: Date,
      newEndDate: Date,
      reason: String
    }]
  },
  collections: [{
    date: { type: Date, default: Date.now },
    amountCollected: { type: Number },
    lateFine: { type: Number, default: 0 },
    remarks: { type: String },
    addedBy: { type: String } 
  }]
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);