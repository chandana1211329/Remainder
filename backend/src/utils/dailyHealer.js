// Database auto-healing utility for DailyTask records

async function healDailyTask(userId, dailyTask, prisma) {
  if (!dailyTask) return dailyTask;

  // Check count of active unlocked JS roadmap topics
  const activeJSTopicsCount = await prisma.userJavaScriptProgress.count({
    where: { userId, status: 'unlocked' }
  });

  let needsUpdate = false;
  const updateData = {};

  // Auto-complete JS task if none are unlocked (e.g. roadmap complete or not initialized yet)
  if (activeJSTopicsCount === 0 && !dailyTask.jsCompleted) {
    updateData.jsCompleted = true;
    needsUpdate = true;
  } 
  // Revert JS task to incomplete if there are active unlocked topics
  else if (activeJSTopicsCount > 0 && dailyTask.jsCompleted && dailyTask.jsTime === null) {
    updateData.jsCompleted = false;
    needsUpdate = true;
  }

  if (needsUpdate) {
    return await prisma.dailyTask.update({
      where: { id: dailyTask.id },
      data: updateData
    });
  }

  return dailyTask;
}

module.exports = { healDailyTask };
