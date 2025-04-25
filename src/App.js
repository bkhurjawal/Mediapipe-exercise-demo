import './App.css';
// import 'primereact/resources/themes/saga-blue/theme.css'; // theme
import 'primeflex/primeflex.css';
import 'primeflex/themes/primeone-light.css';
import 'primereact/resources/primereact.min.css'; // core css
import 'primereact/resources/themes/saga-green/theme.css';

import { PrimeReactProvider } from 'primereact/api';

import MediaPipeColorChanger from './MediaPipeColorChanger';

function App() {
  return (
    <div className="App">
      <PrimeReactProvider>
        <MediaPipeColorChanger />
        {/* <PoseFrame /> */}
        {/* <PoseTracker/> */}
        {/* <PoseTrackers /> */}
        {/* <PoseEstimation /> */}
        {/* <PoseTrackerWithUpload /> */}
        {/* <PoseReview /> */}
        {/* <PoseTrackerWithHolistic /> */}
      </PrimeReactProvider>
    </div>
  );
}

export default App;
