import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { calculateHeadlineStreak } from '../../lib/stats';
import { Habit, HabitLog } from '../../lib/types';
import { getUserSettings, updateReinforcementRate } from '../../lib/userSettings';
import { getReinforcementTier } from '../../lib/reinforcement';

export default function ProfileScreen() {
  const { session } = useAuth();
  const user = session?.user;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [streak, setStreak] = useState(0);
  const [reinforcementRate, setReinforcementRate] = useState(50);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [{ data: habitsData }, { data: logsData }, settings] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('habit_logs').select('habit_id, date, completed').eq('completed', true),
        getUserSettings(user.id).catch(() => ({ reinforcement_rate: 50 })), // Fallback if table doesn't exist yet
      ]);

      if (habitsData && logsData) {
        setStreak(calculateHeadlineStreak(habitsData as Habit[], logsData as HabitLog[]));
      }
      if (settings) {
        setReinforcementRate(settings.reinforcement_rate);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Logout failed', error.message);
  };

  const handleSliderChange = async (newRate: number) => {
    setReinforcementRate(newRate);
    if (!user) return;
    setSaving(true);
    try {
      await updateReinforcementRate(user.id, newRate);
    } catch (error) {
      console.error('Error updating reinforcement rate:', error);
      Alert.alert('Error', 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#2D4A34" size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://via.placeholder.com/100' }}
          style={styles.avatar}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>{user?.email?.split('@')[0] || 'User'}</Text>
          <View style={styles.headerStats}>
            <Text style={styles.headerStatText}>🔥 {streak} day streak</Text>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>⭐ 0 points</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <MenuItem icon="person-outline" label="Personal info" />
        <MenuItem icon="notifications-outline" label="Notifications" />
        <MenuItem icon="lock-closed-outline" label="Privacy & Security" />
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>

        <View style={styles.reinforcementContainer}>
          <View style={styles.reinforcementHeader}>
            <Text style={styles.reinforcementLabel}>Reinforcement Mode</Text>
            {saving && <ActivityIndicator size="small" color="#2D4A34" />}
          </View>

          <ReinforcementSlider
            value={reinforcementRate}
            onChange={handleSliderChange}
          />

          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>Direct</Text>
            <Text style={styles.sliderLabelText}>Encouraging</Text>
          </View>
          <Text style={styles.tierHint}>
            Current style: <Text style={styles.tierName}>{getReinforcementTier(reinforcementRate)}</Text>
          </Text>
        </View>

        <MenuItem icon="help-circle-outline" label="FAQ" />
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Text style={[styles.menuItemText, { color: '#e74c3c' }]}>Delete account</Text>
          <Ionicons name="chevron-forward" size={20} color="#e74c3c" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.logoutButton]} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function MenuItem({ icon, label }: { icon: any; label: string }) {
  return (
    <TouchableOpacity style={styles.menuItem}>
      <View style={styles.menuItemLeft}>
        <Ionicons name={icon} size={20} color="#2D4A34" style={styles.menuIcon} />
        <Text style={styles.menuItemText}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#6B8F5F" />
    </TouchableOpacity>
  );
}

function ReinforcementSlider({ value, onChange }: { value: number; onChange: (val: number) => void }) {
  // Simple custom slider since we don't have @react-native-community/slider
  return (
    <View style={styles.sliderTrack}>
      <TouchableOpacity
        style={styles.sliderTouchable}
        activeOpacity={1}
        onPress={(e) => {
          const { locationX } = e.nativeEvent;
          // Assuming width is roughly constant or we can get it via onLayout
          // For now, let's use a fixed width or just 3 positions
        }}
      >
        <View style={[styles.sliderFill, { width: `${value}%` }]} />
        <View style={[styles.sliderThumb, { left: `${value}%` }]} />

        {/* Simple tier selection */}
        <View style={styles.tierButtons}>
          <TouchableOpacity style={styles.tierButton} onPress={() => onChange(0)} />
          <TouchableOpacity style={styles.tierButton} onPress={() => onChange(50)} />
          <TouchableOpacity style={styles.tierButton} onPress={() => onChange(100)} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const GREEN_BG = '#F7F9F5';
const GREEN_DARK = '#2D4A34';
const GREEN_MID = '#6B8F5F';
const GREEN_LIGHT = '#DCEACF';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: GREEN_LIGHT },
  headerInfo: { marginLeft: 16, flex: 1 },
  userName: { fontSize: 22, fontWeight: '700', color: GREEN_DARK },
  headerStats: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  headerStatText: { fontSize: 14, color: GREEN_MID, marginRight: 12 },
  pointsBadge: { backgroundColor: GREEN_LIGHT, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  pointsText: { fontSize: 12, color: GREEN_DARK, fontWeight: '600' },

  section: {
    backgroundColor: '#FAFBF9',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F0F2EE'
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: GREEN_DARK, marginBottom: 16 },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2EE'
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { marginRight: 12 },
  menuItemText: { fontSize: 16, color: GREEN_DARK, fontWeight: '500' },

  reinforcementContainer: { marginVertical: 8 },
  reinforcementHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reinforcementLabel: { fontSize: 16, fontWeight: '600', color: GREEN_DARK },

  sliderTrack: {
    height: 12,
    backgroundColor: GREEN_LIGHT,
    borderRadius: 6,
    marginVertical: 10,
    position: 'relative',
    overflow: 'visible'
  },
  sliderTouchable: { flex: 1, position: 'relative' },
  sliderFill: { height: '100%', backgroundColor: GREEN_DARK, borderRadius: 6 },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: GREEN_DARK,
    position: 'absolute',
    top: -6,
    marginLeft: -12
  },
  tierButtons: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  tierButton: { flex: 1 },

  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  sliderLabelText: { fontSize: 12, color: GREEN_MID, fontWeight: '500' },
  tierHint: { fontSize: 12, color: GREEN_MID, marginTop: 8, textAlign: 'center' },
  tierName: { fontWeight: '700', color: GREEN_DARK, textTransform: 'capitalize' },

  logoutButton: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#FDECEC'
  },
  logoutButtonText: { color: '#e74c3c', fontWeight: '700', fontSize: 16 }
});
