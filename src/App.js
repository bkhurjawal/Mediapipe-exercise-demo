import './App.css';
// import 'primereact/resources/themes/saga-blue/theme.css'; // theme
import 'primereact/resources/themes/saga-green/theme.css';
import 'primereact/resources/primereact.min.css'; // core css
import 'primeflex/themes/primeone-light.css';
import 'primeflex/primeflex.css';

import { PrimeReactProvider } from 'primereact/api';

import PoseFrame from './PoseFrame';
import PoseTracker from './PoseTracker';
import PoseTrackers from './PoseTrackers';
import PoseTrackerWithUpload from './PoseTrackerWithUpload';
import PoseEstimation from './PoseEstimation';
import PoseTrackerWithHolistic from './PoseTrackerWithHolistic';

function App() {
  return (
    <div className="App">
      <PrimeReactProvider>
        {/* <PoseFrame /> */}
        {/* <PoseTracker/> */}
        {/* <PoseTrackers /> */}
        {/* <PoseEstimation /> */}
        <PoseTrackerWithUpload />
        {/* <PoseTrackerWithHolistic /> */}
      </PrimeReactProvider>
    </div>
  );
}

export default App;
