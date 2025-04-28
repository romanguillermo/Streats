import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Colors from '../constants/colors';
import { FontAwesome } from '@expo/vector-icons';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (newName: string) => Promise<void>;
  initialName: string;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  onSave,
  initialName,
}) => {
  const [editedName, setEditedName] = useState(initialName);
  const [isLoading, setIsLoading] = useState(false);

  // Reset name when modal becomes visible or initialName changes
  useEffect(() => {
    if (visible) {
      setEditedName(initialName);
    }
  }, [visible, initialName]);

  const handleSave = async () => {
    if (editedName.trim() === '') {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    if (editedName === initialName) {
      onClose(); // Close if name hasn't changed
      return;
    }

    setIsLoading(true);
    try {
      await onSave(editedName.trim()); // Call the async save function from props
      // onClose will be called by the parent component on success
    } catch (error) {
      // Error alert should be handled in the parent's onSave function
      console.error("Error passed to modal's handleSave:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
         behavior={Platform.OS === "ios" ? "padding" : "height"}
         style={styles.keyboardAvoidingView}
      >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose} disabled={isLoading}>
              <FontAwesome name="times" size={20} color="#888" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={editedName}
            onChangeText={setEditedName}
            placeholder="Enter your display name"
            autoCapitalize="words"
            editable={!isLoading} // Disable input while loading
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton, isLoading && styles.disabledButton]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
     </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
      flex: 1,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center', 
    alignItems: 'center',    
  },
  modalContainer: {
    width: '90%', 
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end', 
    marginTop: 10,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginLeft: 10,
    minWidth: 100, 
    alignItems: 'center', 
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  }
});

export default EditProfileModal;