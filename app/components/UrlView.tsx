import { useEffect, useState } from "react";
import {
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HtmlRenderer from "./HtmlRenderer";
import CourseService from "../services/CourseService";
import TopBar from "./TopBar";
import { storeToken } from "../utils/SecureStoreUtils";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import ErrorView from "./ErrorView";
import { createAxiosInstance } from "../services/AxiosInstance";
import { useSQLiteContext } from "expo-sqlite";
import { backendUrlDatabases } from "../utils/sql/transaction";

type UrlProps = {
  id: number;
  coursemodule: number;
  course: number;
  name: string;
  intro: string;
  externalurl: string;
};

const UrlView = ({ id, name }: { id: number; name: string }) => {
  const db = useSQLiteContext();
  const backendUrl = backendUrlDatabases();
  const [data, setData] = useState<UrlProps>();
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isError, setIsError] = useState<{
    state: boolean;
    message: string;
  }>({ state: false, message: "" });

  const onRefresh = () => {
    setRefreshing(true);
    try {
      fetchData();
    } finally {
      setRefreshing(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    const url = await backendUrl.getBackendUrl(db);
    const instance = await createAxiosInstance(url);
    const token = storeToken.getTokenSync();
    const data = {
      wstoken: token,
      wsfunction: "mod_url_get_urls_by_courses",
      moodlewsrestformat: "json",
    };
    try {
      const response = await CourseService.getModuleDetailbyType(
        instance,
        data
      );
      const updateData = response.urls.filter(
        (url: UrlProps) => url.coursemodule === id
      );
      setData(updateData[0]);
      setIsLoading(false);
    } catch (error) {
      setIsError({ state: true, message: "Error Getting Data" });
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  return (
    <View className="flex-1">
      <TopBar name={name} />
      <ScrollView
        contentContainerClassName={`${isError.state && "flex-1"}`}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isError.state ? (
          <ErrorView
            className="flex-1 items-center justify-center"
            errorMessage={isError.message}
          />
        ) : isLoading ? (
          <View className="mt-2 mx-4">
            <ShimmerPlaceholder
              style={styles.shimmerDescription}
              LinearGradient={LinearGradient}
            />
            <View className="mt-4">
              <ShimmerPlaceholder
                style={styles.shimmerAttachment}
                LinearGradient={LinearGradient}
              />
            </View>
          </View>
        ) : (
          data && (
            <View className="mt-4">
              <View className="mx-4 min-h-80">
                <Text className="text-lg font-bold">Description</Text>
                <HtmlRenderer html={data.intro} />
              </View>
              <View className="mt-4 border-t border-t-gray-300">
                <View className="mx-4 mt-4">
                  <Text className="text-lg font-bold mb-4">
                    Link Attachment
                  </Text>
                  <Pressable
                    onPress={() => {
                      Linking.openURL(data.externalurl);
                    }}
                    className="border border-gray-300 rounded-xl px-4 py-2 flex-row min-h-20 items-center mb-4"
                  >
                    <Ionicons
                      className="mr-2 rounded-xl bg-gray-200 p-2"
                      name="link-sharp"
                      size={45}
                      color="#121568"
                    />
                    <View>
                      <Text
                        numberOfLines={2}
                        className="text-base font-bold pr-14"
                      >
                        {data.name}
                      </Text>
                      <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        className="text-base pr-14"
                      >
                        {data.externalurl}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  shimmerDescription: {
    width: "100%",
    height: 400,
    borderRadius: 10,
  },
  shimmerAttachment: {
    width: "100%",
    height: 100,
    borderRadius: 10,
  },
});

export default UrlView;
