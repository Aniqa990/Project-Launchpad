# Error Handling Guide

This guide explains how to use the comprehensive error handling system implemented in the React app.

## Overview

The error handling system provides:
- User-friendly error messages instead of technical errors
- Centralized error management
- Consistent error handling across the app
- Error boundaries for React component errors
- Toast notifications for user feedback

## Components

### 1. Error Handler Utility (`src/utils/errorHandler.ts`)

The main error handling utility provides:

#### Error Types
```typescript
enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION', 
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN'
}
```

#### Main Functions

**`handleError(error, operation?)`**
- Main error handling function
- Automatically determines error type and shows appropriate message
- Optional operation parameter for specific error messages

```typescript
import { handleError } from '../utils/errorHandler';

try {
  await someApiCall();
} catch (error) {
  handleError(error, 'fetchData');
}
```

**`showErrorToast(message, duration?)`**
- Shows error toast notification
- Default duration: 4000ms

**`showSuccessToast(message, duration?)`**
- Shows success toast notification
- Default duration: 3000ms

**`showInfoToast(message, duration?)`**
- Shows info toast notification
- Default duration: 3000ms

**`safeAsync(promise, operation?)`**
- Wraps async operations safely
- Returns `{ success: true, data }` or `{ success: false, error }`

```typescript
import { safeAsync } from '../utils/errorHandler';

const result = await safeAsync(someApiCall(), 'fetchData');
if (result.success) {
  // Handle success
  setData(result.data);
} else {
  // Error already handled by safeAsync
  console.log(result.error);
}
```

### 2. Error Boundary (`src/components/ui/ErrorBoundary.tsx`)

Catches React component errors and displays user-friendly error page.

#### Usage
```typescript
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}
```

#### Custom Fallback
```typescript
function CustomErrorFallback({ error, resetError }) {
  return (
    <div>
      <h1>Custom Error Page</h1>
      <button onClick={resetError}>Try Again</button>
    </div>
  );
}

<ErrorBoundary fallback={CustomErrorFallback}>
  <YourApp />
</ErrorBoundary>
```

## Migration Guide

### Before (Old Error Handling)
```typescript
try {
  const data = await fetchProjects();
  setProjects(data);
} catch (error) {
  console.error('Failed to fetch projects:', error);
  toast.error('Failed to fetch projects');
}
```

### After (New Error Handling)
```typescript
import { handleError } from '../utils/errorHandler';

try {
  const data = await fetchProjects();
  setProjects(data);
} catch (error) {
  handleError(error, 'fetchProjects');
}
```

### Before (Old Success Messages)
```typescript
toast.success('Project created successfully!');
```

### After (New Success Messages)
```typescript
import { showSuccessToast } from '../utils/errorHandler';

showSuccessToast('Project created successfully!');
```

## Error Messages

### Built-in Operation Messages
The system includes specific error messages for common operations:

- **Authentication**: `login`, `signup`, `logout`
- **Projects**: `createProject`, `updateProject`, `deleteProject`, `fetchProjects`
- **Milestones**: `createMilestone`, `updateMilestone`, `deleteMilestone`, `fetchMilestones`, `assignMilestone`, `unassignMilestone`
- **Payments**: `processPayment`, `releasePayment`, `fetchPayments`
- **Messages**: `sendMessage`, `fetchMessages`, `deleteMessage`
- **Profile**: `updateProfile`, `uploadImage`, `changePassword`
- **Files**: `uploadFile`, `downloadFile`
- **Meetings**: `createMeeting`, `joinMeeting`
- **General**: `fetchData`, `saveData`, `deleteData`

### Custom Error Messages
You can add custom error messages by extending the `OPERATION_ERROR_MESSAGES` object in `errorHandler.ts`.

## Best Practices

### 1. Use Operation-Specific Error Handling
```typescript
// Good
handleError(error, 'fetchProjects');

// Avoid
handleError(error); // Generic message
```

### 2. Use Safe Async for Complex Operations
```typescript
const result = await safeAsync(
  Promise.all([
    fetchProjects(),
    fetchMilestones(),
    fetchPayments()
  ]),
  'fetchDashboardData'
);

if (result.success) {
  setDashboardData(result.data);
}
```

### 3. Handle Validation Errors Separately
```typescript
import { handleValidationError } from '../utils/errorHandler';

// For form validation errors
if (validationErrors) {
  handleValidationError(validationErrors);
  return;
}
```

### 4. Use Success Messages Appropriately
```typescript
import { showSuccessToast } from '../utils/errorHandler';

// After successful operations
showSuccessToast('Project updated successfully!');
```

## Error Types and User Messages

| Error Type | HTTP Status | User Message |
|------------|-------------|--------------|
| NETWORK | No response | "Network connection error. Please check your internet connection and try again." |
| AUTHENTICATION | 401 | "Your session has expired. Please log in again to continue." |
| AUTHORIZATION | 403 | "You don't have permission to perform this action." |
| VALIDATION | 400 | "Please check your input and try again." |
| NOT_FOUND | 404 | "The requested resource was not found." |
| SERVER_ERROR | 500, 502, 503, 504 | "Something went wrong on our end. Please try again later." |
| UNKNOWN | Other | "An unexpected error occurred. Please try again." |

## API Integration

The API endpoints file (`src/apiendpoints.ts`) has been updated with:

1. **Response Interceptor**: Logs errors but lets individual handlers deal with them
2. **Auth Error Handling**: 401/403 errors are handled by AuthContext
3. **Error Handler Import**: Available for use in API functions

## Testing Error Handling

### Test Network Errors
```typescript
// Simulate network error
const mockError = new Error('Network Error');
mockError.response = undefined;
handleError(mockError, 'fetchData');
```

### Test Server Errors
```typescript
// Simulate server error
const mockError = new Error('Server Error');
mockError.response = { status: 500 };
handleError(mockError, 'fetchData');
```

### Test Validation Errors
```typescript
// Simulate validation error
const mockError = new Error('Validation Error');
mockError.response = { 
  status: 400, 
  data: { message: 'Invalid input data' } 
};
handleError(mockError, 'createProject');
```

## Migration Checklist

- [ ] Replace `console.error()` with `handleError()`
- [ ] Replace `toast.error()` with `handleError()` or `showErrorToast()`
- [ ] Replace `toast.success()` with `showSuccessToast()`
- [ ] Add operation-specific error handling
- [ ] Test error scenarios
- [ ] Update error boundaries where needed

## Examples

### Component Error Handling
```typescript
import { handleError, showSuccessToast } from '../utils/errorHandler';

const MyComponent = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await apiCall();
      setData(result);
      showSuccessToast('Data loaded successfully!');
    } catch (error) {
      handleError(error, 'fetchData');
    } finally {
      setLoading(false);
    }
  };

  const saveData = async (formData) => {
    try {
      await saveApiCall(formData);
      showSuccessToast('Data saved successfully!');
    } catch (error) {
      handleError(error, 'saveData');
    }
  };

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};
```

### Form Validation
```typescript
import { handleValidationError } from '../utils/errorHandler';

const handleSubmit = async (formData) => {
  // Validate form
  const errors = validateForm(formData);
  if (Object.keys(errors).length > 0) {
    handleValidationError(errors);
    return;
  }

  try {
    await submitForm(formData);
    showSuccessToast('Form submitted successfully!');
  } catch (error) {
    handleError(error, 'submitForm');
  }
};
```

This error handling system provides a consistent, user-friendly experience across the entire application while maintaining proper error logging for debugging purposes. 