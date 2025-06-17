import React from 'react';
import { View, ScrollView } from 'react-native';
import { Card, List, Divider, Button, Switch, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './SettingsScreen.style';
import { useAppDispatch } from '../../../store/hooks';
import { resetExamData } from '../../../store/slices/examSlice';

const SettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const [darkMode, setDarkMode] = React.useState(false);

  const handleResetExam = () => {
    // Reset all exam data
    dispatch(resetExamData({}));
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <Text style={styles.title} variant="headlineMedium">
          {t('screens.settings')}
        </Text>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 8 }}>
              {t('settings.appearance')}
            </Text>

            <List.Item
              title={t('settings.darkMode')}
              right={() => (
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                />
              )}
              style={styles.settingItem}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 8 }}>
              {t('settings.language')}
            </Text>

            <List.Item
              title="English"
              onPress={() => changeLanguage('en')}
              right={props => i18n.language === 'en' && <List.Icon {...props} icon="check" />}
              style={styles.settingItem}
            />

            <Divider style={styles.divider} />

            <List.Item
              title="Turkish"
              onPress={() => changeLanguage('tr')}
              right={props => i18n.language === 'tr' && <List.Icon {...props} icon="check" />}
              style={styles.settingItem}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 8 }}>
              {t('settings.dataManagement')}
            </Text>

            <View style={{ marginVertical: 8 }}>
              <Button
                mode="outlined"
                icon="delete"
                onPress={handleResetExam}
                textColor="red"
              >
                {t('exam.resetExams')}
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;
