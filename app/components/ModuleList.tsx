import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useState } from "react";
import ModuleCard from "./ModuleCard";

const ModuleList = ({
  detail,
  handleManualCompletion,
  handleCompletionByView,
  isLoading,
}: {
  detail: any;
  handleCompletionByView: any;
  handleManualCompletion: any;
  isLoading: any;
}) => {
  const [isShow, setIsShow] = useState<{ [key: number]: boolean }>({});
  return (
    <View className="mx-4 px-4 my-3 rounded-lg shadow bg-white">
      <View className="flex-row justify-between">
        <Pressable
          className="pt-4 pr-4 pb-4"
          onPress={() =>
            setIsShow((prevStates) => {
              return {
                ...prevStates,
                [detail.id]: !prevStates[detail.id],
              };
            })
          }
        >
          <View className="pl-4">
            <Text
              numberOfLines={1}
              className="text-base font-bold text-wrap max-w-80"
            >
              Modul: {detail.name}
            </Text>
          </View>
        </Pressable>
        <Pressable
          className="pt-6 pb-4"
          onPress={() =>
            setIsShow((prevStates) => {
              return {
                ...prevStates,
                [detail.id]: !prevStates[detail.id],
              };
            })
          }
        >
          <Ionicons
            name={
              !isShow[detail.id]
                ? "chevron-down-sharp"
                : "chevron-forward-sharp"
            }
            size={18}
            color="black"
          />
        </Pressable>
      </View>
      {detail.modules?.map((module: any, index: number) =>
        !isShow[detail.id] ? (
          <ModuleCard
            key={index}
            module={module}
            handleCompletionByView={handleCompletionByView}
            handleManualCompletion={handleManualCompletion}
            isLoading={isLoading}
          />
        ) : null
      )}
    </View>
  );
};

export default ModuleList;
