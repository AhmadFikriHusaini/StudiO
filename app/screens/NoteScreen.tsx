import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import SafeView from "../components/SafeView";
import { Ionicons } from "@expo/vector-icons";
import { NoteDatabases } from "../utils/sql/transaction";
import { useEffect, useRef, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { useIsFocused } from "@react-navigation/native";
import {
  Swipeable,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import ShimmerPlaceholder from "react-native-shimmer-placeholder";
import { LinearGradient } from "expo-linear-gradient";

const NoteScreen = () => {
  const db = useSQLiteContext();
  const noteDB = NoteDatabases();
  const isFocused = useIsFocused();
  const [notes, setNotes] = useState<any>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isEmpty, setIsEmpty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setIsEditingId] = useState(0);
  const [isFetching, setIsFetching] = useState(true);

  const swipeableRefs = useRef<any>([]);

  const fetchNotes = async () => {
    try {
      const response = await noteDB.getNotes(db);
      setNotes(response);
    } catch (error) {
      alert(error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleAddNote = async () => {
    if (title === "" || content === "") {
      setIsEmpty(true);
      setIsSaving(false);
      return;
    }
    try {
      setIsSaving(true);
      await noteDB.addNote(db, title, content);
      fetchNotes();
      setTitle("");
      setContent("");
      setModalVisible(false);
    } catch (error) {
      alert(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditing = (id: number) => {
    const swipeableInstance = swipeableRefs.current[id];
    if (swipeableInstance) swipeableInstance.close();
    setIsEditing(true);
    setIsEditingId(id);
    const note = notes.find((note: any) => note.id === id);
    setTitle(note.title);
    setContent(note.content);
    setModalVisible(true);
  };

  const handleUpdateNote = async (id: number) => {
    if (title === "" || content === "") {
      setIsEmpty(true);
      setIsSaving(false);
      return;
    }
    try {
      setIsSaving(true);
      await noteDB.updateNote(db, id, title, content);
      fetchNotes();
      setTitle("");
      setContent("");
      setModalVisible(false);
    } catch (error) {
      alert(error);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const handleDeleteNote = async (id: number) => {
    const swipeableInstance = swipeableRefs.current[id];
    if (swipeableInstance) swipeableInstance.close();
    try {
      await noteDB.deleteNote(db, id);
      fetchNotes();
    } catch (error) {
      alert(error);
    }
  };

  const renderLeftActions = (id: number) => (
    <Pressable
      className="bg-orange-500 justify-center items-start px-6 w-80 -mr-60 rounded-l-lg"
      onPress={() => handleEditing(id)}
    >
      <Ionicons name="pencil-sharp" size={24} color="white" />
    </Pressable>
  );

  const renderRightActions = (id: number) => (
    <Pressable
      className="bg-red-500 justify-center items-end px-6 w-80 -ml-60 rounded-r-lg"
      onPress={() => handleDeleteNote(id)}
    >
      <Ionicons name="trash-sharp" size={24} color="white" />
    </Pressable>
  );

  useEffect(() => {
    if (isFocused) {
      StatusBar.setBarStyle("dark-content");
      StatusBar.setBackgroundColor("white");
      fetchNotes();
    }
  }, [isFocused]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeView className="flex-1 bg-white">
        <Modal visible={modalVisible} transparent animationType="fade">
          <Pressable
            onPress={() => setModalVisible(!modalVisible)}
            className="flex-1 bg-black bg-opacity-50"
          >
            <View className="bg-white h-fit mx-4 mt-4 rounded-lg pt-3 px-4 shadow drop-shadow-2xl border border-gray-100">
              <View className="items-center">
                <Text className="font-bold">
                  {isEditing ? "Update Note" : "Add Note"}
                </Text>
              </View>
              <View className="mt-2 gap-2">
                <TextInput
                  className="border border-gray-200 pl-3 rounded-lg h-12"
                  placeholder="Title"
                  value={title}
                  onChangeText={(text) => {
                    setIsEmpty(false);
                    setTitle(text);
                  }}
                />
                <TextInput
                  className="border border-gray-200 px-3 rounded-lg h-28"
                  placeholder="Note"
                  value={content}
                  multiline
                  onChangeText={(text) => {
                    setIsEmpty(false);
                    setContent(text);
                  }}
                />
              </View>
              {isEmpty && (
                <View className="my-1">
                  <Text className="text-red-400">
                    *Note: empty field detected
                  </Text>
                </View>
              )}
              <View className="mt-3 flex-row justify-end gap-4 mb-4">
                <Pressable
                  className="bg-green-200 py-1 items-center w-20 rounded-lg"
                  onPress={() =>
                    isEditing ? handleUpdateNote(editingId) : handleAddNote()
                  }
                >
                  {isSaving ? (
                    <ActivityIndicator color="green" size="small" />
                  ) : (
                    <Ionicons name="checkmark-sharp" size={20} color="green" />
                  )}
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Modal>
        <View className="px-6 py-4 justify-center">
          <Text className="font-bold text-primary text-3xl">Notes</Text>
        </View>
        {isFetching ? (
          <View className="mx-4 flex-1">
            {Array.from({ length: 4 }).map((_, index) => (
              <ShimmerPlaceholder
                key={index}
                style={{
                  height: 100,
                  width: "100%",
                  borderRadius: 10,
                  marginBottom: 10,
                }}
                LinearGradient={LinearGradient}
              />
            ))}
          </View>
        ) : notes.length > 0 ? (
          <ScrollView className="mx-4">
            {notes.map((note: any, index: number) => (
              <Swipeable
                key={note.id}
                ref={(ref) => (swipeableRefs.current[note.id] = ref)}
                renderLeftActions={() => renderLeftActions(note.id)}
                renderRightActions={() => renderRightActions(note.id)}
                containerStyle={{
                  backgroundColor: "#fff",
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: "#f1f1f1",
                  borderRadius: 10,
                }}
              >
                <View className="bg-white py-4 px-4 rounded-lg">
                  <Text className="font-bold">{note.title}</Text>
                  <Text>{note.content}</Text>
                </View>
              </Swipeable>
            ))}
          </ScrollView>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-400">No notes found</Text>
          </View>
        )}
        {!isFetching && (
          <Pressable
            className="absolute bottom-4 right-4"
            onPress={() => {
              setTitle("");
              setContent("");
              setModalVisible(true);
            }}
          >
            <Ionicons name="add-circle-sharp" size={55} color="#121568" />
          </Pressable>
        )}
      </SafeView>
    </GestureHandlerRootView>
  );
};

export default NoteScreen;
