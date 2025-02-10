import { RefreshControl, ScrollView, View } from "react-native";
import { useEffect, useState } from "react";
import ModuleList from "./ModuleList";
import CourseService from "../services/CourseService";
import { storeToken } from "../utils/SecureStoreUtils";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import ErrorView from "./ErrorView";
import { backendUrlDatabases } from "../utils/sql/transaction";
import { useSQLiteContext } from "expo-sqlite";
import { createAxiosInstance } from "../services/AxiosInstance";

const CourseDetail = ({ courseid }: { courseid: number }) => {
  const db = useSQLiteContext();
  const backendDB = backendUrlDatabases();
  const [isLoading, setIsLoading] = useState<{ [key: number]: boolean }>({});
  const [refreshing, setRefreshing] = useState(false);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [data, setData] = useState<any[]>([]);
  const [isError, setIsError] = useState<{
    state: boolean;
    message: string;
  }>({ state: false, message: "" });
  const token = storeToken.getTokenSync();

  const onRefresh = () => {
    setIsFetching(true);
    setRefreshing(true);
    try {
      fetchData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleCompletionByView = async (
    instances: number,
    modname: string,
    completion: number
  ) => {
    if (completion !== 2) return;

    const wsFunctions: {
      [key: string]: { function: string; idParam: string };
    } = {
      url: { function: "mod_url_view_url", idParam: "urlid" },
      resource: {
        function: "mod_resource_view_resource",
        idParam: "resourceid",
      },
    };

    const config = wsFunctions[modname];
    if (!config) return;

    const url = await backendDB.getBackendUrl(db);
    const instance = await createAxiosInstance(url);

    const params = {
      wstoken: token,
      wsfunction: config.function,
      moodlewsrestformat: "json",
      [config.idParam]: instances,
    };
    try {
      await CourseService.completionByView(instance, params);
    } catch (error) {
      alert(`Error triggering completion by view: ${error}`);
    }
  };
  const handleManualCompletion = async (cmid: number, state: number) => {
    setIsLoading((prevStates) => ({
      ...prevStates,
      [cmid]: true,
    }));
    const url = await backendDB.getBackendUrl(db);
    const instance = await createAxiosInstance(url);
    const completed = state === 1 ? 0 : 1;
    const data = {
      wstoken: token,
      wsfunction: "core_completion_update_activity_completion_status_manually",
      moodlewsrestformat: "json",
      completed: completed,
      cmid: cmid,
    };
    CourseService.manualCompletion(instance, data)
      .then((res) => {
        if (res.data.status) {
          fetchData();
        }
      })
      .finally(() => {
        setIsLoading((prevStates) => ({
          ...prevStates,
          [cmid]: false,
        }));
      });
  };

  const fetchData = async () => {
    const url = await backendDB.getBackendUrl(db);
    const instance = await createAxiosInstance(url);
    const params = {
      moodlewsrestformat: "json",
      wsfunction: "core_course_get_contents",
      wstoken: token,
      courseid: courseid,
    };
    try {
      const response = await CourseService.getCourseDetails(instance, params);
      if (!response.errorcode) {
        setData(response);
      }
    } catch (error) {
      setIsError({ state: true, message: "Error Getting Data" });
    } finally {
      setIsFetching(false);
    }
  };
  const detailComponents = () => {
    return data.map((detail, index) => {
      return detail.uservisible
        ? detail.name !== "General" && (
            <ModuleList
              key={index}
              detail={detail}
              handleCompletionByView={handleCompletionByView}
              handleManualCompletion={handleManualCompletion}
              isLoading={isLoading}
            />
          )
        : null;
    });
  };
  useEffect(() => {
    setIsFetching(true);
    fetchData();
  }, []);
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      className="flex-1 bg-[#f5f5f5]"
      contentContainerClassName={`${isError.state && "flex-1"}`}
    >
      {isError.state ? (
        <ErrorView
          className="flex-1 items-center justify-center"
          errorMessage={isError.message}
        />
      ) : isFetching ? (
        <View className="mt-4">
          {Array.from(Array(6).keys()).map((_, index) => (
            <View key={index} className="mb-3 mx-4">
              <ShimmerPlaceholder
                style={{
                  width: "100%",
                  height: 98,
                  borderRadius: 5,
                }}
                LinearGradient={LinearGradient}
              />
            </View>
          ))}
        </View>
      ) : (
        <View className="my-4">{detailComponents()}</View>
      )}
    </ScrollView>
  );
};

export default CourseDetail;
