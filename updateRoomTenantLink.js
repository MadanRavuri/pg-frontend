// Script to update rooms with tenantId for existing data
// Usage: node updateRoomTenantLink.js

const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://sunflowerpgs77:sunflower@pg.wctacc3.mongodb.net/sunflower_pg?retryWrites=true&w=majority'; // Use your actual URI

const roomSchema = new mongoose.Schema({
  tenantId: mongoose.Schema.Types.ObjectId,
  status: String,
  _id: mongoose.Schema.Types.ObjectId
});
const tenantSchema = new mongoose.Schema({
  roomId: mongoose.Schema.Types.ObjectId,
  _id: mongoose.Schema.Types.ObjectId
});

const Room = mongoose.model('Room', roomSchema);
const Tenant = mongoose.model('Tenant', tenantSchema);

(async () => {
  await mongoose.connect(MONGODB_URI);
  const tenants = await Tenant.find({});
  for (const tenant of tenants) {
    await Room.findByIdAndUpdate(tenant.roomId, { tenantId: tenant._id, status: 'occupied' });
  }
  console.log('Rooms updated with tenantId!');
  await mongoose.disconnect();
})();
