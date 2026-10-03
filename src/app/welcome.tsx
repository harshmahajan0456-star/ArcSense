import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { Colors } from "@/constants/theme";

type WelcomeScreenProps = {
  onGetStarted?: () => void;
};

export default function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  const handleGetStarted = () => {
    onGetStarted?.();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoSymbol}>◈</Text>
        </View>

        <Text style={styles.title}>ArcSense</Text>

        <Text style={styles.tagline}>
          See the pressure before the deadline.
        </Text>

        <Text style={styles.description}>
          Plan your college work, understand your workload, and identify
          deadlines that may need attention.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
  },

  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#07111F",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },

  logoSymbol: {
    fontSize: 42,
    color: "#38BDF8",
    fontWeight: "700",
  },

  title: {
    fontSize: 36,
    fontWeight: "800",
    color: Colors.light.text,
    marginBottom: 10,
  },

  tagline: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2563EB",
    textAlign: "center",
    marginBottom: 16,
  },

  description: {
    fontSize: 15,
    lineHeight: 23,
    color: Colors.light.textSecondary,
    textAlign: "center",
    maxWidth: 330,
    marginBottom: 34,
  },

  button: {
    width: "100%",
    maxWidth: 330,
    backgroundColor: Colors.light.text,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
