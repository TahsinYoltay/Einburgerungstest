import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { Button, Text, Card } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '../../../providers/ThemeProvider';

interface NetworkTestProps {
  onTestComplete?: (success: boolean, error?: string) => void;
}

const NetworkTest: React.FC<NetworkTestProps> = ({ onTestComplete }) => {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    url: string;
    status: 'pending' | 'success' | 'error';
    result?: string;
    error?: string;
  }[]>([]);

  const testUrls = [
    'https://firebasestorage.googleapis.com/v0/b/lifeuk-6dff5.appspot.com/o/BookData%2FLife%20in%20the%20United%20Kingdom_%20A%20Guide%20for%20Ne%20-%20Chapter%201.epub?alt=media',
    'https://cdn.jsdelivr.net/npm/epubjs@0.3.93/dist/epub.min.js',
    'https://www.google.com',
  ];

  const runNetworkTest = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    const results = [];
    
    for (const url of testUrls) {
      try {
        console.log('NetworkTest - Testing URL:', url);
        
        const startTime = Date.now();
        const response = await fetch(url, { 
          method: 'HEAD',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const result = {
          url: url.split('/').pop() || url,
          status: response.ok ? 'success' as const : 'error' as const,
          result: response.ok 
            ? `✅ ${response.status} ${response.statusText} (${duration}ms)`
            : `❌ ${response.status} ${response.statusText}`,
          error: response.ok ? undefined : `HTTP ${response.status}`,
        };
        
        results.push(result);
        setTestResults([...results]);
        
        console.log('NetworkTest - Result:', result);
        
      } catch (error) {
        const result = {
          url: url.split('/').pop() || url,
          status: 'error' as const,
          result: `❌ Network Error`,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        
        results.push(result);
        setTestResults([...results]);
        
        console.error('NetworkTest - Error:', error);
      }
    }
    
    setIsLoading(false);
    
    // Check if Firebase Storage test passed
    const firebaseTest = results.find(r => r.url.includes('Chapter'));
    const success = firebaseTest?.status === 'success';
    
    if (onTestComplete) {
      onTestComplete(success, firebaseTest?.error);
    }
    
    // Show summary alert
    const successCount = results.filter(r => r.status === 'success').length;
    const totalCount = results.length;
    
    Alert.alert(
      'Network Test Results',
      `${successCount}/${totalCount} tests passed\n\n` +
      `Firebase Storage: ${firebaseTest?.status === 'success' ? '✅ Working' : '❌ Failed'}\n` +
      `CDN Access: ${results.find(r => r.url.includes('epub.min.js'))?.status === 'success' ? '✅ Working' : '❌ Failed'}\n` +
      `Internet: ${results.find(r => r.url.includes('google'))?.status === 'success' ? '✅ Working' : '❌ Failed'}`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={{ padding: 16 }}>
      <Card style={{ marginBottom: 16, padding: 16 }}>
        <Text variant="titleMedium" style={{ marginBottom: 8 }}>
          Network Connectivity Test
        </Text>
        <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
          Test network access to Firebase Storage and CDN resources
        </Text>
        
        <Button 
          mode="contained" 
          onPress={runNetworkTest}
          loading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Testing...' : 'Run Network Test'}
        </Button>
        
        {testResults.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text variant="titleSmall" style={{ marginBottom: 8 }}>
              Test Results:
            </Text>
            {testResults.map((result, index) => (
              <View key={index} style={{ marginBottom: 8 }}>
                <Text variant="bodySmall" style={{ fontWeight: 'bold' }}>
                  {result.url}
                </Text>
                <Text 
                  variant="bodySmall" 
                  style={{
                    marginTop: 8,
                    fontFamily: 'monospace',
                    fontSize: 12,
                    color: result.status === 'success' ? theme.colors.primary : theme.colors.error
                  }}
                >
                  {result.result}
                </Text>
                {result.error && (
                  <Text variant="bodySmall" style={{
                    marginTop: 8,
                    fontFamily: 'monospace',
                    fontSize: 12,
                    color: theme.colors.error
                  }}>
                    Error: {result.error}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </Card>
    </View>
  );
};

export default NetworkTest; 