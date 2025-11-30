import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  questionText: {
    flex: 1,
    marginBottom: 16,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  tileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    minHeight: 56,
  },
  tileSelected: {
    borderColor: '#1A73E8',
    borderWidth: 3,
    backgroundColor: '#E8F0FE',
  },
  optionText: {
    fontSize: 17,
    color: '#212121',
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#1A73E8',
  },
  imagesContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  questionImage: {
    width: width - 64,
    height: 200,
    marginBottom: 8,
    borderRadius: 8,
  },
  optionImage: {
    width: width - 80,
    height: 100,
    marginLeft: 8,
    marginBottom: 8,
    borderRadius: 4,
  },
  explainButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  hintButton: {
    margin: 0,
    padding: 0,
  },
  hintText: {
    color: '#1A73E8',
    fontSize: 14,
    marginLeft: 4,
  },
  explanationContainer: {
    marginTop: 8,
    paddingTop: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
  },
  divider: {
    marginVertical: 8,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
