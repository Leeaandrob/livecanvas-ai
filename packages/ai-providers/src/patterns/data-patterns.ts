/**
 * Data Patterns
 *
 * Patterns for data management in distributed systems.
 */

import type { ArchitecturePattern } from "@live-canvas/protocols";

export const DATA_PATTERNS: ArchitecturePattern[] = [
  {
    id: "cqrs",
    name: "CQRS (Command Query Responsibility Segregation)",
    category: "data",
    description:
      "Separate read and write operations into different models, allowing independent optimization of each.",
    whenToUse: [
      "Read and write patterns differ significantly",
      "Need highly optimized read models",
      "High read-to-write ratio",
      "Complex domain with multiple views of same data",
      "Need to scale reads and writes independently",
    ],
    whenNotToUse: [
      "Simple CRUD operations",
      "Consistent read-after-write required immediately",
      "Small scale application",
      "Team unfamiliar with eventual consistency",
    ],
    tradeoffs: {
      pros: [
        "Optimized read and write models",
        "Independent scaling",
        "Simplified queries",
        "Better performance for complex domains",
        "Supports multiple read projections",
      ],
      cons: [
        "Increased complexity",
        "Eventual consistency between models",
        "Data synchronization overhead",
        "More infrastructure to manage",
        "Learning curve for team",
      ],
    },
    relatedPatterns: ["event-sourcing", "saga-choreography", "microservices-basic"],
    templates: {
      c4Container: `C4Container
    title Container diagram - CQRS Pattern

    Person(user, "User", "System user")

    System_Boundary(cqrs, "CQRS System") {
        Container(api, "API Gateway", "Express", "Routes commands and queries")

        Container_Boundary(write, "Write Side") {
            Container(cmd_handler, "Command Handler", "Node.js", "Processes commands")
            ContainerDb(write_db, "Write Store", "PostgreSQL", "Source of truth")
        }

        Container_Boundary(read, "Read Side") {
            Container(query_handler, "Query Handler", "Node.js", "Handles queries")
            ContainerDb(read_db, "Read Store", "MongoDB/Redis", "Optimized for reads")
        }

        Container(projector, "Projector", "Node.js", "Syncs write to read")
        Container(queue, "Event Bus", "Kafka", "Event distribution")
    }

    Rel(user, api, "Commands & Queries", "HTTPS")
    Rel(api, cmd_handler, "Commands")
    Rel(api, query_handler, "Queries")

    Rel(cmd_handler, write_db, "Writes")
    Rel(cmd_handler, queue, "Publishes events")

    Rel(queue, projector, "Subscribes")
    Rel(projector, read_db, "Updates projections")

    Rel(query_handler, read_db, "Reads")`,
      sequence: `sequenceDiagram
    participant U as User
    participant API as API
    participant CH as Command Handler
    participant WDB as Write DB
    participant Q as Event Queue
    participant P as Projector
    participant RDB as Read DB
    participant QH as Query Handler

    Note over U,QH: Write Path (Command)
    U->>API: POST /orders (Command)
    API->>CH: CreateOrder
    CH->>WDB: Insert Order
    CH->>Q: Publish OrderCreated
    CH-->>API: Success
    API-->>U: 201 Created

    Q->>P: OrderCreated Event
    P->>RDB: Update Read Model

    Note over U,QH: Read Path (Query)
    U->>API: GET /orders
    API->>QH: GetOrders
    QH->>RDB: Query
    RDB-->>QH: Results
    QH-->>API: Orders
    API-->>U: Order List`,
      flowchart: `flowchart TB
    subgraph "Write Side"
        CMD[Commands]
        CH[Command Handler]
        AGG[Aggregates]
        WS[(Write Store)]
    end

    subgraph "Event Bus"
        EB[Events]
    end

    subgraph "Read Side"
        PROJ[Projector]
        RS[(Read Store)]
        QH[Query Handler]
        Q[Queries]
    end

    CMD --> CH
    CH --> AGG
    AGG --> WS
    AGG --> EB
    EB --> PROJ
    PROJ --> RS
    Q --> QH
    QH --> RS`,
    },
    variables: [
      {
        name: "writeStore",
        description: "Write side database",
        type: "select",
        options: ["PostgreSQL", "MySQL", "EventStore"],
        default: "PostgreSQL",
        required: true,
      },
      {
        name: "readStore",
        description: "Read side database",
        type: "select",
        options: ["MongoDB", "Redis", "Elasticsearch", "PostgreSQL"],
        default: "MongoDB",
        required: true,
      },
    ],
    validations: [
      {
        id: "single-source-of-truth",
        description: "Write store must be the source of truth",
        check: "Read store should only be updated via events from write side",
        severity: "error",
      },
      {
        id: "eventual-consistency",
        description: "System must handle eventual consistency",
        check: "UI should handle stale reads gracefully",
        severity: "warning",
      },
    ],
    examples: [
      {
        name: "E-commerce Order System",
        description: "Optimized writes for orders, optimized reads for dashboards",
        mermaidCode: `flowchart LR
    subgraph Write
        API[Order API]
        OH[Order Handler]
        PG[(PostgreSQL)]
    end

    subgraph Sync
        K[Kafka]
        P[Projector]
    end

    subgraph Read
        ES[(Elasticsearch)]
        D[Dashboard API]
    end

    API --> OH --> PG
    OH --> K --> P --> ES
    D --> ES`,
      },
    ],
  },

  {
    id: "event-sourcing",
    name: "Event Sourcing",
    category: "data",
    description:
      "Store state as a sequence of events rather than current state, enabling full audit trail and temporal queries.",
    whenToUse: [
      "Need complete audit trail of changes",
      "Need to reconstruct past states",
      "Complex domain with many state transitions",
      "Event-driven architecture",
      "Regulatory compliance requirements",
    ],
    whenNotToUse: [
      "Simple CRUD with no audit requirements",
      "High-volume updates with no query needs",
      "Team unfamiliar with event-driven concepts",
      "Need for immediate consistency",
    ],
    tradeoffs: {
      pros: [
        "Complete audit trail",
        "Can reconstruct any past state",
        "Natural fit for event-driven systems",
        "Enables temporal queries",
        "Debugging through event replay",
      ],
      cons: [
        "Increased storage requirements",
        "Complex querying (need projections)",
        "Event schema evolution challenges",
        "Performance overhead for long event streams",
        "Learning curve",
      ],
    },
    relatedPatterns: ["cqrs", "saga-choreography", "outbox-pattern"],
    templates: {
      sequence: `sequenceDiagram
    participant C as Client
    participant ES as Event Store
    participant P as Projector
    participant RM as Read Model

    Note over C,RM: Write: Append Event
    C->>ES: Append OrderCreated
    ES->>ES: Store Event
    ES-->>C: Event Stored

    Note over C,RM: Rebuild State
    C->>ES: Load Events for Order-123
    ES-->>C: [OrderCreated, ItemAdded, ItemRemoved, OrderConfirmed]
    C->>C: Replay events to rebuild state

    Note over C,RM: Update Projections
    ES->>P: New Event
    P->>P: Apply to projection
    P->>RM: Update read model`,
      flowchart: `flowchart TB
    subgraph "Event Sourcing"
        CMD[Command]
        AGG[Aggregate]
        ES[(Event Store)]
        EV[Events]
    end

    subgraph "Projections"
        P1[List Projection]
        P2[Stats Projection]
        P3[Search Projection]
        RM1[(Read Model 1)]
        RM2[(Read Model 2)]
        RM3[(Search Index)]
    end

    CMD --> AGG
    AGG --> EV
    EV --> ES
    ES --> P1 --> RM1
    ES --> P2 --> RM2
    ES --> P3 --> RM3`,
      er: `erDiagram
    EVENT_STORE {
        uuid event_id PK
        uuid aggregate_id
        string aggregate_type
        int version
        string event_type
        jsonb payload
        timestamp created_at
    }

    SNAPSHOT {
        uuid snapshot_id PK
        uuid aggregate_id
        int version
        jsonb state
        timestamp created_at
    }

    EVENT_STORE ||--o{ SNAPSHOT : "optimizes"`,
    },
    variables: [
      {
        name: "eventStore",
        description: "Event store technology",
        type: "select",
        options: ["EventStoreDB", "Kafka", "PostgreSQL", "DynamoDB"],
        default: "EventStoreDB",
        required: true,
      },
      {
        name: "snapshotFrequency",
        description: "How often to snapshot (events count)",
        type: "number",
        default: 100,
        required: false,
      },
    ],
    validations: [
      {
        id: "event-immutability",
        description: "Events must be immutable",
        check: "Events should never be modified after storage",
        severity: "error",
      },
      {
        id: "snapshot-strategy",
        description: "Consider snapshots for long event streams",
        check: "Aggregates with > 100 events should have snapshot strategy",
        severity: "warning",
      },
    ],
    examples: [
      {
        name: "Bank Account",
        description: "All transactions stored as events",
        mermaidCode: `flowchart TB
    E1[AccountOpened] --> E2[MoneyDeposited]
    E2 --> E3[MoneyWithdrawn]
    E3 --> E4[MoneyDeposited]
    E4 --> E5[MoneyWithdrawn]

    E5 --> STATE[Current Balance: $150]`,
      },
    ],
  },

  {
    id: "saga-orchestration",
    name: "Saga Pattern (Orchestration)",
    category: "data",
    description:
      "Manage distributed transactions using a central orchestrator that coordinates the sequence of local transactions.",
    whenToUse: [
      "Need distributed transactions across services",
      "Complex workflows with clear sequencing",
      "Central visibility of transaction state required",
      "Need to easily add compensating transactions",
      "Team prefers imperative workflow definition",
    ],
    whenNotToUse: [
      "Simple transactions within single service",
      "Need ACID transactions",
      "Orchestrator becomes single point of failure concern",
      "Highly decoupled services preferred",
    ],
    tradeoffs: {
      pros: [
        "Central control of transaction flow",
        "Easier to understand and debug",
        "Clear compensation logic",
        "Good for complex sequential workflows",
        "Easier to add new steps",
      ],
      cons: [
        "Orchestrator can become bottleneck",
        "Single point of failure risk",
        "Tighter coupling to orchestrator",
        "More complex orchestrator logic",
      ],
    },
    relatedPatterns: ["saga-choreography", "outbox-pattern", "event-sourcing"],
    templates: {
      sequence: `sequenceDiagram
    participant O as Orchestrator
    participant OS as Order Service
    participant PS as Payment Service
    participant IS as Inventory Service
    participant SS as Shipping Service

    Note over O,SS: Happy Path
    O->>OS: Create Order
    OS-->>O: Order Created
    O->>PS: Process Payment
    PS-->>O: Payment Success
    O->>IS: Reserve Inventory
    IS-->>O: Inventory Reserved
    O->>SS: Create Shipment
    SS-->>O: Shipment Created
    O->>OS: Confirm Order

    Note over O,SS: Compensation (if Inventory fails)
    O->>IS: Reserve Inventory
    IS--xO: Inventory Failed
    O->>PS: Refund Payment
    PS-->>O: Refunded
    O->>OS: Cancel Order
    OS-->>O: Order Cancelled`,
      flowchart: `flowchart TB
    subgraph "Saga Orchestrator"
        START((Start))
        S1[Create Order]
        S2[Process Payment]
        S3[Reserve Inventory]
        S4[Create Shipment]
        DONE((Complete))

        C1[Cancel Order]
        C2[Refund Payment]
        C3[Release Inventory]
    end

    START --> S1
    S1 -->|success| S2
    S2 -->|success| S3
    S3 -->|success| S4
    S4 -->|success| DONE

    S2 -->|failure| C1
    S3 -->|failure| C2 --> C1
    S4 -->|failure| C3 --> C2`,
      state: `stateDiagram-v2
    [*] --> OrderCreated
    OrderCreated --> PaymentPending: StartPayment
    PaymentPending --> PaymentComplete: PaymentSuccess
    PaymentPending --> OrderCancelled: PaymentFailed

    PaymentComplete --> InventoryPending: ReserveInventory
    InventoryPending --> InventoryReserved: InventorySuccess
    InventoryPending --> PaymentRefunding: InventoryFailed

    InventoryReserved --> ShipmentPending: CreateShipment
    ShipmentPending --> Completed: ShipmentCreated
    ShipmentPending --> InventoryReleasing: ShipmentFailed

    PaymentRefunding --> OrderCancelled: Refunded
    InventoryReleasing --> PaymentRefunding: Released

    OrderCancelled --> [*]
    Completed --> [*]`,
    },
    variables: [
      {
        name: "orchestratorType",
        description: "Orchestrator implementation",
        type: "select",
        options: ["Temporal", "AWS Step Functions", "Camunda", "Custom"],
        default: "Temporal",
        required: true,
      },
    ],
    validations: [
      {
        id: "compensation-defined",
        description: "Every step must have a compensating action",
        check: "Each forward step should have a rollback defined",
        severity: "error",
      },
      {
        id: "idempotency",
        description: "All operations must be idempotent",
        check: "Steps should handle retry safely",
        severity: "error",
      },
    ],
    examples: [
      {
        name: "Order Fulfillment",
        description: "Order → Payment → Inventory → Shipping",
        mermaidCode: `flowchart LR
    O[Orchestrator]
    OS[Order]
    PS[Payment]
    IS[Inventory]
    SS[Shipping]

    O --> OS
    O --> PS
    O --> IS
    O --> SS`,
      },
    ],
  },

  {
    id: "saga-choreography",
    name: "Saga Pattern (Choreography)",
    category: "data",
    description:
      "Manage distributed transactions through event-driven communication where each service reacts to events and triggers the next step.",
    whenToUse: [
      "Highly decoupled services preferred",
      "No central orchestration wanted",
      "Simple workflows with few steps",
      "Services owned by different teams",
      "Event-driven architecture already in place",
    ],
    whenNotToUse: [
      "Complex workflows with many steps",
      "Need central visibility of transaction state",
      "Debugging distributed transactions is a concern",
      "Circular dependencies likely",
    ],
    tradeoffs: {
      pros: [
        "No single point of failure",
        "Loose coupling between services",
        "Services can evolve independently",
        "Natural fit for event-driven systems",
        "Better scalability",
      ],
      cons: [
        "Harder to track overall transaction state",
        "Complex to debug and monitor",
        "Risk of cyclic dependencies",
        "Compensation logic distributed across services",
        "Can become spaghetti with many services",
      ],
    },
    relatedPatterns: ["saga-orchestration", "event-sourcing", "outbox-pattern"],
    templates: {
      sequence: `sequenceDiagram
    participant OS as Order Service
    participant Q as Event Bus
    participant PS as Payment Service
    participant IS as Inventory Service
    participant SS as Shipping Service

    Note over OS,SS: Event-Driven Flow
    OS->>Q: OrderCreated
    Q->>PS: OrderCreated

    PS->>PS: Process Payment
    PS->>Q: PaymentProcessed
    Q->>IS: PaymentProcessed

    IS->>IS: Reserve Items
    IS->>Q: InventoryReserved
    Q->>SS: InventoryReserved

    SS->>SS: Create Shipment
    SS->>Q: ShipmentCreated
    Q->>OS: ShipmentCreated
    OS->>OS: Confirm Order`,
      flowchart: `flowchart LR
    subgraph "Event Bus"
        E1([OrderCreated])
        E2([PaymentProcessed])
        E3([PaymentFailed])
        E4([InventoryReserved])
        E5([InventoryFailed])
        E6([ShipmentCreated])
    end

    OS[Order Service]
    PS[Payment Service]
    IS[Inventory Service]
    SS[Shipping Service]

    OS --> E1
    E1 --> PS
    PS --> E2
    PS --> E3
    E2 --> IS
    IS --> E4
    IS --> E5
    E4 --> SS
    SS --> E6
    E6 --> OS

    E3 --> OS
    E5 --> PS`,
    },
    variables: [
      {
        name: "eventBus",
        description: "Event bus technology",
        type: "select",
        options: ["Kafka", "RabbitMQ", "AWS EventBridge", "Redis Streams"],
        default: "Kafka",
        required: true,
      },
    ],
    validations: [
      {
        id: "no-cycles",
        description: "Event flow should not have cycles",
        check: "Events should flow in one direction",
        severity: "error",
      },
      {
        id: "compensation-events",
        description: "Failure events must trigger compensations",
        check: "Each service should listen for failure events to compensate",
        severity: "error",
      },
    ],
    examples: [
      {
        name: "E-commerce Checkout",
        description: "Services react to events in chain",
        mermaidCode: `flowchart TB
    O[Order] -->|OrderCreated| P[Payment]
    P -->|PaymentOK| I[Inventory]
    P -->|PaymentFailed| O
    I -->|Reserved| S[Shipping]
    I -->|OutOfStock| P
    S -->|Shipped| O`,
      },
    ],
  },

  {
    id: "outbox-pattern",
    name: "Transactional Outbox Pattern",
    category: "data",
    description:
      "Ensure reliable event publishing by storing events in an outbox table within the same transaction as the business data.",
    whenToUse: [
      "Need guaranteed event delivery",
      "Database and message broker consistency required",
      "At-least-once delivery semantics needed",
      "Cannot lose events during failures",
      "Eventual consistency is acceptable",
    ],
    whenNotToUse: [
      "Synchronous communication is required",
      "Message broker supports transactions",
      "Simple systems without event publishing",
    ],
    tradeoffs: {
      pros: [
        "Guaranteed event delivery",
        "Atomic with business transaction",
        "No distributed transaction needed",
        "Simple to implement",
        "Works with any message broker",
      ],
      cons: [
        "Adds latency (polling interval)",
        "Requires outbox table management",
        "Need to handle duplicate events",
        "Additional database writes",
      ],
    },
    relatedPatterns: ["saga-choreography", "event-sourcing", "cqrs"],
    templates: {
      sequence: `sequenceDiagram
    participant S as Service
    participant DB as Database
    participant R as Relay/CDC
    participant Q as Message Broker
    participant C as Consumer

    Note over S,C: Write with Outbox
    S->>DB: BEGIN TRANSACTION
    S->>DB: INSERT INTO orders (...)
    S->>DB: INSERT INTO outbox (OrderCreated)
    S->>DB: COMMIT

    Note over S,C: Relay publishes events
    R->>DB: Poll outbox / CDC
    DB-->>R: New events
    R->>Q: Publish OrderCreated
    R->>DB: Mark event as published

    Note over S,C: Consumer processes
    Q->>C: OrderCreated
    C->>C: Process (idempotently)`,
      er: `erDiagram
    ORDERS {
        uuid id PK
        string customer_id
        decimal total
        string status
        timestamp created_at
    }

    OUTBOX {
        uuid id PK
        string aggregate_type
        uuid aggregate_id
        string event_type
        jsonb payload
        timestamp created_at
        boolean published
        timestamp published_at
    }

    ORDERS ||--o{ OUTBOX : "generates"`,
      flowchart: `flowchart TB
    subgraph "Service Transaction"
        BIZ[Business Logic]
        DB[(Database)]
        OUT[Outbox Table]
    end

    subgraph "Message Relay"
        POLL[Outbox Poller]
        CDC[Change Data Capture]
    end

    subgraph "Messaging"
        Q[Message Broker]
        C1[Consumer 1]
        C2[Consumer 2]
    end

    BIZ -->|1. Write data| DB
    BIZ -->|2. Write event| OUT
    POLL -->|3. Poll| OUT
    CDC -->|3. CDC| OUT
    POLL -->|4. Publish| Q
    CDC -->|4. Publish| Q
    Q --> C1
    Q --> C2`,
    },
    variables: [
      {
        name: "relayMethod",
        description: "How to relay events from outbox",
        type: "select",
        options: ["Polling", "CDC (Debezium)", "Database Triggers"],
        default: "Polling",
        required: true,
      },
      {
        name: "pollingInterval",
        description: "Polling interval in milliseconds",
        type: "number",
        default: 1000,
        required: false,
      },
    ],
    validations: [
      {
        id: "same-transaction",
        description: "Outbox write must be in same transaction as business data",
        check: "Both writes should be atomic",
        severity: "error",
      },
      {
        id: "idempotent-consumers",
        description: "Consumers must handle duplicate events",
        check: "Use event ID for deduplication",
        severity: "error",
      },
    ],
    examples: [
      {
        name: "Order Service with Outbox",
        description: "Order creation with guaranteed event publishing",
        mermaidCode: `flowchart LR
    API[API] --> SVC[Service]
    SVC --> DB[(Orders + Outbox)]
    DB --> REL[Relay]
    REL --> K[Kafka]
    K --> INV[Inventory]
    K --> PAY[Payment]`,
      },
    ],
  },
];
