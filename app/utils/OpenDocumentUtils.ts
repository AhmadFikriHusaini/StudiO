import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import { Alert, Platform } from "react-native";

const runIntent = async (decryptUri: string, type: string) => {
  try {
    const intent = {
      data: decryptUri,
      flags: 1,
      type: type,
    };
    await IntentLauncher.startActivityAsync(
      "android.intent.action.VIEW",
      intent
    );
  } catch (error: any) {
    return Alert.alert(
      "Error!",
      "Could not open the document. Please make sure you have an app that can open this type of file."
    );
  }
};

export const openDocument = async ({
  filename,
  type,
  url,
  file,
}: {
  filename: string;
  type: string;
  url?: string;
  file?: string;
}) => {
  try {
    if (!file && !url) {
      throw new Error("No file or URL provided");
    }

    if (file) {
      const decryptUri = await FileSystem.getContentUriAsync(file);
      if (Platform.OS !== "android") {
        console.log("Platform not supported");
        throw new Error("Platform not supported");
      }
      await runIntent(decryptUri, type);
    }

    if (url) {
      const local = FileSystem.documentDirectory + filename;
      const { uri } = await FileSystem.downloadAsync(url, local);
      const decryptUri = await FileSystem.getContentUriAsync(uri);
      if (Platform.OS !== "android") {
        console.log("Platform not supported");
        throw new Error("Platform not supported");
      }
      await runIntent(decryptUri, type);
    }
  } catch (error: any) {
    throw error;
  }
};
