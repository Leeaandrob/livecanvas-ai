/**
 * Resilience Architecture Patterns
 *
 * Patterns for building fault-tolerant, reliable distributed systems.
 */

import type { ArchitecturePattern } from "@live-canvas/protocols";

export const RESILIENCE_PATTERNS: ArchitecturePattern[] = [
  // ============================================
  // Circuit Breaker Pattern
  // ============================================
  {
    id: "circuit-breaker",
    name: "Circuit Breaker",
    category: "resilience",
    description:
      "Prevents cascading failures by detecting failures and temporarily stopping requests to a failing service, allowing it time to recover.",
    whenToUse: [
      "Calling external services that may fail",
      "Need to prevent cascade failures",
      "Service recovery time is known",
      "Want to fail fast instead of waiting for timeout",
      "Building microservices architecture",
    ],
    whenNotToUse: [
      "Local in-process calls",
      "Calls that must always be attempted",
      "Simple CRUD with reliable database",
      "When failure is acceptable",
    ],
    tradeoffs: {
      pros: [
        "Prevents cascade failures",
        "Fails fast (no waiting for timeout)",
        "Allows services to recover",
        "Provides fallback mechanisms",
        "Enables graceful degradation",
      ],
      cons: [
        "Adds complexity to codebase",
        "Requires tuning thresholds",
        "May reject valid requests during recovery",
        "State management overhead",
        "Testing circuit states is complex",
      ],
    },
    relatedPatterns: ["retry-with-backoff", "bulkhead", "fallback"],
    templates: {
      flowchart: `flowchart TB
    subgraph "Circuit Breaker"
        REQ[Incoming Request]

        subgraph States
            CLOSED[Closed<br/>Normal Operation]
            OPEN[Open<br/>Failing Fast]
            HALF[Half-Open<br/>Testing Recovery]
        end

        SUCCESS[Success Response]
        FALLBACK[Fallback Response]
    end

    subgraph "External Service"
        SVC[Service]
    end

    REQ --> CLOSED
    CLOSED -->|success| SUCCESS
    CLOSED -->|failures > threshold| OPEN
    OPEN -->|timeout expired| HALF
    OPEN -->|immediate| FALLBACK
    HALF -->|success| CLOSED
    HALF -->|failure| OPEN
    CLOSED --> SVC
    HALF --> SVC`,
      stateDiagram: `stateDiagram-v2
    [*] --> Closed

    Closed --> Closed: Success\\nReset failure count
    Closed --> Open: Failure threshold exceeded

    Open --> Open: Request arrives\\nReturn fallback immediately
    Open --> HalfOpen: Timeout period elapsed

    HalfOpen --> Closed: Probe request succeeds
    HalfOpen --> Open: Probe request fails

    note right of Closed: Normal operation\\nAll requests pass through
    note right of Open: Failing fast\\nNo requests to service
    note right of HalfOpen: Testing recovery\\nLimited requests allowed`,
      sequence: `sequenceDiagram
    participant C as Client
    participant CB as Circuit Breaker
    participant S as External Service

    Note over CB: State: CLOSED

    C->>CB: Request 1
    CB->>S: Forward request
    S-->>CB: Success
    CB-->>C: Response

    C->>CB: Request 2
    CB->>S: Forward request
    S--xCB: Failure
    CB-->>C: Error (failure count: 1)

    C->>CB: Request 3
    CB->>S: Forward request
    S--xCB: Failure
    CB-->>C: Error (failure count: 2)

    Note over CB: Threshold exceeded!
    Note over CB: State: OPEN

    C->>CB: Request 4
    CB-->>C: Fallback (circuit open)

    Note over CB: Timeout elapsed
    Note over CB: State: HALF-OPEN

    C->>CB: Request 5 (probe)
    CB->>S: Test request
    S-->>CB: Success

    Note over CB: State: CLOSED
    CB-->>C: Response`,
    },
    variables: [
      {
        name: "failureThreshold",
        description: "Number of failures before opening circuit",
        defaultValue: "5",
        type: "number",
      },
      {
        name: "resetTimeout",
        description: "Time before attempting recovery (ms)",
        defaultValue: "30000",
        type: "number",
      },
      {
        name: "halfOpenRequests",
        description: "Number of test requests in half-open state",
        defaultValue: "3",
        type: "number",
      },
    ],
    validations: [
      {
        rule: "Circuit breaker must have a fallback mechanism",
        severity: "warning",
      },
      {
        rule: "Reset timeout should be tuned based on service recovery time",
        severity: "warning",
      },
      {
        rule: "Circuit state should be monitored and alerted",
        severity: "warning",
      },
    ],
    examples: [
      {
        name: "TypeScript Circuit Breaker",
        description: "Simple circuit breaker implementation",
        code: `class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime?: number;

  constructor(
    private readonly threshold = 5,
    private readonly resetTimeout = 30000
  ) {}

  async execute<T>(operation: () => Promise<T>, fallback: () => T): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime! > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        return fallback();
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (this.state === 'OPEN') {
        return fallback();
      }
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}`,
      },
    ],
  },

  // ============================================
  // Bulkhead Pattern
  // ============================================
  {
    id: "bulkhead",
    name: "Bulkhead",
    category: "resilience",
    description:
      "Isolates components so that failure in one doesn't affect others, similar to ship compartments. Limits concurrent calls and prevents resource exhaustion.",
    whenToUse: [
      "Multiple independent service dependencies",
      "Need to prevent resource exhaustion",
      "Want to isolate critical from non-critical operations",
      "Protecting against slow consumers",
      "Multi-tenant systems needing isolation",
    ],
    whenNotToUse: [
      "Single service with uniform load",
      "Resources are abundant",
      "Simple applications",
      "When isolation overhead is too high",
    ],
    tradeoffs: {
      pros: [
        "Prevents cascade failures",
        "Isolates impact of slow/failing services",
        "Protects critical functionality",
        "Enables graceful degradation",
        "Predictable resource usage",
      ],
      cons: [
        "More complex configuration",
        "Resource overhead (thread pools, etc.)",
        "May reject requests even when system has capacity",
        "Requires careful sizing",
        "Can mask underlying issues",
      ],
    },
    relatedPatterns: ["circuit-breaker", "retry-with-backoff"],
    templates: {
      flowchart: `flowchart TB
    subgraph "Application"
        REQ[Incoming Requests]

        subgraph "Bulkhead Partitions"
            subgraph "Critical Pool (20 threads)"
                CP[Critical Operations]
                P1[Payment Service]
                P2[Order Service]
            end

            subgraph "Standard Pool (10 threads)"
                SP[Standard Operations]
                R1[Recommendation Service]
                R2[Analytics Service]
            end

            subgraph "Background Pool (5 threads)"
                BP[Background Operations]
                B1[Reporting Service]
                B2[Cleanup Service]
            end
        end
    end

    REQ --> CP
    REQ --> SP
    REQ --> BP

    CP --> P1
    CP --> P2

    SP --> R1
    SP --> R2

    BP --> B1
    BP --> B2`,
      sequence: `sequenceDiagram
    participant Client
    participant BH as Bulkhead Manager
    participant Pool1 as Critical Pool<br/>(20 threads)
    participant Pool2 as Standard Pool<br/>(10 threads)
    participant Svc1 as Payment Service
    participant Svc2 as Recommendation Service

    Note over Pool1: 15/20 threads in use
    Note over Pool2: 10/10 threads in use (full)

    Client->>BH: Payment Request (Critical)
    BH->>Pool1: Acquire thread
    Pool1-->>BH: Thread acquired (16/20)
    BH->>Svc1: Process payment
    Svc1-->>BH: Success
    BH->>Pool1: Release thread
    BH-->>Client: Payment Success

    Client->>BH: Recommendation Request (Standard)
    BH->>Pool2: Acquire thread
    Pool2--xBH: Pool exhausted!
    BH-->>Client: 503 Service Unavailable

    Note over Client: Critical operations unaffected\\nby standard pool exhaustion`,
      c4Component: `C4Component
    title Bulkhead Architecture

    Container_Boundary(app, "Application") {
        Component(lb, "Load Balancer", "nginx", "Routes requests")

        Component(critical, "Critical Bulkhead", "Thread Pool", "20 threads, critical ops")
        Component(standard, "Standard Bulkhead", "Thread Pool", "10 threads, standard ops")
        Component(background, "Background Bulkhead", "Thread Pool", "5 threads, async ops")
    }

    Container_Boundary(services, "External Services") {
        Component(payment, "Payment Service", "API", "Processes payments")
        Component(inventory, "Inventory Service", "API", "Stock management")
        Component(recommendations, "Recommendations", "API", "ML recommendations")
        Component(analytics, "Analytics", "API", "Tracking & metrics")
    }

    Rel(lb, critical, "Critical traffic")
    Rel(lb, standard, "Standard traffic")
    Rel(lb, background, "Async tasks")

    Rel(critical, payment, "Isolated pool")
    Rel(critical, inventory, "Isolated pool")
    Rel(standard, recommendations, "Shared pool")
    Rel(background, analytics, "Background pool")`,
    },
    variables: [
      {
        name: "criticalPoolSize",
        description: "Thread pool size for critical operations",
        defaultValue: "20",
        type: "number",
      },
      {
        name: "standardPoolSize",
        description: "Thread pool size for standard operations",
        defaultValue: "10",
        type: "number",
      },
      {
        name: "queueSize",
        description: "Queue size when pool is full",
        defaultValue: "100",
        type: "number",
      },
    ],
    validations: [
      {
        rule: "Critical operations must have dedicated resources",
        severity: "error",
      },
      {
        rule: "Pool sizes should be based on load testing",
        severity: "warning",
      },
      {
        rule: "Rejected requests must return appropriate error codes",
        severity: "warning",
      },
    ],
    examples: [
      {
        name: "Semaphore-based Bulkhead",
        description: "TypeScript implementation using semaphores",
        code: `class Bulkhead {
  private readonly semaphore: Semaphore;

  constructor(
    private readonly name: string,
    private readonly maxConcurrent: number,
    private readonly timeout: number = 5000
  ) {
    this.semaphore = new Semaphore(maxConcurrent);
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    const acquired = await this.semaphore.tryAcquire(this.timeout);

    if (!acquired) {
      throw new BulkheadRejectedException(
        \`Bulkhead '\${this.name}' is full (\${this.maxConcurrent} concurrent)\`
      );
    }

    try {
      return await operation();
    } finally {
      this.semaphore.release();
    }
  }

  get availablePermits(): number {
    return this.semaphore.availablePermits;
  }
}

// Usage
const paymentBulkhead = new Bulkhead('payment', 20);
const recommendationBulkhead = new Bulkhead('recommendations', 10);

// Critical payment - isolated
await paymentBulkhead.execute(() => paymentService.process(order));

// Non-critical - separate pool
await recommendationBulkhead.execute(() => recService.get(userId));`,
      },
    ],
  },

  // ============================================
  // Retry with Backoff Pattern
  // ============================================
  {
    id: "retry-with-backoff",
    name: "Retry with Exponential Backoff",
    category: "resilience",
    description:
      "Automatically retries failed operations with progressively longer delays between attempts, helping handle transient failures while avoiding overwhelming recovering services.",
    whenToUse: [
      "Transient failures are common (network issues, temporary unavailability)",
      "Operation can be safely retried (idempotent)",
      "Service is expected to recover quickly",
      "Better user experience than immediate failure",
      "Distributed systems with network partitions",
    ],
    whenNotToUse: [
      "Operation is not idempotent",
      "Failure is permanent (auth error, validation error)",
      "Immediate response is critical",
      "Would worsen an overload situation",
    ],
    tradeoffs: {
      pros: [
        "Handles transient failures gracefully",
        "Improves perceived reliability",
        "Reduces manual intervention",
        "Backoff prevents overwhelming services",
        "Jitter prevents thundering herd",
      ],
      cons: [
        "Increased latency on retries",
        "Can mask underlying issues",
        "Must ensure idempotency",
        "Can worsen overload if misconfigured",
        "Complexity in determining retry-able errors",
      ],
    },
    relatedPatterns: ["circuit-breaker", "timeout"],
    templates: {
      flowchart: `flowchart TB
    START[Request] --> ATTEMPT[Attempt Operation]
    ATTEMPT --> CHECK{Success?}
    CHECK -->|Yes| SUCCESS[Return Result]
    CHECK -->|No| RETRYABLE{Retryable<br/>Error?}
    RETRYABLE -->|No| FAIL[Return Error]
    RETRYABLE -->|Yes| MAX{Max Retries<br/>Reached?}
    MAX -->|Yes| FAIL
    MAX -->|No| CALC[Calculate Backoff]
    CALC --> WAIT[Wait with Jitter]
    WAIT --> ATTEMPT

    subgraph "Backoff Calculation"
        direction TB
        B1["Attempt 1: 100ms"]
        B2["Attempt 2: 200ms"]
        B3["Attempt 3: 400ms"]
        B4["Attempt 4: 800ms"]
    end`,
      sequence: `sequenceDiagram
    participant C as Client
    participant R as Retry Handler
    participant S as Service

    C->>R: Request

    R->>S: Attempt 1
    S--xR: 503 Service Unavailable

    Note over R: Backoff: 100ms + jitter
    R->>R: Wait 127ms

    R->>S: Attempt 2
    S--xR: 503 Service Unavailable

    Note over R: Backoff: 200ms + jitter
    R->>R: Wait 243ms

    R->>S: Attempt 3
    S-->>R: 200 OK

    R-->>C: Success Response

    Note over C,S: Total time: ~500ms<br/>3 attempts, 2 retries`,
      flowchart2: `flowchart LR
    subgraph "Retry Decision Matrix"
        direction TB

        subgraph "Retryable (DO retry)"
            R1[503 Service Unavailable]
            R2[504 Gateway Timeout]
            R3[429 Too Many Requests]
            R4[Network Timeout]
            R5[Connection Reset]
        end

        subgraph "Non-Retryable (DO NOT retry)"
            NR1[400 Bad Request]
            NR2[401 Unauthorized]
            NR3[403 Forbidden]
            NR4[404 Not Found]
            NR5[409 Conflict]
        end
    end`,
    },
    variables: [
      {
        name: "maxRetries",
        description: "Maximum number of retry attempts",
        defaultValue: "3",
        type: "number",
      },
      {
        name: "baseDelay",
        description: "Base delay in milliseconds",
        defaultValue: "100",
        type: "number",
      },
      {
        name: "maxDelay",
        description: "Maximum delay cap in milliseconds",
        defaultValue: "10000",
        type: "number",
      },
      {
        name: "jitterFactor",
        description: "Jitter factor (0-1) to add randomness",
        defaultValue: "0.5",
        type: "number",
      },
    ],
    validations: [
      {
        rule: "Operations must be idempotent for safe retry",
        severity: "error",
      },
      {
        rule: "Jitter should be used to prevent thundering herd",
        severity: "warning",
      },
      {
        rule: "Maximum retry count should be bounded",
        severity: "error",
      },
      {
        rule: "Only transient errors should trigger retry",
        severity: "warning",
      },
    ],
    examples: [
      {
        name: "Exponential Backoff with Jitter",
        description: "TypeScript retry implementation",
        code: `interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  jitterFactor: number;
}

async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {
    maxRetries: 3,
    baseDelay: 100,
    maxDelay: 10000,
    jitterFactor: 0.5
  }
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (!isRetryable(error) || attempt === config.maxRetries) {
        throw error;
      }

      const delay = calculateBackoff(attempt, config);
      await sleep(delay);
    }
  }

  throw lastError!;
}

function calculateBackoff(attempt: number, config: RetryConfig): number {
  // Exponential: baseDelay * 2^attempt
  const exponential = config.baseDelay * Math.pow(2, attempt);
  // Cap at maxDelay
  const capped = Math.min(exponential, config.maxDelay);
  // Add jitter: delay * (1 - jitter/2) to (1 + jitter/2)
  const jitter = 1 + (Math.random() - 0.5) * config.jitterFactor;
  return Math.floor(capped * jitter);
}

function isRetryable(error: any): boolean {
  const retryableCodes = [503, 504, 429, 'ECONNRESET', 'ETIMEDOUT'];
  return retryableCodes.includes(error.code) ||
         retryableCodes.includes(error.status);
}`,
      },
    ],
  },

  // ============================================
  // Timeout Pattern
  // ============================================
  {
    id: "timeout",
    name: "Timeout",
    category: "resilience",
    description:
      "Sets maximum time for operations to complete, preventing indefinite waits and enabling fail-fast behavior when services are slow or unresponsive.",
    whenToUse: [
      "Calling external services with unknown response times",
      "Need to bound maximum latency",
      "Resources need to be released promptly",
      "Preventing thread/connection exhaustion",
      "User-facing operations with SLA requirements",
    ],
    whenNotToUse: [
      "Operation must complete regardless of time",
      "Batch processing with variable duration",
      "When partial results are not acceptable",
    ],
    tradeoffs: {
      pros: [
        "Prevents indefinite waiting",
        "Enables fail-fast behavior",
        "Releases resources promptly",
        "Improves user experience (no infinite spinners)",
        "Prevents thread/connection exhaustion",
      ],
      cons: [
        "May abort operations that would have succeeded",
        "Requires careful timeout value selection",
        "Can mask slow performance issues",
        "Orphaned operations may continue running",
        "Difficult to set optimal values",
      ],
    },
    relatedPatterns: ["circuit-breaker", "retry-with-backoff"],
    templates: {
      flowchart: `flowchart TB
    REQ[Request] --> START[Start Timer]
    START --> OP[Execute Operation]

    OP --> RACE{Race<br/>Condition}
    RACE -->|Operation completes first| RESULT[Return Result]
    RACE -->|Timer fires first| TIMEOUT[Timeout Error]

    TIMEOUT --> CLEANUP[Cleanup Resources]
    CLEANUP --> FALLBACK{Fallback<br/>Available?}
    FALLBACK -->|Yes| FB[Return Fallback]
    FALLBACK -->|No| ERROR[Return Timeout Error]

    subgraph "Timeout Tiers"
        T1["API Gateway: 30s"]
        T2["Service Call: 5s"]
        T3["Database Query: 2s"]
        T4["Cache Lookup: 100ms"]
    end`,
      sequence: `sequenceDiagram
    participant C as Client
    participant TH as Timeout Handler
    participant S as Slow Service

    C->>TH: Request (timeout: 5s)
    TH->>TH: Start timer (5s)
    TH->>S: Forward request

    Note over S: Processing...<br/>Taking too long

    rect rgb(255, 200, 200)
        TH->>TH: Timer expires!
        TH-->>C: 504 Gateway Timeout
    end

    Note over C: Client receives timeout<br/>after 5 seconds

    S-->>TH: Response (too late)
    Note over TH: Response discarded`,
      flowchart2: `flowchart LR
    subgraph "Timeout Budget"
        CLIENT[Client Request<br/>Budget: 10s]

        subgraph "Service A (Budget: 8s)"
            A[Service A Logic<br/>2s]

            subgraph "Service B Call (Budget: 5s)"
                B[Service B Logic<br/>1s]
                C[DB Query<br/>Budget: 2s]
            end
        end

        RESPONSE[Response]
    end

    CLIENT --> A
    A --> B
    B --> C
    C --> B
    B --> A
    A --> RESPONSE
    RESPONSE --> CLIENT`,
    },
    variables: [
      {
        name: "connectionTimeout",
        description: "Time to establish connection (ms)",
        defaultValue: "3000",
        type: "number",
      },
      {
        name: "requestTimeout",
        description: "Time for complete request (ms)",
        defaultValue: "10000",
        type: "number",
      },
      {
        name: "idleTimeout",
        description: "Time connection can be idle (ms)",
        defaultValue: "60000",
        type: "number",
      },
    ],
    validations: [
      {
        rule: "Downstream timeouts must be shorter than upstream",
        severity: "error",
      },
      {
        rule: "Timeouts should be based on SLA requirements",
        severity: "warning",
      },
      {
        rule: "Resources must be cleaned up on timeout",
        severity: "error",
      },
    ],
    examples: [
      {
        name: "Promise-based Timeout",
        description: "TypeScript timeout wrapper",
        code: `function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message = 'Operation timed out'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(message, timeoutMs));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise])
    .finally(() => clearTimeout(timeoutId));
}

class TimeoutError extends Error {
  constructor(message: string, public readonly timeoutMs: number) {
    super(message);
    this.name = 'TimeoutError';
  }
}

// Usage with cascading timeouts
async function fetchUserWithProfile(userId: string) {
  const userPromise = withTimeout(
    userService.getUser(userId),
    2000,
    'User fetch timed out'
  );

  const profilePromise = withTimeout(
    profileService.getProfile(userId),
    3000,
    'Profile fetch timed out'
  );

  // Overall operation timeout
  return withTimeout(
    Promise.all([userPromise, profilePromise]),
    5000,
    'User profile fetch timed out'
  );
}`,
      },
    ],
  },

  // ============================================
  // Fallback Pattern
  // ============================================
  {
    id: "fallback",
    name: "Fallback",
    category: "resilience",
    description:
      "Provides alternative responses or behaviors when primary operations fail, enabling graceful degradation of functionality.",
    whenToUse: [
      "Primary service is not critical",
      "Cached or default data is acceptable",
      "User experience matters more than precision",
      "Partial functionality is better than complete failure",
      "Non-critical features can be disabled",
    ],
    whenNotToUse: [
      "Operation must have accurate, real-time data",
      "Stale data would cause issues",
      "No reasonable fallback exists",
      "Financial or safety-critical operations",
    ],
    tradeoffs: {
      pros: [
        "Graceful degradation",
        "Improved availability",
        "Better user experience",
        "System remains functional during outages",
        "Reduces perceived failure rate",
      ],
      cons: [
        "May serve stale or incomplete data",
        "Users may not realize they're getting fallback",
        "Can mask underlying issues",
        "Fallback logic adds complexity",
        "Testing all fallback paths is challenging",
      ],
    },
    relatedPatterns: ["circuit-breaker", "timeout", "bulkhead"],
    templates: {
      flowchart: `flowchart TB
    REQ[Request] --> PRIMARY[Try Primary Service]

    PRIMARY --> CHECK{Success?}
    CHECK -->|Yes| RESPONSE[Return Response]
    CHECK -->|No| FALLBACK[Fallback Strategy]

    subgraph "Fallback Strategies"
        FALLBACK --> CACHE[Cached Data]
        FALLBACK --> DEFAULT[Default Value]
        FALLBACK --> SECONDARY[Secondary Service]
        FALLBACK --> DEGRADED[Degraded Response]
        FALLBACK --> EMPTY[Empty/Null Response]
    end

    CACHE --> RESPONSE
    DEFAULT --> RESPONSE
    SECONDARY --> RESPONSE
    DEGRADED --> RESPONSE
    EMPTY --> RESPONSE`,
      sequence: `sequenceDiagram
    participant C as Client
    participant H as Handler
    participant P as Primary Service
    participant Cache as Cache
    participant S as Secondary Service

    C->>H: Get Product Details
    H->>P: Request product data
    P--xH: 503 Unavailable

    Note over H: Primary failed, trying fallbacks

    H->>Cache: Get cached product
    Cache-->>H: Cache miss

    H->>S: Get product from secondary
    S-->>H: Product data (stale: 1hr)

    H-->>C: Product data + stale indicator

    Note over C: Response includes<br/>freshness indicator`,
      flowchart2: `flowchart TB
    subgraph "Fallback Chain"
        direction TB
        L1[Level 1: Real-time API]
        L2[Level 2: Cache - 5min TTL]
        L3[Level 3: Secondary DC]
        L4[Level 4: Static Default]
        L5[Level 5: Graceful Error]

        L1 -->|Fail| L2
        L2 -->|Miss| L3
        L3 -->|Fail| L4
        L4 -->|N/A| L5
    end

    subgraph "Response Quality"
        Q1[Fresh Data ★★★★★]
        Q2[Recent Cache ★★★★☆]
        Q3[Stale Replica ★★★☆☆]
        Q4[Static Default ★★☆☆☆]
        Q5[Error Message ★☆☆☆☆]
    end

    L1 -.-> Q1
    L2 -.-> Q2
    L3 -.-> Q3
    L4 -.-> Q4
    L5 -.-> Q5`,
    },
    variables: [
      {
        name: "fallbackStrategy",
        description: "Primary fallback strategy",
        defaultValue: "cache",
        type: "string",
      },
      {
        name: "cacheTTL",
        description: "Cache TTL for fallback data (seconds)",
        defaultValue: "300",
        type: "number",
      },
      {
        name: "indicateFallback",
        description: "Whether to indicate fallback in response",
        defaultValue: "true",
        type: "boolean",
      },
    ],
    validations: [
      {
        rule: "Fallback data freshness must be indicated to caller",
        severity: "warning",
      },
      {
        rule: "Critical operations should not use fallbacks silently",
        severity: "error",
      },
      {
        rule: "Fallback paths must be tested regularly",
        severity: "warning",
      },
    ],
    examples: [
      {
        name: "Multi-level Fallback",
        description: "TypeScript fallback chain implementation",
        code: `interface FallbackResult<T> {
  data: T;
  source: 'primary' | 'cache' | 'secondary' | 'default';
  freshness: 'fresh' | 'stale' | 'static';
  timestamp?: Date;
}

class FallbackChain<T> {
  constructor(
    private readonly primary: () => Promise<T>,
    private readonly fallbacks: Array<{
      name: string;
      source: FallbackResult<T>['source'];
      freshness: FallbackResult<T>['freshness'];
      execute: () => Promise<T | null>;
    }>,
    private readonly defaultValue?: T
  ) {}

  async execute(): Promise<FallbackResult<T>> {
    // Try primary
    try {
      const data = await this.primary();
      return { data, source: 'primary', freshness: 'fresh' };
    } catch (primaryError) {
      console.warn('Primary failed:', primaryError);
    }

    // Try fallbacks in order
    for (const fallback of this.fallbacks) {
      try {
        const data = await fallback.execute();
        if (data !== null) {
          return {
            data,
            source: fallback.source,
            freshness: fallback.freshness,
            timestamp: new Date()
          };
        }
      } catch (error) {
        console.warn(\`Fallback '\${fallback.name}' failed:\`, error);
      }
    }

    // Use default if available
    if (this.defaultValue !== undefined) {
      return {
        data: this.defaultValue,
        source: 'default',
        freshness: 'static'
      };
    }

    throw new Error('All fallbacks exhausted');
  }
}

// Usage
const productFallback = new FallbackChain(
  () => productApi.getProduct(id),
  [
    {
      name: 'local-cache',
      source: 'cache',
      freshness: 'stale',
      execute: () => cache.get(\`product:\${id}\`)
    },
    {
      name: 'secondary-dc',
      source: 'secondary',
      freshness: 'stale',
      execute: () => secondaryApi.getProduct(id)
    }
  ],
  { id, name: 'Unknown Product', available: false }
);`,
      },
    ],
  },
];
