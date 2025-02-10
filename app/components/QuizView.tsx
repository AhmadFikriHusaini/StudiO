import { useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import HtmlRenderer from "./HtmlRenderer";
import CourseService from "../services/CourseService";
import {
  StackActions,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import QuizService from "../services/QuizService";
import TopBar from "./TopBar";
import { storeQuizAttempt, storeToken } from "../utils/SecureStoreUtils";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import AlertModal from "./AlertModal";
import ErrorView from "./ErrorView";
import { useSQLiteContext } from "expo-sqlite";
import { backendUrlDatabases } from "../utils/sql/transaction";
import { createAxiosInstance } from "../services/AxiosInstance";

type QuizProps = {
  id: number;
  coursemodule: number;
  course: number;
  name: string;
  intro: string;
  timelimit: number;
};

const checkQuestionLength = (layout: any) => {
  const max = Math.max(...layout.split(",").map(Number));
  return max;
};

const QuizView = ({ id, name }: { id: number; name: string }) => {
  const db = useSQLiteContext();
  const backendUrl = backendUrlDatabases();
  const isFocused = useIsFocused();
  const [data, setData] = useState<QuizProps>();
  const [isLoading, setIsLoading] = useState(false);
  const [unfinishedAttempt, setUnfinishedAttempt] = useState<any>();
  const getLastSavedAttempt = storeQuizAttempt.getQuizAttemptSync();
  const [isError, setIsError] = useState<{
    state: boolean;
    message: string;
  }>({ state: false, message: "" });
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
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const token = storeToken.getTokenSync();

  const onRefresh = () => {
    setRefreshing(true);
    try {
      fetchData();
    } finally {
      setRefreshing(false);
    }
  };

  const checkLastAttempt = async (id: number) => {
    const url = await backendUrl.getBackendUrl(db);
    const instance = await createAxiosInstance(url);
    const params = {
      wstoken: token,
      moodlewsrestformat: "json",
      wsfunction: "mod_quiz_get_user_attempts",
      quizid: id,
      status: "unfinished",
    };

    try {
      const response = await QuizService.GetUserAttempts(instance, params);
      if (!response.errorcode) {
        if (response.attempts && response.attempts.length > 0) {
          const lastAttempt = response.attempts.find(
            (attempt: any) => attempt.id === id
          );
          return !!lastAttempt;
        }
        return false;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  const fetchUserAttempt = async (quizid: number) => {
    const url = await backendUrl.getBackendUrl(db);
    const instance = await createAxiosInstance(url);
    const params = {
      wstoken: token,
      wsfunction: "mod_quiz_get_user_attempts",
      quizid: quizid,
      moodlewsrestformat: "json",
      status: "unfinished",
    };
    try {
      const response = await QuizService.GetUserAttempts(instance, params);
      if (!response.errorcode) {
        const unfinished = response.attempts.find(
          (attempt: any) => attempt.state === "inprogress"
        );
        setUnfinishedAttempt(unfinished || null);
      } else {
        setIsError({
          state: true,
          message: "Error fetching attempt data " + JSON.stringify(response),
        });
      }
    } catch (error) {
      setIsError({
        state: true,
        message: "cant get user Attempt",
      });
    }
  };

  const StartQuiz = async (id: number, timelimit: number, page: number) => {
    const url = await backendUrl.getBackendUrl(db);
    const instance = await createAxiosInstance(url);
    const params = {
      wstoken: token,
      moodlewsrestformat: "json",
      wsfunction: "mod_quiz_start_attempt",
      quizid: id,
    };
    try {
      const response = await QuizService.StartAttempt(instance, params);
      if (!response.errorcode) {
        if (response.warnings.length > 0) {
          setAlertModal({
            visible: true,
            icon: () => (
              <Ionicons name="warning-sharp" size={25} color="orange" />
            ),
            title: "Warning",
            message: response.warnings[0].message,
            confirm: () => {
              setAlertModal({ ...alertModal, visible: false });
            },
          });
          return;
        }

        storeQuizAttempt.storeQuizAttempt(String(id));
        navigation.dispatch(
          StackActions.push("quiz", {
            attemptid: response.attempt.id,
            timestart: response.attempt.timestart,
            timelimit: timelimit,
            page: page,
            length: checkQuestionLength(response.attempt.layout),
          })
        );
      } else {
        setAlertModal({
          visible: true,
          icon: () => (
            <Ionicons name="warning-sharp" size={25} color="orange" />
          ),
          title: "Warning",
          message: response.errorcode,
          confirm: () => {
            setAlertModal({ ...alertModal, visible: false });
          },
        });
      }
    } catch (error) {
      setAlertModal({
        visible: true,
        icon: () => <Ionicons name="warning-sharp" size={25} color="orange" />,
        title: "Warning",
        message: "Error starting quiz",
        confirm: () => {
          setAlertModal({ ...alertModal, visible: false });
        },
      });
    }
  };

  const startQuizHandler = async (
    id: number,
    timelimit: number,
    page: number
  ) => {
    if (getLastSavedAttempt !== null) {
      const lastAttempt = await checkLastAttempt(Number(getLastSavedAttempt));
      if (lastAttempt) {
        setAlertModal({
          visible: true,
          icon: () => (
            <Ionicons name="warning-sharp" size={25} color="orange" />
          ),
          title: "Warning",
          message: "Finish the previous quiz first",
          confirm: () => {
            setAlertModal({ ...alertModal, visible: false });
          },
        });
        return;
      }
    }

    const fileUri = FileSystem.documentDirectory + "selectedAnswers.json";
    if ((await FileSystem.getInfoAsync(fileUri)).exists === true) {
      await FileSystem.deleteAsync(fileUri);
    }
    storeQuizAttempt.removeQuizAttempt();
    await StartQuiz(id, timelimit, page);
  };

  const fetchData = async () => {
    setIsLoading(true);
    const url = await backendUrl.getBackendUrl(db);
    const instance = await createAxiosInstance(url);
    const params = {
      wsfunction: "mod_quiz_get_quizzes_by_courses",
      wstoken: token,
      moodlewsrestformat: "json",
    };
    try {
      const response = await CourseService.getModuleDetailbyType(
        instance,
        params
      );
      const updateData = response.quizzes.filter(
        (quiz: QuizProps) => quiz.coursemodule === id
      );
      setData(updateData[0]);
      fetchUserAttempt(updateData[0].id);
      setIsLoading(false);
    } catch (error) {
      setIsError({
        state: true,
        message: "cant get quiz data",
      });
    }
  };

  useEffect(() => {
    isFocused && fetchData();
  }, [isFocused]);

  return (
    <View className="flex-1">
      <AlertModal {...alertModal} />
      <TopBar name={name} />
      {isLoading ? (
        <View className="mt-2 mx-4">
          <ShimmerPlaceholder
            style={styles.shimmerDescription}
            LinearGradient={LinearGradient}
          />
          <View className="mt-4">
            <ShimmerPlaceholder
              style={styles.shimmerTimer}
              LinearGradient={LinearGradient}
            />
          </View>
        </View>
      ) : isError.state ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerClassName="flex-1"
        >
          <ErrorView
            className="flex-1 items-center justify-center"
            errorMessage={isError.message}
          />
        </ScrollView>
      ) : (
        data && (
          <View className="flex-1">
            <ScrollView
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              className="mt-2"
            >
              <View className="mx-4  p-4">
                <Text className="font-bold text-xl">Description</Text>
                <HtmlRenderer html={data.intro} />
              </View>
              <View className="px-4">
                <View className="px-4">
                  <Text className="font-bold text-xl">Timer</Text>
                </View>
                <View className="mt-2 flex-row h-14 items-center gap-4 px-4">
                  <Ionicons name="time" size={30} color="#121568" />
                  <Text className="font-bold text-xl">
                    {data.timelimit === 0
                      ? "No time limit"
                      : data.timelimit / 60 + " minutes"}
                  </Text>
                </View>
              </View>
            </ScrollView>
            <View className="mx-4 mb-4 gap-2">
              <Pressable
                className="bg-primary p-4 rounded-lg items-center"
                onPress={() => {
                  if (unfinishedAttempt) {
                    navigation.dispatch(
                      StackActions.push("quiz", {
                        attemptid: unfinishedAttempt.id,
                        timestart: unfinishedAttempt.timestart,
                        timelimit: data?.timelimit,
                        page: unfinishedAttempt.currentpage,
                        length: checkQuestionLength(unfinishedAttempt.layout),
                      })
                    );
                  } else {
                    startQuizHandler(data?.id, data?.timelimit, 0);
                  }
                }}
              >
                <Text className="text-white font-bold">
                  {unfinishedAttempt ? "Continue Quiz" : "Start Quiz"}
                </Text>
              </Pressable>
            </View>
          </View>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  shimmerDescription: {
    width: "100%",
    height: 250,
    borderRadius: 10,
  },
  shimmerTimer: {
    width: "100%",
    height: 50,
    borderRadius: 10,
  },
});

export default QuizView;
