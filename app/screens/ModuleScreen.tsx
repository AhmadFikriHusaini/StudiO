import ModuleDetail from "../components/ModuleDetail";
import SafeView from "../components/SafeView";

const ModuleScreen = ({ route }: any) => {
  const { name, modname, id } = route.params;
  return (
    <SafeView className="flex-1">
      <ModuleDetail name={name} modname={modname} id={id} />
    </SafeView>
  );
};

export default ModuleScreen;
