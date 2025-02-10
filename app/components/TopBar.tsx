import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Pressable, Text, View } from "react-native";

const TopBar = ({ name }: { name: any }) => {
  const navigation = useNavigation();
  return (
    <View className="h-16 bg-white flex-row items-center justify-between">
      <View className="flex-row items-center gap-3">
        <Pressable className="ml-3 h-12 w-12 items-center justify-center rounded-full">
          <Ionicons
            name="chevron-back-sharp"
            size={25}
            color="#000"
            onPress={() => {
              navigation.goBack();
            }}
          />
        </Pressable>
        <View className="w-56">
          <Text numberOfLines={1} className="text-xl font-bold">
            {name}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default TopBar;
