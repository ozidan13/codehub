const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function parseUsersFromSQL(sqlContent) {
  // Extract the VALUES part from the INSERT statement
  const valuesMatch = sqlContent.match(/VALUES\s+(.+)/s);
  if (!valuesMatch) {
    throw new Error('Could not find VALUES in SQL content');
  }
  
  const valuesString = valuesMatch[1];
  
  // Parse each user record - they are in format ('id', 'email', 'name', ...)
  const userRecords = [];
  const recordRegex = /\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*([^,]+),\s*([^,]+),\s*'([^']+)'\)/g;
  
  let match;
  while ((match = recordRegex.exec(valuesString)) !== null) {
    const [, id, email, name, password, role, createdAt, updatedAt, balance, isMentor, mentorBio, mentorRate, phoneNumber] = match;
    
    userRecords.push({
      id,
      email,
      name,
      password,
      role,
      createdAt: new Date(createdAt),
      updatedAt: new Date(updatedAt),
      balance: parseFloat(balance),
      isMentor: isMentor === 'true',
      mentorBio: mentorBio === 'null' ? null : mentorBio,
      mentorRate: mentorRate === 'null' ? null : parseFloat(mentorRate),
      phoneNumber
    });
  }
  
  return userRecords;
}

async function restoreUsers() {
  try {
    console.log('🔄 Starting user restoration from backup...');
    
    // Read the SQL backup file
    const backupPath = path.join(__dirname, '..', 'prisma', 'backup', 'users_rows.sql');
    const sqlContent = fs.readFileSync(backupPath, 'utf8');
    
    console.log('📁 Backup file loaded successfully');
    
    // Parse users from SQL
    console.log('🔍 Parsing user data from SQL...');
    const users = parseUsersFromSQL(sqlContent);
    console.log(`📊 Found ${users.length} users to restore`);
    
    // Check for existing users to avoid conflicts
    console.log('🔍 Checking for existing users...');
    const existingEmails = await prisma.user.findMany({
      select: { email: true }
    });
    const existingEmailSet = new Set(existingEmails.map(u => u.email));
    
    // Filter out users that already exist
    const newUsers = users.filter(user => !existingEmailSet.has(user.email));
    console.log(`📊 ${newUsers.length} new users to add (${users.length - newUsers.length} already exist)`);
    
    if (newUsers.length > 0) {
      // Restore users using createMany
      console.log('💾 Restoring users to database...');
      await prisma.user.createMany({
        data: newUsers,
        skipDuplicates: true
      });
      
      console.log('✅ User restoration completed successfully!');
    } else {
      console.log('ℹ️ No new users to restore - all users already exist');
    }
    
    // Count total students
    const studentCount = await prisma.user.count({
      where: { role: 'STUDENT' }
    });
    
    console.log(`📊 Total students in database: ${studentCount}`);
    
    // Show sample of restored users
    const sampleUsers = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        email: true,
        name: true,
        balance: true,
        createdAt: true
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('👥 Sample users in database:');
    sampleUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - Balance: $${user.balance}`);
    });
    
  } catch (error) {
    console.error('❌ Error during user restoration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the restoration
restoreUsers()
  .then(() => {
    console.log('🎉 User restoration process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Restoration failed:', error);
    process.exit(1);
  });