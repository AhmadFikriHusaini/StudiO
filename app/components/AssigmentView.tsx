import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useCourse } from "../utils/context/courseContext";
import HtmlRenderer from "./HtmlRenderer";
import { Ionicons } from "@expo/vector-icons";
import * as DocPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import moment from "moment";
import AssignmentService from "../services/AssignmentService";
import TopBar from "./TopBar";
import { storeToken, storeUserId } from "../utils/SecureStoreUtils";
import { openDocument } from "../utils/OpenDocumentUtils";
import AlertModal from "./AlertModal";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";
import ErrorView from "./ErrorView";
import { useAppDispatch, useAppSelector } from "../redux/Hooks";
import {
  cleanUpAssignment,
  cleanUpAssignmentStatus,
  getAssignment,
  getAssignmentStatus,
} from "../features/assign/assignSlice";
import {
  GetAssignment,
  GetAssignmentStatus,
} from "../features/assign/assignAction";
import { AssigmentProps } from "../types/app";
import { useNavigation } from "@react-navigation/native";
import { useSQLiteContext } from "expo-sqlite";
import { backendUrlDatabases } from "../utils/sql/transaction";
import { createAxiosInstance } from "../services/AxiosInstance";

const AssignmentView = ({ id, name }: { id: number; name: string }) => {
  const [data, setData] = useState<AssigmentProps>({
    id: null,
    cmid: null,
    course: null,
    name: "",
    allowsubmissionsfromdate: 0,
    duedate: 0,
    cutoffdate: 0,
    configs: [
      {
        plugin: "",
        subtype: "",
        name: "",
        value: "",
      },
    ],
    intro: "",
    introattachments: [
      {
        filename: "",
        fileurl: "",
        mimetype: "",
      },
    ],
    timelimit: null,
  });
  const assignmentStatus = useAppSelector(getAssignmentStatus);
  const assignment = useAppSelector(getAssignment);
  const dispatch = useAppDispatch();
  const db = useSQLiteContext();
  const backendUrl = backendUrlDatabases();
  const [document, setDocument] = useState<DocPicker.DocumentPickerAsset[]>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [maxSubmission, setMaxSubmission] = useState<number>(1);
  const [maxSubmissionSize, setMaxSubmissionSize] = useState<number>(0);
  const [submissionFileType, setSubmissionFileType] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const navigation = useNavigation();
  const currentDate = Date.now() / 1000;
  const startDate =
    data.allowsubmissionsfromdate > 0 &&
    currentDate > data.allowsubmissionsfromdate;
  const cutoffDate =
    data.cutoffdate === 0 ||
    (data.cutoffdate > 0 && currentDate < data.cutoffdate);
  const [isError, setIsError] = useState<boolean>(false);
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
  const token = storeToken.getTokenSync();
  const { courseid } = useCourse();
  const mimeTypeMap: { [key: string]: string } = {
    ".pdf": "application/pdf",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".doc": "application/msword",
    ".pptx":
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".ppt": "application/vnd.ms-powerpoint",
    ".jpg": "image/jpg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".zip": "application/zip",
    ".rar": "application/vnd.rar",
  };

  const onRefresh = () => {
    setRefreshing(true);
    try {
      fetchAssignment();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async (itemid: number) => {
    setIsLoading(true);
    const url = await backendUrl.getBackendUrl(db);
    const instance = await createAxiosInstance(url);
    try {
      const params = {
        wstoken: token,
        wsfunction: "mod_assign_save_submission",
        moodlewsrestformat: "json",
        assignmentid: data?.id,
        "plugindata[files_filemanager]": itemid,
      };
      const response = await AssignmentService.submitAssigment(
        instance,
        params
      );
      if (response) {
        setIsLoading(false);
        setAlertModal({
          visible: true,
          icon: () => <Ionicons name="checkmark" size={24} color="green" />,
          title: "Success",
          message: "Assignment submitted successfully",
          confirm: () => {
            setAlertModal({ ...alertModal, visible: false });
          },
        });
        document && setDocument([]);
        await fetchAssignmentStatus(data?.id);
      }
    } catch (err) {
      setIsLoading(false);
      setAlertModal({
        visible: true,
        icon: () => <Ionicons name="warning-sharp" size={24} color="orange" />,
        title: "Failed",
        message: "Failed to submit assignment",
        confirm: () => {
          document && setDocument([]);
          setAlertModal({ ...alertModal, visible: false });
        },
      });
    }
  };

  const handleUpload = async () => {
    if (!document || document.length === 0) {
      setAlertModal({
        visible: true,
        icon: () => <Ionicons name="warning-sharp" size={24} color="orange" />,
        title: "Warning",
        message: "Please select a file to upload",
        confirm: () => {
          setAlertModal({ ...alertModal, visible: false });
        },
      });
      return;
    }

    const totalSize = document.reduce((acc, doc) => acc + (doc?.size || 0), 0);

    if (totalSize > maxSubmissionSize) {
      setAlertModal({
        visible: true,
        icon: () => <Ionicons name="warning-sharp" size={24} color="orange" />,
        title: "Warning",
        message: `Total file size exceeds the limit of ${
          maxSubmissionSize / 1024
        } KB`,
        confirm: () => {
          setAlertModal({ ...alertModal, visible: false });
        },
      });
      return;
    }

    setIsLoading(true);
    const url = await backendUrl.getBackendUrl(db);
    const instance = await createAxiosInstance(url);
    try {
      let currentItemId = 0;
      const failedUploads: string[] = [];

      for (let i = 0; i < document.length; i++) {
        const doc = document[i];
        const fileUri = doc.uri;
        const fileContent = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const instanceId = storeUserId.getUserIdSync();
        const data = {
          wstoken: token,
          wsfunction: "core_files_upload",
          moodlewsrestformat: "json",
          contextlevel: "user",
          instanceid: instanceId,
          component: "user",
          filearea: "draft",
          itemid: currentItemId,
          filepath: "/",
          filename: doc.name,
          filecontent: fileContent,
        };

        const response = await AssignmentService.UploadFile(instance, data);

        if (!response.errorcode) {
          if (i === 0) {
            currentItemId = response.itemid;
          }
        } else {
          failedUploads.push(doc.name);
        }
      }

      if (failedUploads.length > 0) {
        setAlertModal({
          visible: true,
          icon: () => (
            <Ionicons name="warning-sharp" size={24} color="orange" />
          ),
          title: "Upload Failed",
          message: `The following files could not be uploaded: ${failedUploads.join(
            ", "
          )}`,
          confirm: () => {
            setAlertModal({ ...alertModal, visible: false });
          },
        });
      } else {
        setAlertModal({
          visible: true,
          icon: () => <Ionicons name="checkmark" size={24} color="green" />,
          title: "Success",
          message: "Files uploaded successfully",
          confirm: async () => {
            setAlertModal({ ...alertModal, visible: false });
            await handleSubmit(currentItemId);
          },
        });
      }
    } catch (error) {
      setAlertModal({
        visible: true,
        icon: () => <Ionicons name="warning-sharp" size={24} color="orange" />,
        title: "Upload Failed",
        message: "An error occurred while uploading files.",
        confirm: () => {
          setAlertModal({ ...alertModal, visible: false });
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = (name: string) => {
    setAlertModal({
      visible: true,
      icon: () => <Ionicons name="warning-sharp" size={24} color="orange" />,
      title: "Delete File",
      message: "Are you sure you want to delete this file?",
      confirm: () => {
        handleDeleteAttachment(name);
        setAlertModal({ ...alertModal, visible: false });
      },
      cancel: () => {
        setAlertModal({ ...alertModal, visible: false });
      },
    });
  };

  const handleDeleteAttachment = async (name: string) => {
    setDocument((prevFiles) => prevFiles?.filter((doc) => doc.name !== name));
  };

  const handleSelectDocument = async () => {
    try {
      const doc = await DocPicker.getDocumentAsync({
        type: submissionFileType,
        multiple: maxSubmission > 1 ? true : false,
      });
      if (doc.assets) {
        if (doc.assets.length > maxSubmission) {
          setAlertModal({
            visible: true,
            icon: () => (
              <Ionicons name="warning-sharp" size={24} color="orange" />
            ),
            title: "Warning",
            message: `You can only submit ${maxSubmission} files`,
            confirm: () => {
              setAlertModal({ ...alertModal, visible: false });
            },
          });
          return;
        }
        if (document) {
          setDocument([...document, ...doc.assets]);
        } else {
          setDocument(doc.assets);
        }
      }
    } catch (e) {
      setAlertModal({
        visible: true,
        icon: () => (
          <Ionicons name="close-circle-sharp" size={24} color="red" />
        ),
        title: "Error",
        message: `An error occurred while selecting files : ${e}`,
        confirm: () => {
          setAlertModal({ ...alertModal, visible: false });
        },
      });
    }
  };

  const fetchAssignmentStatus = async (id: number | null) => {
    const url = await backendUrl.getBackendUrl(db);
    const instance = await createAxiosInstance(url);
    dispatch(
      GetAssignmentStatus({
        instance,
        params: {
          wstoken: token,
          wsfunction: "mod_assign_get_submission_status",
          moodlewsrestformat: "json",
          assignid: id,
        },
      })
    );
  };

  const getConfigValue = (configs: any[], name: string): string | undefined => {
    const config = configs.find((config: any) => config.name === name);
    return config?.value;
  };
  const handleMaxSubmission = async (configs: any[]) => {
    const maxSubmissionValue = getConfigValue(configs, "maxfilesubmissions");
    if (maxSubmissionValue) {
      setMaxSubmission(parseInt(maxSubmissionValue));
    }
  };
  const handleMaxSubmissionSize = async (configs: any[]) => {
    const maxSubmissionSizeValue = getConfigValue(
      configs,
      "maxsubmissionsizebytes"
    );
    if (maxSubmissionSizeValue) {
      setMaxSubmissionSize(parseInt(maxSubmissionSizeValue));
    }
  };
  const handleSubmissionFileTypes = async (configs: any[]) => {
    const submissionFileTypeValue = getConfigValue(configs, "filetypeslist");
    if (submissionFileTypeValue) {
      const types = submissionFileTypeValue
        .split(",")
        .filter((type: string) => {
          return (
            type !== "document" && type !== "presentation" && type.trim() !== ""
          );
        })
        .map((ext: string) => {
          const mimeType = mimeTypeMap[ext.trim()];
          return mimeType ? mimeType : null;
        })
        .filter((mimeType: string | null) => mimeType !== null);
      setSubmissionFileType(types);
    } else {
      alert("submissionFileTypeValue is empty or undefined");
    }
  };

  const filterData = async () => {
    const course = assignment.data.courses.find(
      (course) => course.id === courseid
    );
    if (course) {
      const assign = course.assignments.find(
        (assignment) => assignment.id === id || assignment.cmid === id
      );
      if (assign) {
        await fetchAssignmentStatus(assign.id);
        setData(assign);
        if (assign.configs) {
          await handleMaxSubmission(assign.configs);
          await handleMaxSubmissionSize(assign.configs);
          await handleSubmissionFileTypes(assign.configs);
        }
      }
      if (!assign) {
        setIsError(true);
        setAlertModal({
          visible: true,
          icon: () => (
            <Ionicons name="warning-sharp" size={24} color="orange" />
          ),
          title: "Error",
          message: "Assignment hidden or not available for your role",
          confirm: () => {
            setAlertModal((prev) => ({ ...prev, status: false }));
            navigation.goBack();
          },
        });
      }
    }
  };

  const fetchAssignment = async () => {
    const url = await backendUrl.getBackendUrl(db);
    const instance = await createAxiosInstance(url);
    const params = {
      wstoken: token,
      wsfunction: "mod_assign_get_assignments",
      moodlewsrestformat: "json",
    };
    dispatch(GetAssignment({ instance, params }));
  };

  useEffect(() => {
    if (assignment.status === "success") {
      filterData();
    }
  }, [assignment.status]);

  useEffect(() => {
    fetchAssignment();
    return () => {
      dispatch(cleanUpAssignment());
      dispatch(cleanUpAssignmentStatus());
    };
  }, []);

  return (
    <View className="flex-1 bg-white">
      <AlertModal {...alertModal} />
      <TopBar name={name} />
      {assignment.status === "failed" || isError ? (
        <ScrollView
          contentContainerClassName="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <ErrorView
            className="flex-1 items-center justify-center"
            errorMessage={assignment.error || "Failed to fetch assignment"}
          />
        </ScrollView>
      ) : assignment.status === "loading" || assignment.status === "idle" ? (
        <View className="flex-1 mt-2 mx-4">
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
        <View className="flex-1">
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            className="mt-4"
          >
            {data && (
              <View>
                <View className="mx-4 min-h-80">
                  <Text className="font-bold text-lg">Description</Text>
                  <HtmlRenderer html={data.intro} />
                  <View className="items-center">
                    <Text className="font-bold text-lg mb-2">
                      Submission Date:
                    </Text>
                  </View>
                  <View className="gap-2 mb-4">
                    {data.allowsubmissionsfromdate !== 0 && (
                      <View className="flex-row items-center">
                        <Text className="font-bold">Start at : </Text>
                        <Text>
                          {moment(data.allowsubmissionsfromdate * 1000).format(
                            "DD/MM/YYYY HH:mm"
                          )}
                        </Text>
                      </View>
                    )}
                    {data.cutoffdate !== 0 && (
                      <View className="flex-row items-center">
                        <Text className="font-bold">due Date : </Text>
                        <Text>
                          {moment(data.cutoffdate * 1000).format(
                            "DD/MM/YYYY HH:mm"
                          )}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                {data.introattachments.length > 0 && (
                  <View className="mx-4">
                    <View className="mb-2">
                      <Text className="font-bold text-lg">Attachment</Text>
                    </View>
                    <View className="flex-row items-center gap-2 mb-4 flex-wrap justify-center">
                      {data.introattachments.map((attachment, index) => {
                        return (
                          <Pressable
                            className="flex-row rounded-lg pl-2 gap-2 w-44 h-20 items-center border border-gray-200"
                            key={index}
                            onPress={() =>
                              openDocument({
                                filename: attachment.filename,
                                type: attachment.mimetype,
                                url: `${attachment.fileurl}?token=${token}`,
                              })
                            }
                          >
                            <View className="bg-gray-100 py-4 px-1 rounded-xl">
                              <Ionicons name="attach" size={24} color="black" />
                            </View>
                            <Text numberOfLines={2} className="mr-12">
                              {attachment.filename}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}
                <View className="mx-4 pt-3 border-t border-gray-300">
                  <Text className="font-bold text-lg">Assignment History</Text>
                  {assignmentStatus.status === "loading" ||
                  assignmentStatus.status === "idle" ? (
                    <View className="mt-4">
                      <ShimmerPlaceholder
                        style={styles.shimmerAttachment}
                        LinearGradient={LinearGradient}
                      />
                    </View>
                  ) : assignmentStatus.status === "success" ? (
                    <View className="border-b border-gray-300 py-2">
                      <View className="flex-row gap-2 flex-wrap mb-2">
                        <Text className="font-bold">Submission Status:</Text>

                        <Text
                          className={`rounded px-2 text-white ${
                            assignmentStatus.data.submission.status === "new"
                              ? "bg-blue-500"
                              : assignmentStatus.data.submission.status ===
                                "submitted"
                              ? "bg-green-600"
                              : ""
                          }`}
                          numberOfLines={1}
                        >
                          {assignmentStatus.data.submission.status}
                        </Text>
                      </View>
                      <View className="flex-row gap-2 flex-wrap mb-2">
                        <Text className="font-bold">Last Modified:</Text>
                        <Text numberOfLines={1}>
                          {assignmentStatus.data.submission.timemodified !==
                            null &&
                          assignmentStatus.data.submission.timemodified > 0 &&
                          assignmentStatus.data.submission.status !== "new"
                            ? moment(
                                assignmentStatus.data.submission.timemodified *
                                  1000
                              ).format("DD/MM/YYYY HH:mm")
                            : "N/A"}
                        </Text>
                      </View>
                      {assignmentStatus.data.feedback &&
                        assignmentStatus.data.feedback.plugins &&
                        assignmentStatus.data.feedback.plugins.length > 0 &&
                        assignmentStatus.data.feedback.plugins[0].fileareas && (
                          <View className="mb-2">
                            <Text className="font-bold">Comments:</Text>
                            <HtmlRenderer
                              html={
                                assignmentStatus.data.feedback.plugins[0]
                                  .editorfields[0].text
                              }
                            />
                          </View>
                        )}
                    </View>
                  ) : (
                    <View className="items-center justify-center bg-gray-100 rounded h-28 mt-2">
                      <Text className="italic text-lg">Failed to Load</Text>
                      <Pressable
                        className="flex-row gap-2 items-center bg-primary rounded-full py-2 px-3 mt-2"
                        onPress={() => fetchAssignmentStatus(data.id)}
                      >
                        <Ionicons name="reload-sharp" size={24} color="white" />
                        <Text className="font-bold text-md text-white">
                          Reload
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
          {startDate &&
          cutoffDate &&
          assignmentStatus.data.submission.status === "new" &&
          !assignmentStatus.data.locked ? (
            <View className="mt-2 mx-4 mb-4">
              <View className="gap-1">
                {document &&
                  document.map((doc, index) => {
                    return (
                      <View
                        key={index}
                        className="flex-row items-center gap-2 rounded-xl bg-gray-200 pl-4 pr-16"
                      >
                        <Pressable onPress={() => handleCancel(doc.name)}>
                          <Ionicons name="close" size={24} color="red" />
                        </Pressable>
                        <Pressable
                          onLongPress={() => {
                            handleCancel(doc.name);
                          }}
                          onPress={() => {
                            openDocument({
                              filename: doc.name,
                              type: doc.mimeType || "",
                              file: doc.uri,
                            });
                          }}
                          className="flex-row items-center py-4 gap-2"
                        >
                          <Ionicons
                            name="file-tray-sharp"
                            size={24}
                            color="#121568"
                          />
                          <Text numberOfLines={1} className="text-base pr-12">
                            {doc.name}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
              </View>
              <Pressable
                className="bg-gray-200 p-4 rounded-lg items-center mt-2"
                onPress={() => {
                  handleSelectDocument();
                }}
              >
                <View className="flex-row items-center">
                  <Ionicons name="add" size={24} color="black" />
                  <Text>Add attachment</Text>
                </View>
              </Pressable>
              <Pressable
                className="mt-2 bg-primary p-4 rounded-lg items-center"
                onPress={() => handleUpload()}
              >
                {isLoading ? (
                  <ActivityIndicator size={"small"} color="white" />
                ) : (
                  <Text className="text-white font-bold">Submit</Text>
                )}
              </Pressable>
            </View>
          ) : assignmentStatus.data.submission.status === "new" &&
            assignmentStatus.data.locked ? (
            <View className="mt-2 mx-4 mb-4">
              <Pressable
                onPress={() => {
                  setAlertModal({
                    visible: true,
                    icon: () => (
                      <Ionicons name="infinite-sharp" size={24} color="green" />
                    ),
                    title: "Info",
                    message: "Submission Disabled",
                    confirm: () => {
                      setAlertModal({ ...alertModal, visible: false });
                    },
                  });
                }}
                style={{
                  backgroundColor: "gray",
                }}
                className="mt-2 p-4 rounded-lg items-center"
              >
                <Text className="text-white font-bold">Submission Locked</Text>
              </Pressable>
            </View>
          ) : assignmentStatus.data.submission.status === "submitted" &&
            !assignmentStatus.data.locked ? (
            <View className="mt-2 mx-4 mb-4">
              <View className="gap-1">
                {document &&
                  document.map((doc, index) => {
                    return (
                      <View
                        key={index}
                        className="flex-row items-center gap-2 rounded-xl bg-gray-200 pl-4 pr-16"
                      >
                        <Pressable onPress={() => handleCancel(doc.name)}>
                          <Ionicons name="close" size={24} color="red" />
                        </Pressable>
                        <Pressable
                          onLongPress={() => {
                            handleCancel(doc.name);
                          }}
                          onPress={() => {
                            openDocument({
                              filename: doc.name,
                              type: doc.mimeType || "",
                              file: doc.uri,
                            });
                          }}
                          className="flex-row items-center py-4 gap-2"
                        >
                          <Ionicons
                            name="file-tray-sharp"
                            size={24}
                            color="#121568"
                          />
                          <Text numberOfLines={1} className="text-base pr-12">
                            {doc.name}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
              </View>
              <Pressable
                className="bg-gray-200 p-4 rounded-lg items-center mt-2"
                onPress={() => {
                  handleSelectDocument();
                }}
              >
                <View className="flex-row items-center">
                  <Ionicons name="add" size={24} color="black" />
                  <Text>Add attachment</Text>
                </View>
              </Pressable>
              <Pressable
                className="mt-2 bg-primary p-4 rounded-lg items-center"
                onPress={() => handleUpload()}
              >
                {isLoading ? (
                  <ActivityIndicator size={"small"} color="white" />
                ) : (
                  <Text className="text-white font-bold">Re-Submit</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View className="mt-2 mx-4 mb-4">
              <Pressable
                onPress={() => {
                  setAlertModal({
                    visible: true,
                    icon: () => (
                      <Ionicons name="infinite-sharp" size={24} color="green" />
                    ),
                    title: "Info",
                    message: "Submission Disabled",
                    confirm: () => {
                      setAlertModal({ ...alertModal, visible: false });
                    },
                  });
                }}
                style={{
                  backgroundColor: "gray",
                }}
                className="mt-2 p-4 rounded-lg items-center"
              >
                <Text className="text-white font-bold">Submission Locked</Text>
              </Pressable>
            </View>
          )}
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

export default AssignmentView;
