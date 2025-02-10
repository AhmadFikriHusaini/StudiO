import { useEffect, useState } from "react";
import { View, Text } from "react-native";

const Timer = ({
  duration,
  className,
  textStyle,
  modalVisible,
}: {
  duration: number;
  className?: string;
  textStyle?: string;
  modalVisible?: () => void;
}) => {
  const [timer, setTimer] = useState(duration);
  const formatedTime = () => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
  };
  useEffect(() => {
    if (timer <= 0) {
      modalVisible && modalVisible();
    }
    const countdown = setInterval(() => {
      setTimer(timer - 1);
    }, 1000);
    countdown;
    return () => clearInterval(countdown);
  }, [timer]);
  return (
    <View className={className}>
      {
        <Text className={textStyle}>
          {timer <= 0 ? "Time's up!" : formatedTime()}
        </Text>
      }
    </View>
  );
};

export default Timer;
