const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const xpUtil = require('../utils/xp');
const achievementUtil = require('../utils/achievements');

exports.getRoadmap = async (req, res) => {
  try {
    const userId = req.userId;

    const roadmap = await prisma.javaScriptTopic.findMany({
      orderBy: { orderNumber: 'asc' },
      include: {
        userProgress: {
          where: { userId }
        }
      }
    });

    // Flatten user progress for easier frontend rendering
    const formattedRoadmap = roadmap.map(topic => {
      const progress = topic.userProgress[0] || {};
      return {
        id: topic.id,
        category: topic.category,
        title: topic.title,
        description: topic.description,
        estimatedTime: topic.estimatedTime,
        difficulty: topic.difficulty,
        orderNumber: topic.orderNumber,
        practiceQuestions: JSON.parse(topic.practiceQuestions || '[]'),
        interviewQuestions: JSON.parse(topic.interviewQuestions || '[]'),
        relatedProject: topic.relatedProject,
        status: progress.status || 'locked',
        completionDate: progress.completionDate || null,
        confidenceRating: progress.confidenceRating || null,
        notes: progress.notes || ''
      };
    });

    return res.status(200).json(formattedRoadmap);
  } catch (error) {
    console.error('getRoadmap Error:', error);
    return res.status(500).json({ error: 'Server error fetching JavaScript roadmap.' });
  }
};

exports.updateTopicStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const { topicId, status, confidenceRating } = req.body; // status should be 'completed'

    if (!topicId || !status) {
      return res.status(400).json({ error: 'Topic ID and status are required.' });
    }

    // Fetch the topic
    const topic = await prisma.javaScriptTopic.findUnique({
      where: { id: parseInt(topicId) }
    });

    if (!topic) {
      return res.status(404).json({ error: 'Topic not found.' });
    }

    // Fetch current user progress
    const currentProgress = await prisma.userJavaScriptProgress.findUnique({
      where: {
        userId_topicId: {
          userId,
          topicId: topic.id
        }
      }
    });

    if (!currentProgress) {
      return res.status(404).json({ error: 'User topic progress not found.' });
    }

    // If already completed, just return success without double awarding XP
    if (currentProgress.status === 'completed' && status === 'completed') {
      return res.status(200).json({ message: 'Topic already completed.' });
    }

    // Fetch user settings for XP rewards
    const userSettings = await prisma.settings.findUnique({
      where: { userId }
    });
    const xpReward = userSettings ? userSettings.xpRewardJS : 40;

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update this topic status to completed
      const updatedProgress = await tx.userJavaScriptProgress.update({
        where: {
          userId_topicId: {
            userId,
            topicId: topic.id
          }
        },
        data: {
          status: 'completed',
          completionDate: now,
          confidenceRating: confidenceRating ? parseInt(confidenceRating) : undefined
        }
      });

      // 2. Unlock the NEXT topic (orderNumber = currentOrderNumber + 1)
      let nextTopicUnlocked = null;
      const nextTopic = await tx.javaScriptTopic.findFirst({
        where: { orderNumber: topic.orderNumber + 1 }
      });

      if (nextTopic) {
        nextTopicUnlocked = await tx.userJavaScriptProgress.upsert({
          where: {
            userId_topicId: {
              userId,
              topicId: nextTopic.id
            }
          },
          update: { status: 'unlocked' },
          create: {
            userId,
            topicId: nextTopic.id,
            status: 'unlocked'
          }
        });
      }

      // 3. Award XP
      const userBefore = await tx.user.findUnique({ where: { id: userId } });
      const newXp = userBefore.xp + xpReward;
      const newLevel = xpUtil.calculateLevel(newXp);

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          xp: newXp,
          level: newLevel
        }
      });

      // Check if user leveled up
      if (newLevel > userBefore.level) {
        await tx.notification.create({
          data: {
            userId,
            title: 'Level Up!',
            message: `Awesome job! You reached Level ${newLevel}! Keep going!`,
            type: 'level_up',
            scheduledTime: now
          }
        });
      }

      // 4. Update today's DailyTask: mark jsCompleted = true
      const todayStr = now.toISOString().split('T')[0];
      const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);

      const dailyTask = await tx.dailyTask.findUnique({
        where: { userId_date: { userId, date: startOfDay } }
      });

      if (dailyTask) {
        await tx.dailyTask.update({
          where: { id: dailyTask.id },
          data: {
            jsCompleted: true,
            jsTime: now,
            xpEarned: { increment: xpReward }
          }
        });
      } else {
        await tx.dailyTask.create({
          data: {
            userId,
            date: startOfDay,
            jsCompleted: true,
            jsTime: now,
            xpEarned: xpReward
          }
        });
      }

      // 5. Schedule Spaced Repetition Revisions
      // Intervals: 1, 3, 7, 15, 30 days
      const intervals = [1, 3, 7, 15, 30];
      for (const days of intervals) {
        const dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + days);

        await tx.revisionSchedule.create({
          data: {
            userId,
            topicId: topic.id,
            topicTitle: topic.title,
            topicCategory: topic.category,
            intervalDays: days,
            dueDate
          }
        });
      }

      return { updatedUser, nextTopicUnlocked };
    });

    // Run achievements check outside transaction to avoid locks
    const newAchievements = await achievementUtil.checkAndUnlockAchievements(userId, prisma);

    // Fetch user final state
    const finalUser = await prisma.user.findUnique({ where: { id: userId } });

    return res.status(200).json({
      message: 'Topic completed successfully, next topic unlocked!',
      xpEarned: xpReward,
      user: {
        xp: finalUser.xp,
        level: finalUser.level,
        currentStreak: finalUser.currentStreak,
        longestStreak: finalUser.longestStreak
      },
      newAchievements
    });

  } catch (error) {
    console.error('updateTopicStatus Error:', error);
    return res.status(500).json({ error: 'Server error updating topic status.' });
  }
};

