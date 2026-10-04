const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Project = require('./models/Project');
const Bid = require('./models/Bid');

const MONGO_URI = process.env.MONGO_URI;

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    await User.deleteMany({});
    await Project.deleteMany({});
    await Bid.deleteMany({});
    console.log('Cleared existing users, projects, and bids.');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const rahul = await User.create({
      name: 'Rahul',
      email: 'rahul@example.com',
      password: hashedPassword,
      role: 'client'
    });

    const priya = await User.create({
      name: 'Priya',
      email: 'priya@example.com',
      password: hashedPassword,
      role: 'client'
    });

    const aman = await User.create({
      name: 'Aman',
      email: 'aman@example.com',
      password: hashedPassword,
      role: 'freelancer'
    });

    const rohit = await User.create({
      name: 'Rohit',
      email: 'rohit@example.com',
      password: hashedPassword,
      role: 'freelancer'
    });

    const sneha = await User.create({
      name: 'Sneha',
      email: 'sneha@example.com',
      password: hashedPassword,
      role: 'freelancer'
    });

    console.log('Created sample users (Rahul, Priya, Aman, Rohit, Sneha).');

    const project1 = await Project.create({
      title: 'Website Development',
      description: 'Need a complete responsive website for my local retail business using React.',
      budget: 20000,
      client: rahul._id,
      status: 'open'
    });

    const project2 = await Project.create({
      title: 'Mobile App Design',
      description: 'UI/UX design and screens for a fitness tracking mobile application.',
      budget: 15000,
      client: rahul._id,
      status: 'open'
    });

    const project3 = await Project.create({
      title: 'E-commerce Website',
      description: 'Full-stack e-commerce store with product catalogue, filtering, and cart.',
      budget: 35000,
      client: priya._id,
      status: 'open'
    });

    const project4 = await Project.create({
      title: 'Logo Design',
      description: 'Modern, minimalist vector logo design for our new organic coffee brand.',
      budget: 5000,
      client: priya._id,
      status: 'open'
    });

    console.log('Created sample projects.');

    await Bid.create({
      project: project1._id,
      freelancer: aman._id,
      amount: 18000,
      proposal: 'I can build the website using React and Node.js with high quality and responsiveness.',
      status: 'pending'
    });

    await Bid.create({
      project: project1._id,
      freelancer: rohit._id,
      amount: 17500,
      proposal: 'Experienced web developer ready to deliver clean code in 7 days.',
      status: 'pending'
    });

    await Bid.create({
      project: project2._id,
      freelancer: sneha._id,
      amount: 14000,
      proposal: 'Experienced designer with Figma portfolio ready to deliver sleek UI designs.',
      status: 'pending'
    });

    await Bid.create({
      project: project3._id,
      freelancer: aman._id,
      amount: 32000,
      proposal: 'Can build scalable e-commerce store with clean MongoDB schema and express APIs.',
      status: 'pending'
    });

    await Bid.create({
      project: project3._id,
      freelancer: sneha._id,
      amount: 30000,
      proposal: 'Full-stack experience with React and Express, ready to build within 2 weeks.',
      status: 'pending'
    });

    await Bid.create({
      project: project4._id,
      freelancer: rohit._id,
      amount: 4500,
      proposal: 'Creative graphic designer providing 3 unique logo concepts with unlimited revisions.',
      status: 'pending'
    });

    console.log('Created sample bids successfully.');
    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seedDatabase();
