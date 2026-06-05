require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

const User = require('../models/User');
const Project = require('../models/Project');
const Contractor = require('../models/Contractor');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Labour = require('../models/Labour');

const seed = async () => {
  try {
    await connectDB();
    console.log('🌱 Starting seed...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Contractor.deleteMany({}),
      Payment.deleteMany({}),
      Expense.deleteMany({}),
      Labour.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Hash password manually and insert directly to avoid double-hashing
    // from the User model pre-save hook
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash('password123', salt);

    const userDoc = await User.collection.insertOne({
      name: 'Ahmed Khan',
      email: 'ahmed@siteledger.com',
      phone: '03001234567',
      passwordHash,
      companyName: 'Khan Construction Co.',
      role: 'owner',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const user = await User.findById(userDoc.insertedId);
    console.log('👤 Test user created: ahmed@siteledger.com / password123');

    // Create projects
    const project1 = await Project.create({
      userId: user._id,
      name: 'DHA Phase 6 Villa',
      clientName: 'Mr. Tariq Mahmood',
      location: 'DHA Phase 6, Lahore',
      projectType: 'Residential',
      estimatedBudget: 8500000,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-12-31'),
      status: 'active',
      notes: 'Double storey villa with basement',
    });

    const project2 = await Project.create({
      userId: user._id,
      name: 'Gulberg Commercial Plaza',
      clientName: 'Gulberg Developers',
      location: 'Gulberg III, Lahore',
      projectType: 'Commercial',
      estimatedBudget: 25000000,
      startDate: new Date('2024-03-01'),
      status: 'active',
      notes: '5 storey commercial building',
    });

    await Project.create({
      userId: user._id,
      name: 'Model Town House',
      clientName: 'Mrs. Sana Iqbal',
      location: 'Model Town, Lahore',
      projectType: 'Residential',
      estimatedBudget: 4200000,
      startDate: new Date('2023-06-01'),
      endDate: new Date('2024-02-28'),
      status: 'completed',
      notes: 'Single storey house renovation',
    });

    console.log('🏗️  Projects created');

    // Create contractors
    const contractor1 = await Contractor.create({
      userId: user._id,
      projectId: project1._id,
      name: 'Ustad Ramzan',
      phone: '03211234567',
      type: 'Contractor',
      category: 'Mason',
      totalContractAmount: 1200000,
      notes: 'Main mason contractor for DHA villa',
    });

    const contractor2 = await Contractor.create({
      userId: user._id,
      projectId: project1._id,
      name: 'Ali Electric Works',
      phone: '03331234567',
      type: 'Contractor',
      category: 'Electrician',
      totalContractAmount: 350000,
      notes: 'Full electrical work',
    });

    const contractor3 = await Contractor.create({
      userId: user._id,
      projectId: project1._id,
      name: 'Punjab Steel Traders',
      phone: '03451234567',
      type: 'Supplier',
      category: 'Steel Supplier',
      totalContractAmount: 2100000,
      notes: 'Steel and iron supply',
    });

    const contractor4 = await Contractor.create({
      userId: user._id,
      projectId: project2._id,
      name: 'Chaudhry Plumbing',
      phone: '03561234567',
      type: 'Contractor',
      category: 'Plumber',
      totalContractAmount: 480000,
      notes: 'Plumbing for commercial plaza',
    });

    await Contractor.create({
      userId: user._id,
      projectId: project1._id,
      name: 'Faisal Cement Store',
      phone: '03671234567',
      type: 'Supplier',
      category: 'Cement Supplier',
      totalContractAmount: 650000,
      notes: 'Cement supply throughout project',
    });

    console.log('👷 Contractors created');

    // Create payments
    await Payment.create({
      userId: user._id, projectId: project1._id, contractorId: contractor1._id,
      title: 'Foundation Work Payment', totalAmount: 400000, paidAmount: 400000,
      paymentMethod: 'Bank Transfer', paymentDate: new Date('2024-02-10'),
      notes: 'Foundation completed',
    });

    await Payment.create({
      userId: user._id, projectId: project1._id, contractorId: contractor1._id,
      title: 'Ground Floor Masonry', totalAmount: 500000, paidAmount: 300000,
      paymentMethod: 'Cash', paymentDate: new Date('2024-04-15'),
      notes: 'Partial payment - work in progress',
    });

    await Payment.create({
      userId: user._id, projectId: project1._id, contractorId: contractor3._id,
      title: 'Steel Supply - Phase 1', totalAmount: 850000, paidAmount: 850000,
      paymentMethod: 'Cheque', paymentDate: new Date('2024-03-20'),
      notes: 'Full payment for first steel delivery',
    });

    await Payment.create({
      userId: user._id, projectId: project1._id, contractorId: contractor3._id,
      title: 'Steel Supply - Phase 2', totalAmount: 750000, paidAmount: 400000,
      paymentMethod: 'Bank Transfer', paymentDate: new Date('2024-05-10'),
      notes: 'Partial payment',
    });

    await Payment.create({
      userId: user._id, projectId: project1._id, contractorId: contractor2._id,
      title: 'Electrical Wiring - Ground Floor', totalAmount: 180000, paidAmount: 0,
      paymentMethod: 'Cash', paymentDate: new Date('2024-06-01'),
      notes: 'Work not started yet',
    });

    await Payment.create({
      userId: user._id, projectId: project2._id, contractorId: contractor4._id,
      title: 'Plumbing - Basement', totalAmount: 200000, paidAmount: 120000,
      paymentMethod: 'Easypaisa', paymentDate: new Date('2024-04-25'),
      notes: 'Basement plumbing partial',
    });

    console.log('💰 Payments created');

    // Create expenses
    await Expense.create({ userId: user._id, projectId: project1._id, title: 'Cement Purchase - 200 bags', category: 'Material', amount: 120000, date: new Date('2024-02-05'), paymentMethod: 'Cash', notes: 'OPC cement 200 bags' });
    await Expense.create({ userId: user._id, projectId: project1._id, title: 'Sand and Gravel', category: 'Material', amount: 45000, date: new Date('2024-02-08'), paymentMethod: 'Cash', notes: 'Foundation material' });
    await Expense.create({ userId: user._id, projectId: project1._id, title: 'Truck Transport - Steel', category: 'Transport', amount: 15000, date: new Date('2024-03-21'), paymentMethod: 'Cash', notes: 'Transport for steel delivery' });
    await Expense.create({ userId: user._id, projectId: project1._id, title: 'Generator Fuel', category: 'Fuel', amount: 8500, date: new Date('2024-04-10'), paymentMethod: 'Cash', notes: 'Diesel for site generator' });
    await Expense.create({ userId: user._id, projectId: project1._id, title: 'Worker Tea & Food', category: 'Tea/Food', amount: 12000, date: new Date('2024-04-30'), paymentMethod: 'Cash', notes: 'Monthly food expense' });
    await Expense.create({ userId: user._id, projectId: project2._id, title: 'Scaffolding Rental', category: 'Tools', amount: 35000, date: new Date('2024-03-15'), paymentMethod: 'Bank Transfer', notes: 'Monthly scaffolding rental' });
    await Expense.create({ userId: user._id, projectId: project2._id, title: 'Petty Cash - Misc', category: 'Petty Cash', amount: 25000, date: new Date('2024-05-01'), paymentMethod: 'Cash', notes: 'Miscellaneous site expenses' });

    console.log('📋 Expenses created');

    // Create labour records
    await Labour.create({ userId: user._id, projectId: project1._id, labourName: 'Daily Labour Team A', labourType: 'General Labour', dailyRate: 1200, numberOfDays: 45, paidAmount: 40000, date: new Date('2024-04-30'), notes: 'Foundation and ground floor labour' });
    await Labour.create({ userId: user._id, projectId: project1._id, labourName: 'Shuttering Team', labourType: 'Carpenter', dailyRate: 1800, numberOfDays: 20, paidAmount: 36000, date: new Date('2024-05-15'), notes: 'Slab shuttering work' });
    await Labour.create({ userId: user._id, projectId: project2._id, labourName: 'Daily Labour Team B', labourType: 'General Labour', dailyRate: 1200, numberOfDays: 30, paidAmount: 20000, date: new Date('2024-05-31'), notes: 'Commercial plaza labour' });

    console.log('👨‍🔧 Labour records created');
    console.log('');
    console.log('✅ Seed completed successfully!');
    console.log('');
    console.log('Test Credentials:');
    console.log('  Email    : ahmed@siteledger.com');
    console.log('  Password : password123');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seed();
