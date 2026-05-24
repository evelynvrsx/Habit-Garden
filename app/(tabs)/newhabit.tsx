import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TextInput, Button } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import IconPicker from "react-native-icon-picker";

export default function NewHabitScreen() {
  const [number, onChangeNumber] = React.useState('');
  const [isEnabled, setIsEnabled] = useState(false);

  const [value, setValue] = useState(null);

  const [showPicker, setShowPicker] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(null);

  const [selectedRepeatHabit, setSelectedRepeatHabit] = useState('');

  const toggleSwitch = () => setIsEnabled(previousState => !previousState);

  return (
    <View style={{ flex: 1, justifyContent: 'top', alignItems: 'flex-start' }}>
      {/* Habit Title */}
      <IconPicker
          showIconPicker={showPicker}
          toggleIconPicker={() => setShowPicker(!showPicker)}
          iconDetails={iconList}
          onSelect={(icon) => {
            setSelectedIcon(icon);
            setShowPicker(false);
          }}
          content={
            <View style={{ padding: 10, backgroundColor: '#E3EED9' }}>
              <Text>{selectedIcon ? `Selected: ${selectedIcon.icon}` : "Pick an Icon"}</Text>
            </View>
          }
      />

      <TextInput
        style={styles.input}
        onChangeText={onChangeNumber}
        value={number}
        placeholder="Enter new habit title"
        keyboardType="default"
      />

      {/* Set your target */}
      <View style={{ flexDirection: 'row', margin: 20 }}>
        <Text>Set your target</Text>
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isEnabled ? '#f5dd4b' : '#f4f3f4'}
          onValueChange={toggleSwitch}
          value={isEnabled}
        />
      </View>

      {/* Dropdown */}
      <View style={{ flexDirection: 'row', margin: 20 }}>
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

      {/* Repeat Habit */}
      <View style={styles.line} />
      <Text>Repeat Habit</Text>

      <View style={{ flexDirection: 'row', margin: 20 }}>
        <Button
            title="Daily"
            onPress={() => setSelectedRepeatHabit('Daily')}
            color={ selectedRepeatHabit === 'Daily' ? "#74B084" : "#E3EED9" }
        />
        <Button
            title="Weekly"
            onPress={() => setSelectedRepeatHabit('Weekly')}
            color={ selectedRepeatHabit === 'Weekly' ? "#74B084" : "#E3EED9" }
        />
        <Button
            title="Monthly"
            onPress={() => setSelectedRepeatHabit('Monthly')}
            color={ selectedRepeatHabit === 'Monthly' ? "#74B084" : "#E3EED9" }
        />
        <Button
            title="Custom"
            onPress={() => setSelectedRepeatHabit('Custom')}
            color={ selectedRepeatHabit === 'Custom' ? "#74B084" : "#E3EED9" }
        />
      </View>

        {/* Expanded Content */}
        {selectedRepeatHabit === 'Daily' && (
           <View style={styles.expandedContent}>
                <Text>Daily text here</Text>
           </View>
        )}

        {selectedRepeatHabit === 'Weekly' && (
          <View style={styles.expandedContent}>
            <Text>Weekly text here</Text>
          </View>
        )}

        {selectedRepeatHabit === 'Monthly' && (
            <View style={styles.expandedContent}>
              <Text>Monthly text here</Text>
            </View>
        )}

        {selectedRepeatHabit === 'Custom' && (
            <View style={styles.expandedContent}>
              <Text>Custom text here</Text>
            </View>
        )}

      {/* Advanced Settings */}
      <View style={styles.line} />
      <Text>Advanced Settings</Text>

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

const iconList = [
    { family: "AntDesign", icons: ["wallet", "user", "home"] },
    { family: "FontAwesome", icons: ["rocket", "star"] },
    { family: "MaterialIcons", icons: ["category", "alarm"] }
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
  line: {
      height: 0.5,
      width: '100%',
      backgroundColor: '#A0C19F',
      marginVertical: 20,
  },
  expandedContent: { marginTop: 10, padding: 10, backgroundColor: '#f0f0f0' }
});