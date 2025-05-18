import { useState, useEffect } from 'react';
import Comments from './Comments';
import styles from '../styles/VideoDetails.module.css'

function VideoDetails({ videoId }) {
  const [video, setVideo] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  const token = process.env.REACT_APP_TOKEN;

  useEffect(() => {
    fetch(`https://cactrofullstack18maybackend.onrender.com/video/${videoId}`)
      .then(res => res.json())
      .then(data => {
        setVideo(data);
        setTitle(data.snippet.title);
        setDescription(data.snippet.description);
      });
  }, [videoId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const res = await fetch(`https://cactrofullstack18maybackend.onrender.com/video/${videoId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title, description }),
    });

    const result = await res.json();

    if (res.ok) {
      setMessage('Video updated successfully!');
      setVideo(prev => ({
        ...prev,
        snippet: {
          ...prev.snippet,
          title,
          description,
        }
      }));
    } else {
      setMessage(`Failed to update video: ${result.message}`);
    }
  };

  if (!video) return <p>Loading video details...</p>;

  return (<>
  <div className={styles.VideoDetailsContainer}>
        <div className={styles.VideoDetails}>    
            <img src={video.snippet.thumbnails.standard.url} alt="Video thumbnail" />
            <h2>{title}</h2>
            <p>{description}</p>
        </div>

      <div className={styles.editDetails}>
      <h2>Edit Video Details</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Description:</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
            rows={4}
          />
        </div>
        <button type="submit">Update Video</button>
      </form>
      {message && <p className="message">{message}</p>}

      </div>
      </div>
      <Comments videoId={videoId} accessToken={token} />
    
  </>
    
  );
}

export default VideoDetails;