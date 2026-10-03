import { Task } from "./taskTypes";

export type WorkloadLevel = "Low" | "Moderate" | "High" | "Critical";

export type WorkloadAnalysis = {
  level: WorkloadLevel;
  upcomingCount: number;
  totalMinutes: number;
  highPriorityCount: number;
  overdueCount: number;
  atRiskCount: number;
  atRiskTask: Task | null;
  earliestDeadlineMinutes: number | null;
  suggestedTask: Task | null;
};

export function analyzeWorkload(
  tasks: Task[],
  now: Date = new Date(),
): WorkloadAnalysis {
  const incompleteTasks = tasks.filter((task) => !task.completed);

  const currentTime = now.getTime();
  const next24Hours = currentTime + 24 * 60 * 60 * 1000;

  // Tasks due within the next 24 hours.
  const upcomingTasks = incompleteTasks.filter((task) => {
    const deadline = new Date(task.deadline).getTime();

    return deadline > currentTime && deadline <= next24Hours;
  });

  // Tasks whose deadline has already passed.
  const overdueTasks = incompleteTasks.filter((task) => {
    const deadline = new Date(task.deadline).getTime();

    return deadline <= currentTime;
  });

  // Total estimated work for tasks due within 24 hours.
  const totalMinutes = upcomingTasks.reduce(
    (total, task) => total + task.estimatedMinutes,
    0,
  );

  const highPriorityCount = upcomingTasks.filter(
    (task) => task.priority === "High",
  ).length;

  // A task is at risk when the estimated work
  // is greater than the time remaining.
  const atRiskTasks = upcomingTasks.filter((task) => {
    const deadline = new Date(task.deadline).getTime();

    const remainingMinutes = Math.max(0, (deadline - currentTime) / 60000);

    return task.estimatedMinutes > remainingMinutes;
  });

  // Earliest at-risk task.
  const sortedAtRiskTasks = [...atRiskTasks].sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
  );

  const atRiskTask = sortedAtRiskTasks[0] ?? null;

  // How many minutes remain until the earliest
  // upcoming deadline.
  let earliestDeadlineMinutes: number | null = null;

  if (upcomingTasks.length > 0) {
    const earliestDeadline = Math.min(
      ...upcomingTasks.map((task) => new Date(task.deadline).getTime()),
    );

    earliestDeadlineMinutes = Math.max(
      0,
      Math.round((earliestDeadline - currentTime) / 60000),
    );
  }

  /*
   * Recommendation order:
   *
   * 1. Overdue tasks first.
   * 2. Then upcoming tasks.
   * 3. Earlier deadline first.
   * 4. Higher priority breaks deadline ties.
   */
  const recommendationTasks = [...overdueTasks, ...upcomingTasks];

  const sortedRecommendationTasks = recommendationTasks.sort((a, b) => {
    const aDeadline = new Date(a.deadline).getTime();

    const bDeadline = new Date(b.deadline).getTime();

    const aOverdue = aDeadline <= currentTime;

    const bOverdue = bDeadline <= currentTime;

    if (aOverdue !== bOverdue) {
      return aOverdue ? -1 : 1;
    }

    if (aDeadline !== bDeadline) {
      return aDeadline - bDeadline;
    }

    const priorityWeight = {
      High: 3,
      Medium: 2,
      Low: 1,
    };

    return priorityWeight[b.priority] - priorityWeight[a.priority];
  });

  const suggestedTask = sortedRecommendationTasks[0] ?? null;

  // Determine overall workload level.
  let level: WorkloadLevel = "Low";

  if (overdueTasks.length > 0) {
    level = "Critical";
  } else if (
    atRiskTasks.length > 0 ||
    totalMinutes >= 360 ||
    highPriorityCount >= 3
  ) {
    level = "High";
  } else if (totalMinutes >= 180 || highPriorityCount >= 2) {
    level = "Moderate";
  }

  return {
    level,
    upcomingCount: upcomingTasks.length,
    totalMinutes,
    highPriorityCount,
    overdueCount: overdueTasks.length,
    atRiskCount: atRiskTasks.length,
    atRiskTask,
    earliestDeadlineMinutes,
    suggestedTask,
  };
}
