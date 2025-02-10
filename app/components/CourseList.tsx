import { RefreshControl, ScrollView, View } from "react-native";
import CourseCard from "./CourseCard";

const CourseList = ({ courses, refreshing, onRefresh }: any) => {
  return (
    <ScrollView
      className="pl-4 pt-1"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => onRefresh()}
          colors={["#121568"]}
        />
      }
    >
      <View className="mt-4 gap-3 flex-1 flex-row flex-wrap">
        {courses.map((course: any) => {
          return (
            <CourseCard
              key={course.id}
              id={course.id}
              fullname={course.fullname}
              shortname={course.shortname}
              siswa={course.enrolledusercount}
            />
          );
        })}
      </View>
    </ScrollView>
  );
};

export default CourseList;
