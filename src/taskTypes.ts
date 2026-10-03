export type Task = {
  id: string;
  title: string;
  subject: string;
  deadline: string;
  estimatedMinutes: number;
  priority: "Low" | "Medium" | "High";
  completed: boolean;
};
