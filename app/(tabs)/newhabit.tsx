import React from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import HabitForm, { HabitFormValues } from '../../components/HabitForm';

export default function NewHabitScreen() {
  const { session } = useAuth();
  const [formKey, setFormKey] = React.useState(0);

  async function handleCreate(values: HabitFormValues) {
    if (!session?.user) {
      Alert.alert('Not signed in', 'Please log in again and try creating your habit.');
      return;
    }

    const { error } = await supabase
      .from('habits')
      .insert([{ ...values, user_id: session.user.id }]);

    if (error) {
      console.error('Supabase insert error:', error);
      Alert.alert('Could not create habit', `${error.message} (${error.code})`);
      return;
    }

    Alert.alert('Habit created!', 'Your new habit has been added.', [
      {
        text: 'OK',
        onPress: () => {
          setFormKey((prev) => prev + 1);
          router.back();
        },
      },
    ]);
  }

  return <HabitForm key={formKey} onSubmit={handleCreate} submitLabel="Create Habit" />;
}