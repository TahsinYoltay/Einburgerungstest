import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
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
    fontSize: 18,
    fontWeight: '500',
  },
  optionContainer: {
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  optionText: {
    fontSize: 16,
  },
  optionItem: {
    paddingVertical: 8,
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
  videoContainer: {
    marginBottom: 16,
    height: 200,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  videoText: {
    fontSize: 16,
  },
  multipleChoiceHeader: {
    marginBottom: 8,
    fontSize: 16,
    fontStyle: 'italic',
    color: '#666',
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
    color: '#007AFF',
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