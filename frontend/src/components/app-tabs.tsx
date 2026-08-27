import { StyleSheet, Text, View } from 'react-native';

export default function AppTabs() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>App tabs</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
