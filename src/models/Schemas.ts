import mongoose from 'mongoose';

// Category Schema
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true }
});
export const Category = mongoose.model('Category', categorySchema);

// MenuItem Schema
const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  isActive: { type: Boolean, default: true },
  image: { type: String },
  tags: [String]
});
export const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  items: [{
    id: String,
    name: String,
    price: Number,
    quantity: Number
  }],
  total: { type: Number, required: true },
  finalTotal: { type: Number, required: true },
  promoCode: { type: String },
  status: { type: String, enum: ['pending', 'paid', 'preparing', 'ready', 'completed', 'cancelled'], default: 'pending' },
  queueNumber: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
export const Order = mongoose.model('Order', orderSchema);

// PromoCode Schema
const promoCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ['percent', 'fixed'], required: true },
  value: { type: Number, required: true },
  isActive: { type: Boolean, default: true }
});
export const PromoCode = mongoose.model('PromoCode', promoCodeSchema);

// Settings Schema (for queue)
const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: mongoose.Schema.Types.Mixed
});
export const Settings = mongoose.model('Settings', settingsSchema);
