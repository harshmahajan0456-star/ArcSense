import { Colors } from "@/constants/theme";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { deleteTask, getTasks, updateTask } from "../storage/taskStorage";
import { Task } from "../taskTypes";

type Filter = "All" | "Pending" | "Completed";

export default function TasksScreen() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("All");

  const loadTasks = async () => {
    try {
      setLoading(true);

      const savedTasks = await getTasks();

      setTasks(savedTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, []),
  );

  const toggleTask = async (task: Task) => {
    const updatedTask: Task = {
      ...task,
      completed: !task.completed,
    };

    await updateTask(updatedTask);

    setTasks((currentTasks) =>
      currentTasks.map((item) =>
        item.id === updatedTask.id ? updatedTask : item,
      ),
    );
  };

  const handleDeleteTask = (task: Task) => {
    Alert.alert(
      "Delete task",
      `Are you sure you want to delete "${task.title}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteTask(task.id);

            setTasks((currentTasks) =>
              currentTasks.filter((item) => item.id !== task.id),
            );
          },
        },
      ],
    );
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "Pending") {
      return !task.completed;
    }

    if (filter === "Completed") {
      return task.completed;
    }

    return true;
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />

          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Tasks</Text>

            <Text style={styles.subtitle}>
              Keep track of your college work and deadlines.
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countText}>{tasks.length}</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          {(["All", "Pending", "Completed"] as Filter[]).map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.filterButton,
                filter === item && styles.filterButtonSelected,
              ]}
              onPress={() => setFilter(item)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item && styles.filterTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredTasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>
              {filter === "Completed" ? "🎉" : "📝"}
            </Text>

            <Text style={styles.emptyTitle}>
              {filter === "All"
                ? "No tasks yet"
                : filter === "Pending"
                  ? "No pending tasks"
                  : "No completed tasks"}
            </Text>

            <Text style={styles.emptyText}>
              {filter === "All"
                ? "Add your first college task from the Add tab."
                : filter === "Pending"
                  ? "You're all caught up."
                  : "Complete a task and it will appear here."}
            </Text>
          </View>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={() => toggleTask(task)}
              onEdit={() =>
                router.push({
                  pathname: "/add",
                  params: { editId: task.id },
                })
              }
              onDelete={() => handleDeleteTask(task)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.taskCard}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={[styles.checkbox, task.completed && styles.checkboxCompleted]}
          onPress={onToggle}
        >
          {task.completed && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        <View style={styles.taskInfo}>
          <Text
            style={[styles.taskTitle, task.completed && styles.completedTask]}
          >
            {task.title}
          </Text>

          <Text style={styles.subject}>{task.subject}</Text>
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

      <View style={styles.infoRow}>
        <Text style={styles.infoText}>📅 {formatDeadline(task.deadline)}</Text>

        <Text style={styles.infoText}>
          ⏱ {formatEstimatedTime(task.estimatedMinutes)}
        </Text>
      </View>

      <View style={styles.bottomRow}>
        {task.completed ? (
          <Text style={styles.completedLabel}>✓ Completed</Text>
        ) : (
          <Text style={styles.pendingLabel}>○ Pending</Text>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity onPress={onEdit}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onDelete}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function formatDeadline(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
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
    alignItems: "flex-start",
    marginBottom: 18,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    maxWidth: 280,
  },

  countBadge: {
    minWidth: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.light.text,
    justifyContent: "center",
    alignItems: "center",
  },

  countText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  filterRow: {
    flexDirection: "row",
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },

  filterButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: "center",
  },

  filterButtonSelected: {
    backgroundColor: "#FFFFFF",
  },

  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },

  filterTextSelected: {
    color: Colors.light.text,
  },

  taskCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  checkbox: {
    width: 25,
    height: 25,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  checkboxCompleted: {
    backgroundColor: Colors.light.text,
    borderColor: Colors.light.text,
  },

  checkmark: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  taskInfo: {
    flex: 1,
  },

  taskTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.text,
  },

  completedTask: {
    textDecorationLine: "line-through",
    color: "#9CA3AF",
  },

  subject: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 5,
  },

  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
    marginLeft: 8,
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

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },

  infoText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
  },

  completedLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#16A34A",
  },

  pendingLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },

  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },

  editText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
  },

  deleteText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    marginTop: 10,
  },

  emptyEmoji: {
    fontSize: 42,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 19,
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
