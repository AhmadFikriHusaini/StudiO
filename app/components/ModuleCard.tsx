import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StackActions, useNavigation } from "@react-navigation/native";

const ModuleCard = ({
  module,
  handleCompletionByView,
  handleManualCompletion,
  isLoading,
}: {
  module: any;
  handleCompletionByView: any;
  handleManualCompletion: any;
  isLoading: any;
}) => {
  const navigation = useNavigation();
  return (
    <View className="border-t border-gray-300 mb-2 rounded-xl items-center flex-row justify-between min-h-16">
      <Pressable
        onPress={async () => {
          await handleCompletionByView(
            module.instance,
            module.modname,
            module.completion
          );
          navigation.dispatch(
            StackActions.push("module", {
              name: module.name,
              modname: module.modname,
              id: module.id,
            })
          );
        }}
        className="flex-1 pl-4 w-fit justify-center pr-2 py-2"
      >
        <View className="flex-row flex-wrap gap-x-2">
          <Text className="font-bold">{`${module.modname} : `}</Text>
          <Text numberOfLines={1}>{module.name}</Text>
        </View>
      </Pressable>
      <View className="mr-2">
        {module.completion === 1 ? (
          <Pressable
            onPress={async () => {
              await handleManualCompletion(
                module.id,
                module.completiondata.state
              );
            }}
          >
            {module.completiondata.state === 1 ? (
              <View className="px-2 py-1">
                {isLoading[module.id] === true ? (
                  <ActivityIndicator size={25} color="#121568" />
                ) : (
                  <Ionicons
                    name="checkmark-circle-sharp"
                    size={23}
                    color="green"
                  />
                )}
              </View>
            ) : (
              <View className="px-2 py-1">
                {isLoading[module.id] === true ? (
                  <ActivityIndicator size={25} color="#121568" />
                ) : (
                  <Ionicons
                    name="checkmark-circle-sharp"
                    size={23}
                    color="gray"
                  />
                )}
              </View>
            )}
          </Pressable>
        ) : module.completiondata && module.completiondata.isoverallcomplete ? (
          <View className="mr-2">
            <Ionicons name="checkmark-circle-sharp" size={23} color="green" />
          </View>
        ) : null}
      </View>
    </View>
  );
};

export default ModuleCard;
