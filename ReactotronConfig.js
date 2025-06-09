import Reactotron from 'reactotron-react-native';
import { reactotronRedux } from 'reactotron-redux';
import AsyncStorage from '@react-native-async-storage/async-storage'; // For React Native

// Configure Reactotron
const reactotron = Reactotron.configure()
    .useReactNative({
        asyncStorage: false, // there are more options to the async storage.
        networking: {
            // optionally, you can turn it off with false.
            ignoreUrls: /symbolicate/,
        },
        editor: false, // there are more options to editor
        overlay: false, // just turning off overlay
    })
    .use(reactotronRedux())
    .connect();
// Clear Reactotron logs on every app reload (optional)
if (__DEV__) {
  console.tron = Reactotron;
  Reactotron.clear();
} else {
  console.tron = { log: () => {} };
}

export default reactotron;
