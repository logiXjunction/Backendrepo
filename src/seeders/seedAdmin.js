const Admin = require('../models/admin');

const seedAdmin = async () => {
  try {
    const {
      ADMIN_NAME,
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
    } = process.env;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.log('⚠️ Admin seed skipped (missing env vars)');
      return;
    }

    const existingAdmin = await Admin.findOne({
      where: { email: ADMIN_EMAIL },
    });

    if (existingAdmin) {
      console.log('✅ Admin already exists, skipping seed');
      return;
    }

    await Admin.create({
      name: ADMIN_NAME || 'Admin',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD, // 🔐 hashed by hook
      role: 'admin',
    });

    console.log('🚀 Admin seeded successfully');
    console.log(`📧 Email: ${ADMIN_EMAIL}`);
  } catch (err) {
    console.error('❌ Failed to seed admin:', err);
  }
};

module.exports = seedAdmin;
