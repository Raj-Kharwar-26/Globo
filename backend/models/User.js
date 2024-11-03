import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  virtualNumbers: [{
    number: String,
    country: String,
    active: Boolean,
    rented: {
      type: Boolean,
      default: false
    },
    rentedAt: Date,
    expiresAt: Date,
    price: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add the default admin user if not exists
userSchema.statics.ensureDefaultAdmin = async function() {
  try {
    const adminExists = await this.findOne({ phoneNumber: '7439999525' });
    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Raj1234#', salt);
      
      await this.create({
        phoneNumber: '7439999525',
        password: hashedPassword,
        isAdmin: true
      });
      console.log('Default admin user created');
    }
  } catch (err) {
    console.error('Error ensuring default admin:', err);
  }
};

export default mongoose.model('User', userSchema);