import { Image, Text, View } from "react-native";

const ErrorView = ({
  errorMessage,
  className,
}: {
  errorMessage: string;
  className?: string;
}) => {
  return (
    <View className={className}>
      <Image
        className="w-64 h-64"
        source={require("../../assets/Oops! 404 Error with a broken robot-pana.png")}
      />
      <Text className="text-3xl font-bold text-red-700">Oops...</Text>

      <Text className="font-bold">{errorMessage}</Text>
    </View>
  );
};
export default ErrorView;
