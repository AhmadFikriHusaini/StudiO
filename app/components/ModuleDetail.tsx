import { StatusBar, View } from "react-native";
import UrlView from "./UrlView";
import ResourceView from "./ResourceView";
import QuizView from "./QuizView";
import AssigmentView from "./AssigmentView";
import { useEffect } from "react";
import { useIsFocused } from "@react-navigation/native";

type routeProps = {
  name: string;
  modname: string;
  id: number;
};

const ModuleDetail = ({ modname, id, name }: routeProps) => {
  const isFocused = useIsFocused();
  const moduleType = [
    {
      name: "url",
      component: () => <UrlView id={id} name={name} />,
    },
    {
      name: "resource",
      component: () => <ResourceView id={id} name={name} />,
    },
    {
      name: "quiz",
      component: () => <QuizView id={id} name={name} />,
    },
    {
      name: "assign",
      component: () => <AssigmentView id={id} name={name} />,
    },
  ];

  useEffect(() => {
    if (isFocused) {
      StatusBar.setBarStyle("dark-content");
      StatusBar.setBackgroundColor("#fff");
    }
  }, [isFocused]);

  return (
    <View className="flex-1 bg-white">
      {moduleType.map((module) => {
        if (module.name === modname) {
          return (
            <View key={id} className="flex-1">
              {module.component()}
            </View>
          );
        }
      })}
    </View>
  );
};

export default ModuleDetail;
