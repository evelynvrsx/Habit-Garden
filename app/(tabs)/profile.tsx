import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, PanResponder, Switch } from 'react-native';
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
  const [reinforcementRate, setReinforcementRate] = useState(100);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [{ data: habitsData }, { data: logsData }, settings] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('habit_logs').select('habit_id, date, completed').eq('completed', true),
        getUserSettings(user.id).catch(() => ({ reinforcement_mode: 100 })), // Fallback if table doesn't exist yet
      ]);

      const rate = settings?.reinforcement_mode ?? 100;
      if (settings) {
        setReinforcementRate(rate);
      }
      if (habitsData && logsData) {
        // Pass rate through so this agrees with Home/Stats on what the
        // headline streak means in the current reinforcement mode.
        setStreak(calculateHeadlineStreak(habitsData as Habit[], logsData as HabitLog[], new Date(), rate));
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
      // Streak display depends on the tier (Encouraging swaps in the
      // cumulative growth count), so recompute it against the new rate
      // rather than waiting for the next focus/fetch.
      const [{ data: habitsData }, { data: logsData }] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('habit_logs').select('habit_id, date, completed').eq('completed', true),
      ]);
      if (habitsData && logsData) {
        setStreak(calculateHeadlineStreak(habitsData as Habit[], logsData as HabitLog[], new Date(), newRate));
      }
    } catch (error) {
      console.warn('Error updating reinforcement rate:', error);
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
          </View>
        </View>
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
            <Text style={styles.sliderLabelText}>Disciplined</Text>
            <Text style={styles.sliderLabelText}>Balanced</Text>
            <Text style={styles.sliderLabelText}>Encouraging</Text>
          </View>
          <Text style={styles.tierHint}>
            Current style: <Text style={styles.tierName}>{getReinforcementTier(reinforcementRate)}</Text>
          </Text>
        </View>

        <FAQSection />

        <TouchableOpacity style={[styles.logoutButton]} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function FAQSection() {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.faqContainer}>
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.faqHeaderLeft}>
          <Ionicons name="help-circle-outline" size={20} color={GREEN_DARK} />
          <Text style={styles.faqTitle}>About Reinforcement Modes</Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={GREEN_MID}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.faqContent}>
          <View style={styles.faqItem}>
            <Text style={styles.faqItemTitle}>Disciplined</Text>
            <Text style={styles.faqItemText}>
              Strict accountability. Miss one day, and your streak resets to 0.
              Notifications are firm and direct.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqItemTitle}>Balanced</Text>
            <Text style={styles.faqItemText}>
              A safety net. You get 1 "Grace Day". Missing one day pauses your streak
              instead of resetting it. Notifications are supportive.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqItemTitle}>Encouraging</Text>
            <Text style={styles.faqItemText}>
              Growth focused. Your streak never resets; it counts your total lifetime
              completions. Notifications are positive and celebratory.
            </Text>
          </View>
        </View>
      )}
    </View>
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
  return (
    <View style={styles.sliderTrack}>
      <View style={[styles.sliderFill, { width: `${value}%` }]} />
      <View style={[styles.sliderThumb, { left: `${value}%` }]} />

      {/* 3 Step markers */}
      <View style={styles.stepContainer}>
        <View style={[styles.stepDot, value >= 0 && styles.stepDotActive]} />
        <View style={[styles.stepDot, value >= 50 && styles.stepDotActive]} />
        <View style={[styles.stepDot, value >= 100 && styles.stepDotActive]} />
      </View>

      <View style={styles.tierButtons}>
        <TouchableOpacity style={styles.tierButton} onPress={() => onChange(0)} />
        <TouchableOpacity style={styles.tierButton} onPress={() => onChange(50)} />
        <TouchableOpacity style={styles.tierButton} onPress={() => onChange(100)} />
      </View>
    </View>
  );
}

const GREEN_BG = '#F4FBEF';
const GREEN_DARK = '#2D4A34';
const GREEN_MID = '#6B8F5F';
const GREEN_LIGHT = '#DCEACF';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: GREEN_BG },
  content: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: GREEN_BG },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: GREEN_LIGHT },
  headerInfo: { marginLeft: 16, flex: 1 },
  userName: { fontSize: 22, fontWeight: '700', color: GREEN_DARK },
  headerStats: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  headerStatText: { fontSize: 14, color: GREEN_MID, marginRight: 12 },

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
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
    marginLeft: -12,
    zIndex: 10
  },
  stepContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    opacity: 0.5
  },
  stepDotActive: {
    backgroundColor: '#fff',
    opacity: 1
  },
  tierButtons: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    flexDirection: 'row',
    zIndex: 20
  },
  tierButton: { flex: 1 },

  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingHorizontal: 2 },
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
  logoutButtonText: { color: '#e74c3c', fontWeight: '700', fontSize: 16 },

  faqContainer: {
    backgroundColor: '#F9FCF7',
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E8F2E3',
    overflow: 'hidden'
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F1F8E9'
  },
  faqHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  faqTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: GREEN_DARK
  },
  faqContent: {
    padding: 12,
    gap: 12
  },
  faqItem: {
    gap: 4
  },
  faqItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: GREEN_DARK
  },
  faqItemText: {
    fontSize: 12,
    color: '#556B4B',
    lineHeight: 16
  }
});