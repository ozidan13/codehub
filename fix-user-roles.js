const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUserRoles() {
  try {
    console.log('🔍 البحث عن المستخدمين الذين لديهم دور ADMIN...');
    
    // البحث عن جميع المستخدمين الذين لديهم دور ADMIN
    const adminUsers = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
    
    console.log(`📊 تم العثور على ${adminUsers.length} مستخدم بدور ADMIN`);
    
    if (adminUsers.length === 0) {
      console.log('✅ لا يوجد مستخدمين بدور ADMIN للتحديث');
      return;
    }
    
    // عرض المستخدمين الذين سيتم تحديثهم
    console.log('\n👥 المستخدمين الذين سيتم تحديثهم:');
    adminUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'بدون اسم'} (${user.email}) - ID: ${user.id}`);
    });
    
    console.log('\n🔄 بدء تحديث أدوار المستخدمين من ADMIN إلى STUDENT...');
    
    // تحديث جميع المستخدمين من ADMIN إلى STUDENT
    const updateResult = await prisma.user.updateMany({
      where: {
        role: 'ADMIN'
      },
      data: {
        role: 'STUDENT'
      }
    });
    
    console.log(`✅ تم تحديث ${updateResult.count} مستخدم بنجاح`);
    
    // التحقق من النتيجة
    const remainingAdmins = await prisma.user.count({
      where: {
        role: 'ADMIN'
      }
    });
    
    const totalStudents = await prisma.user.count({
      where: {
        role: 'STUDENT'
      }
    });
    
    console.log('\n📈 الإحصائيات النهائية:');
    console.log(`- عدد المستخدمين بدور ADMIN: ${remainingAdmins}`);
    console.log(`- عدد المستخدمين بدور STUDENT: ${totalStudents}`);
    
    if (remainingAdmins === 0) {
      console.log('\n🎉 تم تحديث جميع المستخدمين بنجاح! الآن جميع المستخدمين لديهم دور STUDENT');
    }
    
  } catch (error) {
    console.error('❌ حدث خطأ أثناء تحديث أدوار المستخدمين:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل الدالة
fixUserRoles()
  .then(() => {
    console.log('\n✨ انتهت عملية التحديث');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ فشل في تشغيل السكريبت:', error);
    process.exit(1);
  });