import React, { useState } from 'react';
import '../../css/Parents/Feedback.css';
import { FaReply, FaEye } from 'react-icons/fa';

const sampleFeedbacks = [
  {
    teacher: 'Ms. Maria L. Santiago',
    subject: 'Math',
    date: '2025-04-02',
    week: 'Week 1',
    message: 'Great improvement on the last test, keep practicing.',
    replies: ['Great, I’ll work on it more!'],
    detailsVisible: false,
    newReply: '',
    messageSent: false,
  },
  {
    teacher: 'Mr. John D. DeLemos',
    subject: 'Filipino',
    date: '2025-04-01',
    week: 'Week 2',
    message: 'Excellent progress in your recent project. Very detailed work!',
    replies: ['Thank you! I’ll keep up the good work.'],
    detailsVisible: false,
    newReply: '',
    messageSent: false,
  },
  {
    teacher: 'Ms. Maria L. Santiago',
    subject: 'Filipino',
    date: '2025-04-01',
    week: 'Week 3',
    message: 'Excellent progress in your recent project. Very detailed work!',
    replies: ['Thank you! I’ll keep up the good work.'],
    detailsVisible: false,
    newReply: '',
    messageSent: false,
  },
  {
    teacher: 'Mr. John D. DeLemos',
    subject: 'Filipino',
    date: '2025-04-01',
    week: 'Week 4',
    message: 'Excellent progress in your recent project. Very detailed work!',
    replies: ['Thank you! I’ll keep up the good work.'],
    detailsVisible: false,
    newReply: '',
    messageSent: false,
  },
  {
    teacher: 'Ms. Maria L. Santiago',
    subject: 'Filipino',
    date: '2025-04-01',
    week: 'Week 5',
    message: 'Excellent progress in your recent project. Very detailed work!',
    replies: ['Thank you! I’ll keep up the good work.'],
    detailsVisible: false,
    newReply: '',
    messageSent: false,
  },
  {
    teacher: 'Ms. Maria L. Santiago',
    subject: 'Filipino',
    date: '2025-04-01',
    week: 'Week 6',
    message: 'Excellent progress in your recent project. Very detailed work!',
    replies: ['Thank you! I’ll keep up the good work.'],
    detailsVisible: false,
    newReply: '',
    messageSent: false,
  },
  {
    teacher: 'Mr. John D. DeLemos',
    subject: 'Filipino',
    date: '2025-04-01',
    week: 'Week 7',
    message: 'Excellent progress in your recent project. Very detailed work!',
    replies: ['Thank you! I’ll keep up the good work.'],
    detailsVisible: false,
    newReply: '',
    messageSent: false,
  },
  {
    teacher: 'Mr. John D. DeLemos',
    subject: 'Filipino',
    date: '2025-04-01',
    week: 'Week 8',
    message: 'Excellent progress in your recent project. Very detailed work!',
    replies: ['Thank you! I’ll keep up the good work.'],
    detailsVisible: false,
    newReply: '',
    messageSent: false,
  },
];

const Feedback = () => {
  const [feedbacks, setFeedbacks] = useState(sampleFeedbacks);

  const toggleDetails = (id) => {
    const updatedFeedbacks = feedbacks.map((feedback, index) => {
      if (index === id) {
        feedback.detailsVisible = !feedback.detailsVisible;
      }
      return feedback;
    });
    setFeedbacks(updatedFeedbacks);
  };

  const handleReplyChange = (id, e) => {
    const updatedFeedbacks = feedbacks.map((feedback, index) => {
      if (index === id) {
        feedback.newReply = e.target.value;
      }
      return feedback;
    });
    setFeedbacks(updatedFeedbacks);
  };

  const sendReply = (id) => {
    const updatedFeedbacks = feedbacks.map((feedback, index) => {
      if (index === id && feedback.newReply.trim()) {
        feedback.replies.push(feedback.newReply);
        feedback.newReply = '';
        feedback.messageSent = true;
      }
      return feedback;
    });
    setFeedbacks(updatedFeedbacks);

    setTimeout(() => {
      const resetMessageStatus = feedbacks.map((feedback) => {
        feedback.messageSent = false;
        return feedback;
      });
      setFeedbacks(resetMessageStatus);
    }, 3000);
  };

  return (
    <div className="feedback-container">
      <div className="feedback-header">
        <h1>Feedback to Teacher</h1>
        <p>View and reply to the feedback given by your child’s teacher.</p>
      </div>

      <div className="feedback-table">
        <table>
          <thead>
            <tr>
              <th>Teacher</th>
              <th>Aralin</th>
              <th>Week</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.map((feedback, index) => (
              <React.Fragment key={index}>
                <tr>
                  <td>{feedback.teacher}</td>
                  <td>{feedback.subject}</td>
                  <td>{feedback.week}</td>
                  <td>{feedback.date}</td>
                  <td>
                    <button className="view-details-btn" onClick={() => toggleDetails(index)}>
                      <FaEye /> {feedback.detailsVisible ? 'Hide Progress' : 'View Progress'}
                    </button>
                  </td>
                </tr>

                {feedback.detailsVisible && (
                  <tr className="details-row">
                    <td colSpan="5">
                      <div className="feedback-details">
                        <p><strong>Message:</strong> {feedback.message}</p>
                        <div className="feedback-replies">
                          <strong>Replies:</strong>
                          <ul>
                            {feedback.replies.map((reply, idx) => (
                              <li key={idx}>{reply}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="reply-input">
                          <textarea
                            placeholder="Write your reply here..."
                            value={feedback.newReply}
                            onChange={(e) => handleReplyChange(index, e)}
                          />
                          <button
                            className={`send-btn ${feedback.messageSent ? 'sent' : ''}`}
                            onClick={() => sendReply(index)}
                          >
                            <FaReply /> {feedback.messageSent ? 'Message Sent!' : 'Send Reply'}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Feedback;
