import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useState } from 'react';
import { supabase } from '../../lib/supabase'; // adjust path to match your project

export default function ProfileScreen() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) Alert.alert('Logout failed', error.message);
    // AuthContext picks it up, _layout redirects to /login
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Profile Screen</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Logging out...' : 'Log Out'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    marginTop: 20,
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});