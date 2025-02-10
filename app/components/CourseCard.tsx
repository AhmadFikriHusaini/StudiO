import { StackActions, useNavigation } from "@react-navigation/native";
import { Pressable, Text, View } from "react-native";
import { useCourse } from "../utils/context/courseContext";

const CourseCard = ({ id, fullname, shortname, siswa }: any) => {
  const navigation = useNavigation();
  const { setCourseid } = useCourse();

  return (
    <Pressable
      onPress={() => {
        setCourseid(id);
        navigation.dispatch(
          StackActions.push("course", { courseId: id, courseName: fullname })
        );
      }}
    >
      <View className="w-44 h-36 rounded-xl bg-white border border-gray-200 justify-end">
        <View className="flex-1 justify-start mt-2">
          <View className="flex-row items-center">
            <Text className="font-bold text-gray-500 text-3xl ml-4">
              {siswa}
            </Text>
          </View>
        </View>
        <View className="bg-primary justify-center rounded-b-xl px-4 py-2">
          <Text className="font-bold text-base text-white">{shortname}</Text>
        </View>
      </View>
    </Pressable>
  );
};

export default CourseCard;
