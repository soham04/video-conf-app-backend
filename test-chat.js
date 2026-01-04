// Quick test script to verify chat storage
// Run with: node backend/test-chat.js

const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const roomSchema = new mongoose.Schema({
  roomId: String,
  meetName: String,
  userId: String,
  chats: [{
    sendersName: String,
    message: String,
    time: Date
  }],
  createdAt: Date,
  updatedAt: Date
});

const Room = mongoose.model('Room', roomSchema);

async function testChatStorage() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all rooms with chats
    const roomsWithChats = await Room.find({ 'chats.0': { $exists: true } });
    
    console.log(`📊 Found ${roomsWithChats.length} room(s) with chat messages:\n`);

    roomsWithChats.forEach((room, index) => {
      console.log(`Room ${index + 1}:`);
      console.log(`  Room ID: ${room.roomId}`);
      console.log(`  Meeting Name: ${room.meetName}`);
      console.log(`  Total Messages: ${room.chats.length}`);
      console.log(`  Messages:`);
      
      room.chats.forEach((chat, i) => {
        const time = new Date(chat.time).toLocaleString();
        console.log(`    ${i + 1}. [${time}] ${chat.sendersName}: ${chat.message}`);
      });
      console.log('');
    });

    if (roomsWithChats.length === 0) {
      console.log('ℹ️  No chat messages found yet.');
      console.log('   Send some messages in the app and run this script again!\n');
    }

    await mongoose.disconnect();
    console.log('✅ Test complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testChatStorage();

