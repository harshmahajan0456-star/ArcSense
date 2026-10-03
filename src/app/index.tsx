import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Colors } from "@/constants/theme";
import { getTasks } from "../storage/taskStorage";
import { Task } from "../taskTypes";
import { analyzeWorkload, WorkloadAnalysis } from "../workload";

export default function HomeScreen() {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [analysis, setAnalysis] = useState<WorkloadAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  const loadHomeData = async () => {
    try {
      setLoading(true);

      const savedTasks = await getTasks();

      setTasks(savedTasks);

      const workloadResult = analyzeWorkload(savedTasks);

      setAnalysis(workloadResult);
    } catch (error) {
      console.error("Error loading home data:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, []),
  );

  if (loading || !analysis) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading ArcSense...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const completedCount = tasks.filter((task) => task.completed).length;

  const pendingCount = tasks.filter((task) => !task.completed).length;

  const progressPercentage =
    tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  const upcomingTasks = [...tasks]
    .filter((task) => !task.completed)
    .sort(
      (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
    )
    .slice(0, 3);

  const workloadMessage =
    analysis.level === "Critical"
      ? "Immediate attention needed"
      : analysis.level === "High"
        ? "Your upcoming workload is heavy"
        : analysis.level === "Moderate"
          ? "Your workload is manageable"
          : "Your upcoming workload is light";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.smallText}>Good morning 👋</Text>
            <Text style={styles.title}>ArcSense</Text>
          </View>

          <View style={styles.profileCircle}>
            <Text style={styles.profileText}>H</Text>
          </View>
        </View>

        {/* Workload Card */}
        <View style={styles.workloadCard}>
          <Text style={styles.cardLabel}>WORKLOAD STATUS</Text>

          <Text style={styles.workloadTitle}>
            {analysis.level === "Low"
              ? "✓ Workload looks light"
              : analysis.level === "Moderate"
                ? "⚠ Workload building up"
                : analysis.level === "High"
                  ? "⚠ Heavy workload ahead"
                  : "🚨 Critical workload"}
          </Text>

          <Text style={styles.workloadText}>
            {analysis.upcomingCount > 0
              ? `${analysis.upcomingCount} deadline${
                  analysis.upcomingCount > 1 ? "s" : ""
                } within the next 24 hours.`
              : "No deadlines within the next 24 hours."}
          </Text>

          {analysis.totalMinutes > 0 && (
            <Text style={styles.workloadText}>
              Estimated work: {formatEstimatedTime(analysis.totalMinutes)}
            </Text>
          )}

          <Text style={styles.workloadSubtext}>{workloadMessage}</Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.navigate("/insights")}
          >
            <Text style={styles.primaryButtonText}>View workload</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{pendingCount}</Text>

            <Text style={styles.statLabel}>Pending</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completedCount}</Text>

            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{progressPercentage}%</Text>

            <Text style={styles.statLabel}>Progress</Text>
          </View>
        </View>

        {/* Upcoming Tasks */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Tasks</Text>

          <TouchableOpacity onPress={() => router.navigate("/tasks")}>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>

        {upcomingTasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🎉</Text>

            <Text style={styles.emptyTitle}>You're all caught up</Text>

            <Text style={styles.emptyText}>
              Add a new task to start planning your workload.
            </Text>
          </View>
        ) : (
          upcomingTasks.map((task) => <TaskPreview key={task.id} task={task} />)
        )}

        {/* Add Task */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.navigate("/add")}
        >
          <Text style={styles.addButtonText}>+ Add New Task</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function TaskPreview({ task }: { task: Task }) {
  return (
    <View style={styles.taskCard}>
      <View style={styles.taskInfo}>
        <Text style={styles.taskTitle}>{task.title}</Text>

        <Text style={styles.taskMeta}>
          {task.subject} • {formatDeadline(task.deadline)}
        </Text>
      </View>

      <View
        style={[
          styles.priorityBadge,
          task.priority === "High" && styles.highPriority,
          task.priority === "Medium" && styles.mediumPriority,
          task.priority === "Low" && styles.lowPriority,
        ]}
      >
        <Text style={styles.priorityText}>{task.priority}</Text>
      </View>
    </View>
  );
}

function formatDeadline(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatEstimatedTime(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remainingMinutes} min`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  smallText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.text,
  },

  profileCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.text,
    justifyContent: "center",
    alignItems: "center",
  },

  profileText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  workloadCard: {
    backgroundColor: "#FFF4D6",
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
  },

  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8A5A00",
    marginBottom: 8,
  },

  workloadTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 8,
  },

  workloadText: {
    fontSize: 14,
    lineHeight: 21,
    color: "#665000",
  },

  workloadSubtext: {
    fontSize: 13,
    fontWeight: "600",
    color: "#665000",
    marginTop: 8,
    marginBottom: 16,
  },

  primaryButton: {
    alignSelf: "flex-start",
    backgroundColor: Colors.light.text,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },

  statCard: {
    width: "31%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },

  statNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
  },

  viewAll: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
  },

  taskCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  taskInfo: {
    flex: 1,
  },

  taskTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 5,
  },

  taskMeta: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },

  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginLeft: 10,
    backgroundColor: "#E5E7EB",
  },

  highPriority: {
    backgroundColor: "#FEE2E2",
  },

  mediumPriority: {
    backgroundColor: "#FEF3C7",
  },

  lowPriority: {
    backgroundColor: "#DCFCE7",
  },

  priorityText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    marginBottom: 12,
  },

  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },

  addButton: {
    marginTop: 10,
    backgroundColor: Colors.light.text,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: Colors.light.textSecondary,
  },
});
