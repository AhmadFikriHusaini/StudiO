import { NavigationContainer } from "@react-navigation/native";
import AuthNavigation from "./AuthNavigation";
import { useAppSelector } from "../redux/Hooks";
import { selectAuth } from "../features/auth/AuthSlice";
import MainNavigation from "./MainNavigation";
import { CourseContextProvider } from "../utils/context/courseContext";

const RootNavigation = () => {
  const auth = useAppSelector(selectAuth);
  return (
    <NavigationContainer>
      {auth.data.isLogin && auth.data.userid ? (
        <CourseContextProvider>
          <MainNavigation />
        </CourseContextProvider>
      ) : (
        <AuthNavigation />
      )}
    </NavigationContainer>
  );
};

export default RootNavigation;
