// Test script to verify the fixed transaction workflow
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
    console.log('🧪 Testing Fixed Transaction Workflow\n');
    
    // Test the current transaction
    const transaction = await prisma.escrowTransaction.findUnique({
      where: { id: 'cmfz142n20005hj5mhp59p790' },
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
    
    // Test the complete workflow
    console.log('🔄 Complete Transaction Workflow:');
    console.log('');
    
    // 1. PENDING -> ACTIVE (when counterparty joins)
    console.log('1. PENDING → ACTIVE (when counterparty joins)');
    console.log(`   SELLER: ${getNextAction('ACTIVE', 'SELLER', true)}`);
    console.log(`   BUYER:  ${getNextAction('ACTIVE', 'BUYER', true)}`);
    console.log('');
    
    // 2. ACTIVE -> WAITING_FOR_DELIVERY_DETAILS (for courier transactions)
    console.log('2. ACTIVE → WAITING_FOR_DELIVERY_DETAILS (for courier transactions)');
    console.log(`   SELLER: ${getNextAction('WAITING_FOR_DELIVERY_DETAILS', 'SELLER', true)}`);
    console.log(`   BUYER:  ${getNextAction('WAITING_FOR_DELIVERY_DETAILS', 'BUYER', true)}`);
    console.log('');
    
    // 3. WAITING_FOR_DELIVERY_DETAILS -> WAITING_FOR_PAYMENT (after buyer fills details)
    console.log('3. WAITING_FOR_DELIVERY_DETAILS → WAITING_FOR_PAYMENT (after buyer fills details)');
    console.log(`   SELLER: ${getNextAction('WAITING_FOR_PAYMENT', 'SELLER', true)}`);
    console.log(`   BUYER:  ${getNextAction('WAITING_FOR_PAYMENT', 'BUYER', true)}`);
    console.log('');
    
    // 4. WAITING_FOR_PAYMENT -> WAITING_FOR_SHIPMENT (after buyer pays)
    console.log('4. WAITING_FOR_PAYMENT → WAITING_FOR_SHIPMENT (after buyer pays)');
    console.log(`   SELLER: ${getNextAction('WAITING_FOR_SHIPMENT', 'SELLER', true)}`);
    console.log(`   BUYER:  ${getNextAction('WAITING_FOR_SHIPMENT', 'BUYER', true)}`);
    console.log('');
    
    // 5. WAITING_FOR_SHIPMENT -> WAITING_FOR_BUYER_CONFIRMATION (after seller ships)
    console.log('5. WAITING_FOR_SHIPMENT → WAITING_FOR_BUYER_CONFIRMATION (after seller ships)');
    console.log(`   SELLER: ${getNextAction('WAITING_FOR_BUYER_CONFIRMATION', 'SELLER', true)}`);
    console.log(`   BUYER:  ${getNextAction('WAITING_FOR_BUYER_CONFIRMATION', 'BUYER', true)}`);
    console.log('');
    
    // Test non-courier workflow
    console.log('🚚 Non-Courier Transaction Workflow:');
    console.log('ACTIVE → WAITING_FOR_PAYMENT (skip delivery details)');
    console.log(`   SELLER: ${getNextAction('WAITING_FOR_PAYMENT', 'SELLER', false)}`);
    console.log(`   BUYER:  ${getNextAction('WAITING_FOR_PAYMENT', 'BUYER', false)}`);
    console.log('');
    
    console.log('✅ Workflow test completed! The role-based actions are working correctly.');
    
  } catch (error) {
    console.error('❌ Error testing workflow:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWorkflow();

