const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to reset user progress
const resetUserProgressData = async (userId, tx) => {
  // Reset user stats
  await tx.user.update({
    where: { id: userId },
    data: {
      xp: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0
    }
  });

  // Delete dependent progress rows
  await tx.userJavaScriptProgress.deleteMany({ where: { userId } });
  await tx.userDSAProgress.deleteMany({ where: { userId } });
  await tx.userAssignment.deleteMany({ where: { userId } });
  await tx.dailyTask.deleteMany({ where: { userId } });
  await tx.revisionSchedule.deleteMany({ where: { userId } });
  await tx.userAchievement.deleteMany({ where: { userId } });
  await tx.notification.deleteMany({ where: { userId } });

  // Re-initialize JS progress (unlocking the first topic)
  const jsTopics = await tx.javaScriptTopic.findMany({ orderBy: { orderNumber: 'asc' } });
  for (const topic of jsTopics) {
    await tx.userJavaScriptProgress.create({
      data: {
        userId,
        topicId: topic.id,
        status: topic.orderNumber === 1 ? 'unlocked' : 'locked'
      }
    });
  }

  // Re-initialize DSA progress
  const dsaTopics = await tx.dSATopic.findMany();
  for (const dsa of dsaTopics) {
    await tx.userDSAProgress.create({
      data: {
        userId,
        dsaTopicId: dsa.id,
        status: 'not_started'
      }
    });
  }

  // Create welcome notification
  await tx.notification.create({
    data: {
      userId,
      title: 'Progress Reset',
      message: 'Your study and life progress has been reset to level 1. Ready for a new start?',
      type: 'alert',
      scheduledTime: new Date()
    }
  });
};

exports.resetProgress = async (req, res) => {
  try {
    const userId = req.userId;

    await prisma.$transaction(async (tx) => {
      await resetUserProgressData(userId, tx);
    });

    return res.status(200).json({ message: 'Progress reset successfully!' });
  } catch (error) {
    console.error('resetProgress Error:', error);
    return res.status(500).json({ error: 'Server error resetting progress.' });
  }
};

exports.backupDatabase = async (req, res) => {
  try {
    const userId = req.userId;

    const backup = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { xp: true, level: true, currentStreak: true, longestStreak: true }
      });
      const settings = await tx.settings.findUnique({ where: { userId } });
      const jsProgress = await tx.userJavaScriptProgress.findMany({ where: { userId } });
      const dsaProgress = await tx.userDSAProgress.findMany({ where: { userId } });
      const assignments = await tx.userAssignment.findMany({ where: { userId } });
      const dailyTasks = await tx.dailyTask.findMany({ where: { userId } });
      const revisions = await tx.revisionSchedule.findMany({ where: { userId } });
      const achievements = await tx.userAchievement.findMany({ where: { userId } });
      const notifications = await tx.notification.findMany({ where: { userId } });

      return {
        userId,
        backupDate: new Date(),
        user,
        settings,
        jsProgress,
        dsaProgress,
        assignments,
        dailyTasks,
        revisions,
        achievements,
        notifications
      };
    });

    return res.status(200).json(backup);
  } catch (error) {
    console.error('backupDatabase Error:', error);
    return res.status(500).json({ error: 'Server error creating database backup.' });
  }
};

