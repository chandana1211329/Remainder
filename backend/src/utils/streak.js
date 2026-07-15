/**
 * Calculates current and longest streaks based on user daily tasks.
 * Required tasks: JS roadmap, DSA topic, Assignment, Morning Exercise, Evening Exercise, and Sleep.
 */
async function recalculateStreaks(userId, prisma) {
  // Fetch all daily tasks for the user, ordered by date descending
  const dailyTasks = await prisma.dailyTask.findMany({
    where: { userId },
    orderBy: { date: 'desc' }
  });

  if (dailyTasks.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Helper to check if a task has all required items completed
  const isPerfect = (task) => {
    return (
      task.jsCompleted &&
      task.dsaCompleted &&
      task.assignmentCompleted &&
      task.morningExCompleted &&
      task.eveningExCompleted &&
      task.sleepCompleted
    );
  };

  // Convert dates to local date strings (YYYY-MM-DD) for consistency
  const formatDateStr = (dateVal) => {
    const d = new Date(dateVal);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Build a set of perfect dates
  const perfectDates = new Set();
  const allDatesOrdered = [];

  for (const task of dailyTasks) {
    const dateStr = formatDateStr(task.date);
    allDatesOrdered.push(dateStr);
    if (isPerfect(task)) {
      perfectDates.add(dateStr);
    }
  }

  // Get current local date strings
  const todayStr = formatDateStr(new Date());
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateStr(yesterday);

  // 1. Calculate Current Streak
  let currentStreak = 0;
  let checkDate = new Date(); // Start checking from today

  // If today is not perfect, we check if today has a record. 
  // If today has a record but isn't perfect yet, we check if yesterday was perfect. 
  // If yesterday was perfect, currentStreak starts counting from yesterday (since today is still in progress).
  // If yesterday was not perfect, currentStreak is 0.
  const todayRecord = dailyTasks.find(t => formatDateStr(t.date) === todayStr);
  const todayIsPerfect = todayRecord && isPerfect(todayRecord);
  const yesterdayRecord = dailyTasks.find(t => formatDateStr(t.date) === yesterdayStr);
  const yesterdayIsPerfect = yesterdayRecord && isPerfect(yesterdayRecord);

  if (todayIsPerfect) {
    currentStreak = 1;
    // Walk backwards from yesterday
    let walkDate = new Date(yesterday);
    while (true) {
      const walkStr = formatDateStr(walkDate);
      if (perfectDates.has(walkStr)) {
        currentStreak++;
        walkDate.setDate(walkDate.getDate() - 1);
      } else {
        break;
      }
    }
  } else if (yesterdayIsPerfect) {
    currentStreak = 1;
    // Walk backwards from day before yesterday
    let walkDate = new Date(yesterday);
    walkDate.setDate(walkDate.getDate() - 1);
    while (true) {
      const walkStr = formatDateStr(walkDate);
      if (perfectDates.has(walkStr)) {
        currentStreak++;
        walkDate.setDate(walkDate.getDate() - 1);
      } else {
        break;
      }
    }
  } else {
    currentStreak = 0;
  }

  // 2. Calculate Longest Streak historically
  // Sort all unique task dates ascending
  const taskDatesSorted = dailyTasks
    .map(t => formatDateStr(t.date))
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort();

  let longestStreak = 0;
  let runningStreak = 0;
  let prevDate = null;

  for (const dateStr of taskDatesSorted) {
    if (perfectDates.has(dateStr)) {
      if (prevDate === null) {
        runningStreak = 1;
      } else {
        // Check if consecutive
        const prev = new Date(prevDate);
        const curr = new Date(dateStr);
        const diffTime = Math.abs(curr - prev);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 1) {
          runningStreak++;
        } else {
          runningStreak = 1;
        }
      }
      prevDate = dateStr;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
      prevDate = null;
    }
  }

  // Update user record with new streak counts
  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak)
    }
  });

  return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
}

module.exports = {
  recalculateStreaks
};
