const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.saveNotes = async (req, res) => {
  try {
    const userId = req.userId;
    const { type, id, notes } = req.body; // type: 'javascript' or 'dsa', id: topicId or dsaTopicId, notes: string

    if (!type || !id || notes === undefined) {
      return res.status(400).json({ error: 'Type, ID and notes content are required.' });
    }

    if (type === 'javascript') {
      const progress = await prisma.userJavaScriptProgress.findUnique({
        where: {
          userId_topicId: {
            userId,
            topicId: parseInt(id)
          }
        }
      });

      if (!progress) {
        return res.status(404).json({ error: 'JavaScript topic progress not found.' });
      }

      await prisma.userJavaScriptProgress.update({
        where: { id: progress.id },
        data: { notes }
      });
    } else if (type === 'dsa') {
      const progress = await prisma.userDSAProgress.findUnique({
        where: {
          userId_dsaTopicId: {
            userId,
            dsaTopicId: parseInt(id)
          }
        }
      });

      if (!progress) {
        return res.status(404).json({ error: 'DSA topic progress not found.' });
      }

      await prisma.userDSAProgress.update({
        where: { id: progress.id },
        data: { notes }
      });
    } else {
      return res.status(400).json({ error: 'Invalid type. Must be javascript or dsa.' });
    }

    return res.status(200).json({ message: 'Notes saved successfully!' });
  } catch (error) {
    console.error('saveNotes Error:', error);
    return res.status(500).json({ error: 'Server error saving notes.' });
  }
};

exports.searchNotes = async (req, res) => {
  try {
    const userId = req.userId;
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required.' });
    }

    // 1. Search JavaScript notes
    const jsNotes = await prisma.userJavaScriptProgress.findMany({
      where: {
        userId,
        notes: { contains: query }
      },
      include: {
        topic: true
      }
    });

    // 2. Search DSA notes
    const dsaNotes = await prisma.userDSAProgress.findMany({
      where: {
        userId,
        notes: { contains: query }
      },
      include: {
        dsaTopic: true
      }
    });

    const results = [
      ...jsNotes.map(n => ({
        type: 'javascript',
        title: n.topic.title,
        category: n.topic.category,
        id: n.topicId,
        notes: n.notes,
        updatedAt: n.updatedAt
      })),
      ...dsaNotes.map(n => ({
        type: 'dsa',
        title: `${n.dsaTopic.category} (${n.dsaTopic.difficulty})`,
        category: n.dsaTopic.category,
        id: n.dsaTopicId,
        notes: n.notes,
        updatedAt: n.updatedAt
      }))
    ];

    return res.status(200).json(results);
  } catch (error) {
    console.error('searchNotes Error:', error);
    return res.status(500).json({ error: 'Server error searching notes.' });
  }
};
