const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'study_dashboard_super_secret_key_12345';

exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in a transaction to ensure all progress tables are initialized
    const user = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const newUser = await tx.user.create({
        data: {
          username,
          password: hashedPassword
        }
      });

      // 2. Create Default Settings
      await tx.settings.create({
        data: {
          userId: newUser.id
        }
      });

      // 3. Initialize JS Roadmap Progress
      const topics = await tx.javaScriptTopic.findMany({
        orderBy: { orderNumber: 'asc' }
      });

      for (const topic of topics) {
        await tx.userJavaScriptProgress.create({
          data: {
            userId: newUser.id,
            topicId: topic.id,
            status: topic.orderNumber === 1 ? 'unlocked' : 'locked' // unlock first topic
          }
        });
      }

      // 4. Initialize DSA Progress
      const dsaTopics = await tx.dSATopic.findMany();
      for (const dsa of dsaTopics) {
        await tx.userDSAProgress.create({
          data: {
            userId: newUser.id,
            dsaTopicId: dsa.id,
            status: 'not_started'
          }
        });
      }

      // 5. Create Welcome Notification
      await tx.notification.create({
        data: {
          userId: newUser.id,
          title: 'Welcome to your Study & Life Dashboard!',
          message: 'Get ready to build your consistency, track DSA problems, study JavaScript, and level up!',
          type: 'alert',
          scheduledTime: new Date()
        }
      });

      return newUser;
    });

    // Generate Token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      message: 'User registered successfully!',
      token,
      user: {
        id: user.id,
        username: user.username,
        xp: user.xp,
        level: user.level,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ error: 'Server error during registration.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Generate Token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        username: user.username,
        xp: user.xp,
        level: user.level,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Server error during login.' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        username: true,
        xp: true,
        level: true,
        currentStreak: true,
        longestStreak: true,
        settings: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('getMe Error:', error);
    return res.status(500).json({ error: 'Server error fetching profile.' });
  }
};
