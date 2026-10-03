import { Colors } from "@/constants/theme";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  getTaskById,
  getTasks,
  saveTasks,
  updateTask,
} from "../storage/taskStorage";

import { Task } from "../taskTypes";

export default function AddScreen() {
  const router = useRouter();

  const { editId } = useLocalSearchParams<{ editId?: string }>();

  const isEditing = Boolean(editId);

  const [taskName, setTaskName] = useState("");
  const [subject, setSubject] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");

  const [estimatedTime, setEstimatedTime] = useState("");

  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");

  // Load the task when the screen is opened in edit mode.
  useEffect(() => {
    if (!editId) {
      return;
    }

    const loadTask = async () => {
      const task = await getTaskById(editId);

      if (!task) {
        Alert.alert("Task not found", "This task could not be loaded.");

        router.replace("/tasks");
        return;
      }

      setTaskName(task.title);
      setSubject(task.subject);
      setDeadline(task.deadline);
      setSelectedDate(new Date(task.deadline));
      setEstimatedTime(task.estimatedMinutes.toString());
      setPriority(task.priority);
    };

    loadTask();
  }, [editId]);

  const handleDeadlinePress = () => {
    setPickerMode("date");
    setShowPicker(true);
  };

  const handleDateChange = (event: DateTimePickerEvent, chosenDate?: Date) => {
    setShowPicker(false);

    if (event.type === "dismissed" || !chosenDate) {
      return;
    }

    if (pickerMode === "date") {
      setSelectedDate(chosenDate);

      if (Platform.OS === "android") {
        setPickerMode("time");

        setTimeout(() => {
          setShowPicker(true);
        }, 100);
      }
    } else {
      setSelectedDate(chosenDate);
      setDeadline(chosenDate.toISOString());
    }
  };

  const formatDeadline = (dateString: string) => {
    if (!dateString) {
      return "Select date & time";
    }

    const date = new Date(dateString);

    return date.toLocaleString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleSaveTask = async () => {
    if (
      !taskName.trim() ||
      !subject.trim() ||
      !deadline ||
      !estimatedTime.trim()
    ) {
      Alert.alert(
        "Missing information",
        "Please fill in all fields before saving the task.",
      );

      return;
    }

    const estimatedMinutes = Number(estimatedTime);

    if (!Number.isFinite(estimatedMinutes) || estimatedMinutes <= 0) {
      Alert.alert(
        "Invalid time",
        "Enter the estimated time in minutes. Example: 120",
      );

      return;
    }

    const selectedDeadline = new Date(deadline);

    if (selectedDeadline.getTime() <= Date.now()) {
      Alert.alert("Invalid deadline", "Please select a future date and time.");

      return;
    }

    try {
      if (isEditing && editId) {
        const existingTask = await getTaskById(editId);

        if (!existingTask) {
          Alert.alert("Task not found", "This task could not be updated.");

          return;
        }

        const updatedTask: Task = {
          ...existingTask,
          title: taskName.trim(),
          subject: subject.trim(),
          deadline,
          estimatedMinutes,
          priority,
        };

        await updateTask(updatedTask);

        Alert.alert("Task updated", "Your changes have been saved.");
      } else {
        const newTask: Task = {
          id: Date.now().toString(),
          title: taskName.trim(),
          subject: subject.trim(),
          deadline,
          estimatedMinutes,
          priority,
          completed: false,
        };

        const existingTasks = await getTasks();

        const updatedTasks = [...existingTasks, newTask];

        await saveTasks(updatedTasks);

        Alert.alert("Task added", "Your task has been saved successfully.");
      }

      router.replace("/tasks");
    } catch (error) {
      console.error("Error saving task:", error);

      Alert.alert("Something went wrong", "We could not save your changes.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {isEditing ? "Edit Task" : "Add New Task"}
        </Text>

        <Text style={styles.subtitle}>
          {isEditing
            ? "Update your task details and save the changes."
            : "Add your college work and keep your deadlines organized."}
        </Text>

        {/* Task Name */}
        <Text style={styles.label}>Task name</Text>

        <TextInput
          style={styles.input}
          placeholder="e.g. OOP Assignment"
          value={taskName}
          onChangeText={setTaskName}
        />

        {/* Subject */}
        <Text style={styles.label}>Subject</Text>

        <TextInput
          style={styles.input}
          placeholder="e.g. OOP"
          value={subject}
          onChangeText={setSubject}
        />

        {/* Deadline */}
        <Text style={styles.label}>Deadline</Text>

        <TouchableOpacity style={styles.input} onPress={handleDeadlinePress}>
          <Text style={deadline ? styles.dateText : styles.placeholderText}>
            {formatDeadline(deadline)}
          </Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={selectedDate}
            mode={pickerMode}
            display="default"
            onChange={handleDateChange}
          />
        )}

        {/* Estimated Time */}
        <Text style={styles.label}>Estimated effort (minutes)</Text>

        <TextInput
          style={styles.input}
          placeholder="e.g. 120 minutes"
          keyboardType="numeric"
          value={estimatedTime}
          onChangeText={setEstimatedTime}
        />

        {/* Priority */}
        <Text style={styles.label}>Priority</Text>

        <View style={styles.priorityRow}>
          {["Low", "Medium", "High"].map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.priorityButton,
                priority === item && styles.priorityButtonSelected,
              ]}
              onPress={() => setPriority(item as "Low" | "Medium" | "High")}
            >
              <Text
                style={[
                  styles.priorityText,
                  priority === item && styles.priorityTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Save / Update Button */}
        <TouchableOpacity style={styles.addButton} onPress={handleSaveTask}>
          <Text style={styles.addButtonText}>
            {isEditing ? "Update Task" : "Add Task"}
          </Text>
        </TouchableOpacity>

        {isEditing && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.replace("/tasks")}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
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

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 28,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E1E7EF",
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 18,
  },

  dateText: {
    fontSize: 14,
    color: Colors.light.text,
  },

  placeholderText: {
    fontSize: 14,
    color: "#9AA7B8",
  },

  priorityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 28,
  },

  priorityButton: {
    width: "31%",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E1E7EF",
    alignItems: "center",
  },

  priorityButtonSelected: {
    backgroundColor: Colors.light.text,
    borderColor: Colors.light.text,
  },

  priorityText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },

  priorityTextSelected: {
    color: "#FFFFFF",
  },

  addButton: {
    backgroundColor: Colors.light.text,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  cancelButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },

  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
