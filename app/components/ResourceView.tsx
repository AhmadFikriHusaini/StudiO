import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HtmlRenderer from "./HtmlRenderer";
import CourseService from "../services/CourseService";
import TopBar from "./TopBar";
import { storeToken } from "../utils/SecureStoreUtils";
import { openDocument } from "../utils/OpenDocumentUtils";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import { useSQLiteContext } from "expo-sqlite";
import { backendUrlDatabases, ModuleDatabases } from "../utils/sql/transaction";
import * as FileSystem from "expo-file-system";
import ErrorView from "./ErrorView";
import { createAxiosInstance } from "../services/AxiosInstance";

type ResourceProps = {
  id: number;
  coursemodule: number;
  course: number;
  name: string;
  intro: string;
  contentfiles: {
    filename: string;
    filesize: number;
    fileurl: string;
    mimetype: string;
  }[];
};

const ResourceView = ({ id, name }: { id: number; name: string }) => {
  const token = storeToken.getTokenSync();
  const [data, setData] = useState<ResourceProps>();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState<{
    state: boolean;
    message: string;
  }>({ state: false, message: "" });
  const [isDownload, setIsDownload] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isAlreadyDownloaded, setIsAlreadyDownloaded] = useState(false);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const db = useSQLiteContext();
  const moduleDB = ModuleDatabases();
  const backendUrl = backendUrlDatabases();

  const onRefresh = () => {
    setRefreshing(true);
    try {
      fetchData();
    } finally {
      setRefreshing(false);
    }
  };

  const compareFiles = (storedFiles: any[], fetchedFiles: any[]) => {
    if (storedFiles.length !== fetchedFiles.length) return false;

    return fetchedFiles.every((fetchedFile) => {
      const storedFile = storedFiles.find(
        (file) =>
          file.filename === fetchedFile.filename &&
          file.filesize === fetchedFile.filesize &&
          file.filetype === fetchedFile.mimetype
      );
      return !!storedFile;
    });
  };

  const checkIfModuleIsDownloaded = async () => {
    if (!data) return;
    try {
      const downloadedModule = await moduleDB.getResources(db, id);
      if (downloadedModule.length > 0) {
        const isContentDifferent = !compareFiles(
          downloadedModule,
          data.contentfiles
        );

        if (isContentDifferent) {
          setNeedsUpdate(true);
        } else {
          setIsAlreadyDownloaded(true);
        }
      }
    } catch (error) {
      ToastAndroid.show("Error checking module status", ToastAndroid.SHORT);
    }
  };

  const downloadModule = async () => {
    setIsDownload(true);
    if (data) {
      try {
        const downloadedFiles = await Promise.all(
          data.contentfiles.map(async (file) => {
            try {
              const downloadResult = await FileSystem.downloadAsync(
                `${file.fileurl}?token=${token}`,
                `${FileSystem.documentDirectory}${file.filename}`
              );
              return {
                fileName: file.filename,
                fileSize: file.filesize,
                mimeType: file.mimetype,
                fileUri: downloadResult.uri,
              };
            } catch (error) {
              ToastAndroid.show(
                `Failed to download ${file.filename}: ${error}`,
                ToastAndroid.SHORT
              );
              return null;
            }
          })
        );
        const successfullyDownloadedFiles = downloadedFiles.filter(
          (file) => file !== null
        );

        try {
          if (needsUpdate) {
            await moduleDB.updateModuleAndResources(
              db,
              data.coursemodule,
              data.name,
              data.intro,
              successfullyDownloadedFiles as any
            );
          }
          if (!needsUpdate) {
            await moduleDB.insertModule(
              db,
              data.coursemodule,
              data.name,
              data.intro,
              successfullyDownloadedFiles as any
            );
          }
          ToastAndroid.show(
            "Module downloaded and saved offline",
            ToastAndroid.SHORT
          );
          setIsAlreadyDownloaded(true);
          setNeedsUpdate(false);
        } catch (error) {
          alert("Error saving module: " + error);
        }
      } catch (error) {
        ToastAndroid.show("Failed to download module", ToastAndroid.SHORT);
      } finally {
        setIsDownload(false);
      }
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    const url = await backendUrl.getBackendUrl(db);
    const instance = await createAxiosInstance(url);
    const data = {
      wstoken: token,
      wsfunction: "mod_resource_get_resources_by_courses",
      moodlewsrestformat: "json",
    };
    try {
      const response = await CourseService.getModuleDetailbyType(
        instance,
        data
      );
      const updateData = response.resources.filter(
        (resource: ResourceProps) => resource.coursemodule === id
      );
      setData(updateData[0]);
    } catch (error) {
      setIsError({
        state: true,
        message: "cant get resource data",
      });
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (data) {
      checkIfModuleIsDownloaded();
    }
  }, [data]);

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <View className="flex-1">
      <TopBar name={name} />
      <ScrollView
        contentContainerClassName={`${isError.state && `flex-1`}`}
        className="mt-4 mb-4"
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
            <View>
              <View className="mx-4 min-h-80">
                <Text className="text-lg font-bold">Description</Text>
                <HtmlRenderer html={data.intro} />
              </View>
              <View className="mt-2 pt-4 px-4 border-t border-t-gray-300">
                <Text className="text-lg font-bold mb-2">Attachments</Text>
                <View
                  className={`${
                    data.contentfiles.length > 1 && `items-center`
                  }`}
                >
                  <View className="flex-row flex-wrap gap-2 pl-2 py-4">
                    {data.contentfiles.map((file, index) => (
                      <Pressable
                        key={index}
                        onPress={() => {
                          openDocument({
                            filename: file.filename,
                            type: file.mimetype,
                            url: `${file.fileurl}?token=${token}`,
                          });
                        }}
                        className="bg-white border border-gray-200 items-center pb-3 pt-2 px-4 rounded-lg w-44"
                      >
                        <View className="border border-gray-200 bg-gray-100 h-20 justify-center items-center rounded-lg w-full">
                          <Ionicons
                            name="file-tray-full-sharp"
                            size={50}
                            color="#121568"
                          />
                        </View>
                        <Text className="px-2" numberOfLines={3}>
                          {file.filename}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          )
        )}
      </ScrollView>
      {!isError.state && (
        <View className="absolute bottom-4 justify-center w-screen">
          <Pressable
            className={`bg-primary items-center justify-center h-16 mx-4 rounded-lg flex-row gap-2 ${
              isAlreadyDownloaded && !needsUpdate ? "bg-gray-400" : "bg-primary"
            }`}
            disabled={isAlreadyDownloaded && !needsUpdate}
            onPress={() => downloadModule()}
          >
            <Ionicons name="cloud-download-sharp" size={24} color="white" />
            {isDownload ? (
              <ActivityIndicator color="white" size="small" />
            ) : isAlreadyDownloaded && !needsUpdate ? (
              <Text className="font-bold text-white text-lg">
                Content Already Downloaded
              </Text>
            ) : needsUpdate ? (
              <Text className="font-bold text-white text-lg">
                Update Content
              </Text>
            ) : (
              <Text className="font-bold text-white text-lg">
                Make It Offline
              </Text>
            )}
          </Pressable>
        </View>
      )}
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

export default ResourceView;
