import 'primeflex/primeflex.css';
import 'primeflex/themes/primeone-light.css';
import 'primereact/resources/primereact.min.css';
import 'primereact/resources/themes/saga-green/theme.css';
import './styles/App.css';

import { PrimeReactProvider } from 'primereact/api';
import PoseTrackerWithWebcam from './screens/PoseTrackerWithWebcam';

function App() {
  return (
    <div className="App">
      <PrimeReactProvider>
        <PoseTrackerWithWebcam />
      </PrimeReactProvider>
    </div>
  );
}

export default App;
