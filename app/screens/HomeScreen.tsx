import {
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import SafeView from "../components/SafeView";
import { useAppDispatch, useAppSelector } from "../redux/Hooks";
import { useEffect, useState } from "react";
import { getCourseList } from "../features/course/CourseAction";
import { cleanUp, selectCourse } from "../features/course/CourseSlice";
import CourseList from "../components/CourseList";
import { useIsFocused } from "@react-navigation/native";
import { selectAuth } from "../features/auth/AuthSlice";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import {
  storeToken,
  storeUserId,
  storeUsername,
} from "../utils/SecureStoreUtils";
import ErrorView from "../components/ErrorView";
import { useSQLiteContext } from "expo-sqlite";
import { backendUrlDatabases } from "../utils/sql/transaction";
import { createAxiosInstance } from "../services/AxiosInstance";

const HomeScreen = () => {
  const db = useSQLiteContext();
  const backendUrl = backendUrlDatabases();
  const dispatch = useAppDispatch();
  const course = useAppSelector(selectCourse);
  const isFocused = useIsFocused();
  const userId = useAppSelector(selectAuth).data.userid;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    try {
      fetchData();
    } finally {
      setRefreshing(false);
    }
  };

  const fetchData = async () => {
    const token = await storeToken.getToken();
    const url = await backendUrl.getBackendUrl(db);
    const instance = await createAxiosInstance(url);
    if (token && isFocused) {
      dispatch(
        getCourseList({
          instance,
          params: {
            wstoken: token,
            wsfunction: "core_enrol_get_users_courses",
            moodlewsrestformat: "json",
            userid: (await storeUserId.getUserId()) ?? userId,
          },
        })
      );
    }
  };

  useEffect(() => {
    if (isFocused) {
      StatusBar.setBarStyle("dark-content");
      StatusBar.setBackgroundColor("#fff");
      fetchData();
    }

    return () => {
      dispatch(cleanUp());
    };
  }, [isFocused]);
  return (
    <SafeView className="flex-1 bg-white">
      {course.status === "failed" ? (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerClassName="flex-1"
        >
          <ErrorView
            className="flex-1 items-center justify-center"
            errorMessage={course.error ?? "something went wrong"}
          />
        </ScrollView>
      ) : (
        <View className="flex-1">
          <View className="px-6 py-4 bg-white">
            <Text className="font-bold text-primary text-3xl">Dashboard</Text>
          </View>
          {course.status === "loading" ? (
            <View className="ml-4 mt-4">
              <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                style={styles.courseCard}
              />
            </View>
          ) : (
            <View className="flex-1">
              <View className="flex-row items-end ml-6">
                <Text className="font-bold text-2xl">Welcome, </Text>
                <Text className="text-lg">
                  {storeUsername.getUsernameSync()}
                </Text>
              </View>
              <CourseList
                courses={course.data}
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            </View>
          )}
        </View>
      )}
    </SafeView>
  );
};

const styles = StyleSheet.create({
  courseCard: {
    width: 192,
    height: 144,
    borderRadius: 20,
  },
});

export default HomeScreen;
