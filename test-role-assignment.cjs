// Test script to verify the fixed role assignment
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

async function testRoleAssignment() {
  try {
    console.log('🧪 Testing Fixed Role Assignment\n');
    
    // Test the current transaction
    const transaction = await prisma.escrowTransaction.findUnique({
      where: { id: 'cmfz95xuo00057fij4ycuzowg' },
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
    
    // Test workflow for CREATOR (BUYER)
    console.log('👤 CREATOR View (BUYER):');
    const creatorAction = getNextAction(transaction.status, transaction.creatorRole, transaction.useCourier);
    console.log(`   Next Action: ${creatorAction}`);
    console.log('');
    
    // Test workflow for COUNTERPARTY (SELLER)
    console.log('👤 COUNTERPARTY View (SELLER):');
    const counterpartyAction = getNextAction(transaction.status, transaction.counterpartyRole, transaction.useCourier);
    console.log(`   Next Action: ${counterpartyAction}`);
    console.log('');
    
    // Verify role assignment is correct
    console.log('✅ Role Assignment Verification:');
    if (transaction.creatorRole === 'BUYER' && transaction.counterpartyRole === 'SELLER') {
      console.log('   ✅ CORRECT: Creator is BUYER, Counterparty is SELLER');
    } else if (transaction.creatorRole === 'SELLER' && transaction.counterpartyRole === 'BUYER') {
      console.log('   ✅ CORRECT: Creator is SELLER, Counterparty is BUYER');
    } else {
      console.log('   ❌ INCORRECT: Both parties have the same role!');
      console.log(`   Creator: ${transaction.creatorRole}, Counterparty: ${transaction.counterpartyRole}`);
    }
    console.log('');
    
    // Test the complete workflow with correct roles
    console.log('🔄 Complete Workflow with Correct Roles:');
    console.log('');
    
    console.log('1. WAITING_FOR_DELIVERY_DETAILS (Current Status):');
    console.log(`   BUYER (Creator): ${getNextAction('WAITING_FOR_DELIVERY_DETAILS', 'BUYER', true)}`);
    console.log(`   SELLER (Counterparty): ${getNextAction('WAITING_FOR_DELIVERY_DETAILS', 'SELLER', true)}`);
    console.log('');
    
    console.log('2. WAITING_FOR_PAYMENT (After buyer fills details):');
    console.log(`   BUYER (Creator): ${getNextAction('WAITING_FOR_PAYMENT', 'BUYER', true)}`);
    console.log(`   SELLER (Counterparty): ${getNextAction('WAITING_FOR_PAYMENT', 'SELLER', true)}`);
    console.log('');
    
    console.log('3. WAITING_FOR_SHIPMENT (After buyer pays):');
    console.log(`   BUYER (Creator): ${getNextAction('WAITING_FOR_SHIPMENT', 'BUYER', true)}`);
    console.log(`   SELLER (Counterparty): ${getNextAction('WAITING_FOR_SHIPMENT', 'SELLER', true)}`);
    console.log('');
    
    console.log('4. WAITING_FOR_BUYER_CONFIRMATION (After seller ships):');
    console.log(`   BUYER (Creator): ${getNextAction('WAITING_FOR_BUYER_CONFIRMATION', 'BUYER', true)}`);
    console.log(`   SELLER (Counterparty): ${getNextAction('WAITING_FOR_BUYER_CONFIRMATION', 'SELLER', true)}`);
    console.log('');
    
    console.log('✅ Role assignment test completed!');
    
  } catch (error) {
    console.error('❌ Error testing role assignment:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRoleAssignment();

