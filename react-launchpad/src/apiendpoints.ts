import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:7053/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// PROJECTS
export const getProjects = async () => {
  const res = await api.get('/projects');
  return res.data;
};

export const createProject = async (payload: any) => {
  const res = await api.post('/projects', payload);
  return res.data;
};

export const updateProject = async (id: number, updatedData: any) => {
  const res = await api.put(`/projects/${id}`, updatedData);
  return res.data;
};

// TIMESHEETS
export const getTimesheets = async () => {
  const res = await api.get('/timesheets');
  return res.data;
};

export const createTimesheet = async (payload: any) => {
  const res = await api.post('/timesheets', payload);
  return res.data;
};

export const approveTimesheet = async (id: number, reviewerComments: string) => {
  const res = await api.put(`/timesheets/${id}/approve`, { reviewerComments });
  return res.data;
};

export const rejectTimesheet = async (id: number, reviewerComments: string) => {
  const res = await api.put(`/timesheets/${id}/reject`, { reviewerComments });
  return res.data;
};

// MESSAGES
export const getUserMessages = async (userId: number) => {
  const res = await api.get(`/messages/user/${userId}`);
  return res.data;
};

export const getConversationMessages = async (userId: number, otherUserId: number) => {
  const res = await api.get(`/messages/conversation/${userId}/${otherUserId}`);
  return res.data;
};

export const sendMessage = async (messageData: any) => {
  const res = await api.post('/messages', messageData);
  return res.data;
};

export const markMessageRead = async (messageId: number) => {
  const res = await api.put(`/messages/${messageId}/read`);
  return res.data;
};

export const deleteMessage = async (messageId: number) => {
  const res = await api.delete(`/messages/${messageId}`);
  return res.data;
}; 