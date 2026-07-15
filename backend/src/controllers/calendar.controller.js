const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getCalendarData = async (req, res) => {
  try {
    const userId = req.userId;
    const { year, month } = req.query; // e.g. year=2026, month=7

    if (!year || !month) {
      return res.status(400).json({ error: 'Year and month are required parameters.' });
    }

    const y = parseInt(year);
    const m = parseInt(month); // 1-indexed

    // Calculate dates
    const startDate = new Date(Date.UTC(y, m - 1, 1));
    const endDate = new Date(Date.UTC(y, m, 1)); // first day of next month

    const dailyTasks = await prisma.dailyTask.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lt: endDate
        }
      },
      orderBy: { date: 'asc' }
    });

    // Also fetch custom data for tooltips/modal detailed day views
    // We map them so the client receives a normalized view
    const formattedData = dailyTasks.map(task => {
      const isPerfect =
        task.jsCompleted &&
        task.dsaCompleted &&
        task.assignmentCompleted &&
        task.morningExCompleted &&
        task.eveningExCompleted &&
        task.sleepCompleted;

      return {
        id: task.id,
        date: task.date.toISOString().split('T')[0], // YYYY-MM-DD
        jsCompleted: task.jsCompleted,
        dsaCompleted: task.dsaCompleted,
        assignmentCompleted: task.assignmentCompleted,
        morningExCompleted: task.morningExCompleted,
        eveningExCompleted: task.eveningExCompleted,
        sleepCompleted: task.sleepCompleted,
        breakfastCompleted: task.breakfastCompleted,
        lunchCompleted: task.lunchCompleted,
        dinnerCompleted: task.dinnerCompleted,
        waterIntakeML: task.waterIntakeML,
        meditationMin: task.meditationMin,
        readingMin: task.readingMin,
        xpEarned: task.xpEarned,
        mood: task.mood,
        notes: task.notes,
        isPerfect
      };
    });

    return res.status(200).json(formattedData);
  } catch (error) {
    console.error('getCalendarData Error:', error);
    return res.status(500).json({ error: 'Server error fetching calendar history.' });
  }
};
