const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const xpUtil = require('../utils/xp');
const streakUtil = require('../utils/streak');
const achievementUtil = require('../utils/achievements');
const { healDailyTask } = require('../utils/dailyHealer');

exports.getDailyTask = async (req, res) => {
  try {
    const userId = req.userId;
    const { date } = req.query; // Expect YYYY-MM-DD

    let targetDate;
    if (date) {
      targetDate = new Date(`${date}T00:00:00.000Z`);
    } else {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      targetDate = new Date(`${dateStr}T00:00:00.000Z`);
    }

    let dailyTask = await prisma.dailyTask.findUnique({
      where: {
        userId_date: {
          userId,
          date: targetDate
        }
      }
    });

    if (!dailyTask) {
      dailyTask = await prisma.dailyTask.create({
        data: {
          userId,
          date: targetDate
        }
      });
    }

    dailyTask = await healDailyTask(userId, dailyTask, prisma);

    return res.status(200).json(dailyTask);
  } catch (error) {
    console.error('getDailyTask Error:', error);
    return res.status(500).json({ error: 'Server error loading daily task.' });
  }
};

exports.updateDailyTask = async (req, res) => {
  try {
    const userId = req.userId;
    const {
      date, // YYYY-MM-DD
      field, // jsCompleted, dsaCompleted, assignmentCompleted, morningExCompleted, eveningExCompleted, sleepCompleted, breakfastCompleted, lunchCompleted, dinnerCompleted, etc.
      completed, // boolean
      notes,
      mood,
      waterIntakeML,
      meditationMin,
      readingMin
    } = req.body;

    if (!date || !field) {
      return res.status(400).json({ error: 'Date and field are required.' });
    }

    const targetDate = new Date(`${date}T00:00:00.000Z`);

    // Fetch existing daily task
    let dailyTask = await prisma.dailyTask.findUnique({
      where: {
        userId_date: {
          userId,
          date: targetDate
        }
      }
    });

    if (!dailyTask) {
      dailyTask = await prisma.dailyTask.create({
        data: {
          userId,
          date: targetDate
        }
      });
    }

    dailyTask = await healDailyTask(userId, dailyTask, prisma);

    // Fetch user settings for XP rewards
    const userSettings = await prisma.settings.findUnique({ where: { userId } });
    const xpRewards = {
      jsCompleted: userSettings ? userSettings.xpRewardJS : 40,
      dsaCompleted: userSettings ? userSettings.xpRewardDSA : 30,
      assignmentCompleted: userSettings ? userSettings.xpRewardAssignment : 30,
      morningExCompleted: userSettings ? userSettings.xpRewardExercise : 15,
      eveningExCompleted: userSettings ? userSettings.xpRewardExercise : 15,
      sleepCompleted: userSettings ? userSettings.xpRewardSleep : 20,
      breakfastCompleted: 5,
      lunchCompleted: 5,
      dinnerCompleted: 5
    };

    const isRoutineCompletedField = [
      'morningExCompleted', 'eveningExCompleted', 'sleepCompleted',
      'breakfastCompleted', 'lunchCompleted', 'dinnerCompleted'
    ].includes(field);

    const now = new Date();
    let xpAwarded = 0;
    let details = {};

    const updatedTask = await prisma.$transaction(async (tx) => {
      const updateData = {};
      
      // Handle completion time and XP
      if (completed) {
        updateData[field] = true;
        updateData[field.replace('Completed', 'Time')] = now;
        
        // Award XP if it wasn't already completed
        if (!dailyTask[field]) {
          xpAwarded = xpRewards[field] || 0;
          updateData.xpEarned = dailyTask.xpEarned + xpAwarded;
        }
      } else {
        updateData[field] = false;
        updateData[field.replace('Completed', 'Time')] = null;
        
        // Deduct XP if it was completed
        if (dailyTask[field]) {
          xpAwarded = -(xpRewards[field] || 0);
          updateData.xpEarned = Math.max(0, dailyTask.xpEarned + xpAwarded);
        }
      }

      // Handle extra fields if provided
      if (notes !== undefined) updateData.notes = notes;
      if (mood !== undefined) updateData.mood = mood;
      if (waterIntakeML !== undefined) updateData.waterIntakeML = parseInt(waterIntakeML);
      if (meditationMin !== undefined) updateData.meditationMin = parseInt(meditationMin);
      if (readingMin !== undefined) updateData.readingMin = parseInt(readingMin);

      // Perform updates for actual JS, DSA, or Assignments if checked from dashboard
      if (completed && !dailyTask[field]) {
        if (field === 'jsCompleted') {
          // Complete the active unlocked JS topic
          const activeTopic = await tx.userJavaScriptProgress.findFirst({
            where: { userId, status: 'unlocked' },
            include: { topic: true },
            orderBy: { topic: { orderNumber: 'asc' } }
          });
          if (activeTopic) {
            await tx.userJavaScriptProgress.update({
              where: { id: activeTopic.id },
              data: { status: 'completed', completionDate: now }
            });
            // Unlock next
            const nextTopic = await tx.javaScriptTopic.findFirst({
              where: { orderNumber: activeTopic.topic.orderNumber + 1 }
            });
            if (nextTopic) {
              await tx.userJavaScriptProgress.upsert({
                where: { userId_topicId: { userId, topicId: nextTopic.id } },
                update: { status: 'unlocked' },
                create: { userId, topicId: nextTopic.id, status: 'unlocked' }
              });
            }
            // Schedule revisions
            const intervals = [1, 3, 7, 15, 30];
            for (const days of intervals) {
              const dueDate = new Date(now);
              dueDate.setDate(dueDate.getDate() + days);
              await tx.revisionSchedule.create({
                data: {
                  userId,
                  topicId: activeTopic.topicId,
                  topicTitle: activeTopic.topic.title,
                  topicCategory: activeTopic.topic.category,
                  intervalDays: days,
                  dueDate
                }
              });
            }
            details.jsTopicCompleted = activeTopic.topic.title;
          }
        } else if (field === 'dsaCompleted') {
          // Increment progress on active DSA topic
          let activeDsa = await tx.userDSAProgress.findFirst({
            where: { userId, status: 'in_progress' },
            include: { dsaTopic: true }
          });
          if (!activeDsa) {
            activeDsa = await tx.userDSAProgress.findFirst({
              where: { userId, status: 'not_started' },
              include: { dsaTopic: true },
              orderBy: { dsaTopicId: 'asc' }
            });
          }
          if (activeDsa) {
            const target = activeDsa.dsaTopic.difficulty === 'Easy' ? 10 
                         : activeDsa.dsaTopic.difficulty === 'Medium' ? 10 
                         : 5;
            const newSolved = activeDsa.problemsSolved + 1;
            const isCompleted = newSolved >= target;

            await tx.userDSAProgress.update({
              where: { id: activeDsa.id },
              data: {
                problemsSolved: newSolved,
                easyCount: activeDsa.dsaTopic.difficulty === 'Easy' ? activeDsa.easyCount + 1 : activeDsa.easyCount,
                mediumCount: activeDsa.dsaTopic.difficulty === 'Medium' ? activeDsa.mediumCount + 1 : activeDsa.mediumCount,
                hardCount: activeDsa.dsaTopic.difficulty === 'Hard' ? activeDsa.hardCount + 1 : activeDsa.hardCount,
                status: isCompleted ? 'completed' : 'in_progress'
              }
            });
            details.dsaTopicCompleted = `${activeDsa.dsaTopic.category} (${activeDsa.dsaTopic.difficulty})`;
          }
        } else if (field === 'assignmentCompleted') {
          // Complete active pending assignment
          const activeAssignment = await tx.userAssignment.findFirst({
            where: { userId, status: 'pending' },
            include: { assignment: true },
            orderBy: { assignment: { deadline: 'asc' } }
          });
          if (activeAssignment) {
            await tx.userAssignment.update({
              where: { id: activeAssignment.id },
              data: { status: 'completed', completionDate: now }
            });
            details.assignmentCompletedName = activeAssignment.assignment.name;
          }
        }
      }

      // Update DailyTask record
      const updated = await tx.dailyTask.update({
        where: { id: dailyTask.id },
        data: updateData
      });

      // Update User XP & Level
      if (xpAwarded !== 0) {
        const user = await tx.user.findUnique({ where: { id: userId } });
        const newXp = Math.max(0, user.xp + xpAwarded);
        const newLevel = xpUtil.calculateLevel(newXp);

        await tx.user.update({
          where: { id: userId },
          data: { xp: newXp, level: newLevel }
        });

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
      }

      return updated;
    });

    // Recalculate streaks
    await streakUtil.recalculateStreaks(userId, prisma);

    // Check achievements
    const newAchievements = await achievementUtil.checkAndUnlockAchievements(userId, prisma);

    // Fetch user final stats
    const finalUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    return res.status(200).json({
      message: 'Daily task updated successfully!',
      dailyTask: updatedTask,
      xpEarned: xpAwarded,
      user: {
        xp: finalUser.xp,
        level: finalUser.level,
        currentStreak: finalUser.currentStreak,
        longestStreak: finalUser.longestStreak
      },
      newAchievements,
      details
    });

  } catch (error) {
    console.error('updateDailyTask Error:', error);
    return res.status(500).json({ error: 'Server error updating daily task.' });
  }
};
