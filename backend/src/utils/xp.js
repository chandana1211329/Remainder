/**
 * Calculates user level based on total XP
 * Formula: level = floor(sqrt(xp / 100)) + 1
 * 
 * XP requirements per level:
 * Level 1: 0 - 99 XP
 * Level 2: 100 - 399 XP
 * Level 3: 400 - 899 XP
 * Level 4: 900 - 1599 XP
 * Level 5: 1600+ XP
 */
function calculateLevel(xp) {
  if (!xp || xp < 0) return 1;
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/**
 * Returns the total XP required to reach a specific level
 */
function xpForLevel(level) {
  if (level <= 1) return 0;
  return Math.pow(level - 1, 2) * 100;
}

/**
 * Returns the XP progress percentage and values for the current level
 */
function getLevelProgress(xp) {
  const currentLevel = calculateLevel(xp);
  const xpForCurrent = xpForLevel(currentLevel);
  const xpForNext = xpForLevel(currentLevel + 1);
  
  const levelXpEarned = xp - xpForCurrent;
  const levelXpRequired = xpForNext - xpForCurrent;
  const progressPercent = Math.min(100, Math.max(0, Math.floor((levelXpEarned / levelXpRequired) * 100)));

  return {
    level: currentLevel,
    currentXp: xp,
    levelXpEarned,
    levelXpRequired,
    progressPercent
  };
}

module.exports = {
  calculateLevel,
  xpForLevel,
  getLevelProgress
};
