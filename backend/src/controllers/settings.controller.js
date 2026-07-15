const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getSettings = async (req, res) => {
  try {
    const userId = req.userId;

    let settings = await prisma.settings.findUnique({
      where: { userId }
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: { userId }
      });
    }

    return res.status(200).json(settings);
  } catch (error) {
    console.error('getSettings Error:', error);
    return res.status(500).json({ error: 'Server error loading settings.' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const userId = req.userId;
    const updateData = req.body;

    // Filter out fields that shouldn't be directly updated or are read-only
    const allowedFields = [
      'wakeupTime',
      'morningExerciseTime',
      'breakfastTime',
      'lunchTime',
      'eveningExerciseTime',
      'dinnerTime',
      'sleepTime',
      'theme',
      'accentColor',
      'notifyMorning',
      'notifyStudy',
      'notifyAssignment',
      'notifyExercise',
      'notifyDinner',
      'notifySleep',
      'notifyRevision',
      'xpRewardJS',
      'xpRewardDSA',
      'xpRewardAssignment',
      'xpRewardRevision',
      'xpRewardExercise',
      'xpRewardSleep'
    ];

    const filteredUpdate = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        // Enforce integer types for XP rewards
        if (key.startsWith('xpReward')) {
          filteredUpdate[key] = parseInt(updateData[key]);
        } else {
          filteredUpdate[key] = updateData[key];
        }
      }
    }

    let settings = await prisma.settings.findUnique({
      where: { userId }
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          userId,
          ...filteredUpdate
        }
      });
    } else {
      settings = await prisma.settings.update({
        where: { userId },
        data: filteredUpdate
      });
    }

    return res.status(200).json({
      message: 'Settings updated successfully!',
      settings
    });
  } catch (error) {
    console.error('updateSettings Error:', error);
    return res.status(500).json({ error: 'Server error updating settings.' });
  }
};
