import AsyncStorage from "@react-native-async-storage/async-storage";
import { Task } from "../taskTypes";

const TASKS_KEY = "@campusflow_tasks";

export async function getTasks(): Promise<Task[]> {
  try {
    const storedTasks = await AsyncStorage.getItem(TASKS_KEY);

    if (!storedTasks) {
      return [];
    }

    return JSON.parse(storedTasks);
  } catch (error) {
    console.error("Error loading tasks:", error);
    return [];
  }
}

export async function saveTasks(tasks: Task[]): Promise<void> {
  try {
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Error saving tasks:", error);
  }
}

export async function updateTask(updatedTask: Task): Promise<void> {
  try {
    const tasks = await getTasks();

    const updatedTasks = tasks.map((task) =>
      task.id === updatedTask.id ? updatedTask : task,
    );

    await saveTasks(updatedTasks);
  } catch (error) {
    console.error("Error updating task:", error);
  }
}

export async function clearTasks(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TASKS_KEY);
  } catch (error) {
    console.error("Error clearing tasks:", error);
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  try {
    const tasks = await getTasks();

    const updatedTasks = tasks.filter((task) => task.id !== taskId);

    await saveTasks(updatedTasks);
  } catch (error) {
    console.error("Error deleting task:", error);
  }
}

export async function getTaskById(taskId: string): Promise<Task | null> {
  try {
    const tasks = await getTasks();

    return tasks.find((task) => task.id === taskId) ?? null;
  } catch (error) {
    console.error("Error finding task:", error);
    return null;
  }
}
