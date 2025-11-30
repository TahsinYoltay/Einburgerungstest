import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { FileSystemUtils } from '../../../utils/fileSystem';

interface FileSystemDemoProps {}

function FileSystemDemo(props: FileSystemDemoProps) {
  const theme = useTheme();
  const [logs, setLogs] = useState<string[]>(['Ready to test file operations...']);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `${timestamp}: ${message}`;
    console.log('FileSystemDemo:', logMessage); // Also log to console for debugging
    setLogs(prev => [...prev, logMessage]);
  };

  const clearLogs = () => {
    setLogs(['Ready to test file operations...']);
  };

  const testLogging = () => {
    addLog('✅ Logging system is working!');
    addLog('Click other buttons to test file operations');
  };

  const testWriteFile = async () => {
    try {
      setIsLoading(true);
      addLog('Writing file...');
      
      await FileSystemUtils.writeFile({
        fileName: 'test.txt',
        content: 'Hello from react-native-fs!',
        encoding: 'utf8'
      });
      
      addLog('File written successfully');
    } catch (error) {
      addLog(`Write error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testReadFile = async () => {
    try {
      setIsLoading(true);
      addLog('Reading file...');
      
      const content = await FileSystemUtils.readFile('test.txt');
      addLog(`File content: ${content}`);
    } catch (error) {
      addLog(`Read error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testFileExists = async () => {
    try {
      setIsLoading(true);
      addLog('Checking file existence...');
      
      const exists = await FileSystemUtils.exists('test.txt');
      addLog(`File exists: ${exists ? 'Yes' : 'No'}`);
    } catch (error) {
      addLog(`Check error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const showPaths = () => {
    try {
      addLog('=== SHOWING PATHS ===');
      addLog(`Document Path: ${FileSystemUtils.DocumentDirectoryPath}`);
      addLog(`Cache Path: ${FileSystemUtils.CacheDirectoryPath}`);
      if (FileSystemUtils.ExternalStorageDirectoryPath) {
        addLog(`External Path: ${FileSystemUtils.ExternalStorageDirectoryPath}`);
      } else {
        addLog('External Path: Not available (iOS or no external storage)');
      }
      addLog('=== PATHS COMPLETE ===');
    } catch (error) {
      addLog(`Error showing paths: ${error}`);
    }
  };

  const testGetStorageInfo = async () => {
    try {
      setIsLoading(true);
      addLog('Getting storage info...');
      
      const freeSpace = await FileSystemUtils.getFreeSpace();
      const totalSpace = await FileSystemUtils.getTotalSpace();
      
      const freeSpaceMB = (freeSpace / (1024 * 1024)).toFixed(2);
      const totalSpaceMB = (totalSpace / (1024 * 1024)).toFixed(2);
      
      addLog(`Free Space: ${freeSpaceMB} MB`);
      addLog(`Total Space: ${totalSpaceMB} MB`);
    } catch (error) {
      addLog(`Storage error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          React Native FS Demo
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Test file system operations
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={testLogging}
          disabled={isLoading}
          style={styles.button}
        >
          🧪 Test Logging
        </Button>
        
        <Button
          mode="contained"
          onPress={showPaths}
          disabled={isLoading}
          style={styles.button}
        >
          📁 Show Paths
        </Button>
        
        <Button
          mode="contained"
          onPress={testWriteFile}
          disabled={isLoading}
          style={styles.button}
        >
          ✏️ Write File
        </Button>
        
        <Button
          mode="contained"
          onPress={testReadFile}
          disabled={isLoading}
          style={styles.button}
        >
          📖 Read File
        </Button>
        
        <Button
          mode="contained"
          onPress={testFileExists}
          disabled={isLoading}
          style={styles.button}
        >
          🔍 Check File Exists
        </Button>
        
        <Button
          mode="contained"
          onPress={testGetStorageInfo}
          disabled={isLoading}
          style={styles.button}
        >
          💾 Get Storage Info
        </Button>
        
        <Button
          mode="outlined"
          onPress={clearLogs}
          disabled={isLoading}
          style={styles.button}
        >
          🗑️ Clear Logs
        </Button>
      </View>

      <View style={[styles.logsContainer, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.outline }]}>
        <Text variant="titleMedium" style={styles.logsTitle}>
          Logs ({logs.length})
        </Text>
        <ScrollView style={styles.logsScrollView} nestedScrollEnabled={true}>
          {logs.length === 0 ? (
            <Text style={styles.logText}>No logs yet...</Text>
          ) : (
            logs.map((log, index) => (
              <Text key={index} variant="bodySmall" style={[styles.logText, { color: theme.colors.onSurface }]}>
                {log}
              </Text>
            ))
          )}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 24,
  },
  button: {
    marginVertical: 4,
  },
  logsContainer: {
    borderRadius: 8,
    padding: 16,
    minHeight: 200,
    maxHeight: 400,
  },
  logsTitle: {
    marginBottom: 8,
  },
  logsScrollView: {
    flex: 1,
  },
  logText: {
    marginBottom: 4,
    fontFamily: 'monospace',
  },
});

export default FileSystemDemo; 