exports.restoreDatabase = async (req, res) => {
  try {
    const userId = req.userId;
    const { backup } = req.body;

    if (!backup) {
      return res.status(400).json({ error: 'Backup payload is required.' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Reset user progress
      await tx.user.update({
        where: { id: userId },
        data: {
          xp: backup.user.xp,
          level: backup.user.level,
          currentStreak: backup.user.currentStreak,
          longestStreak: backup.user.longestStreak
        }
      });

      // Clear existing records
      await tx.userJavaScriptProgress.deleteMany({ where: { userId } });
      await tx.userDSAProgress.deleteMany({ where: { userId } });
      await tx.userAssignment.deleteMany({ where: { userId } });
      await tx.dailyTask.deleteMany({ where: { userId } });
      await tx.revisionSchedule.deleteMany({ where: { userId } });
      await tx.userAchievement.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { userId } });

      // 2. Restore settings if they exist
      if (backup.settings) {
        const { id, userId: sUserId, ...settingsFields } = backup.settings;
        await tx.settings.upsert({
          where: { userId },
          update: settingsFields,
          create: { userId, ...settingsFields }
        });
      }

      // 3. Restore JS Progress
      for (const jp of backup.jsProgress) {
        await tx.userJavaScriptProgress.create({
          data: {
            userId,
            topicId: jp.topicId,
            status: jp.status,
            completionDate: jp.completionDate ? new Date(jp.completionDate) : null,
            confidenceRating: jp.confidenceRating,
            notes: jp.notes
          }
        });
      }

      // 4. Restore DSA Progress
      for (const dp of backup.dsaProgress) {
        await tx.userDSAProgress.create({
          data: {
            userId,
            dsaTopicId: dp.dsaTopicId,
            problemsSolved: dp.problemsSolved,
            easyCount: dp.easyCount,
            mediumCount: dp.mediumCount,
            hardCount: dp.hardCount,
            status: dp.status,
            notes: dp.notes
          }
        });
      }

      // 5. Restore Assignments
      for (const ua of backup.assignments) {
        await tx.userAssignment.create({
          data: {
            userId,
            assignmentId: ua.assignmentId,
            status: ua.status,
            completionDate: ua.completionDate ? new Date(ua.completionDate) : null,
            notes: ua.notes
          }
        });
      }

      // 6. Restore DailyTasks
      for (const dt of backup.dailyTasks) {
        await tx.dailyTask.create({
          data: {
            userId,
            date: new Date(dt.date),
            jsCompleted: dt.jsCompleted,
            dsaCompleted: dt.dsaCompleted,
            assignmentCompleted: dt.assignmentCompleted,
            morningExCompleted: dt.morningExCompleted,
            eveningExCompleted: dt.eveningExCompleted,
            sleepCompleted: dt.sleepCompleted,
            breakfastCompleted: dt.breakfastCompleted,
            lunchCompleted: dt.lunchCompleted,
            dinnerCompleted: dt.dinnerCompleted,
            waterIntakeML: dt.waterIntakeML,
            meditationMin: dt.meditationMin,
            readingMin: dt.readingMin,
            jsTime: dt.jsTime ? new Date(dt.jsTime) : null,
            dsaTime: dt.dsaTime ? new Date(dt.dsaTime) : null,
            assignmentTime: dt.assignmentTime ? new Date(dt.assignmentTime) : null,
            morningExTime: dt.morningExTime ? new Date(dt.morningExTime) : null,
            eveningExTime: dt.eveningExTime ? new Date(dt.eveningExTime) : null,
            sleepTime: dt.sleepTime ? new Date(dt.sleepTime) : null,
            breakfastTime: dt.breakfastTime ? new Date(dt.breakfastTime) : null,
            lunchTime: dt.lunchTime ? new Date(dt.lunchTime) : null,
            dinnerTime: dt.dinnerTime ? new Date(dt.dinnerTime) : null,
            notes: dt.notes,
            mood: dt.mood,
            xpEarned: dt.xpEarned
          }
        });
      }

      // 7. Restore Revisions
      for (const rev of backup.revisions) {
        await tx.revisionSchedule.create({
          data: {
            userId,
            topicId: rev.topicId,
            topicTitle: rev.topicTitle,
            topicCategory: rev.topicCategory,
            intervalDays: rev.intervalDays,
            dueDate: new Date(rev.dueDate),
            completedDate: rev.completedDate ? new Date(rev.completedDate) : null,
            status: rev.status
          }
        });
      }

      // 8. Restore Achievements
      for (const ach of backup.achievements) {
        await tx.userAchievement.create({
          data: {
            userId,
            achievementId: ach.achievementId,
            unlockedAt: new Date(ach.unlockedAt)
          }
        });
      }

      // 9. Restore Notifications
      for (const notif of backup.notifications) {
        await tx.notification.create({
          data: {
            userId,
            title: notif.title,
            message: notif.message,
            type: notif.type,
            read: notif.read,
            scheduledTime: new Date(notif.scheduledTime),
            createdAt: new Date(notif.createdAt)
          }
        });
      }
    });

    return res.status(200).json({ message: 'Backup restored successfully!' });
  } catch (error) {
    console.error('restoreDatabase Error:', error);
    return res.status(500).json({ error: 'Server error restoring database.' });
  }
};

