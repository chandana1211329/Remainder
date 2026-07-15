const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const xpUtil = require('../utils/xp');
const achievementUtil = require('../utils/achievements');

exports.getDSATopics = async (req, res) => {
  try {
    const userId = req.userId;

    const dsaProgress = await prisma.userDSAProgress.findMany({
      where: { userId },
      include: {
        dsaTopic: true
      },
      orderBy: {
        dsaTopicId: 'asc'
      }
    });

    const formattedDSA = dsaProgress.map(progress => {
      // Set target problems to calculate completion percentage
      // Target: Easy=10, Medium=10, Hard=5, or general total of 15
      const targetCount = progress.dsaTopic.difficulty === 'Easy' ? 10 
                        : progress.dsaTopic.difficulty === 'Medium' ? 10 
                        : 5;
      
      const completionPercentage = Math.min(100, Math.round((progress.problemsSolved / targetCount) * 100));

      return {
        id: progress.id,
        topicId: progress.dsaTopicId,
        category: progress.dsaTopic.category,
        difficulty: progress.dsaTopic.difficulty,
        problemsSolved: progress.problemsSolved,
        easyCount: progress.easyCount,
        mediumCount: progress.mediumCount,
        hardCount: progress.hardCount,
        status: progress.status,
        notes: progress.notes,
        targetCount,
        completionPercentage
      };
    });

    return res.status(200).json(formattedDSA);
  } catch (error) {
    console.error('getDSATopics Error:', error);
    return res.status(500).json({ error: 'Server error fetching DSA progress.' });
  }
};

exports.updateDSAProgress = async (req, res) => {
  try {
    const userId = req.userId;
    const { dsaTopicId, easyCount, mediumCount, hardCount, notes, status } = req.body;

    if (!dsaTopicId) {
      return res.status(400).json({ error: 'DSA Topic ID is required.' });
    }

    const currentProgress = await prisma.userDSAProgress.findUnique({
      where: {
        userId_dsaTopicId: {
          userId,
          dsaTopicId: parseInt(dsaTopicId)
        }
      },
      include: {
        dsaTopic: true
      }
    });

    if (!currentProgress) {
      return res.status(404).json({ error: 'DSA Topic progress record not found.' });
    }

    const updatedEasy = easyCount !== undefined ? parseInt(easyCount) : currentProgress.easyCount;
    const updatedMedium = mediumCount !== undefined ? parseInt(mediumCount) : currentProgress.mediumCount;
    const updatedHard = hardCount !== undefined ? parseInt(hardCount) : currentProgress.hardCount;
    const problemsSolved = updatedEasy + updatedMedium + updatedHard;

    // Automatically set status based on count and input
    let newStatus = status || currentProgress.status;
    if (problemsSolved > 0 && newStatus === 'not_started') {
      newStatus = 'in_progress';
    }

    // Determine target based on difficulty
    const target = currentProgress.dsaTopic.difficulty === 'Easy' ? 10 
                 : currentProgress.dsaTopic.difficulty === 'Medium' ? 10 
                 : 5;

    // If status is updated to completed, or target is met, mark completed
    if (problemsSolved >= target && newStatus !== 'completed') {
      newStatus = 'completed';
    }

    // Check if user is completing the module just now to award XP
    const wasCompleted = currentProgress.status === 'completed';
    const isNowCompleted = newStatus === 'completed';
    
    // Fetch XP Settings
    const userSettings = await prisma.settings.findUnique({ where: { userId } });
    const xpReward = userSettings ? userSettings.xpRewardDSA : 30;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update progress
      const updated = await tx.userDSAProgress.update({
        where: {
          userId_dsaTopicId: {
            userId,
            dsaTopicId: currentProgress.dsaTopicId
          }
        },
        data: {
          easyCount: updatedEasy,
          mediumCount: updatedMedium,
          hardCount: updatedHard,
          problemsSolved,
          notes: notes !== undefined ? notes : currentProgress.notes,
          status: newStatus
        }
      });

      let xpAwarded = 0;
      let newXpVal = null;
      let newLevelVal = null;

      // 2. Award XP if this is a new completion
      if (!wasCompleted && isNowCompleted) {
        xpAwarded = xpReward;
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
              scheduledTime: new Date()
            }
          });
        }

        // Add to daily task completions: mark dsaCompleted = true
        const todayStr = new Date().toISOString().split('T')[0];
        const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);

        const dailyTask = await tx.dailyTask.findUnique({
          where: { userId_date: { userId, date: startOfDay } }
        });

        if (dailyTask) {
          await tx.dailyTask.update({
            where: { id: dailyTask.id },
            data: {
              dsaCompleted: true,
              dsaTime: new Date(),
              xpEarned: { increment: xpReward }
            }
          });
        } else {
          await tx.dailyTask.create({
            data: {
              userId,
              date: startOfDay,
              dsaCompleted: true,
              dsaTime: new Date(),
              xpEarned: xpReward
            }
          });
        }
      }

      return { updated, xpAwarded };
    });

    // Check achievements
    const newAchievements = await achievementUtil.checkAndUnlockAchievements(userId, prisma);
    const finalUser = await prisma.user.findUnique({ where: { id: userId } });

    return res.status(200).json({
      message: 'DSA progress updated successfully!',
      xpEarned: result.xpAwarded,
      user: {
        xp: finalUser.xp,
        level: finalUser.level,
        currentStreak: finalUser.currentStreak,
        longestStreak: finalUser.longestStreak
      },
      newAchievements
    });

  } catch (error) {
    console.error('updateDSAProgress Error:', error);
    return res.status(500).json({ error: 'Server error updating DSA progress.' });
  }
};
