import React, { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { useAppDispatch } from '../../../store/hooks';
import { loadExams } from '../../../store/slices/examSlice';
import ExamHistorySummary from '../../../components/exam/ExamHistorySummary/ExamHistorySummary';

const ExamListScreen = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadExams());
  }, [dispatch]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <ExamHistorySummary />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ExamListScreen;
