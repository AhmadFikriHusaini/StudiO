import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import SafeView from "../components/SafeView";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../redux/Hooks";
import { clearStatus, selectAuth } from "../features/auth/AuthSlice";
import { getUserId, login } from "../features/auth/AuthAction";
import { storeToken } from "../utils/SecureStoreUtils";
import { StackActions, useNavigation } from "@react-navigation/native";
import AlertModal from "../components/AlertModal";
import { useSQLiteContext } from "expo-sqlite";
import { backendUrlDatabases } from "../utils/sql/transaction";
import { createAxiosInstance } from "../services/AxiosInstance";

const LoginScreen = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuth);
  const db = useSQLiteContext();
  const backendDB = backendUrlDatabases();
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isEmpty, setIsEmpty] = useState(false);
  const [backendReady, setBackendReady] = useState(false);
  const [showPassword, setShowPassword] = useState({
    show: false,
    icon: "eye",
  });
  const navigation = useNavigation();
  const fetchUserId = async () => {
    const token = storeToken.getTokenSync();
    const url = await backendDB.getBackendUrl(db);
    const instance = await createAxiosInstance(url);
    if (token) {
      dispatch(
        getUserId({
          AxiosInstance: instance,
          params: {
            wsfunction: "core_webservice_get_site_info",
            wstoken: token,
            moodlewsrestformat: "json",
          },
        })
      );
    }
  };
  const doLogin = async () => {
    if (username === "" || password === "") {
      setIsEmpty(true);
      return;
    }
    const url = await backendDB.getBackendUrl(db);
    const instance = await createAxiosInstance(url);
    await dispatch(login(instance, { username, password, service: "studio" }));
    await fetchUserId();
  };
  const backendCheckerHandler = async () => {
    const backend = await backendDB.getBackendUrl(db);

    if (backend) {
      setBackendReady(true);
      setUrl(backend);
    } else {
      setBackendReady(false);
    }
  };
  const backendAddHandler = async () => {
    if (url === "") {
      setIsEmpty(true);
      return;
    }
    if (!url.startsWith("http")) {
      Alert.alert("Error", "Url must be start with http/https");
      return;
    }
    try {
      await backendDB.addBackendUrl(db, url);
      setIsEmpty(false);
    } catch (error) {
      Alert.alert("Error", "Failed to save backend url");
    }
    await backendCheckerHandler();
  };
  const deleteBackendHandler = async () => {
    try {
      await backendDB.deleteBackendUrl(db);
      setUrl("");
    } catch (error) {
      Alert.alert("Error", "Failed to delete backend url");
    }
    await backendCheckerHandler();
  };
  useEffect(() => {
    backendCheckerHandler();
  }, []);
  return (
    <SafeView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <AlertModal
        visible={auth.status === "failed" ? true : false}
        icon={() => <Ionicons name="warning-sharp" size={24} color="orange" />}
        title="Login Failed"
        message={auth.error ?? "check your connection"}
        confirm={() => dispatch(clearStatus())}
      />
      <View className="flex-1 justify-center items-center">
        <View className="">
          <Image
            source={require("../../assets/Logo.png")}
            className="w-40 h-40"
          />
        </View>
        {backendReady ? (
          <View>
            <View className="mb-6">
              <Text className="font-bold text-lg">Backend Url:</Text>
              <View className="mt-4 bg-gray-200 flex-row justify-between items-center gap-3 w-80 py-4 px-4 rounded-2xl border border-gray-300">
                <View className="flex-row gap-2">
                  <Ionicons name="server" color="#808080" size={18} />
                  <Text className="">{url}</Text>
                </View>
                <Pressable
                  onPress={() => {
                    deleteBackendHandler();
                  }}
                >
                  <Ionicons name="close-sharp" size={20} />
                </Pressable>
              </View>
            </View>
            <View className="mb-6">
              <Text className="font-bold text-lg">Username</Text>
              <View className="mt-4 flex-row items-center gap-3 w-80 py-4 px-4 rounded-2xl border border-gray-300">
                <Ionicons name="person-circle" color="#808080" size={20} />
                <TextInput
                  className="w-56"
                  placeholder="Username"
                  value={username}
                  maxLength={25}
                  onFocus={() => setIsEmpty(false)}
                  onChangeText={(text) => {
                    setUsername(text);
                  }}
                />
              </View>
            </View>
            <View>
              <Text className="font-bold text-lg">Password</Text>
              <View className="mt-4 flex-row items-center justify-between w-80 py-4 px-4 rounded-2xl border border-gray-300">
                <View className="flex-row items-center gap-3">
                  <Ionicons name="key-outline" color="#808080" size={20} />
                  <TextInput
                    className="w-52"
                    placeholder="Password"
                    value={password}
                    maxLength={18}
                    secureTextEntry={showPassword.show ? false : true}
                    onFocus={() => setIsEmpty(false)}
                    onChangeText={(text) => {
                      setPassword(text);
                    }}
                  />
                </View>
                <Pressable
                  onPress={() => {
                    setShowPassword({
                      show: !showPassword.show,
                      icon: showPassword.show ? "eye" : "eye-off",
                    });
                  }}
                >
                  <Ionicons
                    name={showPassword.icon as any}
                    color="#808080"
                    size={20}
                  />
                </Pressable>
              </View>
            </View>

            {isEmpty && (
              <View className="mt-4">
                <Text className="text-red-700">
                  Username or Password cannot be empty
                </Text>
              </View>
            )}
            <Pressable
              className="mt-6 w-80 items-center py-4 rounded-2xl bg-primary"
              onPress={() => {
                doLogin();
              }}
            >
              {auth.status === "loading" ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold">Login</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View>
            <View className="mb-6">
              <Text className="font-bold text-lg">Moodle Website</Text>
              <View className="mt-4 flex-row items-center gap-3 w-80 py-4 px-4 rounded-2xl border border-gray-300">
                <Ionicons name="server" color="#808080" size={20} />
                <TextInput
                  className="w-56"
                  placeholder="Add your moodle webservice {url}"
                  value={url}
                  onFocus={() => setIsEmpty(false)}
                  onChangeText={(text) => {
                    setUrl(text);
                  }}
                />
              </View>
            </View>
            {isEmpty && (
              <View className="mt-4">
                <Text className="text-red-700">
                  Backend URL cannot be empty
                </Text>
              </View>
            )}
            <Pressable
              className="mt-6 w-80 items-center py-4 rounded-2xl bg-primary"
              onPress={() => {
                backendAddHandler();
              }}
            >
              <Text className="text-white font-bold">Save</Text>
            </Pressable>
          </View>
        )}
        <View className="flex-row mt-2">
          <Text className="text-sm text-gray-700 font-bold">Offline?</Text>
          <Pressable
            onPress={() => navigation.dispatch(StackActions.push("offline"))}
          >
            <Text className="text-sm text-primary">Try Offline</Text>
          </Pressable>
        </View>
      </View>
    </SafeView>
  );
};

export default LoginScreen;
