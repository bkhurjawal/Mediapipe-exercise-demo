import './styles/App.css';
import 'primeflex/primeflex.css';
import 'primeflex/themes/primeone-light.css';
import 'primereact/resources/primereact.min.css';
import 'primereact/resources/themes/saga-green/theme.css';

import { PrimeReactProvider } from 'primereact/api';
import PoseTrackerWithUpload from './screens/PoseTrackerWithUpload';

function App() {
  return (
    <div className="App">
      <PrimeReactProvider>
        <PoseTrackerWithUpload />
      </PrimeReactProvider>
    </div>
  );
}

export default App;
