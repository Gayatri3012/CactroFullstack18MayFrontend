
import { useEffect, useState } from 'react';
import './App.css';
import VideoDetails from './Components/VideoDetails';
import Notes from './Components/Notes';

function App() {

  const videoId = process.env.VIDEO_ID; 
  console.log(videoId)

  return (
    <div className="App">
      <VideoDetails videoId={videoId} />
      <Notes videoId={videoId} />
    </div>
  );
}

export default App;
