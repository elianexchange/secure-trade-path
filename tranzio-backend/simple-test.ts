console.log('Starting simple test...');

try {
  const express = require('express');
  console.log('✅ Express imported successfully');
  
  const { MessageController } = require('./src/controllers/messageController');
  console.log('✅ MessageController imported successfully');
  
  console.log('✅ All imports successful');
} catch (error) {
  console.error('❌ Import error:', error.message);
}
