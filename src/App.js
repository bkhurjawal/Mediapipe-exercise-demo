import 'primeflex/primeflex.css';
import 'primeflex/themes/primeone-light.css';
import 'primereact/resources/primereact.min.css';
import 'primereact/resources/themes/saga-green/theme.css';
import './styles/App.css';

import { PrimeReactProvider } from 'primereact/api';
import PostureAudioGuide from './screens/PostureAudioGuide';

function App() {
  return (
    <div className="App">
      <PrimeReactProvider>
        {/* <PoseTrackerWithWebcam /> */}
        <PostureAudioGuide />
      </PrimeReactProvider>
    </div>
  );
}

export default App;
