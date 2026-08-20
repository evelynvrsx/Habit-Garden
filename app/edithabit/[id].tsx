import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import HabitForm, { HabitFormValues } from '../../components/HabitForm';

export default function EditHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [habit, setHabit] = useState<HabitFormValues | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('id', id)
        .single();

      if (cancelled) return;

      if (error || !data) {
        console.error('Error loading habit:', error?.message);
        Alert.alert('Could not load habit', 'Please try again.');
        router.back();
        return;
      }

      setHabit(data);
      setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  async function handleUpdate(values: HabitFormValues) {
    const { error } = await supabase
      .from('habits')
      .update(values)
      .eq('id', id);

    if (error) {
      console.error('Supabase update error:', error);
      Alert.alert('Could not save changes', `${error.message} (${error.code})`);
      return;
    }

    router.back();
  }

  if (loading || !habit) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Stack.Screen options={{ title: 'Edit Habit', headerShown: true, headerTitleAlign: 'center' }} />
        <ActivityIndicator color="#2E7D32" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Habit', headerShown: true, headerTitleAlign: 'center' }} />
      <HabitForm initialValues={habit} onSubmit={handleUpdate} submitLabel="Save Changes" submittingLabel="Saving..." />
    </>
  );
}