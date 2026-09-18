import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TextInput, TouchableOpacity, ScrollView, Platform, Modal, FlatList, Alert } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import DateTimePicker from '@react-native-community/datetimepicker';

const ICON_LIST = ['📚', '🏃', '💧', '🧘', '🍎', '💪', '✍️', '🎨', '🎵', '🌿', '🧠', '🛌'];

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-NZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function IconPickerModal({
  visible,
  onSelect,
  onClose,
}: {
  visible: boolean;
  onSelect: (icon: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.iconPickerContainer}>
          <Text style={styles.iconPickerTitle}>Choose an Icon</Text>
          <FlatList
            data={ICON_LIST}
            numColumns={4}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.iconPickerItem}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text style={styles.iconPickerEmoji}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function DateRow({
  label,
  enabled,
  onToggle,
  date,
  onDateChange,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
  date: Date;
  onDateChange: (d: Date) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View>
      <View style={styles.advancedRow}>
        <Text style={styles.advancedLabel}>{label}</Text>
        <Switch
          trackColor={{ false: '#D1D1D6', true: '#4CAF50' }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#D1D1D6"
          onValueChange={onToggle}
          value={enabled}
        />
      </View>

      {enabled && (
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowPicker(true)}
        >
          <Text style={styles.datePickerIcon}>📅</Text>
          <Text style={styles.datePickerText}>{formatDate(date)}</Text>
        </TouchableOpacity>
      )}

      {showPicker && enabled && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_event, selected) => {
            setShowPicker(Platform.OS === 'ios');
            if (selected) onDateChange(selected);
            if (Platform.OS === 'android') setShowPicker(false);
          }}
          minimumDate={new Date()}
          style={{ backgroundColor: '#F4FAF4' }}
        />
      )}
    </View>
  );
}

const TARGET_UNIT_MAP: Record<string, string> = {
  '1': 'seconds',
  '2': 'minutes',
  '3': 'hours',
};
const TARGET_UNIT_REVERSE: Record<string, string> = {
  seconds: '1',
  minutes: '2',
  hours: '3',
};

