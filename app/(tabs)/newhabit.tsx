import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TextInput } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';

export default function NewHabitScreen() {
  const [number, onChangeNumber] = React.useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const toggleSwitch = () => setIsEnabled(previousState => !previousState);
  const [value, setValue] = useState(null);

  return (
    <View style={{ flex: 1, justifyContent: 'top', alignItems: 'flex-start' }}>
      <Text>Add New Habit Screen</Text>
      // Habit Title
      <TextInput
        style={styles.input}
        onChangeText={onChangeNumber}
        value={number}
        placeholder="Enter new habit title"
        keyboardType="default"
      />

      // Set your target
      <View style={{ flexDirection: 'row', margin: 20 }}>
        <Text>Set your target</Text>
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
          onValueChange={toggleSwitch}
          value={isEnabled}
        />
      </View>

      // Dropdown
      <Dropdown
        style={styles.dropdown}
        data={dropdownTimeNumber}
        labelField="label"
        valueField="value"
        placeholder="30"
        value={value}
        onChange={item => setValue(item.value)}
      />
      <Dropdown
          style={styles.dropdown}
          data={dropdownTimeType}
          labelField="label"
          valueField="value"
          placeholder="Minutes"
          value={value}
          onChange={item => setValue(item.value)}
      />

    </View>
  );
}

const dropdownTimeNumber = [
  { label: '1', value: '1' },
  { label: '15', value: '2' },
  { label: '30', value: '3' },
  { label: '45', value: '4' },
  { label: '60', value: '5' },
];

const dropdownTimeType = [
  { label: 'Seconds', value: '1' },
  { label: 'Minutes', value: '2' },
  { label: 'Hours', value: '3' },
];

const styles = StyleSheet.create({
  input: {
      height: 40,
      margin: 24,
      borderWidth: 1,
      padding: 10,
  },
  dropdown: {
      height: 50,
      backgroundColor: '#E3EED9',
      borderWidth: 0.5,
      borderRadius: 8,
      paddingHorizontal: 8
  },
});