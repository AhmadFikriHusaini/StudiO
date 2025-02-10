import "./global.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import RootNavigation from "./app/navigations/RootNavigation";
import { Provider } from "react-redux";
import { store } from "./app/redux/Store";
import { SQLiteProvider } from "expo-sqlite";
import { initializeDB } from "./app/utils/sql/transaction";

export default function App() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <SQLiteProvider databaseName="StudiO.db" onInit={initializeDB}>
          <RootNavigation />
        </SQLiteProvider>
      </Provider>
    </SafeAreaProvider>
  );
}
