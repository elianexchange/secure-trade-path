// Test script to verify transaction workflow logic
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Simulate the TransactionStatusFlow logic
function getNextAction(status, userRole, useCourier) {
  switch (status) {
    case 'ACTIVE':
      if (useCourier) {
        return userRole === 'BUYER' ? 'Proceed to Fill Shipping Details' : 'Waiting for Buyer to Fill Shipping Details';
      } else {
        return userRole === 'BUYER' ? 'Proceed with Payment' : 'Waiting for Buyer to Make Payment';
      }
    case 'WAITING_FOR_DELIVERY_DETAILS':
      return userRole === 'BUYER' ? 'Provide Delivery Details' : 'Waiting for Buyer to Provide Delivery Details';
    case 'DELIVERY_DETAILS_IMPORTED':
      return userRole === 'BUYER' ? 'Proceed with Payment' : 'Waiting for Buyer to Make Payment';
    case 'WAITING_FOR_PAYMENT':
      return userRole === 'BUYER' ? 'Make Payment' : 'Waiting for Buyer to Make Payment';
    case 'PAYMENT_MADE':
      return userRole === 'SELLER' ? 'Proceed to Ship Goods' : 'Waiting for Seller to Ship Goods';
    case 'WAITING_FOR_SHIPMENT':
      return userRole === 'SELLER' ? 'Confirm Shipment' : 'Waiting for Seller to Ship Goods';
    case 'SHIPMENT_CONFIRMED':
      return userRole === 'BUYER' ? 'Confirm Receipt of Goods' : 'Waiting for Buyer to Confirm Receipt';
    case 'WAITING_FOR_BUYER_CONFIRMATION':
      return userRole === 'BUYER' ? 'Confirm Receipt' : 'Waiting for Buyer to Confirm Receipt';
    default:
      return null;
  }
}

async function testWorkflow() {
  try {
    console.log('🧪 Testing Transaction Workflow Logic\n');
    
    // Test the current transaction
    const transaction = await prisma.escrowTransaction.findUnique({
      where: { id: 'cmfz0aj7g0009qonwxkrzke2y' },
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, email: true } },
        counterparty: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });
    
    if (!transaction) {
      console.log('❌ Transaction not found');
      return;
    }
    
    console.log('📋 Transaction Details:');
    console.log(`   ID: ${transaction.id}`);
    console.log(`   Status: ${transaction.status}`);
    console.log(`   Use Courier: ${transaction.useCourier}`);
    console.log(`   Creator: ${transaction.creator.firstName} ${transaction.creator.lastName} (${transaction.creatorRole})`);
    console.log(`   Counterparty: ${transaction.counterparty ? `${transaction.counterparty.firstName} ${transaction.counterparty.lastName}` : 'None'} (${transaction.counterpartyRole})`);
    console.log('');
    
    // Test workflow for SELLER (creator)
    console.log('👤 SELLER View (Creator):');
    const sellerAction = getNextAction(transaction.status, transaction.creatorRole, transaction.useCourier);
    console.log(`   Next Action: ${sellerAction}`);
    console.log('');
    
    // Test workflow for BUYER (counterparty)
    console.log('👤 BUYER View (Counterparty):');
    const buyerAction = getNextAction(transaction.status, transaction.counterpartyRole, transaction.useCourier);
    console.log(`   Next Action: ${buyerAction}`);
    console.log('');
    
    // Test different statuses
    console.log('🔄 Testing Different Statuses:');
    const statuses = ['ACTIVE', 'WAITING_FOR_DELIVERY_DETAILS', 'WAITING_FOR_PAYMENT', 'WAITING_FOR_SHIPMENT', 'WAITING_FOR_BUYER_CONFIRMATION'];
    
    for (const status of statuses) {
      console.log(`\n   Status: ${status}`);
      const sellerAction = getNextAction(status, 'SELLER', transaction.useCourier);
      const buyerAction = getNextAction(status, 'BUYER', transaction.useCourier);
      console.log(`   SELLER: ${sellerAction}`);
      console.log(`   BUYER:  ${buyerAction}`);
    }
    
    console.log('\n✅ Workflow test completed!');
    
  } catch (error) {
    console.error('❌ Error testing workflow:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWorkflow();

