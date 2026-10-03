import AsyncStorage from "@react-native-async-storage/async-storage";
import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StyleSheet, useColorScheme, View } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import AppTabs from "@/components/app-tabs";
import WelcomeScreen from "./welcome";

SplashScreen.preventAutoHideAsync();

const ONBOARDING_KEY = "@arcsense_onboarding_complete";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const completed = await AsyncStorage.getItem(ONBOARDING_KEY);

        setOnboardingComplete(completed === "true");
      } catch (error) {
        console.error("Error checking onboarding:", error);

        setOnboardingComplete(false);
      }
    };

    checkOnboarding();
  }, []);

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");

      setOnboardingComplete(true);
    } catch (error) {
      console.error("Error saving onboarding status:", error);
    }
  };

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />

      {onboardingComplete === null ? (
        <View style={styles.loadingContainer} />
      ) : onboardingComplete ? (
        <AppTabs />
      ) : (
        <WelcomeScreen onGetStarted={handleGetStarted} />
      )}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F7F9FC",
  },
});
