import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { AuthProvider, useAuth } from '../context/AuthContext';

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  console.log('RootLayoutNav render:', { loading, session: !!session, segments });

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // If the user is not signed in and the initial segment is not (auth)
      // redirect them to the login page.
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // If the user is signed in and the initial segment is (auth)
      // redirect them to the garden page.
      router.replace('/(tabs)/garden');
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" />
        </View>
    )
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}