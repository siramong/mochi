import { Text, View, ScrollView, Pressable } from "react-native";
import { useEnergyDaily } from "@/src/shared/hooks/useEnergyDaily";
import { useTodaysPlannedTasks } from "@/src/shared/hooks/useTodaysPlannedTasks";
import { scoreTodaysTasks } from "@/src/shared/lib/plannerLogic";
import { useCyclePhase } from "@/src/shared/hooks/useCyclePhase";
import { useStreaks } from "@/src/shared/hooks/useStreaks";
import { router } from "expo-router";

export function DailyPlanner() {
  const { todayEnergy, isLoading: energyLoading } = useEnergyDaily();
  const { tasks, isLoading: tasksLoading } = useTodaysPlannedTasks();
  const cyclePhase = useCyclePhase();
  const { currentStreak } = useStreaks();

  const scores = scoreTodaysTasks(
    todayEnergy,
    cyclePhase,
    currentStreak,
    tasks,
  );

  if (energyLoading || tasksLoading) {
    return (
      <View className="bg-pink-100 rounded-3xl p-4 mb-4">
        <Text className="text-center text-gray-500 text-sm">Cargando...</Text>
      </View>
    );
  }

  if (scores.length === 0) {
    return (
      <View className="bg-pink-100 rounded-3xl p-4 mb-4">
        <Text className="font-semibold text-gray-800 text-base mb-2">
          Hoy en Mochi
        </Text>
        <Text className="text-gray-600 text-sm">
          No hay tareas planificadas para hoy. ¡Descansa o crea una nueva tarea!
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-pink-100 rounded-3xl p-4 mb-4 border border-pink-200">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="font-bold text-gray-800 text-lg">Hoy en Mochi</Text>
        {todayEnergy !== null && (
          <View className="bg-yellow-200 rounded-full px-2 py-1">
            <Text className="text-xs font-semibold text-yellow-900">
              {todayEnergy}/5 energía
            </Text>
          </View>
        )}
      </View>

      {/* Tasks List */}
      <ScrollView
        className="max-h-72"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {scores.map((task, index) => (
          <Pressable
            key={task.id}
            onPress={() => {
              // Navigate based on task type
              const routes: Record<string, string> = {
                study: "/study-detail",
                routine: "/routine-detail",
                goal: "/goal-detail",
                habit: "/habit-detail",
              };
              const route = routes[task.type] || "/";
              router.push({
                pathname: route,
                params: { id: task.id },
              });
            }}
            className={`${
              index !== scores.length - 1 ? "border-b border-pink-200" : ""
            } py-3`}
          >
            <View className="flex-row items-start justify-between gap-2">
              <View className="flex-1">
                <Text className="font-semibold text-gray-800 text-base">
                  {task.title}
                </Text>
                <Text className="text-xs text-gray-600 mt-1.5">
                  {task.reason}
                </Text>
                <View className="flex-row items-center gap-1 mt-2">
                  <View className="bg-purple-200 rounded-full px-2 py-0.5">
                    <Text className="text-xs font-medium text-purple-800">
                      {task.recommendedLevel === "light"
                        ? "Ligera"
                        : task.recommendedLevel === "medium"
                          ? "Media"
                          : "Intensa"}
                    </Text>
                  </View>
                </View>
              </View>
              <View className="bg-yellow-300 rounded-full w-12 h-12 items-center justify-center">
                <Text className="font-bold text-yellow-900 text-sm">
                  {Math.round(task.score)}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Footer */}
      <View className="border-t border-pink-200 mt-3 pt-2">
        <Text className="text-xs text-gray-600">
          El score se basa en tu energía, racha y fase del ciclo.
        </Text>
      </View>
    </View>
  );
}
