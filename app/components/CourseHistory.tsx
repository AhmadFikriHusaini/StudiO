import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import CourseService from "../services/CourseService";
import { storeToken, storeUserId } from "../utils/SecureStoreUtils";
import moment from "moment";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import ErrorView from "./ErrorView";
import { useSQLiteContext } from "expo-sqlite";
import { backendUrlDatabases } from "../utils/sql/transaction";
import { createAxiosInstance } from "../services/AxiosInstance";

type ActivityHistory = {
  cmid: number;
  name?: string;
  state: number;
  timecompleted: number;
};

const CourseHistory = ({ courseid }: { courseid: number }) => {
  const db = useSQLiteContext();
  const backendUrl = backendUrlDatabases();
  const [completed, setCompleted] = useState<ActivityHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refresing, setRefreshing] = useState(false);
  const [isError, setIsError] = useState<{
    state: boolean;
    message: string;
  }>({ state: false, message: "" });

  const token = storeToken.getTokenSync();
  const userId = storeUserId.getUserIdSync();

  const onRefresh = () => {
    setRefreshing(true);
    try {
      fetchCourseHistory();
    } finally {
      setRefreshing(false);
    }
  };

  const FetchActivityName = async (cmid: number) => {
    const url = await backendUrl.getBackendUrl(db);
    const instance = await createAxiosInstance(url);
    const data = {
      wstoken: token,
      wsfunction: "core_course_get_course_module",
      moodlewsrestformat: "json",
      cmid: cmid,
    };
    const response = await CourseService.getModuleHistory(instance, data);
    return response.data?.cm?.name || "Unknown Module";
  };

  const fetchCourseHistory = async () => {
    setIsLoading(true);
    const url = await backendUrl.getBackendUrl(db);
    const instance = await createAxiosInstance(url);
    const data = {
      wstoken: token,
      wsfunction: "core_completion_get_activities_completion_status",
      moodlewsrestformat: "json",
      courseid: courseid,
      userid: userId,
    };

    try {
      const response = await CourseService.getActivityHistory(instance, data);
      if (response.errorcode) {
        alert(response.message);
        return;
      }

      const statuses = response.statuses;
      const updateStatuses = await Promise.all(
        statuses.map(async (status: ActivityHistory) => {
          const name = await FetchActivityName(status.cmid);
          return { ...status, name };
        })
      );

      const sortedHistories = updateStatuses.sort(
        (a, b) => b.timecompleted - a.timecompleted
      );

      setCompleted(
        sortedHistories.filter((status) => status.isoverallcomplete)
      );
    } catch (error) {
      setIsError({ state: true, message: "Error Getting Data" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseHistory();
  }, []);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refresing}
          onRefresh={onRefresh}
          colors={["#121568"]}
        />
      }
      className="flex-1 pt-4 bg-[#f5f5f5]"
      contentContainerClassName={`${isError.state && "flex-1"}`}
    >
      {isError.state ? (
        <ErrorView
          className="flex-1 items-center justify-center"
          errorMessage={isError.message}
        />
      ) : isLoading ? (
        Array.from(Array(6).keys()).map((_, index) => (
          <View key={index} className="mb-3 mx-4">
            <ShimmerPlaceholder
              style={styles.ShimmerBox}
              LinearGradient={LinearGradient}
            />
          </View>
        ))
      ) : (
        <View className="mx-4 mb-4">
          {completed.length > 0 ? (
            completed.map((history: ActivityHistory, index: number) => (
              <View
                key={index}
                className="bg-white border border-gray-50 shadow mb-4 rounded-lg px-4 h-32"
              >
                <View className="flex-row h-20 items-center gap-4 py-4">
                  <Ionicons name="book-sharp" size={24} color="#121568" />
                  <View className="flex-row flex-wrap items-center gap-2">
                    <Text className="font-bold">Module:</Text>
                    <Text numberOfLines={2} className="pr-16">
                      {history.name}
                    </Text>
                  </View>
                </View>
                <View className="border-t h-12 border-t-gray-200 flex-row gap-2 items-center">
                  <Ionicons
                    name="checkmark-circle-sharp"
                    size={16}
                    color="green"
                  />
                  <Text className="text-green-500">
                    Done on{" "}
                    {moment(history.timecompleted * 1000).format(
                      "DD MMMM YYYY HH:mm"
                    )}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View className="items-center">
              <Text>No activity history</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  ShimmerBox: {
    width: "100%",
    height: 100,
    borderRadius: 5,
  },
});

export default CourseHistory;
