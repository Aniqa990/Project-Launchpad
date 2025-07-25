import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import JaaSMeeting from '../client/JaaSMeeting';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../../components/ui/select';

function renderMessage(msg: string) {
  if (!msg || typeof msg !== 'string') return null;
  const urlRegex = /(https?:\/\/[\S]+)/g;
  return msg.split(urlRegex).map((part, i) =>
    urlRegex.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{part}</a>
      : part
  );
}

export default function FreelancerMeetingRoom() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedNotificationId, setSelectedNotificationId] = useState<number | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [meetingActive, setMeetingActive] = useState(true);

  // Fetch all notifications for the user
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    axios.get(`http://localhost:7053/api/notifications/${user.id}`)
      .then(res => {
        setNotifications(res.data);
        if (res.data && res.data.length > 0) {
          setSelectedNotificationId(res.data[0].id);
        }
      })
      .catch(() => setError('Failed to load notifications.'))
      .finally(() => setLoading(false));
  }, [user]);

  // Set selected notification object
  useEffect(() => {
    if (!selectedNotificationId) {
      setSelectedNotification(null);
      setMeeting(null);
      return;
    }
    const notif = notifications.find((n: any) => n.id === selectedNotificationId);
    setSelectedNotification(notif);
    // Fetch meeting details if relatedMeetingId exists
    if (notif && notif.relatedMeetingId) {
      setLoading(true);
      axios.get(`http://localhost:7053/api/meetings/${notif.relatedMeetingId}/details`)
        .then(res => {
          setMeeting(res.data);
        })
        .catch(() => setError('Failed to load meeting details.'))
        .finally(() => setLoading(false));
    } else {
      setMeeting(null);
    }
  }, [selectedNotificationId, notifications]);

  // Check if user is already a participant
  useEffect(() => {
    if (!meeting || !user) return;
    const alreadyJoined = meeting.Participants?.some((p: any) => p.UserId === user.id);
    setJoined(alreadyJoined);
  }, [meeting, user]);

  const handleJoinMeeting = async () => {
    if (!selectedNotification || !selectedNotification.relatedMeetingId || !user) return;
    setJoining(true);
    try {
      await axios.post('http://localhost:7053/api/meetings/join', {
        meetingId: Number(selectedNotification.relatedMeetingId),
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        role: user.role
      });
      setJoined(true);
      setMeetingActive(true);
    } catch {
      setError('Failed to join meeting.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">Meetings</h1>
      {/* Notification filter dropdown */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Select Notification</label>
        <Select
          value={selectedNotificationId ? String(selectedNotificationId) : ''}
          onValueChange={val => setSelectedNotificationId(Number(val))}
          disabled={notifications.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={notifications.length === 0 ? 'No notifications' : 'Choose a notification'} />
          </SelectTrigger>
          <SelectContent>
            {notifications.map((n: any) => (
              <SelectItem key={n.id} value={String(n.id)}>
                {n.message?.slice(0, 40) || 'No message'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Show selected notification message */}
      {selectedNotification ? (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <span className="font-semibold">Notification: </span>
          {renderMessage(selectedNotification.message)}
        </div>
      ) : (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          No notification selected.
        </div>
      )}
      {/* Show meeting details if available */}
      {meeting && (
        <>
          <div className="mb-4 text-center">
            <div className="text-gray-700 mb-2">{meeting.Description}</div>
            <div className="text-gray-500 text-sm mb-2">Agenda: {meeting.Agenda}</div>
            <div className="text-gray-400 text-xs mb-2">Started: {new Date(meeting.StartedAt).toLocaleString()}</div>
            <div className="mb-2">
              <a href={`https://8x8.vc/vpaas-magic-cookie-916ca21a710a40e0ac58af93b2f48abe/${meeting.MeetingRoomId}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Open Jitsi in new tab</a>
            </div>
          </div>
          {!joined ? (
            <div className="text-center mb-8">
              <Button onClick={handleJoinMeeting} disabled={joining} variant="primary">
                {joining ? 'Joining...' : 'Join Meeting'}
              </Button>
            </div>
          ) : null}
          {joined && meetingActive && (
            <div className="mb-10">
              <JaaSMeeting onMeetingEnd={() => setMeetingActive(false)} />
            </div>
          )}
        </>
      )}
    </div>
  );
} 