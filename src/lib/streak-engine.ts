export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalCheckins: number;
  consistency: number; // percentage of days with check-ins in last 30 days
  milestoneReached: number | null; // 3, 7, 14, 30, 60, 90
  nextMilestone: number;
  daysToNext: number;
}

export function calculateStreakInfo(checkins: { checkin_date: string }[]): StreakInfo {
  if (checkins.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCheckins: 0,
      consistency: 0,
      milestoneReached: null,
      nextMilestone: 3,
      daysToNext: 3,
    };
  }

  const dates = checkins.map((c) => c.checkin_date).sort().reverse();
  const today = new Date().toISOString().split("T")[0];

  // Calculate current streak
  let currentStreak = 0;
  const checkDate = new Date(today);

  for (const date of dates) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (date === dateStr) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (date < dateStr) {
      break;
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;
  const sortedDates = [...dates].sort();
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // 30-day consistency
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentCheckins = dates.filter((d) => new Date(d) >= thirtyDaysAgo).length;
  const consistency = Math.round((recentCheckins / 30) * 100);

  // Milestones
  const milestones = [3, 7, 14, 30, 60, 90];
  let milestoneReached: number | null = null;
  let nextMilestone = 3;

  for (const m of milestones) {
    if (currentStreak >= m) milestoneReached = m;
    if (currentStreak < m) {
      nextMilestone = m;
      break;
    }
  }

  const daysToNext = nextMilestone - currentStreak;

  return {
    currentStreak,
    longestStreak,
    totalCheckins: checkins.length,
    consistency,
    milestoneReached,
    nextMilestone,
    daysToNext,
  };
}
