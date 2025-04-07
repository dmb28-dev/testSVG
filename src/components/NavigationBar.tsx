import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet, Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

type FloorType = 'north-4' | 'north-16' | 'south-6' | 'south-7' | 'south-15' | 'south-16';

interface NavigationBarProps {
  currentFloor: FloorType;
  onFloorChange: (floor: FloorType) => void;
}

const NavigationBar: React.FC<NavigationBarProps> = ({currentFloor, onFloorChange}) => {
  const insets = useSafeAreaInsets();
  
  const floors: Array<{id: FloorType; title: string}> = [
    {id: 'north-4', title: 'Северная 4'},
    {id: 'north-16', title: 'Северная 16'},
    {id: 'south-6', title: 'Южная 6'},
    {id: 'south-7', title: 'Южная 7'},
    {id: 'south-15', title: 'Южная 15'},
    {id: 'south-16', title: 'Южная 16'},
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <View style={styles.innerContainer}>
        {floors.map((floor) => (
          <TouchableOpacity
            key={floor.id}
            style={[
              styles.button,
              currentFloor === floor.id && styles.activeButton,
            ]}
            activeOpacity={0.7}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  innerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    gap: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 100,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  activeButton: {
    backgroundColor: '#007AFF',
    borderColor: '#0066CC',
  },
  buttonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  activeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default NavigationBar;
