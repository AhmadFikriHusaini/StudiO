import {
  FlatList,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import SafeView from "../components/SafeView";
import { useEffect, useState } from "react";
import CourseDetail from "../components/CourseDetail";
import CourseHistory from "../components/CourseHistory";
import CourseMember from "../components/CourseMember";
import CourseGrade from "../components/CourseGrade";
import { useIsFocused } from "@react-navigation/native";
import CourseService from "../services/CourseService";
import { storeToken } from "../utils/SecureStoreUtils";
import { createAxiosInstance } from "../services/AxiosInstance";
import { useSQLiteContext } from "expo-sqlite";
import { backendUrlDatabases } from "../utils/sql/transaction";

const CourseScreen = ({ route }: any) => {
  const db = useSQLiteContext();
  const backendUrl = backendUrlDatabases();
  const { courseId, courseName } = route.params;
  const token = storeToken.getTokenSync();
  const isFocused = useIsFocused();
  const [selectedMenu, setSelectedMenu] = useState<String>("Detail");
  const [groups, setGroups] = useState<any[]>([]);
  const menus = ["Detail", "Member", "History", "Grade"];
  const renderedComponent = () => {
    if (selectedMenu === "Detail") {
      return <CourseDetail courseid={courseId} />;
    } else if (selectedMenu === "Member") {
      return <CourseMember courseid={courseId} />;
    } else if (selectedMenu === "History") {
      return <CourseHistory courseid={courseId} />;
    } else if (selectedMenu === "Grade") {
      return <CourseGrade courseid={courseId} />;
    }
  };

  const fetchGroups = async () => {
    const url = await backendUrl.getBackendUrl(db);
    const instance = await createAxiosInstance(url);
    const params = {
      wstoken: token,
      wsfunction: "core_group_get_course_user_groups",
      moodlewsrestformat: "json",
      courseid: courseId,
    };
    try {
      const response = await CourseService.getUserCourseGroups(
        instance,
        params
      );
      setGroups(response.groups);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (isFocused) {
      StatusBar.setBarStyle("light-content");
      StatusBar.setBackgroundColor("#121568");
    }
  }, [isFocused]);

  return (
    <SafeView className="flex-1 items-center bg-white">
      <View className="flex-1 bg-primary py-2 items-center w-full min-h-20 max-h-20">
        <Text className="text-lg text-white font-bold">{courseName}</Text>
        {
          <View className="flex-1 flex-row">
            {groups && groups.length > 0
              ? groups.map((group, index) => (
                  <Text className="text-white font-bold" key={index}>
                    {group.name + (index < groups.length - 1 ? " : " : "")}
                  </Text>
                ))
              : null}
          </View>
        }
      </View>
      <FlatList
        className={`flex-1 min-h-16 max-h-16 w-full border-b border-b-gray-300`}
        contentContainerClassName="items-center"
        data={menus}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelectedMenu(item)}
            className={`w-28 mx-1 h-16 items-center justify-center ${
              selectedMenu === item ? "border-b-4 border-b-primary" : ""
            }`}
          >
            {
              <Text
                className={`${
                  selectedMenu === item ? "text-primary" : "text-gray-500"
                } font-bold`}
              >
                {item}
              </Text>
            }
          </Pressable>
        )}
      />
      <View className="w-full flex-1">{renderedComponent()}</View>
    </SafeView>
  );
};

export default CourseScreen;
