# Error Handling and Logging

This document describes the comprehensive error handling and logging system implemented in the Buhapka backend.

## Backend Logging with Winston

### Features

- **Daily Log Rotation**: Logs are automatically rotated daily with 14-day retention
- **Structured Logging**: JSON format for production, colorized console output for development
- **Separate Log Levels**: Debug level in development, info level in production
- **Separate Log Files**:
  - `logs/combined-YYYY-MM-DD.log` - All logs (info and above)
  - `logs/error-YYYY-MM-DD.log` - Error logs only
- **Request Logging**: All HTTP requests are logged with method, URL, status code, and response time
- **Exception Handling**: Unhandled exceptions are caught and logged with full stack traces

### Configuration

The logger is configured via environment variables:

- `NODE_ENV`: Set to `production` for production logging (defaults to development)
- `ENABLE_FILE_LOGGING`: Set to `true` to enable file logging in development

### Usage

The `LoggerService` is available globally throughout the application:

```typescript
import { LoggerService } from './logger/logger.service';

@Injectable()
export class MyService {
  constructor(private readonly logger: LoggerService) {}

  someMethod() {
    this.logger.log('Info message', 'MyService');
    this.logger.error('Error message', stackTrace, 'MyService');
    this.logger.warn('Warning message', 'MyService');
    this.logger.debug('Debug message', 'MyService');
  }
}
```

### Log Output

Development console output:
```
2024-01-26 12:00:00 info [Bootstrap] Application is running on port 3001
2024-01-26 12:00:01 info HTTP Request { method: 'GET', url: '/api/expenses', statusCode: 200, responseTime: 45 }
```

Production JSON output:
```json
{
  "timestamp": "2024-01-26 12:00:00",
  "level": "info",
  "message": "HTTP Request",
  "method": "GET",
  "url": "/api/expenses",
  "statusCode": 200,
  "responseTime": 45,
  "type": "http"
}
```

## Global Exception Filter

The `AllExceptionsFilter` catches all unhandled exceptions and:

1. Logs the full error with stack trace
2. Returns a structured error response to the client
3. Includes request context (method, path, timestamp)

### Error Response Format

```json
{
  "statusCode": 500,
  "timestamp": "2024-01-26T12:00:00.000Z",
  "path": "/api/expenses",
  "method": "GET",
  "message": "Internal server error"
}
```

## Request Logging Middleware

All HTTP requests are automatically logged with:

- HTTP method
- Request URL
- Response status code
- Response time in milliseconds
- User ID (if authenticated)

This provides full request tracing for debugging and monitoring.

## Log Files Location

Logs are stored in the `logs/` directory in the backend root:

```
backend/
└── logs/
    ├── combined-2024-01-26.log
    ├── combined-2024-01-27.log
    ├── error-2024-01-26.log
    └── error-2024-01-27.log
```

## Log Rotation

- Logs are rotated daily at midnight
- Maximum file size: 20MB
- Retention period: 14 days
- Old logs are automatically deleted

## Health Check

The health endpoint at `/health` returns application status:

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-26T12:00:00.000Z"
}
```

This endpoint is used by Docker health checks and monitoring tools.

## Best Practices

1. **Log Levels**: Use appropriate log levels
   - `error`: Errors that need immediate attention
   - `warn`: Warning conditions
   - `info`: General informational messages
   - `debug`: Detailed debugging information

2. **Context**: Always provide context (usually the class name) for easier debugging

3. **Sensitive Data**: Never log sensitive information like passwords, tokens, or credit card numbers

4. **Structured Logging**: Use structured logs with additional fields for better searchability

## Monitoring

In production, you can monitor logs using tools like:

- **ELK Stack**: Elasticsearch, Logstash, Kibana
- **Splunk**: Enterprise log management
- **CloudWatch**: AWS log monitoring
- **Grafana Loki**: Log aggregation system

Parse JSON logs for easy ingestion into these systems.
