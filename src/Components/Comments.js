import { useEffect, useState } from 'react';
import styles from '../styles/comments.module.css'
import { Trash2 } from 'lucide-react';

function Comments({ videoId, accessToken }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTexts, setReplyTexts] = useState({}); // reply text per comment id
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    fetch(`http://localhost:5000/comment/${videoId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch comments');
        return res.json();
      })
      .then(data => {
        setComments(data);
        setError('');
      })
      .catch(err => setError(err.message));
  }, [videoId, accessToken]);

  const postComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    setError('');

    const body = {
      snippet: {
        videoId,
        topLevelComment: {
          snippet: {
            textOriginal: newComment,
          },
        },
      },
    };

    try {
      const res = await fetch('https://www.googleapis.com/youtube/v3/commentThreads?part=snippet', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error.message || 'Failed to post comment');
      }

      const postedComment = await res.json();
      setComments([postedComment, ...comments]);
      setNewComment('');

      await fetch('http://localhost:5000/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`, 
        },
        body: JSON.stringify({
          type: 'comment_posted',
          videoId,
          description: `Comment posted: "${newComment}"`,
        }),
      });

    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const postReply = async (parentId) => {
    const replyText = replyTexts[parentId];
    if (!replyText || !replyText.trim()) return;

    setLoading(true);
    setError('');

    const body = {
      snippet: {
        parentId,
        textOriginal: replyText,
      },
    };

    try {
      const res = await fetch('https://www.googleapis.com/youtube/v3/comments?part=snippet', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error.message || 'Failed to post reply');
      }

      const postedReply = await res.json();

      setComments((prevComments) => {
        return prevComments.map((commentThread) => {
          if (commentThread.id === parentId || commentThread.snippet.topLevelComment.id === parentId) {
            const updatedReplies = commentThread.replies?.comments
              ? [...commentThread.replies.comments, postedReply]
              : [postedReply];

            return {
              ...commentThread,
              replies: {
                ...commentThread.replies,
                comments: updatedReplies,
              },
            };
          }
          return commentThread;
        });
      });

      setReplyTexts(prev => ({ ...prev, [parentId]: '' }));

      await fetch('http://localhost:5000/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          type: 'reply_posted',
          videoId,
          description: `Reply posted to comment ${parentId}: "${replyText}"`,
        }),
      });
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/comments?id=${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error.message || 'Failed to delete comment');
      }

      setComments((prevComments) =>
        prevComments.filter(
          (commentThread) =>
            commentThread.snippet.topLevelComment.id !== commentId &&
            (!commentThread.replies?.comments || !commentThread.replies.comments.find((c) => c.id === commentId))
        )
      );

      await fetch('http://localhost:5000/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          type: 'comment_deleted',
          videoId,
          description: `Comment deleted: ID ${commentId}`,
        }),
      });

    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  if (error) return <p style={{color: 'red'}}>Error: {error}</p>;

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Comments:</h3>
  
      <form
        className={styles.commentForm}
        onSubmit={(e) => {
          e.preventDefault();
          postComment();
        }}
      >
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          placeholder="Write a comment..."
          required
        />
        <br />
        <button type="submit" disabled={loading}>
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </form>
  
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
  
      {comments.length === 0 ? (
        <p>No comments yet.</p>
      ) : (
        <ul className={styles.commentList}>
          {comments.map((commentThread) => {
            const topComment = commentThread.snippet.topLevelComment.snippet;
            const topCommentId = commentThread.snippet.topLevelComment.id;
            const replies = commentThread.replies?.comments || [];
  
            return (
              <li key={commentThread.id} className={styles.commentItem}>
                <b>{topComment.authorDisplayName}</b>: {topComment.textOriginal}
                <button
                  className={styles.deleteBtn}
                  onClick={() => deleteComment(topCommentId)}
                  disabled={loading}
                >
                  <Trash2 size={20} />
                </button>
  
                <form
                  className={styles.replyForm}
                  onSubmit={(e) => {
                    e.preventDefault();
                    postReply(topCommentId);
                  }}
                >
                  <input
                    type="text"
                    value={replyTexts[topCommentId] || ''}
                    onChange={(e) =>
                      setReplyTexts((prev) => ({
                        ...prev,
                        [topCommentId]: e.target.value,
                      }))
                    }
                    placeholder="Write a reply..."
                    required
                    className={styles.replyInput}
                  />
                  <button type="submit" disabled={loading}>
                    Reply
                  </button>
                </form>
  
                {replies.length > 0 && (
                  <ul className={styles.replyList}>
                    {replies.map((reply) => (
                      <li key={reply.id}>
                        <b>{reply.snippet.authorDisplayName}</b>: {reply.snippet.textOriginal}
                        <button
                          className={styles.deleteBtn}
                          onClick={() => deleteComment(reply.id)}
                          disabled={loading}
                        >
                            <Trash2 size={20} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
  
}

export default Comments;
