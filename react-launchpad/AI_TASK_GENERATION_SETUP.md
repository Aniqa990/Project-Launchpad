# AI Task Generation from Meeting Transcripts - Setup Guide

## Overview

This system automatically generates tasks from meeting transcripts using AI. It integrates your existing meeting recording system with AI-powered task extraction and creates tasks directly in your Kanban board.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Your Backend    │    │  FastAPI Services│
│                 │    │  (Port 7053)     │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │Kanban Board │ │◄──►│ │AI Integration│ │◄──►│ │Merge        │ │
│ │+ AI Button  │ │    │ │Endpoints     │ │    │ │Transcripts  │ │
│ └─────────────┘ │    │ └──────────────┘ │    │ │(Port 8000)  │ │
└─────────────────┘    └──────────────────┘    │ └─────────────┘ │
                                               │ ┌─────────────┐ │
                                               │ │Task         │ │
                                               │ │Generator    │ │
                                               │ │(Port 8001)  │ │
                                               │ └─────────────┘ │
                                               └─────────────────┘
```

## Prerequisites

1. **Your existing React app** (already working)
2. **Your existing backend** (Port 7053)
3. **FastAPI Merge Transcript Service** (Port 8000) - Your existing code
4. **FastAPI Task Generator Service** (Port 8001) - Your existing code

## Setup Steps

### 1. Frontend Integration ✅ (Already Done)

The React integration is already complete:

- **New Component**: `src/components/ui/AITaskGenerator.tsx`
- **Updated Kanban Board**: `src/components/workspace/KanbanBoard.tsx`
- **New API Endpoints**: `src/apiendpoints.ts`

### 2. Backend Integration

Add the AI integration endpoints to your existing backend:

```javascript
// Add this to your backend routes
const aiTaskGenerationRouter = require('./backend-ai-integration');
app.use('/api', aiTaskGenerationRouter);
```

### 3. Configure Your FastAPI Services

#### Merge Transcript Service (Port 8000)
Your existing service should be running and accessible at:
```
http://localhost:8000/combine-transcripts-json
```

#### Task Generator Service (Port 8001)
Your existing service should be running and accessible at:
```
http://localhost:8001/generate-tasks
```

### 4. Database Schema Updates

Ensure your meetings table has a `transcriptUrls` field:

```sql
ALTER TABLE meetings ADD COLUMN transcriptUrls TEXT[];
-- or JSON field depending on your database
```

## How It Works

### 1. User Flow
1. User conducts a meeting using your existing meeting system
2. Meeting transcript is automatically generated and stored
3. User goes to Kanban board and clicks "AI Task Generator"
4. System shows list of meetings with transcripts
5. User clicks "Generate Tasks" for a specific meeting
6. AI analyzes transcript and creates tasks
7. Tasks appear in Kanban board

### 2. Technical Flow
1. **Frontend** calls `/api/meetings/generate-tasks` with `meetingId`
2. **Backend** fetches meeting details and project info
3. **Backend** calls merge transcript service to combine all transcript URLs
4. **Backend** calls task generator service with transcript + context
5. **Backend** saves generated tasks to database
6. **Frontend** refreshes Kanban board to show new tasks

## API Endpoints

### Frontend API Calls (src/apiendpoints.ts)

```typescript
// Generate tasks from meeting transcript
export const generateTasksFromMeeting = async (meetingId: number)

// Get project meetings
export const getProjectMeetings = async (projectId: number)

// Get meeting transcripts
export const getMeetingTranscripts = async (meetingId: number)
```

### Backend Endpoints

```javascript
POST /api/meetings/generate-tasks
{
  "meetingId": 123
}

GET /api/projects/:projectId/meetings

GET /api/meetings/:meetingId/transcripts
```

## Configuration

### Environment Variables

Add these to your backend `.env`:

```env
MERGE_TRANSCRIPT_API_URL=http://localhost:8000
TASK_GENERATOR_API_URL=http://localhost:8001
```

### Service URLs

Update the URLs in `backend-ai-integration.js`:

```javascript
const MERGE_TRANSCRIPT_API = 'http://localhost:8000';
const TASK_GENERATOR_API = 'http://localhost:8001';
const YOUR_BACKEND_API = 'http://localhost:7053/api';
```

## Testing

### 1. Start All Services

```bash
# Terminal 1: Your React app
npm run dev

# Terminal 2: Your backend
npm start

# Terminal 3: Merge transcript service
cd merge-transcript-service
uvicorn main:app --port 8000

# Terminal 4: Task generator service
cd task-generator-service
uvicorn main:app --port 8001
```

### 2. Test the Flow

1. Create a meeting and generate a transcript
2. Go to Kanban board
3. Select a project
4. Click "AI Task Generator" button
5. Click "Generate Tasks" on a meeting
6. Check that tasks appear in Kanban board

## Troubleshooting

### Common Issues

1. **"Failed to fetch meetings"**
   - Check if your backend meetings endpoint exists
   - Verify project ID is correct

2. **"Failed to generate tasks"**
   - Check if FastAPI services are running
   - Verify transcript URLs are accessible
   - Check AI service logs

3. **"No meetings found"**
   - Ensure meetings have `transcriptUrls` field populated
   - Check if meetings are associated with the project

### Debug Logs

The backend integration includes detailed logging:

```javascript
console.log(`🚀 Starting AI task generation for meeting ${meetingId}`);
console.log('📝 Fetching merged transcript...');
console.log('🧠 Generating tasks with AI...');
console.log(`💾 Saving ${generatedTasks.length} generated tasks...`);
console.log(`✅ Successfully generated and saved ${savedTasks.length} tasks`);
```

## Customization

### Modify AI Task Generation Logic

Edit the task generation prompt in your FastAPI service:

```python
# In your task generator service
messages = [
    {
        "role": "system",
        "content": "You are a smart assistant that updates and expands a task list..."
    }
]
```

### Add Custom Task Fields

Modify the task payload in `backend-ai-integration.js`:

```javascript
const taskPayload = {
    title: task.title,
    description: task.description,
    estimatedDeadline: task.estimated_deadline,
    priority: task.priority,
    createdByUserId: task.created_by_id,
    assignedToUserId: task.freelancer_id,
    ProjectId: meeting.projectId,
    status: 0,
    // Add custom fields here
    customField: task.custom_field
};
```

## Security Considerations

1. **API Key Management**: Ensure your AI service API keys are secure
2. **Input Validation**: Validate all meeting IDs and project IDs
3. **Rate Limiting**: Consider adding rate limiting for AI generation
4. **Error Handling**: Gracefully handle AI service failures

## Performance Optimization

1. **Caching**: Cache meeting data and project details
2. **Async Processing**: Consider making task generation asynchronous
3. **Batch Processing**: Process multiple meetings at once if needed

## Future Enhancements

1. **Task Templates**: Pre-defined task templates for common meeting types
2. **Smart Prioritization**: AI-based task priority assignment
3. **Deadline Estimation**: AI-powered deadline suggestions
4. **Meeting Analytics**: Track which meetings generate the most tasks
5. **Task Quality Scoring**: Rate the quality of generated tasks

## Support

If you encounter issues:

1. Check the browser console for frontend errors
2. Check backend logs for API errors
3. Verify all services are running on correct ports
4. Ensure database schema is updated
5. Test individual API endpoints with Postman/curl 