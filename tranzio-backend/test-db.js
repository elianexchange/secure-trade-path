const { PrismaClient } = require('@prisma/client');

async function testDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔌 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`📊 Users in database: ${userCount}`);
    
    // Test transaction count
    const transactionCount = await prisma.escrowTransaction.count();
    console.log(`📊 Transactions in database: ${transactionCount}`);
    
    // Test message count
    const messageCount = await prisma.message.count();
    console.log(`📊 Messages in database: ${messageCount}`);
    
    console.log('✅ Database test completed successfully');
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();