// Admin custom imports
exports.importJSRoadmap = async (req, res) => {
  try {
    const { topics } = req.body; // Expect array of topics
    if (!topics || !Array.isArray(topics)) {
      return res.status(400).json({ error: 'Payload must contain a topics array.' });
    }

    for (const t of topics) {
      await prisma.javaScriptTopic.upsert({
        where: { title: t.title },
        update: {
          category: t.category,
          description: t.description,
          estimatedTime: parseInt(t.estimatedTime),
          difficulty: t.difficulty,
          orderNumber: parseInt(t.orderNumber),
          practiceQuestions: JSON.stringify(t.practiceQuestions || []),
          interviewQuestions: JSON.stringify(t.interviewQuestions || []),
          relatedProject: t.relatedProject || ''
        },
        create: {
          category: t.category,
          title: t.title,
          description: t.description,
          estimatedTime: parseInt(t.estimatedTime),
          difficulty: t.difficulty,
          orderNumber: parseInt(t.orderNumber),
          practiceQuestions: JSON.stringify(t.practiceQuestions || []),
          interviewQuestions: JSON.stringify(t.interviewQuestions || []),
          relatedProject: t.relatedProject || ''
        }
      });
    }

    return res.status(200).json({ message: 'JavaScript roadmap topics imported/updated successfully!' });
  } catch (error) {
    console.error('importJSRoadmap Error:', error);
    return res.status(500).json({ error: 'Server error importing JS roadmap.' });
  }
};

exports.importDSATopics = async (req, res) => {
  try {
    const { dsaTopics } = req.body;
    if (!dsaTopics || !Array.isArray(dsaTopics)) {
      return res.status(400).json({ error: 'Payload must contain a dsaTopics array.' });
    }

    for (const t of dsaTopics) {
      await prisma.dSATopic.upsert({
        where: {
          category_difficulty: {
            category: t.category,
            difficulty: t.difficulty
          }
        },
        update: {},
        create: {
          category: t.category,
          difficulty: t.difficulty,
          problemsCount: 0
        }
      });
    }

    return res.status(200).json({ message: 'DSA topics imported successfully!' });
  } catch (error) {
    console.error('importDSATopics Error:', error);
    return res.status(500).json({ error: 'Server error importing DSA topics.' });
  }
};

exports.importAssignments = async (req, res) => {
  try {
    const { assignments } = req.body;
    if (!assignments || !Array.isArray(assignments)) {
      return res.status(400).json({ error: 'Payload must contain an assignments array.' });
    }

    const createdAssignments = [];
    for (const a of assignments) {
      const assignment = await prisma.assignment.create({
        data: {
          name: a.name,
          description: a.description,
          deadline: new Date(a.deadline)
        }
      });

      // Link assignment to all users
      const users = await prisma.user.findMany({ select: { id: true } });
      for (const u of users) {
        await prisma.userAssignment.create({
          data: {
            userId: u.id,
            assignmentId: assignment.id,
            status: 'pending'
          }
        });
      }
      createdAssignments.push(assignment);
    }

    return res.status(200).json({
      message: 'Assignments imported and assigned successfully!',
      assignments: createdAssignments
    });
  } catch (error) {
    console.error('importAssignments Error:', error);
    return res.status(500).json({ error: 'Server error importing assignments.' });
  }
};
