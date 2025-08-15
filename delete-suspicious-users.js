const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteSuspiciousUsers() {
  try {
    console.log('🔍 البحث عن المستخدمين المشبوهين...');
    
    // البحث عن المستخدمين الذين:
    // 1. لا يستخدمون Gmail
    // 2. أو تبدأ إيميلاتهم بـ "money"
    // 3. أو تبدأ إيميلاتهم بـ "fake"
    const suspiciousUsers = await prisma.user.findMany({
      where: {
        OR: [
          {
            // المستخدمين الذين لا يستخدمون Gmail
            email: {
              not: {
                endsWith: '@gmail.com'
              }
            }
          },
          {
            // المستخدمين الذين تبدأ إيميلاتهم بـ "money"
            email: {
              startsWith: 'money'
            }
          },
          {
            // المستخدمين الذين تبدأ إيميلاتهم بـ "fake"
            email: {
              startsWith: 'fake'
            }
          }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });
    
    console.log(`📊 تم العثور على ${suspiciousUsers.length} مستخدم مشبوه`);
    
    if (suspiciousUsers.length === 0) {
      console.log('✅ لا يوجد مستخدمين مشبوهين للحذف');
      return;
    }
    
    // تصنيف المستخدمين حسب نوع المشكلة
    const nonGmailUsers = suspiciousUsers.filter(user => !user.email.endsWith('@gmail.com') && !user.email.startsWith('money') && !user.email.startsWith('fake'));
    const moneyUsers = suspiciousUsers.filter(user => user.email.startsWith('money'));
    const fakeUsers = suspiciousUsers.filter(user => user.email.startsWith('fake'));
    
    console.log('\n📋 تصنيف المستخدمين المشبوهين:');
    console.log(`- مستخدمين بإيميلات غير Gmail: ${nonGmailUsers.length}`);
    console.log(`- مستخدمين بإيميلات تبدأ بـ "money": ${moneyUsers.length}`);
    console.log(`- مستخدمين بإيميلات تبدأ بـ "fake": ${fakeUsers.length}`);
    
    // عرض المستخدمين الذين سيتم حذفهم
    console.log('\n🗑️ المستخدمين الذين سيتم حذفهم:');
    
    if (nonGmailUsers.length > 0) {
      console.log('\n📧 مستخدمين بإيميلات غير Gmail:');
      nonGmailUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'بدون اسم'} - ${user.email} - تاريخ التسجيل: ${user.createdAt.toLocaleDateString('ar-EG')}`);
      });
    }
    
    if (moneyUsers.length > 0) {
      console.log('\n💰 مستخدمين بإيميلات تبدأ بـ "money":');
      moneyUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'بدون اسم'} - ${user.email} - تاريخ التسجيل: ${user.createdAt.toLocaleDateString('ar-EG')}`);
      });
    }
    
    if (fakeUsers.length > 0) {
      console.log('\n🎭 مستخدمين بإيميلات تبدأ بـ "fake":');
      fakeUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'بدون اسم'} - ${user.email} - تاريخ التسجيل: ${user.createdAt.toLocaleDateString('ar-EG')}`);
      });
    }
    
    console.log('\n⚠️ تحذير: سيتم حذف هؤلاء المستخدمين نهائياً من قاعدة البيانات!');
    console.log('🔄 بدء عملية الحذف...');
    
    // حذف المستخدمين المشبوهين
    const deleteResult = await prisma.user.deleteMany({
      where: {
        OR: [
          {
            email: {
              not: {
                endsWith: '@gmail.com'
              }
            }
          },
          {
            email: {
              startsWith: 'money'
            }
          },
          {
            email: {
              startsWith: 'fake'
            }
          }
        ]
      }
    });
    
    console.log(`✅ تم حذف ${deleteResult.count} مستخدم مشبوه بنجاح`);
    
    // التحقق من النتيجة النهائية
    const remainingUsers = await prisma.user.count();
    const remainingSuspiciousUsers = await prisma.user.count({
      where: {
        OR: [
          {
            email: {
              not: {
                endsWith: '@gmail.com'
              }
            }
          },
          {
            email: {
              startsWith: 'money'
            }
          },
          {
            email: {
              startsWith: 'fake'
            }
          }
        ]
      }
    });
    
    console.log('\n📈 الإحصائيات النهائية:');
    console.log(`- إجمالي المستخدمين المتبقين: ${remainingUsers}`);
    console.log(`- المستخدمين المشبوهين المتبقين: ${remainingSuspiciousUsers}`);
    
    if (remainingSuspiciousUsers === 0) {
      console.log('\n🎉 تم تنظيف قاعدة البيانات بنجاح! لم يعد هناك مستخدمين مشبوهين');
    }
    
  } catch (error) {
    console.error('❌ حدث خطأ أثناء حذف المستخدمين المشبوهين:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// تشغيل الدالة
deleteSuspiciousUsers()
  .then(() => {
    console.log('\n✨ انتهت عملية تنظيف المستخدمين المشبوهين');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ فشل في تشغيل السكريبت:', error);
    process.exit(1);
  });