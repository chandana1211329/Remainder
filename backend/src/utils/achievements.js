const xpUtil = require('./xp');

async function checkAndUnlockAchievements(userId, prisma) {
  // 1. Fetch user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      achievements: {
        include: { achievement: true }
      }
    }
  });

  if (!user) return [];

  // Get codes of achievements already unlocked
  const unlockedCodes = new Set(user.achievements.map(ua => ua.achievement.code));

  // 2. Fetch all system achievements
  const allAchievements = await prisma.achievement.findMany();
  const newlyUnlocked = [];

  // 3. Gather stats for verification
  // A. JavaScript completions
  const jsProgress = await prisma.userJavaScriptProgress.findMany({
    where: { userId, status: 'completed' },
    include: { topic: true }
  });

  const completedCategories = {};
  jsProgress.forEach(jp => {
    const cat = jp.topic.category;
    if (!completedCategories[cat]) completedCategories[cat] = 0;
    completedCategories[cat]++;
  });

  // Fetch total topics per category to verify completion
  const topicsGrouped = await prisma.javaScriptTopic.groupBy({
    by: ['category'],
    _count: { id: true }
  });
  
  const categoryTotalCounts = {};
  topicsGrouped.forEach(g => {
    categoryTotalCounts[g.category] = g._count.id;
  });

  const isCategoryComplete = (catName) => {
    const total = categoryTotalCounts[catName] || 0;
    const completed = completedCategories[catName] || 0;
    return total > 0 && completed === total;
  };

  // B. DSA problems solved
  const dsaProgress = await prisma.userDSAProgress.aggregate({
    where: { userId },
    _sum: {
      problemsSolved: true
    }
  });
  const totalDsaSolved = dsaProgress._sum.problemsSolved || 0;

  // C. Assignments completed
  const completedAssignmentsCount = await prisma.userAssignment.count({
    where: { userId, status: 'completed' }
  });

  // Helper to unlock an achievement
  const unlock = async (code) => {
    if (unlockedCodes.has(code)) return;

    const achievement = allAchievements.find(a => a.code === code);
    if (!achievement) return;

    // Create UserAchievement
    await prisma.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id
      }
    });

    // Award XP to user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        xp: { increment: achievement.xpValue }
      }
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        title: 'Achievement Unlocked!',
        message: `Congrats! You earned the achievement: "${achievement.title}" and gained +${achievement.xpValue} XP.`,
        type: 'achievement',
        scheduledTime: new Date()
      }
    });

    newlyUnlocked.push(achievement);
  };

  // 4. Evaluate achievement conditions
  // Streaks
  if (user.longestStreak >= 7) {
    await unlock('STREAK_7');
    await unlock('PERFECT_WEEK');
  }
  if (user.longestStreak >= 30) {
    await unlock('STREAK_30');
    await unlock('PERFECT_MONTH');
  }
  if (user.longestStreak >= 100) {
    await unlock('STREAK_100');
  }

  // JS Roadmap Categories
  if (isCategoryComplete('Basics')) {
    await unlock('JS_BASICS_COMPLETED');
  }
  if (isCategoryComplete('Functions')) {
    await unlock('JS_FUNCTIONS_COMPLETED');
  }
  if (isCategoryComplete('DOM')) {
    await unlock('JS_DOM_COMPLETED');
  }

  // DSA Solved Count
  if (totalDsaSolved >= 100) {
    await unlock('DSA_100_PROBLEMS');
  }

  // Assignments
  if (completedAssignmentsCount >= 1) {
    await unlock('FIRST_ASSIGNMENT_COMPLETED');
  }

  // If there were any newly unlocked achievements, check if the user leveled up
  if (newlyUnlocked.length > 0) {
    const finalUser = await prisma.user.findUnique({ where: { id: userId } });
    const oldLevel = user.level;
    const newLevel = xpUtil.calculateLevel(finalUser.xp);
    if (newLevel > oldLevel) {
      await prisma.user.update({
        where: { id: userId },
        data: { level: newLevel }
      });
      // Create level up notification
      await prisma.notification.create({
        data: {
          userId,
          title: 'Level Up!',
          message: `Awesome job! You reached Level ${newLevel}! Keep going!`,
          type: 'level_up',
          scheduledTime: new Date()
        }
      });
    }
  }

  return newlyUnlocked;
}

module.exports = {
  checkAndUnlockAchievements
};
