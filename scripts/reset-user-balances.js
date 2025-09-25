#!/usr/bin/env node

/**
 * Balance Reset Script
 * 
 * This script resets all users' balance to 0
 * Usage: node scripts/reset-user-balances.js
 */

require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function resetAllUserBalances() {
  try {
    console.log('🔄 Starting balance reset for all users...')
    
    // Get current user count and total balance before reset
    const userStats = await prisma.user.aggregate({
      _count: true,
      _sum: {
        balance: true
      }
    })
    
    console.log(`📊 Found ${userStats._count} users with total balance: $${userStats._sum.balance || 0}`)
    
    // Reset all user balances to 0
    console.log('💰 Resetting all user balances to $0...')
    const updateResult = await prisma.user.updateMany({
      data: {
        balance: 0
      }
    })
    
    console.log(`✅ Successfully reset balance for ${updateResult.count} users`)
    
    // Verify the reset
    const verificationStats = await prisma.user.aggregate({
      _sum: {
        balance: true
      },
      _count: {
        balance: true
      }
    })
    
    console.log(`🔍 Verification: Total balance is now $${verificationStats._sum.balance || 0}`)
    
    // Show sample of users with reset balances
    const sampleUsers = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        balance: true,
        role: true
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })
    
    console.log('👥 Sample users after balance reset:')
    sampleUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - Balance: $${user.balance} [${user.role}]`)
    })
    
  } catch (error) {
    console.error('❌ Error during balance reset:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the balance reset
resetAllUserBalances()
  .then(() => {
    console.log('🎉 Balance reset process completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Balance reset failed:', error)
    process.exit(1)
  })