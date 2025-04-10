import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import { UserProfile } from '../services/userService';

interface EmployeeInfoPopupProps {
  employee: UserProfile | null;
  visible: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}

const EmployeeInfoPopup: React.FC<EmployeeInfoPopupProps> = ({
  employee,
  visible,
  onClose,
  position,
}) => {
  if (!employee) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View 
          style={[
            styles.container,
            {
              left: position.x,
              top: position.y,
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          
          <View style={styles.header}>
            {employee.profilePicture?.medium_avatar ? (
              <Image
                source={{ uri: employee.profilePicture.medium_avatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                </Text>
              </View>
            )}
            
            <View style={styles.nameContainer}>
              <Text style={styles.name}>
                {employee.lastName} {employee.firstName} {employee.middleName}
              </Text>
              <Text style={styles.position}>{employee.position}</Text>
            </View>
          </View>
          
          <View style={styles.infoContainer}>
            {employee.department1 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Отдел:</Text>
                <Text style={styles.infoValue}>{employee.department1}</Text>
              </View>
            )}
            
            {employee.show_email_on_portal && employee.email && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{employee.email}</Text>
              </View>
            )}
            
            {employee.show_phone_number_on_portal && employee.workPhone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Телефон:</Text>
                <Text style={styles.infoValue}>{employee.workPhone}</Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Место:</Text>
              <Text style={styles.infoValue}>{employee.place}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    position: 'absolute',
    width: 300,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 5,
    right: 10,
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#999',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  nameContainer: {
    marginLeft: 10,
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  position: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  infoContainer: {
    marginTop: 5,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    width: 70,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
});

export default EmployeeInfoPopup;