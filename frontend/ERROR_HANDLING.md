# Frontend Error Handling

This document describes the comprehensive error handling system implemented in the Buhapka frontend.

## Features

### 1. Toast Notifications

User-friendly toast notifications for success and error messages throughout the application.

#### Usage

```typescript
import { useToast } from '~/shared/ui/toast'

const toast = useToast()

// Success message
toast.success('Expense created successfully!')

// Error message
toast.error('Failed to create expense', 'Error')

// Warning message
toast.warning('Please save your changes')

// Info message
toast.info('Processing your request...')
```

#### Toast Types

- **Success** (green): Positive actions completed
- **Error** (red): Errors and failures (7s duration by default)
- **Warning** (yellow): Warnings and cautions
- **Info** (blue): Informational messages

### 2. API Error Interceptor

Automatic error handling for all API requests with user-friendly messages.

#### Handled Status Codes

- **401 Unauthorized**: Session expired, redirects to login
- **403 Forbidden**: Permission denied
- **404 Not Found**: Resource not found
- **422 Validation Error**: Form validation errors
- **500+ Server Error**: Server-side errors
- **Network Error**: Connection failures

#### Example

```typescript
import apiClient from '~/shared/api/base'

// Errors are automatically handled and displayed as toasts
try {
  const expense = await apiClient('/api/expenses', { method: 'POST', body: data })
} catch (error) {
  // Error already displayed to user via toast
  // Handle cleanup or additional logic if needed
}
```

### 3. Error Boundary Component

Catches JavaScript errors in component tree and displays fallback UI.

#### Usage

Wrap your components with `ErrorBoundary`:

```vue
<template>
  <ErrorBoundary>
    <YourComponent />
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { ErrorBoundary } from '~/shared/ui/error-boundary'
</script>
```

#### Features

- Displays user-friendly error message
- Shows error details in development mode
- Provides "Reload Page" button
- Prevents app crashes from propagating
- Integrates with Sentry (if configured)

### 4. Global Error Handler

Catches uncaught errors and Vue errors globally.

#### Configuration

The global error handler is automatically configured via Nuxt plugin in `plugins/error-handler.ts`.

#### Sentry Integration (Optional)

To enable Sentry error tracking:

1. Install Sentry SDK:
```bash
pnpm add @sentry/vue
```

2. Set environment variable:
```env
VITE_SENTRY_DSN=your_sentry_dsn_here
```

3. Update `plugins/error-handler.ts` to uncomment Sentry initialization

## Toast Container

The `ToastContainer` is automatically included in the default layout at `app/layouts/default.vue`. All toasts are displayed in the top-right corner of the screen.

## Error Message Guidelines

### User-Friendly Messages

Always use clear, actionable error messages:

✅ Good:
- "Failed to save expense. Please check your internet connection."
- "Your session has expired. Please log in again."
- "This expense was not found. It may have been deleted."

❌ Bad:
- "Error 500"
- "Network request failed"
- "Undefined is not a function"

### Error Context

Provide context when possible:

```typescript
toast.error('Failed to delete expense. Please try again.', 'Delete Failed')
```

## Development vs Production

### Development Mode

- Shows detailed error messages
- Displays stack traces in error boundary
- Logs errors to console
- Shows error details in UI

### Production Mode

- Shows user-friendly error messages
- Hides technical details from users
- Reports errors to Sentry (if configured)
- Graceful error handling

## Best Practices

1. **Always handle errors**: Don't let errors fail silently
2. **User-friendly messages**: Translate technical errors into user language
3. **Provide context**: Help users understand what went wrong
4. **Actionable guidance**: Tell users what they can do next
5. **Log for debugging**: Keep detailed logs for developers
6. **Test error scenarios**: Verify error handling works correctly

## Testing Error Handling

### Test API Errors

```typescript
// Test 401 error
await apiClient('/api/test-401')

// Test 500 error
await apiClient('/api/test-500')

// Test network error (disconnect network)
await apiClient('/api/expenses')
```

### Test Error Boundary

```vue
<template>
  <ErrorBoundary>
    <ComponentThatThrows />
  </ErrorBoundary>
</template>
```

### Test Toasts

```typescript
const toast = useToast()

toast.success('Test success message')
toast.error('Test error message')
toast.warning('Test warning message')
toast.info('Test info message')
```

## Accessibility

All error components follow accessibility best practices:

- Toast notifications use `role="alert"` and `aria-live="polite"`
- Error boundaries provide keyboard navigation
- Error messages are screen reader friendly
- Colors meet WCAG contrast requirements

## Future Enhancements

Potential improvements for error handling:

1. **Offline Support**: Detect offline state and queue requests
2. **Retry Logic**: Automatic retry for transient failures
3. **Error Analytics**: Track error patterns and frequencies
4. **User Feedback**: Allow users to report errors
5. **Smart Errors**: Context-aware error messages based on user actions
