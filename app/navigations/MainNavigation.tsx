import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TabNavigation from "./TabNavigation";
import CourseScreen from "../screens/CourseScreen";
import ModuleScreen from "../screens/ModuleScreen";
import QuizScreen from "../screens/QuizScreen";
import DownloadScreen from "../screens/DownloadScreen";

const Stack = createNativeStackNavigator();

const MainNavigation = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="tabs" component={TabNavigation} />
      <Stack.Screen name="course" component={CourseScreen} />
      <Stack.Screen name="module" component={ModuleScreen} />
      <Stack.Screen name="quiz" component={QuizScreen} />
      <Stack.Screen name="download" component={DownloadScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigation;
