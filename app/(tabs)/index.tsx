import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
    return (
    <View style={styles.container}>
      <Text style={styles.title}>Habit Garden</Text>
      <Text>Description of app here</Text>
      <Button
        title="Create Habit"
        onPress={() => router.push('/newhabit')}       // should open a new page to create a habit
        color="#355336"
      />
    </View>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4FBEF',
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});