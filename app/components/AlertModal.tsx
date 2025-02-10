import { Modal, View, Text, Pressable } from "react-native";

const AlertModal = ({
  visible,
  title,
  message,
  cancel,
  confirm,
  icon,
}: {
  visible: boolean;
  title: string;
  message: string;
  cancel?: () => void;
  confirm?: () => void;
  icon?: () => JSX.Element;
  iconColor?: string;
}) => {
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.3)",
        }}
      >
        <View
          style={{
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
          className="bg-white pt-4 rounded-xl w-80 max-h-72 px-4"
        >
          <View className="flex-row gap-2 pt-3 pb-4">
            {icon && icon()}
            <View className="mr-12">
              <Text className="font-bold text-xl">{title}</Text>
              <Text>{message}</Text>
            </View>
          </View>
          <View className="flex-row justify-end items-center gap-3 mb-2 mr-2">
            {cancel && (
              <Pressable className="p-2 items-center" onPress={cancel}>
                <Text className="text-primary font-bold text-lg">Cancel</Text>
              </Pressable>
            )}
            {confirm && (
              <Pressable className="p-2 items-center" onPress={confirm}>
                <Text className="text-primary font-bold text-lg">Confirm</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AlertModal;
