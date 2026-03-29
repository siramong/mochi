import { useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import HomeDashboard from "@/src/features/home/components/HomeDashboard";
import { DailyPlanner } from "@/src/shared/components/DailyPlanner";
import { QuickCaptureModal } from "@/src/shared/components/QuickCaptureModal";
import { RecoveryPlanModal } from "@/src/shared/components/RecoveryPlanModal";
import { useStreakRecovery } from "@/src/shared/hooks/useStreakRecovery";
import { useSession } from "@/src/core/providers/SessionContext";

type ModuleVisibility = {
  partner_features_enabled: boolean;
  study_enabled: boolean;
  exercise_enabled: boolean;
  habits_enabled: boolean;
  goals_enabled: boolean;
  mood_enabled: boolean;
  gratitude_enabled: boolean;
  vouchers_enabled: boolean;
  cooking_enabled: boolean;
  notes_enabled: boolean;
};

const defaultModuleVisibility: ModuleVisibility = {
  partner_features_enabled: false,
  study_enabled: true,
  exercise_enabled: true,
  habits_enabled: true,
  goals_enabled: true,
  mood_enabled: true,
  gratitude_enabled: true,
  vouchers_enabled: false,
  cooking_enabled: true,
  notes_enabled: true,
};

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useSession();
  const [recoveryDismissed, setRecoveryDismissed] = useState(false);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);

  const { activeRecoveryPlan, createRecoveryPlan, dismissRecoveryPlan } =
    useStreakRecovery(session?.user.id);

  const handleRecoveryStart = () => {
    if (!session?.user.id) return;

    void (async () => {
      await createRecoveryPlan(session.user.id);
      setRecoveryDismissed(true);
    })();
  };

  const handleRecoveryDismiss = () => {
    setRecoveryDismissed(true);

    if (!activeRecoveryPlan?.id) return;
    void dismissRecoveryPlan(activeRecoveryPlan.id);
  };

  // Show recovery modal if streak recovery is active and not dismissed yet
  const showRecoveryModal = activeRecoveryPlan !== null && !recoveryDismissed;

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <HomeDashboard
        userName="Amiga"
        onNavigateToCooking={() => {
          router.push("/cooking");
        }}
        moduleVisibility={defaultModuleVisibility}
      />
      <DailyPlanner />

      {/* Recovery Plan Modal - appears when streak = 0 */}
      <RecoveryPlanModal
        visible={showRecoveryModal}
        plan={activeRecoveryPlan}
        onStart={handleRecoveryStart}
        onDismiss={handleRecoveryDismiss}
      />

      {/* Quick Capture Modal - FAB */}
      <QuickCaptureModal
        visible={quickCaptureOpen}
        onClose={() => setQuickCaptureOpen(false)}
      />
    </View>
  );
}