const REPEAT_TYPE_TO_LABEL: Record<string, 'Daily' | 'Weekly' | 'Monthly' | 'Custom'> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  custom: 'Custom',
};

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Used for the Flexible Count preview
const WEEKLY_FLEXIBLE_SUGGESTIONS: Record<number, string[]> = {
  1: ['Mon'],
  2: ['Mon', 'Thu'],
  3: ['Mon', 'Wed', 'Fri'],
  4: ['Mon', 'Tue', 'Thu', 'Sat'],
  5: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  6: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  7: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ---- Repeat schedule shape ----
export type RepeatSchedule =
  | { type: 'daily' }
  | { type: 'weekly'; mode: 'specific_days'; days: string[] }
  | { type: 'weekly'; mode: 'flexible_count'; count: number; days: string[] }
  | { type: 'monthly'; mode: 'specific_dates'; dates: number[] }
  | { type: 'monthly'; mode: 'flexible_count'; count: number }
  | { type: 'custom'; interval: number; unit: 'days' | 'weeks' };

export type HabitFormValues = {
  title: string;
  icon: string;
  target: number | null;
  target_unit: string | null;
  repeat_schedule: RepeatSchedule;
  reminder: boolean;
  start_date: string;
  end_date: string | null;
};

type InitialHabit = Partial<HabitFormValues>;

type Props = {
  initialValues?: InitialHabit;
  onSubmit: (values: HabitFormValues) => Promise<void>;
  submitLabel?: string;
  submittingLabel?: string;
};

export default function HabitForm({
  initialValues,
  onSubmit,
  submitLabel = 'Create Habit',
  submittingLabel = 'Saving...',
}: Props) {
  const isEditing = !!initialValues;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initSchedule = initialValues?.repeat_schedule;

  const [habitTitle, setHabitTitle] = useState(initialValues?.title ?? '');
  const [selectedIcon, setSelectedIcon] = useState(initialValues?.icon ?? '📚');
  const [iconPickerVisible, setIconPickerVisible] = useState(false);

  const [targetEnabled, setTargetEnabled] = useState(
    initialValues?.target != null && initialValues?.target_unit != null
  );
  const [targetNumber, setTargetNumber] = useState<string | null>(
    initialValues?.target != null ? String(initialValues.target) : '30'
  );
  const [targetType, setTargetType] = useState<string | null>(
    initialValues?.target_unit ? TARGET_UNIT_REVERSE[initialValues.target_unit] ?? '2' : '2'
  );

  const [selectedRepeat, setSelectedRepeat] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Custom'>(
    initSchedule?.type ? REPEAT_TYPE_TO_LABEL[initSchedule.type] ?? 'Daily' : 'Daily'
  );

  // ---- Weekly state ----
  const [weeklyMode, setWeeklyMode] = useState<'specific_days' | 'flexible_count'>(
    initSchedule?.type === 'weekly' && initSchedule.mode === 'flexible_count'
      ? 'flexible_count'
      : 'specific_days'
  );
  const [selectedDays, setSelectedDays] = useState<string[]>(
    initSchedule?.type === 'weekly' && initSchedule.mode === 'specific_days' ? initSchedule.days : []
  );
  const [weeklyFlexCount, setWeeklyFlexCount] = useState<string>(
    initSchedule?.type === 'weekly' && initSchedule.mode === 'flexible_count'
      ? String(initSchedule.count)
      : '3'
  );
  const [weeklyFlexAnswer, setWeeklyFlexAnswer] = useState<'yes' | 'no' | null>(
    initSchedule?.type === 'weekly' && initSchedule.mode === 'flexible_count' ? 'yes' : null
  );
  const [weeklyFlexDays, setWeeklyFlexDays] = useState<string[]>(
    initSchedule?.type === 'weekly' && initSchedule.mode === 'flexible_count' ? initSchedule.days : []
  );

  // ---- Monthly state ----
  const [monthlyMode, setMonthlyMode] = useState<'specific_dates' | 'flexible_count'>(
    initSchedule?.type === 'monthly' && initSchedule.mode === 'flexible_count'
      ? 'flexible_count'
      : 'specific_dates'
  );
  const [selectedDates, setSelectedDates] = useState<number[]>(
    initSchedule?.type === 'monthly' && initSchedule.mode === 'specific_dates' ? initSchedule.dates : []
  );
  const [monthlyFlexCount, setMonthlyFlexCount] = useState<string>(
    initSchedule?.type === 'monthly' && initSchedule.mode === 'flexible_count'
      ? String(initSchedule.count)
      : '4'
  );

  // ---- Custom state ----
  const [customInterval, setCustomInterval] = useState<string>(
    initSchedule?.type === 'custom' ? String(initSchedule.interval) : '2'
  );
  const [customUnit, setCustomUnit] = useState<'days' | 'weeks'>(
    initSchedule?.type === 'custom' ? initSchedule.unit : 'days'
  );

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(initialValues?.reminder ?? false);
  const [startDateEnabled, setStartDateEnabled] = useState(isEditing);
  const [endDateEnabled, setEndDateEnabled] = useState(!!initialValues?.end_date);
  const [startDate, setStartDate] = useState(
    initialValues?.start_date ? new Date(initialValues.start_date) : new Date()
  );
  const [endDate, setEndDate] = useState(
    initialValues?.end_date ? new Date(initialValues.end_date) : new Date()
  );

  const repeatOptions = ['Daily', 'Weekly', 'Monthly', 'Custom'] as const;

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function toggleDate(date: number) {
    setSelectedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date].sort((a, b) => a - b)
    );
  }

  function onWeeklyFlexCountChange(value: string) {
    setWeeklyFlexCount(value);
    // Count changed, so any previous yes/no answer is stale — ask again
    setWeeklyFlexAnswer(null);
    setWeeklyFlexDays([]);
  }

  function answerWeeklyFlexSuggestion(accept: boolean) {
    const count = Number(weeklyFlexCount) || 1;
    const days = accept
      ? WEEKLY_FLEXIBLE_SUGGESTIONS[count] ?? DAYS_OF_WEEK.slice(0, count)
      : DAYS_OF_WEEK.slice(0, count); // "No" -> beginning of the week, consecutive
    setWeeklyFlexDays(days);
    setWeeklyFlexAnswer(accept ? 'yes' : 'no');
  }

  function buildRepeatSchedule(): RepeatSchedule | null {
    switch (selectedRepeat) {
      case 'Daily':
        return { type: 'daily' };

      case 'Weekly':
        if (weeklyMode === 'specific_days') {
          if (selectedDays.length === 0) return null;
          return { type: 'weekly', mode: 'specific_days', days: selectedDays };
        }
        if (weeklyFlexAnswer === null) return null;
        return {
          type: 'weekly',
          mode: 'flexible_count',
          count: Number(weeklyFlexCount),
          days: weeklyFlexDays,
        };

      case 'Monthly':
        if (monthlyMode === 'specific_dates') {
          if (selectedDates.length === 0) return null;
          return { type: 'monthly', mode: 'specific_dates', dates: selectedDates };
        }
        return { type: 'monthly', mode: 'flexible_count', count: Number(monthlyFlexCount) };

      case 'Custom':
        if (!customInterval || Number(customInterval) <= 0) return null;
        return { type: 'custom', interval: Number(customInterval), unit: customUnit };

      default:
        return null;
    }
  }

  async function handleSubmit() {
    if (!habitTitle.trim()) {
      Alert.alert('Missing title', 'Please enter a name for your habit.');
      return;
    }

    const repeat_schedule = buildRepeatSchedule();
    if (!repeat_schedule) {
      if (selectedRepeat === 'Weekly' && weeklyMode === 'specific_days') {
        Alert.alert('Pick your days', 'Select at least one day of the week.');
      } else if (selectedRepeat === 'Weekly') {
        Alert.alert('Almost done', 'Let us know if the suggested schedule works for you.');
      } else if (selectedRepeat === 'Monthly') {
        Alert.alert('Pick your dates', 'Select at least one date of the month.');
      } else {
        Alert.alert('Set an interval', 'Choose how often this custom habit repeats.');
      }
      return;
    }

    setIsSubmitting(true);

    const values: HabitFormValues = {
      title: habitTitle.trim(),
      icon: selectedIcon,
      repeat_schedule,
      reminder: reminderEnabled,
      start_date: startDateEnabled ? toISODate(startDate) : toISODate(new Date()),
      target: targetEnabled ? Number(targetNumber ?? '30') : null,
      target_unit: targetEnabled ? TARGET_UNIT_MAP[targetType ?? '2'] : null,
      end_date: endDateEnabled ? toISODate(endDate) : null,
    };

    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }

  const weeklyFlexPreviewCount = Number(weeklyFlexCount) || 1;
  const weeklySuggestedDays = WEEKLY_FLEXIBLE_SUGGESTIONS[weeklyFlexPreviewCount] ?? [];

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.titleRow}>
          <TouchableOpacity style={styles.iconWrapper} onPress={() => setIconPickerVisible(true)}>
            <Text style={styles.iconEmoji}>{selectedIcon}</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.titleInput}
            onChangeText={setHabitTitle}
            value={habitTitle}
            placeholder="Habit title"
            placeholderTextColor="#B0B0B0"
          />

          <TouchableOpacity onPress={() => setIconPickerVisible(true)} style={styles.editIconBtn}>
            <Text style={styles.editIconText}>✏️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Set your target</Text>
          <Switch
            trackColor={{ false: '#D1D1D6', true: '#4CAF50' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#D1D1D6"
            onValueChange={() => setTargetEnabled(!targetEnabled)}
            value={targetEnabled}
          />
        </View>

        {targetEnabled && (
          <View style={styles.dropdownRow}>
            <Dropdown
              style={styles.dropdown}
              data={dropdownTimeNumber}
              labelField="label"
              valueField="value"
              placeholder="30"
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownSelected}
              value={targetNumber}
              onChange={(item) => setTargetNumber(item.value)}
            />
            <Dropdown
              style={styles.dropdown}
              data={dropdownTimeType}
              labelField="label"
              valueField="value"
              placeholder="Mins"
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownSelected}
              value={targetType}
              onChange={(item) => setTargetType(item.value)}
            />
          </View>
        )}

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Repeat Habit</Text>
        <View style={styles.repeatRow}>
          {repeatOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.repeatBtn,
                selectedRepeat === option && styles.repeatBtnActive,
              ]}
              onPress={() => setSelectedRepeat(option)}
            >
              <Text
                style={[
                  styles.repeatBtnText,
                  selectedRepeat === option && styles.repeatBtnTextActive,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ---------------- WEEKLY ---------------- */}
        {selectedRepeat === 'Weekly' && (
          <View style={styles.expandedContent}>
            <TouchableOpacity style={styles.radioRow} onPress={() => setWeeklyMode('specific_days')}>
              <View style={[styles.radioCircle, weeklyMode === 'specific_days' && styles.radioCircleActive]}>
                {weeklyMode === 'specific_days' && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.radioLabel}>Specific Days (recommended)</Text>
            </TouchableOpacity>

            {weeklyMode === 'specific_days' && (
              <View style={styles.dayCircleRow}>
                {DAYS_OF_WEEK.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[styles.dayCircle, selectedDays.includes(day) && styles.dayCircleActive]}
                    onPress={() => toggleDay(day)}
                  >
                    <Text
                      style={[
                        styles.dayCircleText,
                        selectedDays.includes(day) && styles.dayCircleTextActive,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.radioRow} onPress={() => setWeeklyMode('flexible_count')}>
              <View style={[styles.radioCircle, weeklyMode === 'flexible_count' && styles.radioCircleActive]}>
                {weeklyMode === 'flexible_count' && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.radioLabel}>Flexible Count</Text>
            </TouchableOpacity>

            {weeklyMode === 'flexible_count' && (
              <View>
                <View style={styles.flexCountRow}>
                  <Dropdown
                    style={styles.flexCountDropdown}
                    data={weeklyCountOptions}
                    labelField="label"
                    valueField="value"
                    value={weeklyFlexCount}
                    onChange={(item) => onWeeklyFlexCountChange(item.value)}
                  />
                  <Text style={styles.flexCountLabel}>times per</Text>
                  <View style={styles.flexCountFixed}>
                    <Text style={styles.flexCountFixedText}>Week</Text>
                  </View>
                </View>

                <Text style={styles.suggestText}>
                  For now, would you like to schedule this for {weeklySuggestedDays.join(', ')}?
                </Text>
                <View style={styles.yesNoRow}>
                  <TouchableOpacity
                    style={[styles.yesNoBtn, weeklyFlexAnswer === 'yes' && styles.yesNoBtnActive]}
                    onPress={() => answerWeeklyFlexSuggestion(true)}
                  >
                    <Text
                      style={[
                        styles.yesNoBtnText,
                        weeklyFlexAnswer === 'yes' && styles.yesNoBtnTextActive,
                      ]}
                    >
                      Yes
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.yesNoBtn, weeklyFlexAnswer === 'no' && styles.yesNoBtnActive]}
                    onPress={() => answerWeeklyFlexSuggestion(false)}
                  >
                    <Text
                      style={[
                        styles.yesNoBtnText,
                        weeklyFlexAnswer === 'no' && styles.yesNoBtnTextActive,
                      ]}
                    >
                      No
                    </Text>
                  </TouchableOpacity>
                </View>
                {weeklyFlexAnswer === 'no' && (
                  <Text style={styles.helperText}>
                    Scheduled for {weeklyFlexDays.join(', ')} (start of the week).
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* ---------------- MONTHLY ---------------- */}
        {selectedRepeat === 'Monthly' && (
          <View style={styles.expandedContent}>
            <TouchableOpacity style={styles.radioRow} onPress={() => setMonthlyMode('specific_dates')}>
              <View style={[styles.radioCircle, monthlyMode === 'specific_dates' && styles.radioCircleActive]}>
                {monthlyMode === 'specific_dates' && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.radioLabel}>Specific Dates</Text>
            </TouchableOpacity>

            {monthlyMode === 'specific_dates' && (
              <View>
                <View style={styles.dateGrid}>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => (
                    <TouchableOpacity
                      key={date}
                      style={[styles.dateCell, selectedDates.includes(date) && styles.dateCellActive]}
                      onPress={() => toggleDate(date)}
                    >
                      <Text
                        style={[
                          styles.dateCellText,
                          selectedDates.includes(date) && styles.dateCellTextActive,
                        ]}
                      >
                        {date}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.helperText}>
                  If a chosen date doesn't exist in a shorter month (e.g. the 31st in April), it'll fall on the last day of that month instead.
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.radioRow} onPress={() => setMonthlyMode('flexible_count')}>
              <View style={[styles.radioCircle, monthlyMode === 'flexible_count' && styles.radioCircleActive]}>
                {monthlyMode === 'flexible_count' && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.radioLabel}>Flexible Count</Text>
            </TouchableOpacity>

            {monthlyMode === 'flexible_count' && (
              <View>
                <View style={styles.flexCountRow}>
                  <Dropdown
                    style={styles.flexCountDropdown}
                    data={monthlyCountOptions}
                    labelField="label"
                    valueField="value"
                    value={monthlyFlexCount}
                    onChange={(item) => setMonthlyFlexCount(item.value)}
                  />
                  <Text style={styles.flexCountLabel}>times per</Text>
                  <View style={styles.flexCountFixed}>
                    <Text style={styles.flexCountFixedText}>Month</Text>
                  </View>
                </View>
                <Text style={styles.helperText}>
                  We'll spread these evenly across each month for you.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ---------------- CUSTOM ---------------- */}
        {selectedRepeat === 'Custom' && (
          <View style={styles.expandedContent}>
            <Text style={styles.expandedText}>Repeat every</Text>
            <View style={styles.flexCountRow}>
              <Dropdown
                style={styles.flexCountDropdown}
                data={customIntervalOptions}
                labelField="label"
                valueField="value"
                value={customInterval}
                onChange={(item) => setCustomInterval(item.value)}
              />
              <Dropdown
                style={styles.flexCountDropdown}
                data={customUnitOptions}
                labelField="label"
                valueField="value"
                value={customUnit}
                onChange={(item) => setCustomUnit(item.value as 'days' | 'weeks')}
              />
            </View>
            <Text style={styles.helperText}>
              e.g. every 3 days, or every 2 weeks.
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.advancedToggleRow}
          onPress={() => setShowAdvanced(!showAdvanced)}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>Advance Settings</Text>
          <Text style={styles.chevron}>{showAdvanced ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showAdvanced && (
          <View style={styles.advancedContent}>
            <View style={styles.advancedRow}>
              <Text style={styles.advancedLabel}>Remind me</Text>
              <Switch
                trackColor={{ false: '#D1D1D6', true: '#4CAF50' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#D1D1D6"
                onValueChange={() => setReminderEnabled(!reminderEnabled)}
                value={reminderEnabled}
              />
            </View>

            <View style={styles.thinDivider} />

            <DateRow
              label="Start Date"
              enabled={startDateEnabled}
              onToggle={() => setStartDateEnabled(!startDateEnabled)}
              date={startDate}
              onDateChange={setStartDate}
            />

            <View style={styles.thinDivider} />

            <DateRow
              label="End Date"
              enabled={endDateEnabled}
              onToggle={() => setEndDateEnabled(!endDateEnabled)}
              date={endDate}
              onDateChange={setEndDate}
            />
          </View>
        )}

        <TouchableOpacity
          style={[styles.createButton, isSubmitting && { opacity: 0.6 }]}
          activeOpacity={0.85}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.createButtonText}>
            {isSubmitting ? submittingLabel : submitLabel}
          </Text>
        </TouchableOpacity>

      </ScrollView>

      <IconPickerModal
        visible={iconPickerVisible}
        onSelect={setSelectedIcon}
        onClose={() => setIconPickerVisible(false)}
      />
    </View>
  );
}

const dropdownTimeNumber = [
  { label: '1', value: '1' },
  { label: '15', value: '15' },
  { label: '30', value: '30' },
  { label: '45', value: '45' },
  { label: '60', value: '60' },
];

const dropdownTimeType = [
  { label: 'Seconds', value: '1' },
  { label: 'Minutes', value: '2' },
  { label: 'Hours', value: '3' },
];

const weeklyCountOptions = ['1', '2', '3', '4', '5', '6', '7'].map((n) => ({ label: n, value: n }));
const monthlyCountOptions = ['1', '2', '3', '4', '5', '6', '8', '10', '12', '15'].map((n) => ({
  label: n,
  value: n,
}));

const customIntervalOptions = Array.from({ length: 12 }, (_, i) => String(i + 1)).map((n) => ({
  label: n,
  value: n,
}));

const customUnitOptions = [
  { label: 'Days', value: 'days' },
  { label: 'Weeks', value: 'weeks' },
];

const GREEN = '#4CAF50';
const GREEN_DARK = '#2E7D32';
const GREEN_LIGHT = '#E8F5E9';
const GREEN_MID = '#A5D6A7';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4FBEF' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 40 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 20, gap: 12 },
  iconWrapper: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FF7043', alignItems: 'center', justifyContent: 'center' },
  iconEmoji: { fontSize: 24 },
  titleInput: { flex: 1, fontSize: 17, fontWeight: '600', color: '#1A1A1A', paddingVertical: 8, borderBottomWidth: 1.5, borderBottomColor: GREEN_MID },
  editIconBtn: { padding: 4 },
  editIconText: { fontSize: 18, color: '#888' },
  divider: { height: 1, backgroundColor: '#EEEEEE', marginVertical: 20 },
  thinDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { fontSize: 15, fontWeight: '500', color: '#1A1A1A' },
  dropdownRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  dropdown: { flex: 1, height: 48, backgroundColor: GREEN_LIGHT, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: GREEN_MID },
  dropdownPlaceholder: { color: '#555', fontSize: 14 },
  dropdownSelected: { color: '#1A1A1A', fontSize: 14, fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 14 },
  repeatRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  repeatBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: GREEN_LIGHT, borderWidth: 1, borderColor: GREEN_MID },
  repeatBtnActive: { backgroundColor: GREEN, borderColor: GREEN },
  repeatBtnText: { fontSize: 14, color: '#4A7A4A', fontWeight: '500' },
  repeatBtnTextActive: { color: '#FFFFFF', fontWeight: '700' },
  expandedContent: { marginTop: 12, padding: 14, backgroundColor: GREEN_LIGHT, borderRadius: 10 },
  expandedText: { color: '#4A7A4A', fontSize: 13 },

  radioRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  radioCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: GREEN_MID, alignItems: 'center', justifyContent: 'center' },
  radioCircleActive: { borderColor: GREEN_DARK },
  radioDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: GREEN_DARK },
  radioLabel: { fontSize: 14, color: '#1A1A1A', fontWeight: '500' },

  dayCircleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginLeft: 28, marginBottom: 8 },
  dayCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: GREEN_MID, alignItems: 'center', justifyContent: 'center' },
  dayCircleActive: { backgroundColor: GREEN, borderColor: GREEN },
  dayCircleText: { fontSize: 12, color: '#4A7A4A', fontWeight: '600' },
  dayCircleTextActive: { color: '#FFFFFF' },

  flexCountRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 28, marginTop: 4, marginBottom: 8 },
  flexCountDropdown: { width: 90, height: 44, backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: GREEN_MID },
  flexCountLabel: { fontSize: 13, color: '#4A7A4A' },
  flexCountFixed: { height: 44, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: GREEN_MID, alignItems: 'center', justifyContent: 'center' },
  flexCountFixedText: { fontSize: 13, color: '#1A1A1A', fontWeight: '500' },

  suggestText: { fontSize: 13, color: '#4A7A4A', marginLeft: 28, marginTop: 4, marginBottom: 8 },
  yesNoRow: { flexDirection: 'row', gap: 10, marginLeft: 28 },
  yesNoBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: GREEN_MID },
  yesNoBtnActive: { backgroundColor: GREEN, borderColor: GREEN },
  yesNoBtnText: { fontSize: 13, color: '#4A7A4A', fontWeight: '600' },
  yesNoBtnTextActive: { color: '#FFFFFF' },
  helperText: { fontSize: 12, color: '#6B8E6B', marginLeft: 28, marginTop: 6 },

  dateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginLeft: 28, marginTop: 4 },
  dateCell: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: GREEN_MID, alignItems: 'center', justifyContent: 'center' },
  dateCellActive: { backgroundColor: GREEN, borderColor: GREEN },
  dateCellText: { fontSize: 12, color: '#4A7A4A', fontWeight: '600' },
  dateCellTextActive: { color: '#FFFFFF' },

  advancedToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chevron: { fontSize: 14, color: '#888', marginBottom: 14 },
  advancedContent: { backgroundColor: '#FAFAFA', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#EEEEEE', marginBottom: 4 },
  advancedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  advancedLabel: { fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  datePickerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: GREEN_LIGHT, borderRadius: 10, padding: 12, marginTop: 8, gap: 10, borderWidth: 1, borderColor: GREEN_MID },
  datePickerIcon: { fontSize: 18 },
  datePickerText: { fontSize: 14, color: '#2E7D32', fontWeight: '500' },
  createButton: { marginTop: 32, backgroundColor: GREEN_DARK, borderRadius: 16, paddingVertical: 18, alignItems: 'center', shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  createButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  iconPickerContainer: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, width: '80%', maxHeight: '60%', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 10 },
  iconPickerTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A', textAlign: 'center', marginBottom: 16 },
  iconPickerItem: { flex: 1, margin: 8, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: GREEN_LIGHT, borderRadius: 12 },
  iconPickerEmoji: { fontSize: 28 },
});