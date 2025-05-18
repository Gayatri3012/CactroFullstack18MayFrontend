// components/NotesSection.js
import React, { useState, useEffect } from 'react';
import styles from '../styles/Notes.module.css';



const Notes = ({ videoId }) => {
    const [notes, setNotes] = useState([]);
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [search, setSearch] = useState('');
  
    const fetchNotes = async () => {
      try {
        const params = new URLSearchParams({
          videoId,
          ...(search ? { search } : {}),
        });
  
        const res = await fetch(`http://localhost:5000/note?${params.toString()}`);
        const data = await res.json();
        setNotes(data);
      } catch (error) {
        console.error('Failed to fetch notes', error);
      }
    };
  
    useEffect(() => {
      fetchNotes();
    }, [search]);
  
    const handleAddNote = async () => {
      if (!content.trim()) return;
  
      try {
        const res = await fetch('http://localhost:5000/note', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId,
            content,
            tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
          }),
        });
        console.log(res)
        if (res.ok) {
          setContent('');
          setTags('');
          fetchNotes();
        } else {
          console.error('Failed to create note');
        }
      } catch (error) {
        console.error('Error adding note:', error);
      }
    };
    return (
        <div className={styles.container}>
          <h2 className={styles.title}>Your Notes</h2>
      
          <input
            placeholder="Search notes"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchNote}
          />
      
      <div className={styles.addNoteForm}>
            <textarea
                placeholder="Write your note..."
                value={content}
                onChange={e => setContent(e.target.value)}
            />
        
            <input
                placeholder="Tags (comma-separated)"
                value={tags}
                onChange={e => setTags(e.target.value)}
            />
      
          <button
            onClick={handleAddNote}
            className={styles.button}
          >
            Add Note
          </button>
      </div>
          
      
          {notes.length > 0 && (
            <ul className={styles.notesList}>
              {notes.map(note => (
                <li key={note._id} className={styles.noteItem}>
                  <p className={styles.noteContent}>{note.content}</p>
                  {note.tags.length > 0 && (
                    <small className={styles.noteTags}>
                      Tags: {note.tags.join(', ')}
                    </small>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
      
};

export default Notes;
