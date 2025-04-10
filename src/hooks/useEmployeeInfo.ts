import { useState, useEffect } from 'react';
import { UserProfile, getUsersByFloorAndTower } from '../services/userService';

interface UseEmployeeInfoResult {
  employeeByPlace: Map<string, UserProfile>;
  loading: boolean;
  error: string | null;
}

/**
 * Хук для получения информации о сотрудниках на определенном этаже и башне
 * и создания карты соответствия мест и сотрудников
 */
export const useEmployeeInfo = (floor: string, tower: string): UseEmployeeInfoResult => {
  const [employeeByPlace, setEmployeeByPlace] = useState<Map<string, UserProfile>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployeeInfo = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log(`useEmployeeInfo: Загрузка информации о сотрудниках для этажа ${floor} башни ${tower}`);
        const employees = await getUsersByFloorAndTower(floor, tower);
        
        // Создаем карту "место -> сотрудник"
        const placeMap = new Map<string, UserProfile>();
        employees.forEach(employee => {
          if (employee.place && employee.place.trim() !== '') {
            placeMap.set(employee.place, employee);
          }
        });
        
        console.log(`useEmployeeInfo: Создана карта для ${placeMap.size} мест с сотрудниками`);
        setEmployeeByPlace(placeMap);
      } catch (err) {
        console.error('useEmployeeInfo: Ошибка при загрузке информации о сотрудниках:', err);
        setError('Не удалось загрузить информацию о сотрудниках');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeInfo();
  }, [floor, tower]);

  return { employeeByPlace, loading, error };
};