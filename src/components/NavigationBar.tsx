import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, StatusBar } from 'react-native';

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

  // Группируем этажи по башням
  const northFloors = floors.filter(f => f.id.startsWith('north'));
  const southFloors = floors.filter(f => f.id.startsWith('south'));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Выберите этаж</Text>
      </View>
      
      <View style={styles.towerContainer}>
        <Text style={styles.towerLabel}>Северная башня:</Text>
        <View style={styles.buttonRow}>
          {northFloors.map((floor) => (
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
                {floor.title.split(' ')[1]} {/* Показываем только номер этажа */}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.towerContainer}>
        <Text style={styles.towerLabel}>Южная башня:</Text>
        <View style={styles.buttonRow}>
          {southFloors.map((floor) => (
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
                {floor.title.split(' ')[1]} {/* Показываем только номер этажа */}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    // Добавляем отступ сверху для статус-бара
    paddingTop: Platform.OS === 'ios' ? StatusBar.currentHeight || 20 : 12,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  towerContainer: {
    marginBottom: 12,
  },
  towerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    minWidth: 60,
    alignItems: 'center',
    // Добавляем тень для объемности
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  activeButton: {
    backgroundColor: '#007AFF',
    // Усиливаем тень для активной кнопки
    elevation: 4,
    shadowColor: '#007AFF',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 2.62,
  },
  buttonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  activeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default NavigationBar;