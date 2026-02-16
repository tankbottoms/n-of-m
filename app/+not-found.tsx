import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { NEO } from '../constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn't exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: NEO.bg,
  },
  title: {
    fontSize: 20,
    fontFamily: NEO.fontUIBold,
    color: NEO.text,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    fontFamily: NEO.fontUI,
    color: '#2e78b7',
  },
});
