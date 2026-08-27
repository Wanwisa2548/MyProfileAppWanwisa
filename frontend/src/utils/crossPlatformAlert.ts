// react-native-web's Alert.alert() is a no-op (see node_modules/react-native-web/dist/exports/Alert),
// so on web every Alert.alert() call in the app silently does nothing. This wrapper falls back to
// window.alert on web and keeps the native Alert.alert everywhere else.
import { Alert, Platform } from "react-native";

type AlertButton = {
  text: string;
  onPress?: () => void;
};

export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n\n${message}` : title);
    const confirmButton = buttons?.find((button) => button.onPress) ?? buttons?.[0];
    confirmButton?.onPress?.();
    return;
  }

  Alert.alert(title, message, buttons);
}
