import React, { useEffect, useState, useCallback } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CourseService from "../services/CourseService";
import { storeToken, storeUserId } from "../utils/SecureStoreUtils";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import ErrorView from "./ErrorView";
import { useSQLiteContext } from "expo-sqlite";
import { backendUrlDatabases } from "../utils/sql/transaction";
import { createAxiosInstance } from "../services/AxiosInstance";

const CourseGrade = ({ courseid }: { courseid: number }) => {
  const db = useSQLiteContext();
  const backendUrl = backendUrlDatabases();
  const [grades, setGrades] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isError, setIsError] = useState<{
    state: boolean;
    message: string;
  }>({ state: false, message: "" });

  const onRefresh = () => {
    setRefreshing(true);
    try {
      fetchGrade();
    } finally {
      setRefreshing(false);
    }
  };

  const checkPassedGrade = (grade: string) => {
    const gradeFloat = parseFloat(grade.slice(0, -1)) || 0;
    return gradeFloat >= 75;
  };

  const fetchGrade = useCallback(async () => {
    setIsFetching(true);
    const url = await backendUrl.getBackendUrl(db);
    const instance = await createAxiosInstance(url);
    const params = {
      wsfunction: "gradereport_user_get_grade_items",
      wstoken: storeToken.getTokenSync(),
      moodlewsrestformat: "json",
      courseid,
      userid: storeUserId.getUserIdSync(),
    };

    try {
      const response = await CourseService.getUserGrades(instance, params);
      if (!response.errorcode) {
        setGrades(response.usergrades[0].gradeitems);
      }
    } catch (error) {
      setIsError({ state: true, message: "error fetching grade" });
    } finally {
      setIsFetching(false);
    }
  }, [courseid]);

  useEffect(() => {
    fetchGrade();
  }, []);

  const renderGradeItem = (grade: any, index: number) => {
    const isPassed = checkPassedGrade(grade.percentageformatted);
    const statusColor = isPassed ? "green" : "red";

    return (
      <View
        key={index}
        className={`border ${
          isPassed ? `border-green-200 bg-green-50` : `border-red-200 bg-red-50`
        } rounded-lg mb-2 h-28 px-4`}
      >
        <View
          className={`flex-row gap-4 h-16 items-center border-b ${
            isPassed ? `border-b-green-200` : `border-b-red-200`
          } mb-2`}
        >
          <Ionicons
            name={isPassed ? "checkmark-done" : "close"}
            size={24}
            color={isPassed ? "#10B981" : "#EF4444"}
          />
          <Text className={`font-bold text-${statusColor}-700`}>
            {grade.itemname}
          </Text>
        </View>
        <View className="flex-row gap-2 justify-between">
          <Text className={`font-bold text-${statusColor}-700`}>Score:</Text>
          <Text className={`font-bold text-${statusColor}-700`}>
            {grade.percentageformatted !== "-"
              ? grade.percentageformatted.slice(0, -1)
              : grade.percentageformatted === "0"
              ? "0"
              : "Not graded"}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#121568"]}
        />
      }
      className="flex-1 pt-2 bg-[#f5f5f5]"
      contentContainerClassName={`${isError.state && "flex-1"}`}
    >
      {isError.state ? (
        <ErrorView
          className="flex-1 items-center justify-center"
          errorMessage={isError.message}
        />
      ) : isFetching ? (
        <View className="mx-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <View key={index} className="mb-2">
              <ShimmerPlaceholder
                LinearGradient={LinearGradient}
                style={{
                  width: "100%",
                  height: 95,
                  borderRadius: 5,
                }}
              />
            </View>
          ))}
        </View>
      ) : (
        <View>
          <View className="mx-4 px-4 h-20 items-center flex-row justify-between bg-blue-50 border border-blue-200 rounded-lg">
            <Text className="text-lg font-bold text-blue-700">
              Overall Grade :
            </Text>
            <Text className="text-lg font-bold text-blue-700">
              {grades
                .find((grade) => grade.itemname === null)
                ?.percentageformatted.slice(0, -1) || "No Grade"}
            </Text>
          </View>
          <View className="flex-row justify-between mt-2 mx-6">
            <Pressable onPress={() => setIsExpanded(!isExpanded)}>
              <Text className="text-base font-bold">Grade Tracking</Text>
            </Pressable>
            <Ionicons
              name={isExpanded ? "chevron-down-sharp" : "chevron-forward-sharp"}
              size={20}
              color="black"
              onPress={() => setIsExpanded(!isExpanded)}
            />
          </View>
          {isExpanded && (
            <View className="mx-8 mt-2">
              {grades.map(
                (grade, index) =>
                  grade.itemname && renderGradeItem(grade, index)
              )}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

export default CourseGrade;
