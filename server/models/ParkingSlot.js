import mongoose from 'mongoose';

const parkingSlotSchema = new mongoose.Schema({
  slotNumber: { type: Number, required: true, unique: true },
  isOccupied: { type: Boolean, default: false }
});

export const ParkingSlot = mongoose.model('ParkingSlot', parkingSlotSchema);