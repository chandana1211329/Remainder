const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const xpUtil = require('../utils/xp');
const achievementUtil = require('../utils/achievements');

exports.getAssignments = async (req, res) => {
  try {
    const userId = req.userId;

    const assignments = await prisma.userAssignment.findMany({
      where: { userId },
      include: {
        assignment: true
      },
      orderBy: {
        assignment: {
          deadline: 'asc'
        }
      }
    });

    const formattedAssignments = assignments.map(ua => ({
      id: ua.id,
      assignmentId: ua.assignmentId,
      name: ua.assignment.name,
      description: ua.assignment.description,
      deadline: ua.assignment.deadline,
      status: ua.status,
      completionDate: ua.completionDate,
      notes: ua.notes
    }));

    const pending = formattedAssignments.filter(a => a.status === 'pending');
    const completed = formattedAssignments.filter(a => a.status === 'completed');

    return res.status(200).json({
      pending,
      completed
    });
  } catch (error) {
    console.error('getAssignments Error:', error);
    return res.status(500).json({ error: 'Server error fetching assignments.' });
  }
};

exports.updateAssignmentStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const { assignmentId, status, notes } = req.body;

    if (!assignmentId || !status) {
      return res.status(400).json({ error: 'Assignment ID and status are required.' });
    }

    const currentAssignment = await prisma.userAssignment.findUnique({
      where: {
        userId_assignmentId: {
          userId,
          assignmentId: parseInt(assignmentId)
        }
      }
    });

    if (!currentAssignment) {
      return res.status(404).json({ error: 'User assignment record not found.' });
    }

    if (currentAssignment.status === 'completed' && status === 'completed') {
      return res.status(200).json({ message: 'Assignment already completed.' });
    }

    const userSettings = await prisma.settings.findUnique({ where: { userId } });
    const xpReward = userSettings ? userSettings.xpRewardAssignment : 30;

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update user assignment status
      const updated = await tx.userAssignment.update({
        where: {
          userId_assignmentId: {
            userId,
            assignmentId: parseInt(assignmentId)
          }
        },
        data: {
          status,
          completionDate: status === 'completed' ? now : null,
          notes: notes !== undefined ? notes : undefined
        }
      });

      let xpAwarded = 0;

      // 2. Award XP if just completed
      if (status === 'completed') {
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
              scheduledTime: now
            }
          });
        }

        // Add to daily task completions: mark assignmentCompleted = true
        const todayStr = now.toISOString().split('T')[0];
        const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);

        const dailyTask = await tx.dailyTask.findUnique({
          where: { userId_date: { userId, date: startOfDay } }
        });

        if (dailyTask) {
          await tx.dailyTask.update({
            where: { id: dailyTask.id },
            data: {
              assignmentCompleted: true,
              assignmentTime: now,
              xpEarned: { increment: xpReward }
            }
          });
        } else {
          await tx.dailyTask.create({
            data: {
              userId,
              date: startOfDay,
              assignmentCompleted: true,
              assignmentTime: now,
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
      message: 'Assignment status updated successfully!',
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
    console.error('updateAssignmentStatus Error:', error);
    return res.status(500).json({ error: 'Server error updating assignment status.' });
  }
};
