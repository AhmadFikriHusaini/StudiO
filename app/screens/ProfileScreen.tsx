import {
  ActivityIndicator,
  Image,
  Pressable,
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
import { getUserProfile } from "../features/user/UserAction";
import { clearData, selectUser } from "../features/user/UserSlice";
import { Ionicons } from "@expo/vector-icons";
import { logout } from "../features/auth/AuthSlice";
import Moment from "moment";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import {
  StackActions,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import { storeToken, storeUsername } from "../utils/SecureStoreUtils";
import AlertModal from "../components/AlertModal";
import ErrorView from "../components/ErrorView";
import { useSQLiteContext } from "expo-sqlite";
import { backendUrlDatabases } from "../utils/sql/transaction";
import { createAxiosInstance } from "../services/AxiosInstance";

const ProfileScreen = () => {
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
  const db = useSQLiteContext();
  const backendUrl = backendUrlDatabases();
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const profile = user.data[0];
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    try {
      fetchData();
    } finally {
      setRefreshing(false);
    }
  };

  const doLogout = () => {
    setAlertModal({
      visible: true,
      icon: () => <Ionicons name="log-out-outline" size={24} color="#BF310D" />,
      title: "Logout",
      message: "Are you sure want to logout?",
      confirm: () => {
        setIsLoading(false);
        setAlertModal({ ...alertModal, visible: false });
        dispatch(logout());
      },
      cancel: () => {
        setIsLoading(false);
        setAlertModal({ ...alertModal, visible: false });
      },
    });
  };
  const fetchData = async () => {
    const token = await storeToken.getToken();
    const username = await storeUsername.getUsername();
    const url = await backendUrl.getBackendUrl(db);
    const instance = await createAxiosInstance(url);
    if (token && username) {
      dispatch(
        getUserProfile({
          instance,
          params: {
            wstoken: token,
            wsfunction: "core_user_get_users_by_field",
            moodlewsrestformat: "json",
            field: "username",
            values: [username ?? ""],
          },
        })
      );
    }
  };

  useEffect(() => {
    if (isFocused) {
      StatusBar.setBarStyle("light-content");
      StatusBar.setBackgroundColor("#121568");
    }
  }, [isFocused]);

  useEffect(() => {
    if (isFocused) {
      fetchData();
    }
    return () => {
      dispatch(clearData());
    };
  }, [dispatch, isFocused]);
  return (
    <SafeView className="bg-white h-screen">
      <AlertModal {...alertModal} />
      {user.status === "failed" ? (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerClassName="flex-1"
        >
          <View className="items-center justify-between pt-4 mr-6 flex-row">
            <View className="w-3/5 items-end">
              <Text className="text-primary font-bold text-2xl">profile</Text>
            </View>
            <View>
              <Pressable
                onPress={() => {
                  navigation.dispatch(StackActions.push("download"));
                }}
              >
                <Ionicons
                  name="cloud-download-sharp"
                  size={24}
                  color="#121568"
                />
              </Pressable>
            </View>
          </View>
          <ErrorView
            className="flex-1 items-center justify-center"
            errorMessage={user.error ?? "something went wrong"}
          />
          <View className="flex-1 items-center mt-4">
            <Pressable
              className="w-44 border border-danger h-12 justify-center items-center rounded-full"
              onPress={() => {
                setIsLoading(true);
                doLogout();
              }}
            >
              <View className="flex-row items-center">
                <Ionicons
                  className="mr-1"
                  name="log-out-outline"
                  size={24}
                  color="#BF310D"
                />
                {isLoading ? (
                  <ActivityIndicator size="small" color="#BF310D" />
                ) : (
                  <Text className="font-bold text-danger">Logout</Text>
                )}
              </View>
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View className="h-64 bg-primary">
            <View className="items-center justify-between pt-4 mr-6 flex-row">
              <View className="w-3/5 items-end">
                <Text className="text-white font-bold text-2xl">profile</Text>
              </View>
              <View>
                <Pressable
                  onPress={() => {
                    navigation.dispatch(StackActions.push("download"));
                  }}
                >
                  <Ionicons
                    name="cloud-download-sharp"
                    size={24}
                    color="white"
                  />
                </Pressable>
              </View>
            </View>
            <View className="flex-row items-center h-44 gap-4 px-6">
              <Image
                source={
                  user.status === "success"
                    ? { uri: profile.profileimageurl }
                    : require("../../assets/profile.png")
                }
                className="w-20 h-20 rounded-full"
              />

              {user.status === "loading" ? (
                <View className="gap-2">
                  <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={styles.profileUsername}
                  />
                  <ShimmerPlaceholder
                    LinearGradient={LinearGradient}
                    style={styles.profileFullname}
                  />
                </View>
              ) : (
                <View>
                  <Text className="font-bold text-lg text-white uppercase">
                    {profile.username}
                  </Text>
                  <Text className="text-white font-medium text-lg">
                    {profile.fullname}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View className="bg-white -mt-8 mx-6 px-4 rounded-lg py-4 shadow mb-2">
            <View className="items-center">
              <Text className="font-bold text-lg px-4">User Information</Text>
            </View>
            <View className="mt-4 px-4 border-b border-gray-400 pb-4">
              <Text className="font-bold">Email</Text>
              {user.status === "loading" ? (
                <ShimmerPlaceholder
                  LinearGradient={LinearGradient}
                  style={styles.profileData}
                />
              ) : (
                <Text className="text-gray-600">{profile.email}</Text>
              )}
            </View>
            <View className="mt-4 px-4 border-b border-gray-400 pb-4">
              <Text className="font-bold">Terakhir di Buka</Text>
              {user.status === "loading" ? (
                <ShimmerPlaceholder
                  LinearGradient={LinearGradient}
                  style={styles.profileData}
                />
              ) : (
                <Text className="text-gray-600 uppercase">
                  {profile.preferences.map((pref) => {
                    if (pref.name === "_lastloaded") {
                      return Moment(Number(pref.value) * 1000).format(
                        "D MMM YYYY HH:mm"
                      );
                    }
                  })}
                </Text>
              )}
            </View>
            <View className="flex-1 items-center mt-4">
              <Pressable
                className="w-44 border border-danger h-12 justify-center items-center rounded-full"
                onPress={() => {
                  setIsLoading(true);
                  doLogout();
                }}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    className="mr-1"
                    name="log-out-outline"
                    size={24}
                    color="#BF310D"
                  />
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#BF310D" />
                  ) : (
                    <Text className="font-bold text-danger">Logout</Text>
                  )}
                </View>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeView>
  );
};

const styles = StyleSheet.create({
  profileUsername: {
    width: 150,
    borderRadius: 5,
    height: 20,
  },
  profileFullname: {
    width: 180,
    borderRadius: 5,
    height: 20,
  },
  profileData: {
    width: 150,
    borderRadius: 5,
  },
});

export default ProfileScreen;
