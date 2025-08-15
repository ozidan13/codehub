const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanUserNames() {
  try {
    console.log('🔍 البحث عن المستخدمين الذين يحتوون على "🚨 ADMIN -" في أسمائهم...');
    
    // البحث عن جميع المستخدمين الذين يحتوون على النص المطلوب حذفه
    const usersWithAdminText = await prisma.user.findMany({
      where: {
        name: {
          contains: '🚨 ADMIN -'
        }
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });
    
    console.log(`📊 تم العثور على ${usersWithAdminText.length} مستخدم يحتوي على النص "🚨 ADMIN -"`);
    
    if (usersWithAdminText.length === 0) {
      console.log('✅ لا يوجد مستخدمين يحتوون على النص المطلوب حذفه');
      return;
    }
    
    // عرض المستخدمين الذين سيتم تحديثهم
    console.log('\n👥 المستخدمين الذين سيتم تنظيف أسمائهم:');
    usersWithAdminText.forEach((user, index) => {
      const cleanName = user.name ? user.name.replace('🚨 ADMIN - ', '') : user.name;
      console.log(`${index + 1}. الاسم الحالي: "${user.name}"`);
      console.log(`   الاسم الجديد: "${cleanName}"`);
      console.log(`   البريد الإلكتروني: ${user.email}`);
      console.log(`   ID: ${user.id}\n`);
    });
    
    console.log('🔄 بدء تنظيف أسماء المستخدمين...');
    
    let updatedCount = 0;
    
    // تحديث كل مستخدم على حدة
    for (const user of usersWithAdminText) {
      if (user.name) {
        const cleanName = user.name.replace('🚨 ADMIN - ', '');
        
        await prisma.user.update({
          where: {
            id: user.id
          },
          data: {
            name: cleanName
          }
        });
        
        updatedCount++;
        console.log(`✅ تم تحديث: ${user.email} - الاسم الجديد: "${cleanName}"`);
      }
    }
    
    console.log(`\n🎉 تم تنظيف أسماء ${updatedCount} مستخدم بنجاح!`);
    
    // التحقق من النتيجة
    const remainingUsersWithAdminText = await prisma.user.count({
      where: {
        name: {
          contains: '🚨 ADMIN -'
        }
      }
    });
    
    console.log('\n📈 الإحصائيات النهائية:');
    console.log(`- عدد المستخدمين الذين ما زالوا يحتوون على "🚨 ADMIN -": ${remainingUsersWithAdminText}`);
    
    if (remainingUsersWithAdminText === 0) {
      console.log('\n🎉 تم تنظيف جميع الأسماء بنجاح! لم يعد هناك أي مستخدم يحتوي على "🚨 ADMIN -" في اسمه');
    }
    
  } catch (error) {
    console.error('❌ حدث خطأ أثناء تنظيف أسماء المستخدمين:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل الدالة
cleanUserNames()
  .then(() => {
    console.log('\n✨ انتهت عملية تنظيف الأسماء');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ فشل في تشغيل السكريبت:', error);
    process.exit(1);
  });