# Sequence Diagram Template

## Overview

Sequence Diagrams show the interactions between components over time, illustrating the flow of messages and the order of operations for specific use cases.

## Template

```markdown
# Sequence Diagram: [Use Case Name]

## Overview

[Description of the interaction being documented]

## Actors and Participants

| Participant | Type | Description |
|-------------|------|-------------|
| User | Actor | End user initiating the action |
| Frontend | System | Web/Mobile application |
| API Gateway | Service | Request routing and auth |
| Service A | Service | Primary business service |
| Service B | Service | Secondary service |
| Database | Storage | Data persistence |
| Cache | Storage | Caching layer |
| External API | External | Third-party service |

## Main Flow

```mermaid
sequenceDiagram
    autonumber

    actor U as User
    participant F as Frontend
    participant G as API Gateway
    participant A as Service A
    participant B as Service B
    participant D as Database
    participant C as Cache
    participant E as External API

    U->>F: User Action
    F->>G: HTTP Request

    Note over G: Authenticate & Authorize
    G->>G: Validate Token

    G->>A: Forward Request

    A->>C: Check Cache

    alt Cache Hit
        C-->>A: Return Cached Data
    else Cache Miss
        A->>D: Query Database
        D-->>A: Return Data
        A->>C: Store in Cache
    end

    A->>B: Call Service B
    B->>E: External API Call
    E-->>B: API Response
    B-->>A: Service Response

    A-->>G: Response
    G-->>F: HTTP Response
    F-->>U: Display Result
```

## Alternative Flows

### Alt Flow 1: [Scenario Name]

```mermaid
sequenceDiagram
    autonumber

    actor U as User
    participant F as Frontend
    participant G as API Gateway
    participant A as Service A

    U->>F: User Action
    F->>G: HTTP Request
    G->>A: Forward Request

    alt Validation Error
        A-->>G: 400 Bad Request
        G-->>F: Error Response
        F-->>U: Show Validation Error
    else Authorization Error
        G-->>F: 403 Forbidden
        F-->>U: Show Access Denied
    else Success
        A-->>G: 200 OK
        G-->>F: Success Response
        F-->>U: Show Success
    end
```

### Alt Flow 2: [Error Scenario]

```mermaid
sequenceDiagram
    autonumber

    actor U as User
    participant F as Frontend
    participant A as Service
    participant D as Database

    U->>F: Submit Form
    F->>A: Create Request

    A->>D: Insert Record

    alt Database Error
        D--xA: Connection Error
        A->>A: Log Error
        A-->>F: 500 Internal Error
        F-->>U: Show Error Message
    else Constraint Violation
        D-->>A: Unique Constraint Error
        A-->>F: 409 Conflict
        F-->>U: Show Duplicate Error
    else Success
        D-->>A: Insert Success
        A-->>F: 201 Created
        F-->>U: Show Success
    end
```

## Step-by-Step Description

### Main Flow Steps

| Step | From | To | Action | Data |
|------|------|-----|--------|------|
| 1 | User | Frontend | Initiates action | User input |
| 2 | Frontend | API Gateway | Sends request | HTTP payload |
| 3 | API Gateway | API Gateway | Validates auth | JWT token |
| 4 | API Gateway | Service A | Forwards request | Validated request |
| 5 | Service A | Cache | Checks cache | Cache key |
| 6 | Service A | Database | Queries if miss | SQL query |
| 7 | Service A | Service B | Calls dependent service | Internal request |
| 8 | Service B | External API | Calls external | API request |
| 9 | Service A | Frontend | Returns response | JSON response |

## Data Exchanged

### Request: [Endpoint]

```json
{
  "field1": "value",
  "field2": 123,
  "nested": {
    "field3": true
  }
}
```

### Response: Success

```json
{
  "id": "uuid",
  "status": "success",
  "data": {
    "field1": "value"
  }
}
```

### Response: Error

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": []
  }
}
```

## Timing Considerations

| Step | Expected Duration | Timeout | Notes |
|------|------------------|---------|-------|
| Auth validation | < 50ms | 1s | Cached tokens |
| Cache lookup | < 5ms | 100ms | Redis |
| Database query | < 100ms | 5s | Indexed |
| External API | 200-500ms | 10s | Third-party |
| Total | < 1s | 15s | End-to-end |

## Error Handling

| Error Type | HTTP Status | Recovery Action |
|------------|-------------|-----------------|
| Validation Error | 400 | Return validation details |
| Authentication | 401 | Redirect to login |
| Authorization | 403 | Show access denied |
| Not Found | 404 | Show not found page |
| Conflict | 409 | Show conflict details |
| Rate Limited | 429 | Show retry message |
| Server Error | 500 | Show generic error, log details |
| Service Unavailable | 503 | Show maintenance message |

## Notes

[Additional considerations about this interaction]
```

## Example

```markdown
# Sequence Diagram: User Registration

## Overview

This diagram shows the user registration flow from form submission to account creation and welcome email.

## Diagram

```mermaid
sequenceDiagram
    autonumber

    actor U as User
    participant W as Web App
    participant G as API Gateway
    participant Auth as Auth Service
    participant User as User Service
    participant DB as Database
    participant Email as Email Service
    participant Q as Message Queue

    U->>W: Fill registration form
    U->>W: Click "Sign Up"

    W->>W: Client-side validation

    W->>G: POST /api/auth/register
    Note over W,G: {email, password, name}

    G->>Auth: Forward request

    Auth->>Auth: Validate input
    Auth->>Auth: Hash password

    Auth->>User: Create user
    User->>DB: Check email exists

    alt Email Already Exists
        DB-->>User: User found
        User-->>Auth: Email taken error
        Auth-->>G: 409 Conflict
        G-->>W: Error response
        W-->>U: Show "Email already registered"
    else Email Available
        DB-->>User: Not found
        User->>DB: INSERT user
        DB-->>User: User created
        User-->>Auth: User data

        Auth->>Auth: Generate verification token
        Auth->>Q: Publish WelcomeEmail event
        Q-->>Email: Consume event
        Email->>Email: Send welcome email

        Auth-->>G: 201 Created
        Note over Auth,G: {user_id, token}
        G-->>W: Success response
        W-->>U: Show "Check your email"
    end
```

## Steps

| Step | Description | Duration |
|------|-------------|----------|
| 1-2 | User fills and submits form | User |
| 3 | Client validates input | < 10ms |
| 4-5 | Request sent to backend | ~50ms |
| 6-7 | Input validation, password hash | ~100ms |
| 8-9 | Check for existing user | ~20ms |
| 10-12 | Create user in database | ~50ms |
| 13-15 | Queue welcome email | ~10ms |
| 16-17 | Return success | ~20ms |

**Total: ~260ms** (excluding email send)
```

## Best Practices

1. **Number steps** - Use autonumber for clarity
2. **Show alternatives** - Use alt/else for branches
3. **Include notes** - Add context where needed
4. **Show async** - Indicate async operations
5. **Document data** - Show request/response formats
6. **Include timing** - Expected durations
7. **Handle errors** - Show error paths
