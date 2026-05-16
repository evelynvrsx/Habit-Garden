import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
    const navigation = useNavigation();
    return (
    <View style={styles.container}>
      <Text style={styles.title}>Habit Garden</Text>
      <Text>Description of app here</Text>
      <Button
        title="Create Habit"
        onPress={() => navigation.navigate('NewHabit')}       // should open a new page to create a habit
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