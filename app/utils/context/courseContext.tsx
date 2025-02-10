import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from "react";

type courseContextProps = {
  courseid: number;
  setCourseid: Dispatch<SetStateAction<number>>;
};

const CourseContext = createContext<courseContextProps | undefined>(undefined);

const useCourse = (): courseContextProps => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error(
      "CourseContext must be used within an courseContextProvider"
    );
  }

  return context;
};

const CourseContextProvider = (props: { children: ReactNode }) => {
  const [courseid, setCourseid] = useState<number>(0);
  return (
    <CourseContext.Provider {...props} value={{ courseid, setCourseid }} />
  );
};

export { useCourse, CourseContextProvider };
