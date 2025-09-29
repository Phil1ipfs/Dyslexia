// Test MongoDB Connection
require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB connection...');
console.log('MONGO_URI from .env:', process.env.MONGO_URI ? 'Found' : 'Not found');

mongoose.connect(process.env.MONGO_URI, {
  dbName: 'test',
  connectTimeoutMS: 10000,
  socketTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully!');
  console.log('Host:', mongoose.connection.host);
  console.log('Database:', mongoose.connection.name);
  process.exit(0);
})
.catch(err => {
  console.error('❌ MongoDB Connection Failed!');
  console.error('Error:', err.message);
  console.error('\nPossible solutions:');
  console.error('1. Check if your IP is whitelisted in MongoDB Atlas');
  console.error('2. Verify MongoDB credentials are correct');
  console.error('3. Check network/firewall settings');
  process.exit(1);
});