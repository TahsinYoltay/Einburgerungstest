import React, { useState, useEffect } from 'react';
import { View, Alert } from 'react-native';
import { useTheme, Text, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { getCurrentUser, firebaseAuth } from '../../../config/firebase';

export const FirebaseTest: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const theme = useTheme();
  const { t } = useTranslation();

  useEffect(() => {
    testFirebaseConnection();
    
    // Listen for auth state changes
    const unsubscribe = firebaseAuth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return unsubscribe;
  }, []);

  const testFirebaseConnection = async () => {
    try {
      // Simple test to check if Firebase is properly initialized
      const currentUser = getCurrentUser();
      setIsConnected(true);
      setUser(currentUser);
    } catch (error) {
      console.error('Firebase connection test failed:', error);
      setIsConnected(false);
    }
  };

  const handleTestConnection = () => {
    testFirebaseConnection();
    Alert.alert(
      'Firebase Test',
      isConnected 
        ? 'Firebase is properly connected!' 
        : 'Firebase connection failed. Check your configuration.',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={{ 
      padding: 16, 
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      margin: 16 
    }}>
      <Text style={{ 
        fontSize: 18, 
        fontWeight: 'bold',
        color: theme.colors.onSurface,
        marginBottom: 12
      }}>
        Firebase Connection Status
      </Text>
      
      <Text style={{ 
        color: theme.colors.onSurface,
        marginBottom: 8
      }}>
        Status: {isConnected === null ? 'Testing...' : isConnected ? '✅ Connected' : '❌ Failed'}
      </Text>
      
      <Text style={{ 
        color: theme.colors.onSurface,
        marginBottom: 16
      }}>
        User: {user ? `✅ ${user.email || 'Anonymous'}` : '❌ Not signed in'}
      </Text>

      <Button 
        mode="contained"
        onPress={handleTestConnection}
        style={{ marginTop: 8 }}
      >
        Test Connection
      </Button>
    </View>
  );
}; 