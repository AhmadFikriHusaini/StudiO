import { ReactNode } from "react";
import { View } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const SafeView = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaProvider>
      <View
        style={{
          display: "flex",
          marginTop: insets.top,
          marginBottom: insets.bottom,
          marginLeft: insets.left,
          marginRight: insets.right,
        }}
        className={className}
      >
        {children}
      </View>
    </SafeAreaProvider>
  );
};

export default SafeView;
