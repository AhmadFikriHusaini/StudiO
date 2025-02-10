import { Pressable, ScrollView, StatusBar, Text, View } from "react-native";
import SafeView from "../components/SafeView";
import TopBar from "../components/TopBar";
import { useIsFocused } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { ModuleDatabases } from "../utils/sql/transaction";
import { Ionicons } from "@expo/vector-icons";
import {
  GestureHandlerRootView,
  Swipeable,
} from "react-native-gesture-handler";
import { openDocument } from "../utils/OpenDocumentUtils";
import AlertModal from "../components/AlertModal";

type modules = {
  id: number;
  moduleid: number;
  modulename: string;
  moduleintro: string;
  resources: [
    {
      filesize: string;
      id: number;
      filename: string;
      filetype: string;
      fileurl: string;
      module_id: number;
    }
  ];
};

const DownloadScreen = () => {
  const isFocused = useIsFocused();
  const db = useSQLiteContext();
  const moduleDB = ModuleDatabases();
  const [modules, setModules] = useState<modules[]>();
  const [isShow, setIsShow] = useState<{ [key: number]: boolean }>({});
  const [floatOpen, setFloatOpen] = useState(false);
  const swipeRefs = useRef<any>([]);
  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    icon?: () => JSX.Element;
    cancel?: () => void;
    confirm?: () => void;
  }>({
    visible: false,
    title: "",
    message: "",
  });

  const gestureHandlerRight = (id: number, moduleid: number) => (
    <Pressable
      className="bg-red-500 w-80 -ml-60 items-end justify-center rounded-r-lg px-6"
      onPress={() => {
        handleDeleteModule(id, moduleid);
      }}
    >
      <Ionicons name="trash-bin-sharp" size={24} color="white" />
    </Pressable>
  );

  const handleDeleteModule = async (id: number, moduleid: number) => {
    swipeRefs.current[id].close();
    try {
      await moduleDB.deleteModule(db, moduleid);
      fetchData();
    } catch (error) {
      setAlertModal({
        visible: true,
        title: "Error",
        message: "An error occurred while deleting module",
        icon: () => <Ionicons name="alert-circle" size={18} color="red" />,
        cancel: () =>
          setAlertModal((prev) => {
            return { ...prev, visible: false };
          }),
      });
    }
  };

  const handleDeleteAll = async () => {
    try {
      await moduleDB.deleteAllModules(db);
      fetchData();
    } catch (error) {
      setAlertModal({
        visible: true,
        title: "Error",
        message: "An error occurred while deleting all modules",
        icon: () => <Ionicons name="alert-circle" size={18} color="red" />,
        cancel: () =>
          setAlertModal((prev) => {
            return { ...prev, visible: false };
          }),
      });
    }
  };

  const fetchData = async () => {
    try {
      const result = await moduleDB.getModuleAndResources(db);
      setModules(result as any);
    } catch (error) {
      setAlertModal({
        visible: true,
        title: "Error",
        message: "An error occurred while fetching modules",
        icon: () => <Ionicons name="alert-circle" size={18} color="red" />,
        cancel: () =>
          setAlertModal((prev) => {
            return { ...prev, visible: false };
          }),
      });
    }
  };

  useEffect(() => {
    if (isFocused) {
      StatusBar.setBarStyle("dark-content");
      StatusBar.setBackgroundColor("white");
      fetchData();
    }
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeView className="bg-white flex-1">
        <TopBar name={"Offline Content"} />
        <AlertModal {...alertModal} />
        {modules && modules.length > 0 ? (
          <ScrollView className="mx-8">
            {modules.map((module, index) => (
              <Swipeable
                key={index}
                ref={(ref) => (swipeRefs.current[module.moduleid] = ref)}
                renderRightActions={() =>
                  gestureHandlerRight(module.moduleid, module.moduleid)
                }
                containerStyle={{
                  backgroundColor: "#fff",
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: "#f1f1f1",
                  borderRadius: 10,
                }}
              >
                <View className="bg-white px-4 py-4 rounded-lg">
                  <Text className="font-bold border-b border-b-gray-100 pb-4">
                    {module.modulename}
                  </Text>
                  <Pressable
                    className="flex-row items-center justify-between pt-2"
                    onPress={() => {
                      setIsShow((prev) => {
                        return {
                          ...prev,
                          [module.moduleid]: !prev[module.moduleid],
                        };
                      });
                    }}
                  >
                    <Text>Show Resources</Text>
                    <Ionicons
                      name={
                        !isShow[module.moduleid]
                          ? "chevron-forward-sharp"
                          : "chevron-down-sharp"
                      }
                      size={20}
                      color="gray"
                    />
                  </Pressable>
                  <View>
                    {module.resources.map((resource, index) =>
                      isShow[module.moduleid] ? (
                        <Pressable
                          key={index}
                          className="rounded-lg border border-gray-200 mt-2 h-8 flex-row items-center gap-2 pl-2"
                          onPress={() =>
                            openDocument({
                              filename: resource.filename,
                              type: resource.filetype,
                              file: resource.fileurl,
                            })
                          }
                        >
                          <Ionicons
                            name="file-tray-sharp"
                            size={15}
                            color="#121568"
                          />
                          <Text numberOfLines={1} className="pr-12">
                            {resource.filename}
                          </Text>
                        </Pressable>
                      ) : null
                    )}
                  </View>
                </View>
              </Swipeable>
            ))}
          </ScrollView>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-lg text-gray-500">No content available</Text>
          </View>
        )}

        <View className="absolute bottom-8 right-8 justify-center items-center">
          {floatOpen && (
            <Pressable
              className="bg-red-700 rounded-full p-1 h-12 w-12 items-center justify-center mb-2"
              onPress={() => {
                setAlertModal({
                  visible: true,
                  title: "Delete all content",
                  icon: () => (
                    <Ionicons name="trash-bin-sharp" size={18} color="red" />
                  ),
                  message: "Are you sure you want to delete all content?",
                  confirm: () => {
                    handleDeleteAll();
                    setAlertModal((prev) => {
                      return { ...prev, visible: false };
                    });
                  },
                  cancel: () =>
                    setAlertModal((prev) => {
                      return { ...prev, visible: false };
                    }),
                });
              }}
            >
              <Ionicons name="trash-bin-sharp" size={15} color="white" />
            </Pressable>
          )}
          <Pressable
            className="bg-primary rounded-full p-3 h-16 w-16 items-center justify-center"
            onPress={() => setFloatOpen((prev) => !prev)}
          >
            <Ionicons
              name={floatOpen ? "close-sharp" : "menu-sharp"}
              size={24}
              color="white"
            />
          </Pressable>
        </View>
      </SafeView>
    </GestureHandlerRootView>
  );
};

export default DownloadScreen;