exports.getRevisions = async (req, res) => {
  try {
    const userId = req.userId;
    const now = new Date();

    const revisions = await prisma.revisionSchedule.findMany({
      where: { userId },
      orderBy: { dueDate: 'asc' }
    });

    const dueRevisions = revisions.filter(r => r.status === 'pending' && r.dueDate <= now);
    const upcomingRevisions = revisions.filter(r => r.status === 'pending' && r.dueDate > now);
    const completedRevisions = revisions.filter(r => r.status === 'completed');

    return res.status(200).json({
      due: dueRevisions,
      upcoming: upcomingRevisions,
      completed: completedRevisions
    });
  } catch (error) {
    console.error('getRevisions Error:', error);
    return res.status(500).json({ error: 'Server error fetching revisions.' });
  }
};

exports.completeRevision = async (req, res) => {
  try {
    const userId = req.userId;
    const { revisionId } = req.body;

    if (!revisionId) {
      return res.status(400).json({ error: 'Revision ID is required.' });
    }

    const revision = await prisma.revisionSchedule.findUnique({
      where: { id: parseInt(revisionId) }
    });

    if (!revision || revision.userId !== userId) {
      return res.status(404).json({ error: 'Revision schedule not found.' });
    }

    if (revision.status === 'completed') {
      return res.status(400).json({ error: 'Revision already completed.' });
    }

    const userSettings = await prisma.settings.findUnique({
      where: { userId }
    });
    const xpReward = userSettings ? userSettings.xpRewardRevision : 20;

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark revision completed
      await tx.revisionSchedule.update({
        where: { id: revision.id },
        data: {
          status: 'completed',
          completedDate: now
        }
      });

      // 2. Award XP
      const user = await tx.user.findUnique({ where: { id: userId } });
      const newXp = user.xp + xpReward;
      const newLevel = xpUtil.calculateLevel(newXp);

      await tx.user.update({
        where: { id: userId },
        data: {
          xp: newXp,
          level: newLevel
        }
      });

      // Level up check
      if (newLevel > user.level) {
        await tx.notification.create({
          data: {
            userId,
            title: 'Level Up!',
            message: `Awesome job! You reached Level ${newLevel}! Keep going!`,
            type: 'level_up',
            scheduledTime: now
          }
        });
      }

      // Add to today's daily task XP
      const todayStr = now.toISOString().split('T')[0];
      const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);

      const dailyTask = await tx.dailyTask.findUnique({
        where: { userId_date: { userId, date: startOfDay } }
      });

      if (dailyTask) {
        await tx.dailyTask.update({
          where: { id: dailyTask.id },
          data: {
            xpEarned: { increment: xpReward }
          }
        });
      }

      return { newXp, newLevel };
    });

    // Check achievements
    const newAchievements = await achievementUtil.checkAndUnlockAchievements(userId, prisma);

    return res.status(200).json({
      message: 'Revision marked as completed!',
      xpEarned: xpReward,
      user: {
        xp: result.newXp,
        level: result.newLevel
      },
      newAchievements
    });

  } catch (error) {
    console.error('completeRevision Error:', error);
    return res.status(500).json({ error: 'Server error completing revision.' });
  }
};
