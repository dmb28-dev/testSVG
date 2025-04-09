import React, { useState } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Platform, 
  StatusBar, 
  Animated, 
  Easing 
} from 'react-native';

type FloorType = 'north-4' | 'north-16' | 'south-6' | 'south-7' | 'south-15' | 'south-16';

interface NavigationBarProps {
  currentFloor: FloorType;
  onFloorChange: (floor: FloorType) => void;
}

// Компонент анимированной кнопки
const AnimatedButton: React.FC<{
  title: string;
  isActive: boolean;
  onPress: () => void;
}> = ({ title, isActive, onPress }) => {
  // Значение анимации для эффекта нажатия
  const [scaleAnim] = useState(new Animated.Value(1));
  
  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 150,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  };
  
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.button,
          isActive ? styles.activeButton : null,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <Text style={[
          styles.buttonText,
          isActive ? styles.activeButtonText : null,
        ]}>
          {title}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

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
      
      <View style={styles.navigationContainer}>
        <View style={styles.towerContainer}>
          <Text style={styles.towerLabel}>Северная</Text>
          <View style={styles.buttonRow}>
            {northFloors.map((floor) => (
              <AnimatedButton
                key={floor.id}
                title={floor.title.split(' ')[1]}
                isActive={currentFloor === floor.id}
                onPress={() => onFloorChange(floor.id)}
              />
            ))}
          </View>
        </View>
        
        <View style={styles.towerContainer}>
          <Text style={styles.towerLabel}>Южная</Text>
          <View style={styles.buttonRow}>
            {southFloors.map((floor) => (
              <AnimatedButton
                key={floor.id}
                title={floor.title.split(' ')[1]}
                isActive={currentFloor === floor.id}
                onPress={() => onFloorChange(floor.id)}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    padding: 10,
    elevation: 2,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingTop: Platform.OS === 'ios' ? StatusBar.currentHeight || 20 : 10,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0.5,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  towerContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  towerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0.3,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 6,
    marginBottom: 6,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    minWidth: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eeeeee',
    // Минималистичный стиль без теней
  },
  activeButton: {
    backgroundColor: '#4a90e2', // Голубой цвет для активной кнопки
    borderColor: '#4a90e2',
  },
  buttonText: {
    color: '#555555',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    letterSpacing: 0.2,
  },
  activeButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default NavigationBar;