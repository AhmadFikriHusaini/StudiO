import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import QuizService from "../services/QuizService";
import { parseDocument } from "htmlparser2";
import QuestionSimplifier from "../utils/QuestionSimplifier";
import { useNavigation } from "@react-navigation/native";
import Timer from "./Timer";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import { storeQuizAttempt, storeToken } from "../utils/SecureStoreUtils";
import AlertModal from "./AlertModal";
import { useSQLiteContext } from "expo-sqlite";
import { backendUrlDatabases } from "../utils/sql/transaction";
import { createAxiosInstance } from "../services/AxiosInstance";

type selectedAnswerProps = {
  questionId: number;
  answer: string;
};

const QuestionsView = ({
  attemptid,
  timestart,
  timelimit,
  page,
  length,
}: {
  attemptid: number;
  timestart: number;
  timelimit: number;
  page: number;
  length: number;
}) => {
  const db = useSQLiteContext();
  const backendUrl = backendUrlDatabases();
  const navigation = useNavigation();
  const [isFinish, setIsFinish] = useState(false);
  const [quit, setQuit] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [endModal, setEndModal] = useState<{
    status: boolean;
    type: "finish" | "timeup";
    title: string;
    message: string;
  }>({ status: false, type: "finish", title: "", message: "" });
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
  const [data, setData] = useState<any>();
  const [pageNumber, setPageNumber] = useState(page);
  const [questionText, setQuestionText] = useState("");
  const [answerOptions, setAnswerOptions] = useState<any>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<selectedAnswerProps[]>(
    []
  );

  const fileUri = FileSystem.documentDirectory + "selectedAnswers.json";
  const token = storeToken.getTokenSync();
  const timer = timelimit - (Math.floor(Date.now() / 1000) - timestart);

  const clearAnswers = async () => {
    if ((await FileSystem.getInfoAsync(fileUri)).exists === false) {
      return;
    }
    try {
      await FileSystem.deleteAsync(fileUri);
    } catch (error) {
      setAlertModal({
        visible: true,
        icon: () => <Ionicons name="close-circle" size={25} color="red" />,
        title: "Error",
        message: "Error deleting saved answers file",
        confirm: () => {
          setAlertModal((prev) => ({ ...prev, status: false }));
        },
      });
    }
  };

  const saveSelectedAnswers = async () => {
    try {
      const answersString = JSON.stringify(selectedAnswer);
      await FileSystem.writeAsStringAsync(fileUri, answersString);
    } catch (error) {
      setAlertModal({
        visible: true,
        icon: () => <Ionicons name="close-circle" size={25} color="red" />,
        title: "Error",
        message: "Error saving selected answers",
        confirm: () => {
          setAlertModal((prev) => ({ ...prev, status: false }));
        },
      });
    }
  };

  const loadBackAnswers = async () => {
    try {
      const fileExists = await FileSystem.getInfoAsync(fileUri);
      if (fileExists.exists) {
        const savedAnswersString = await FileSystem.readAsStringAsync(fileUri);
        const savedAnswers = JSON.parse(savedAnswersString);
        setSelectedAnswer(savedAnswers);
      }
    } catch (error) {
      setAlertModal({
        visible: true,
        icon: () => <Ionicons name="close-circle" size={25} color="red" />,
        title: "Error",
        message: "Error loading saved answers",
        confirm: () => {
          setAlertModal((prev) => ({ ...prev, status: false }));
        },
      });
    }
  };

  const handleQuitQuiz = (e: any) => {
    setAlertModal({
      visible: true,
      icon: () => <Ionicons name="warning-sharp" size={25} color="orange" />,
      title: "Quit Quiz",
      message: "Are you sure you want to quit?",
      confirm: () => {
        setQuit(true);
        navigation.dispatch(e.data.action);
      },
      cancel: () => {
        setAlertModal((prev) => ({ ...prev, visible: false }));
      },
    });
  };

  const handleFinishQuiz = async () => {
    setIsFinish(true);
    if (endModal.type === "finish") {
      await handleSaveAttempt();
      if (selectedAnswer.length < length) {
        setAlertModal({
          visible: true,
          icon: () => <Ionicons name="warning" size={25} color="orange" />,
          title: "Unfinished Quiz",
          message: "You have unanswered questions!",
          confirm: () => {
            setAlertModal((prev) => ({ ...prev, visible: false }));
          },
        });
        setIsFinish(false);
        return;
      }
      setQuit(true);
    }
    if (endModal.type === "timeup") {
      setQuit(true);
    }
    const url = await backendUrl.getBackendUrl(db);
    const instance = await createAxiosInstance(url);
    const params = {
      wsfunction: "mod_quiz_process_attempt",
      wstoken: token,
      moodlewsrestformat: "json",
      attemptid: attemptid.toString(),
      finishattempt: 1,
    };
    try {
      const response = await QuizService.SubmitQuiz(instance, params);
      if (!response.errorcode) {
        setAlertModal({
          visible: true,
          icon: () => (
            <Ionicons name="checkmark-circle" size={25} color="green" />
          ),
          title: "Success",
          message: "Quiz submitted successfully",
          confirm: () => {
            clearAnswers();
            storeQuizAttempt.removeQuizAttempt();
            navigation.goBack();
          },
        });
      }
      setIsFinish(false);
    } catch (error) {
      setAlertModal({
        visible: true,
        icon: () => <Ionicons name="close-circle" size={25} color="red" />,
        title: "Error",
        message: "Error submitting quiz",
        confirm: () => {
          setAlertModal((prev) => ({ ...prev, status: false }));
        },
      });
    }
  };

  const handleSelectedAnswer = (questionId: number, answer: string) => {
    setSelectedAnswer((prev) => {
      const updatedAnswers = prev.some((item) => item.questionId === questionId)
        ? prev.map((item) =>
            item.questionId === questionId ? { questionId, answer } : item
          )
        : [...prev, { questionId, answer }];

      return updatedAnswers;
    });
  };

  const handleSaveAttempt = async (navigate?: string) => {
    const questionNumber = data.questions[0].number;
    const answer = selectedAnswer[questionNumber - 1]?.answer || "";
    const uniqueId = data.attempt.uniqueid;
    const url = await backendUrl.getBackendUrl(db);
    const instance = await createAxiosInstance(url);
    const params = {
      wsfunction: "mod_quiz_save_attempt",
      wstoken: token,
      moodlewsrestformat: "json",
      attemptid: attemptid,
      "data[0][name]": "slots",
      "data[0][value]": data.questions[0].slot,
      "data[1][name]": `q${uniqueId}:${questionNumber}_:sequencecheck`,
      "data[1][value]": "1",
      "data[2][name]": `q${uniqueId}:${questionNumber}_answer`,
      "data[2][value]": answer,
    };

    try {
      const response = await QuizService.SaveAttempt(instance, params);
      if (!response.errorcode) {
        switch (navigate) {
          case "next":
            if (data.nextpage !== -1) {
              setPageNumber(pageNumber + 1);
            } else {
              setEndModal({
                status: true,
                type: "finish",
                title: "Finish Quiz",
                message: "Are you sure you want to finish the quiz?",
              });
            }
            break;
          case "prev":
            setPageNumber(pageNumber - 1);
            break;
          default:
            break;
        }
      } else {
        setAlertModal({
          visible: true,
          icon: () => (
            <Ionicons name="close-circle-sharp" size={25} color="red" />
          ),
          title: "Error",
          message: "Error saving attempt",
          confirm: () => {
            setAlertModal((prev) => ({ ...prev, status: false }));
          },
        });
      }
    } catch (error) {
      setAlertModal({
        visible: true,
        icon: () => <Ionicons name="close-circle" size={25} color="red" />,
        title: "Error",
        message: "Error saving attempt",
        confirm: () => {
          setAlertModal((prev) => ({ ...prev, status: false }));
        },
      });
    }
  };

  const handlePageNumber = {
    prev: () => {
      if (pageNumber > 0) {
        handleSaveAttempt("prev");
      }
    },
    next: () => {
      handleSaveAttempt("next");
    },
  };

  const fetchQuestion = async () => {
    setIsFetching(true);
    const url = await backendUrl.getBackendUrl(db);
    const instance = await createAxiosInstance(url);
    const data = {
      wsfunction: "mod_quiz_get_attempt_data",
      wstoken: token,
      moodlewsrestformat: "json",
      attemptid: attemptid,
      page: pageNumber,
    };

    try {
      const response = await QuizService.GetQuizQuestions(instance, data);
      if (response.questions) {
        setData(response);
        const parseQuestion = parseDocument(response.questions[0].html);
        const quiz = QuestionSimplifier(parseQuestion);

        setQuestionText(quiz.question);
        setAnswerOptions(quiz.options);
      } else {
        setAlertModal({
          visible: true,
          icon: () => <Ionicons name="close-circle" size={25} color="red" />,
          title: "Error",
          message: "Error fetching question",
          confirm: () => {
            setAlertModal((prev) => ({ ...prev, status: false }));
            navigation.goBack();
          },
        });
      }
    } catch (error) {
      setAlertModal({
        visible: true,
        icon: () => <Ionicons name="close-circle" size={25} color="red" />,
        title: "Error",
        message: "Error fetching question, close the quiz and try again",
        confirm: () => {
          setAlertModal((prev) => ({ ...prev, status: false }));
          navigation.goBack();
        },
      });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (selectedAnswer.length > 0) {
      saveSelectedAnswers();
    }
  }, [selectedAnswer]);

  useEffect(() => {
    loadBackAnswers();
  }, []);

  useEffect(() => {
    const unsubscribe = (e: any) => {
      if (!quit) {
        e.preventDefault();
        handleQuitQuiz(e);
      }
    };
    navigation.addListener("beforeRemove", unsubscribe);
    return () => {
      navigation.removeListener("beforeRemove", unsubscribe);
    };
  }, [navigation, quit]);

  useEffect(() => {
    loadBackAnswers();
    fetchQuestion();
  }, [pageNumber]);

  const renderAnswerOptions = () =>
    answerOptions.map((option: any, index: number) => (
      <View key={index} className="flex-row items-center gap-2 mb-2">
        <Pressable
          className={`w-12 h-12 items-center justify-center rounded-lg ${
            selectedAnswer.find(
              (item) =>
                item.answer === index.toString() &&
                item.questionId === data.questions[0].number
            )
              ? `bg-green-600`
              : `bg-gray-400`
          }`}
          onPress={() =>
            handleSelectedAnswer(data.questions[0].number, index.toString())
          }
        >
          <Text className="font-bold text-white">
            {["A", "B", "C", "D", "E", "F"][index]}
          </Text>
        </Pressable>
        <View className="mr-12">
          <Text className="text-wrap">{option}</Text>
        </View>
      </View>
    ));

  const renderQuestionNumberBlock = () =>
    Array.from({ length: length }, (_, index) => index + 1).map((item) => (
      <Pressable
        key={item}
        className={`h-12 w-12 items-center justify-center rounded-lg ${
          pageNumber === item - 1
            ? `bg-primary`
            : selectedAnswer.find(
                (current) =>
                  current.questionId === item && pageNumber !== item - 1
              )
            ? `bg-green-600`
            : `bg-gray-400`
        }`}
        onPress={() => {
          handleSaveAttempt();
          setPageNumber(item - 1);
        }}
      >
        <Text className="font-bold text-white">{item}</Text>
      </Pressable>
    ));

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
      alwaysBounceVertical={false}
    >
      <AlertModal {...alertModal} />
      <Modal animationType="slide" transparent visible={endModal.status}>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "flex-end",
            backgroundColor: "rgba(0,0,0,0.3)",
          }}
        >
          <View
            style={{
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
            className="bg-white rounded-t-3xl p-6 w-full h-3/5 items-center justify-center"
          >
            <View className="items-end w-full">
              {endModal.type === "finish" ? (
                <Pressable
                  className="p-2"
                  onPress={() => {
                    setEndModal((prev) => ({
                      ...prev,
                      status: false,
                      message: "",
                    }));
                  }}
                >
                  <Ionicons name="close" size={25} color="gray" />
                </Pressable>
              ) : null}
            </View>
            <View className="flex-1 items-center">
              <Text className="font-bold text-xl mb-4">{endModal.title}</Text>
              <Text className="text-center">{endModal.message}</Text>
            </View>
            <View className="flex-1 justify-center">
              {endModal.type === "finish" ? (
                <Timer textStyle="font-bold text-8xl" duration={timer} />
              ) : (
                <Ionicons name="time" size={150} color="#121568" />
              )}
            </View>
            <View className="flex-1 justify-end">
              <Pressable
                className="bg-primary rounded-lg py-2 min-w-72 justify-center items-center"
                onPress={handleFinishQuiz}
              >
                {isFinish ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-lg">Finish</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <View className="flex-row justify-between px-4 bg-primary items-center py-2">
        <Text className="font-bold text-xl text-white">
          Question {pageNumber + 1}
        </Text>
        <Timer
          className="bg-danger px-4 py-3 rounded-lg"
          textStyle="font-bold text-white"
          duration={timer}
          modalVisible={() => {
            setEndModal({
              status: true,
              type: "timeup",
              title: "Time is up",
              message: "No time left for this quiz",
            });
          }}
        />
      </View>

      <View className="flex-1 p-6 bg-gray-50">
        {isFetching ? (
          <View className="flex-1">
            <View className="mb-4">
              <ShimmerPlaceholder
                style={styles.shimmerQuestion}
                LinearGradient={LinearGradient}
              />
            </View>
            <View>
              {Array.from({ length: 5 }, (_, index) => index).map((item) => (
                <View key={item} className="flex-row items-center gap-2 mb-4">
                  <ShimmerPlaceholder
                    style={styles.shimmerAlphabet}
                    LinearGradient={LinearGradient}
                  />
                  <ShimmerPlaceholder
                    style={styles.shimmerMultipleChoice}
                    LinearGradient={LinearGradient}
                  />
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View className="flex flex-grow">
            <View className="mb-6">
              <Text className="text-lg font-bold">{questionText}</Text>
            </View>
            {renderAnswerOptions()}
          </View>
        )}
        <View className="flex flex-grow px-4 mt-4">
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="flex-row gap-2 pt-4 flex-wrap">
              {renderQuestionNumberBlock()}
            </View>
          </ScrollView>
        </View>
        <View className="flex flex-grow my-6 flex-row justify-between">
          <Pressable
            className={`py-2 px-4 bg-gray-400 rounded-lg ${
              pageNumber === 0 && `opacity-50`
            }`}
            onPress={handlePageNumber.prev}
            disabled={pageNumber === 0}
          >
            <Text className="font-bold text-lg text-white">Previous</Text>
          </Pressable>
          {pageNumber < length - 1 ? (
            <Pressable
              className="py-2 px-4 bg-primary rounded-lg"
              onPress={handlePageNumber.next}
            >
              <Text className="font-bold text-lg text-white">Next</Text>
            </Pressable>
          ) : (
            <Pressable
              className="py-2 px-4 bg-primary rounded-lg"
              onPress={() =>
                setEndModal({
                  status: true,
                  type: "finish",
                  title: "Finish Quiz",
                  message: "Are you sure you want to finish the quiz?",
                })
              }
            >
              <Text className="font-bold text-white text-lg">Finish</Text>
            </Pressable>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  shimmerQuestion: {
    width: "100%",
    height: 40,
    borderRadius: 5,
  },
  shimmerAlphabet: {
    width: 35,
    height: 30,
    borderRadius: 5,
  },
  shimmerMultipleChoice: {
    width: "90%",
    height: 30,
    borderRadius: 5,
  },
});

export default QuestionsView;
