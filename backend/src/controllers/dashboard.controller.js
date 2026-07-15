const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { healDailyTask } = require('../utils/dailyHealer');

// List of motivational quotes to display randomly or by day
const MOTIVATIONAL_QUOTES = [
  "The only way to learn a new programming language is by writing programs in it. — Dennis Ritchie",
  "Consistency beats intensity. Little steps daily lead to massive transformations.",
  "An investment in knowledge pays the best interest. — Benjamin Franklin",
  "Don't practice until you get it right. Practice until you can't get it wrong.",
  "First, solve the problem. Then, write the code. — John Johnson",
  "Success is the sum of small efforts, repeated day in and day out.",
  "Talk is cheap. Show me the code. — Linus Torvalds",
  "The secret of getting ahead is getting started. — Mark Twain",
  "Make it work, make it right, make it fast. — Kent Beck",
  "Small gains everyday compound into massive results over time."
];

exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.userId;
    const now = new Date();
    
    // Normalize date to YYYY-MM-DD
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);

    // 1. Fetch User details for streaks and levels
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        xp: true,
        level: true,
        currentStreak: true,
        longestStreak: true,
        settings: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // 2. Fetch or Create today's DailyTask tracker
    let dailyTask = await prisma.dailyTask.findUnique({
      where: {
        userId_date: {
          userId,
          date: startOfDay
        }
      }
    });

    if (!dailyTask) {
      dailyTask = await prisma.dailyTask.create({
        data: {
          userId,
          date: startOfDay
        }
      });
    }

    dailyTask = await healDailyTask(userId, dailyTask, prisma);

    // 3. Find Today's JavaScript Topic (first unlocked one)
    const nextJSTopic = await prisma.userJavaScriptProgress.findFirst({
      where: {
        userId,
        status: 'unlocked'
      },
      include: {
        topic: true
      },
      orderBy: {
        topic: {
          orderNumber: 'asc'
        }
      }
    });

    // 4. Find Today's DSA Category (first in_progress, or first not_started)
    let nextDSATopic = await prisma.userDSAProgress.findFirst({
      where: {
        userId,
        status: 'in_progress'
      },
      include: {
        dsaTopic: true
      }
    });

    if (!nextDSATopic) {
      nextDSATopic = await prisma.userDSAProgress.findFirst({
        where: {
          userId,
          status: 'not_started'
        },
        include: {
          dsaTopic: true
        },
        orderBy: {
          dsaTopic: {
            id: 'asc'
          }
        }
      });
    }

    // 5. Find Today's pending Assignment
    const nextAssignment = await prisma.userAssignment.findFirst({
      where: {
        userId,
        status: 'pending'
      },
      include: {
        assignment: true
      },
      orderBy: {
        assignment: {
          deadline: 'asc'
        }
      }
    });

    // 6. Find Today's Revision (first pending revision, including past due)
    const nextRevision = await prisma.revisionSchedule.findFirst({
      where: {
        userId,
        status: 'pending'
      },
      orderBy: {
        dueDate: 'asc'
      }
    });

    // 7. Calculate overall JS progress percentage
    const totalJSTopics = await prisma.javaScriptTopic.count();
    const completedJSTopics = await prisma.userJavaScriptProgress.count({
      where: { userId, status: 'completed' }
    });
    const jsProgressPercentage = totalJSTopics > 0 ? Math.round((completedJSTopics / totalJSTopics) * 100) : 0;

    // 8. Calculate overall DSA progress percentage
    // Let's count how many DSA categories have solved >= 1 problem
    const totalDSATopics = await prisma.dSATopic.count();
    const completedDSATopics = await prisma.userDSAProgress.count({
      where: {
        userId,
        status: { in: ['in_progress', 'completed'] }
      }
    });
    const dsaProgressPercentage = totalDSATopics > 0 ? Math.round((completedDSATopics / totalDSATopics) * 100) : 0;

    // 9. Choose a motivational quote
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    const quote = MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];

    // Determine Greeting
    const hour = now.getHours();
    let greeting = "Good Evening";
    if (hour >= 5 && hour < 12) {
      greeting = "Good Morning";
    } else if (hour >= 12 && hour < 17) {
      greeting = "Good Afternoon";
    }

    // Count pending revisions due (past due or today)
    const revisionsDueCount = await prisma.revisionSchedule.count({
      where: {
        userId,
        status: 'pending',
        dueDate: { lte: now }
      }
    });

    return res.status(200).json({
      greeting,
      quote,
      user: {
        username: user.username,
        xp: user.xp,
        level: user.level,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak
      },
      settings: user.settings,
      dailyTask,
      progress: {
        js: jsProgressPercentage,
        dsa: dsaProgressPercentage,
        completedJSCount: completedJSTopics,
        totalJSCount: totalJSTopics
      },
      nextJS: nextJSTopic ? {
        id: nextJSTopic.topic.id,
        title: nextJSTopic.topic.title,
        category: nextJSTopic.topic.category,
        estimatedTime: nextJSTopic.topic.estimatedTime,
        difficulty: nextJSTopic.topic.difficulty
      } : null,
      nextDSA: nextDSATopic ? {
        id: nextDSATopic.dsaTopic.id,
        category: nextDSATopic.dsaTopic.category,
        difficulty: nextDSATopic.dsaTopic.difficulty,
        problemsSolved: nextDSATopic.problemsSolved
      } : null,
      nextAssignment: nextAssignment ? {
        id: nextAssignment.assignment.id,
        name: nextAssignment.assignment.name,
        deadline: nextAssignment.assignment.deadline
      } : null,
      nextRevision: nextRevision ? {
        id: nextRevision.id,
        topicTitle: nextRevision.topicTitle,
        topicCategory: nextRevision.topicCategory,
        dueDate: nextRevision.dueDate
      } : null,
      revisionsDueCount
    });

  } catch (error) {
    console.error('getDashboardData Error:', error);
    return res.status(500).json({ error: 'Server error loading dashboard data.' });
  }
};
