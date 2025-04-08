// src/services/userService.ts
import axios from 'axios';

export interface ProfilePicture {
  avatar: string;
  small_avatar: string;
  medium_avatar: string;
}

export interface UserProfile {
  oneCGuid: string;
  lastName: string;
  firstName: string;
  middleName: string;
  lastName_eng: string;
  firstName_eng: string;
  portalId: string;
  email: string;
  mobilePhone: string;
  extensionPhone: string;
  workPhone: string;
  workMobilePhone: string;
  position: string;
  floor: string;
  place: string;
  tower: string;
  birthDate: string;
  startDate: string;
  supervisor: string | null;
  personal_assistant: string;
  show_phone_number_on_portal: boolean;
  show_birth_date_on_portal: boolean;
  show_email_on_portal: boolean;
  show_on_portal: boolean;
  profilePicture: ProfilePicture;
  department1: string;
  department2: string;
  department3: string;
  department4: string;
  department5: string;
  department6: string;
  department7: string;
}

// Базовый URL API - 10.0.2.2 это специальный IP для доступа к localhost хоста из эмулятора Android
const API_URL = 'http://10.0.2.2:8000';

/**
 * Получает список всех пользователей
 */
export const getUsers = async (): Promise<UserProfile[]> => {
  console.log('userService: Начало получения данных пользователей');
  try {
    console.log(`userService: Выполнение запроса к ${API_URL}/users`);
    const response = await axios.get<UserProfile[]>(`${API_URL}/users`);
    console.log(`userService: Получено ${response.data.length} пользователей`);
    return response.data;
  } catch (error) {
    console.error('userService: Ошибка при получении данных пользователей:', error);
    return [];
  }
};

/**
 * Фильтрует пользователей по этажу и башне
 */
export const getUsersByFloorAndTower = async (
  floor: string,
  tower: string
): Promise<UserProfile[]> => {
  console.log(`userService: Начало фильтрации пользователей по этажу ${floor} и башне ${tower}`);
  try {
    console.log('userService: Получение всех пользователей');
    const users = await getUsers();
    // Приводим значения к нижнему регистру для нечувствительного к регистру сравнения
    const normalizedTower = tower.toLowerCase();
    console.log(`userService: Нормализованное название башни: ${normalizedTower}`);
    
    const filteredUsers = users.filter(
      (user) => 
        user.floor === floor && 
        user.tower.toLowerCase() === normalizedTower
    );
    
    console.log(`userService: После фильтрации найдено ${filteredUsers.length} пользователей на этаже ${floor} башни ${tower}`);
    
    // Выводим первые 5 пользователей для проверки
    if (filteredUsers.length > 0) {
      console.log('userService: Примеры отфильтрованных пользователей (первые 5):');
      filteredUsers.slice(0, 5).forEach((user, index) => {
        console.log(`userService: Пользователь ${index + 1}: ${user.lastName} ${user.firstName}, этаж: ${user.floor}, башня: ${user.tower}, место: ${user.place}`);
      });
    }
    
    return filteredUsers;
  } catch (error) {
    console.error('userService: Ошибка при фильтрации пользователей:', error);
    return [];
  }
};

/**
 * Получает список занятых мест на конкретном этаже и башне
 */
export const getOccupiedPlaces = async (
  floor: string,
  tower: string
): Promise<string[]> => {
  console.log(`userService: Начало получения занятых мест на этаже ${floor} башни ${tower}`);
  try {
    console.log(`userService: Запрос пользователей для этажа ${floor} башни ${tower}`);
    const users = await getUsersByFloorAndTower(floor, tower);
    
    console.log(`userService: Извлечение номеров мест из данных ${users.length} пользователей`);
    const places = users.map(user => {
      console.log(`userService: Обработка пользователя ${user.lastName} ${user.firstName}, место: "${user.place}"`);
      return user.place;
    });
    
    console.log(`userService: Фильтрация пустых значений мест`);
    const nonEmptyPlaces = places.filter(place => {
      const isNonEmpty = place.trim() !== '';
      if (!isNonEmpty) {
        console.log(`userService: Найдено пустое значение места, будет отфильтровано`);
      }
      return isNonEmpty;
    });
    
    console.log(`userService: Получено ${nonEmptyPlaces.length} занятых мест`);
    
    // Выводим первые 10 мест для проверки
    if (nonEmptyPlaces.length > 0) {
      console.log('userService: Примеры занятых мест (первые 10):');
      nonEmptyPlaces.slice(0, 10).forEach((place, index) => {
        console.log(`userService: Место ${index + 1}: ${place}`);
      });
    }
    
    return nonEmptyPlaces;
  } catch (error) {
    console.error('userService: Ошибка при получении занятых мест:', error);
    return [];
  }
};