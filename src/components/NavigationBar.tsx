import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';

type FloorType = 'north-4' | 'north-16' | 'south-6' | 'south-7' | 'south-15' | 'south-16';

interface NavigationBarProps {
  currentFloor: FloorType;
  onFloorChange: (floor: FloorType) => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({currentFloor, onFloorChange}) => {
  const floors: Array<{id: FloorType; title: string}> = [
    {id: 'north-4', title: 'Северная 4'},
    {id: 'north-16', title: 'Северная 16'},
    {id: 'south-6', title: 'Южная 6'},
    {id: 'south-7', title: 'Южная 7'},
    {id: 'south-15', title: 'Южная 15'},
    {id: 'south-16', title: 'Южная 16'},
  ];

  return (
    <View style={styles.container}>
      {floors.map((floor) => (
        <TouchableOpacity
          key={floor.id}
          style={[
            styles.button,
            currentFloor === floor.id && styles.activeButton,
          ]}
          onPress={() => onFloorChange(floor.id)}>
          <Text
            style={[
              styles.buttonText,
              currentFloor === floor.id && styles.activeButtonText,
            ]}>
            {floor.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    padding: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  button: {
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  activeButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: '#333',
    fontSize: 14,
  },
  activeButtonText: {
    color: '#fff',
  },
});

export default NavigationBar;
