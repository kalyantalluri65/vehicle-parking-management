import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { Vehicle } from './models/Vehicle.js';
import { ParkingSlot } from './models/ParkingSlot.js';
import { User } from './models/User.js';

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection - replace with your connection string
const MONGODB_URI = 'mongodb+srv://nikhilpulluri7810:1234@nikhilpulluri.g6f9o.mongodb.net/parking?retryWrites=true&w=majority';
mongoose.connect(MONGODB_URI);

// Initialize parking slots if none exist
async function initializeParkingSlots() {
  const count = await ParkingSlot.countDocuments();
  if (count === 0) {
    const slots = Array.from({ length: 50 }, (_, i) => ({
      slotNumber: i + 1,
      isOccupied: false
    }));
    await ParkingSlot.insertMany(slots);
  } else if (count < 50) {
    // If there are fewer than 50 slots, add more to reach 50
    const lastSlot = await ParkingSlot.findOne().sort({ slotNumber: -1 });
    const lastSlotNumber = lastSlot ? lastSlot.slotNumber : 0;
    
    const additionalSlots = Array.from(
      { length: 50 - count }, 
      (_, i) => ({
        slotNumber: lastSlotNumber + i + 1,
        isOccupied: false
      })
    );
    
    if (additionalSlots.length > 0) {
      await ParkingSlot.insertMany(additionalSlots);
    }
  }
}

// Initialize default admin user if none exists
async function initializeDefaultUser() {
  const count = await User.countDocuments();
  if (count === 0) {
    await User.create({
      username: 'admin',
      password: 'admin123'
    });
    console.log('Default admin user created');
  }
}

initializeParkingSlots();
initializeDefaultUser();

// Calculate parking fare based on duration and vehicle type
function calculateParkingFare(entryTime, exitTime, vehicleType) {
  const duration = exitTime.getTime() - new Date(entryTime).getTime();
  const minutes = Math.ceil(duration / (1000 * 60));
  
  // Rates per minute for different vehicle types
  const rates = {
    car: 0.5, // ₹1 per minute (₹60 per hour)
    motorcycle: 0.2, // ₹0.5 per minute (₹30 per hour)
    truck: 0.7 // ₹2 per minute (₹120 per hour)
  };
   
  const rate = rates[vehicleType] || rates.car; // Default to car rate if type not found
  const fare = minutes * rate; // Minimum ₹50
  
  return Math.round(fare); // Round to nearest rupee
}

// User authentication
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    res.json({ success: true, username: user.username });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Update user credentials
app.put('/api/user/credentials', async (req, res) => {
  try {
    const { currentUsername, currentPassword, newUsername, newPassword } = req.body;
    
    // Verify current credentials
    const user = await User.findOne({ username: currentUsername });
    if (!user || user.password !== currentPassword) {
      return res.status(401).json({ error: 'Current credentials are incorrect' });
    }
    
    // Check if new username already exists (if changing username)
    if (newUsername !== currentUsername) {
      const existingUser = await User.findOne({ username: newUsername });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
    }
    
    // Update credentials
    user.username = newUsername;
    user.password = newPassword;
    await user.save();
    
    res.json({ success: true, message: 'Credentials updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update credentials' });
  }
});

// Get available slots
app.get('/api/slots', async (req, res) => {
  try {
    const slots = await ParkingSlot.find().sort({ slotNumber: 1 });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
});

// Register new vehicle
app.post('/api/vehicles', async (req, res) => {
  try {
    const availableSlot = await ParkingSlot.findOne({ isOccupied: false }).sort({ slotNumber: 1 });
    if (!availableSlot) {
      return res.status(400).json({ error: 'No parking slots available' });
    }

    const vehicle = new Vehicle({
      ...req.body,
      slotNumber: availableSlot.slotNumber,
      entryTime: new Date()
    });

    await vehicle.save();
    availableSlot.isOccupied = true;
    await availableSlot.save();

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: 'Failed to register vehicle' });
  }
});

// Get calculated fare for a vehicle
app.get('/api/vehicles/:id/fare', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    const fare = calculateParkingFare(vehicle.entryTime, new Date(), vehicle.category);
    res.json({ fare });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate fare' });
  }
});

// Checkout vehicle with parking fare
app.post('/api/vehicles/:id/checkout', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const slot = await ParkingSlot.findOne({ slotNumber: vehicle.slotNumber });
    slot.isOccupied = false;
    await slot.save();

    const exitTime = new Date();
    const parkingFare = calculateParkingFare(vehicle.entryTime, exitTime, vehicle.category);

    vehicle.exitTime = exitTime;
    vehicle.parkingFare = parkingFare;
    await vehicle.save();

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: 'Failed to checkout vehicle' });
  }
});

// Add new endpoint for canceling a slot
app.post('/api/vehicles/:id/cancel', async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Find and update the slot
    const slot = await ParkingSlot.findOne({ slotNumber: vehicle.slotNumber });
    if (slot) {
      slot.isOccupied = false;
      await slot.save();
    }

    // Delete the vehicle record
    await Vehicle.findByIdAndDelete(req.params.id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel parking slot' });
  }
});

// Get all vehicles (with optional filters)
app.get('/api/vehicles', async (req, res) => {
  try {
    const { status, slotNumber, vehicleNumber, date } = req.query;
    let query = {};

    if (status === 'active') {
      query.exitTime = null;
    } else if (status === 'history') {
      query.exitTime = { $ne: null };
      
      if (slotNumber) {
        query.slotNumber = parseInt(slotNumber);
      }
      
      if (vehicleNumber) {
        query.vehicleNumber = { $regex: vehicleNumber, $options: 'i' };
      }
      
      if (date) {
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        
        query.exitTime = {
          $gte: startDate,
          $lte: endDate
        };
      }
    }
    
    const vehicles = await Vehicle.find(query).sort({ entryTime: -1 });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
