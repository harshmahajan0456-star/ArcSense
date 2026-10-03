import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Colors } from "@/constants/theme";
import { getTasks } from "../storage/taskStorage";
import { analyzeWorkload, WorkloadAnalysis } from "../workload";

export default function InsightsScreen() {
  const [analysis, setAnalysis] = useState<WorkloadAnalysis | null>(null);

  const [loading, setLoading] = useState(true);

  const loadInsights = async () => {
    try {
      setLoading(true);

      const savedTasks = await getTasks();

      const result = analyzeWorkload(savedTasks);

      setAnalysis(result);
    } catch (error) {
      console.error("Error loading insights:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInsights();
    }, []),
  );

  if (loading || !analysis) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Analyzing workload...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hours = Math.floor(analysis.totalMinutes / 60);
  const minutes = analysis.totalMinutes % 60;

  const workloadText =
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
        <Text style={styles.title}>Insights</Text>

        <Text style={styles.subtitle}>
          ArcSense analyzes your upcoming deadlines and estimated work.
        </Text>

        {/* Main workload card */}
        <View
          style={[
            styles.workloadCard,
            analysis.level === "Low" && styles.workloadLow,
            analysis.level === "Moderate" && styles.workloadModerate,
            analysis.level === "High" && styles.workloadHigh,
            analysis.level === "Critical" && styles.workloadCritical,
          ]}
        >
          <Text
            style={[
              styles.cardLabel,
              analysis.level === "Low" && styles.cardLabelLow,
              analysis.level === "Moderate" && styles.cardLabelModerate,
              analysis.level === "High" && styles.cardLabelHigh,
              analysis.level === "Critical" && styles.cardLabelCritical,
            ]}
          >
            CURRENT WORKLOAD
          </Text>

          <Text style={styles.level}>{analysis.level}</Text>

          <Text style={styles.workloadText}>{workloadText}</Text>

          {analysis.overdueCount > 0 && (
            <Text style={styles.overdueText}>
              ⚠ {analysis.overdueCount} overdue task
              {analysis.overdueCount > 1 ? "s" : ""}
            </Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{analysis.upcomingCount}</Text>

            <Text style={styles.statLabel}>Due in 24h</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
            </Text>

            <Text style={styles.statLabel}>Estimated work</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{analysis.atRiskCount}</Text>

            <Text style={styles.statLabel}>At risk</Text>
          </View>
        </View>

        {/* Recommendation */}
        {/* Recommendation */}
        {analysis.suggestedTask ? (
          <>
            <View style={styles.recommendationCard}>
              <Text style={styles.recommendationLabel}>START WITH THIS</Text>

              <Text style={styles.recommendationTitle}>
                {analysis.suggestedTask.title}
              </Text>

              <Text style={styles.recommendationText}>
                {analysis.suggestedTask.priority} priority •{" "}
                {analysis.suggestedTask.estimatedMinutes} min
              </Text>

              <Text style={styles.reason}>
                Earliest deadline among your upcoming tasks
              </Text>
            </View>

            {analysis.atRiskTask && (
              <View style={styles.riskCard}>
                <Text style={styles.riskLabel}>⚠ AT-RISK TASK</Text>

                <Text style={styles.riskTitle}>
                  {analysis.atRiskTask.title}
                </Text>

                <Text style={styles.riskMeta}>
                  {formatEstimatedTime(analysis.atRiskTask.estimatedMinutes)}{" "}
                  estimated
                </Text>

                <Text style={styles.riskMeta}>
                  {formatRemainingTime(analysis.atRiskTask.deadline)} remaining
                </Text>

                <Text style={styles.riskReason}>
                  Estimated work is greater than the available time before the
                  deadline.
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🎉</Text>

            <Text style={styles.emptyTitle}>No urgent workload</Text>

            <Text style={styles.emptyText}>
              Add some future tasks and ArcSense will analyze them here.
            </Text>
          </View>
        )}

        {/* Explanation */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How ArcSense decides</Text>

          <Text style={styles.infoText}>
            • Looks at incomplete tasks due within the next 24 hours.
          </Text>

          <Text style={styles.infoText}>
            • Adds their estimated completion times.
          </Text>

          <Text style={styles.infoText}>• Counts high-priority tasks.</Text>

          <Text style={styles.infoText}>• Flags overdue work as critical.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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

function formatRemainingTime(deadline: string) {
  const remainingMinutes = Math.max(
    0,
    Math.round((new Date(deadline).getTime() - Date.now()) / 60000),
  );

  if (remainingMinutes < 60) {
    return `${remainingMinutes} min`;
  }

  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}
const styles = StyleSheet.create({
  workloadLow: {
    backgroundColor: "#ECFDF5",
  },

  workloadModerate: {
    backgroundColor: "#FFF7ED",
  },

  workloadHigh: {
    backgroundColor: "#FFF4D6",
  },

  workloadCritical: {
    backgroundColor: "#FFF1F2",
  },

  cardLabelLow: {
    color: "#047857",
  },

  cardLabelModerate: {
    color: "#C2410C",
  },

  cardLabelHigh: {
    color: "#8A5A00",
  },

  cardLabelCritical: {
    color: "#BE123C",
  },
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
    lineHeight: 21,
    color: Colors.light.textSecondary,
    marginBottom: 24,
  },

  workloadCard: {
    backgroundColor: "#FFF4D6",
    borderRadius: 20,
    padding: 22,
    marginBottom: 18,
  },

  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8A5A00",
    marginBottom: 8,
  },

  level: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.light.text,
    marginBottom: 4,
  },

  workloadText: {
    fontSize: 14,
    color: "#665000",
  },

  overdueText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "700",
    color: "#B91C1C",
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  statCard: {
    width: "31%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 6,
    alignItems: "center",
  },

  statNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.light.text,
    marginBottom: 5,
    textAlign: "center",
  },

  statLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },

  recommendationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
  },

  recommendationLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
    marginBottom: 8,
  },

  recommendationTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 5,
  },

  recommendationText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },

  reason: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.text,
  },

  riskCard: {
    backgroundColor: "#FFF1F2",
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
  },

  riskLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#BE123C",
    marginBottom: 8,
  },

  riskTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 8,
  },

  riskMeta: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },

  riskReason: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.light.textSecondary,
    marginTop: 10,
  },

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
  },

  infoTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 12,
  },

  infoText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 7,
  },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    marginBottom: 18,
  },

  emptyEmoji: {
    fontSize: 40,
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
    lineHeight: 20,
    color: Colors.light.textSecondary,
    textAlign: "center",
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
