import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String, required: true },
  slotNumber: { type: Number, required: true },
  entryTime: { type: Date, required: true },
  exitTime: { type: Date, default: null },
  parkingFare: { type: Number, default: null }
});

export const Vehicle = mongoose.model('Vehicle', vehicleSchema);
