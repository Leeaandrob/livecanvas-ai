/**
 * Architecture Patterns
 *
 * High-level system architecture patterns with Mermaid templates.
 */

import type { ArchitecturePattern } from "@live-canvas/protocols";

export const ARCHITECTURE_PATTERNS: ArchitecturePattern[] = [
  {
    id: "microservices-basic",
    name: "Microservices Architecture",
    category: "architecture",
    description:
      "Decompose the system into small, independently deployable services organized around business capabilities.",
    whenToUse: [
      "Large team that can be split into autonomous squads",
      "Different parts of the system have different scaling requirements",
      "Need independent deployments and release cycles",
      "Complex domain with clear bounded contexts",
      "Polyglot technology requirements",
    ],
    whenNotToUse: [
      "Small team (< 5 developers)",
      "Simple domain with few features",
      "Early stage startup needing fast iteration",
      "Tight deadline with no time for infrastructure setup",
      "Team lacks distributed systems experience",
    ],
    tradeoffs: {
      pros: [
        "Independent scaling per service",
        "Technology flexibility per service",
        "Fault isolation",
        "Independent deployments",
        "Clear ownership boundaries",
      ],
      cons: [
        "Increased operational complexity",
        "Network latency between services",
        "Distributed data management challenges",
        "More complex testing and debugging",
        "Requires robust CI/CD and monitoring",
      ],
    },
    relatedPatterns: [
      "api-gateway",
      "service-mesh",
      "saga-choreography",
      "circuit-breaker",
    ],
    templates: {
      c4Container: `C4Container
    title Container diagram - Microservices Architecture

    Person(user, "User", "System user")

    System_Boundary(system, "System") {
        Container(gateway, "API Gateway", "Kong/AWS API GW", "Routes requests, auth, rate limiting")

        Container(service_a, "Service A", "Node.js", "Handles domain A")
        Container(service_b, "Service B", "Python", "Handles domain B")
        Container(service_c, "Service C", "Go", "Handles domain C")

        ContainerDb(db_a, "Database A", "PostgreSQL", "Service A data")
        ContainerDb(db_b, "Database B", "MongoDB", "Service B data")
        ContainerDb(db_c, "Database C", "Redis", "Service C cache")

        Container(queue, "Message Queue", "RabbitMQ/Kafka", "Async communication")
    }

    Rel(user, gateway, "Uses", "HTTPS")
    Rel(gateway, service_a, "Routes to", "REST")
    Rel(gateway, service_b, "Routes to", "REST")
    Rel(gateway, service_c, "Routes to", "REST")

    Rel(service_a, db_a, "Reads/Writes")
    Rel(service_b, db_b, "Reads/Writes")
    Rel(service_c, db_c, "Reads/Writes")

    Rel(service_a, queue, "Publishes events")
    Rel(service_b, queue, "Subscribes")
    Rel(service_c, queue, "Subscribes")`,
      sequence: `sequenceDiagram
    participant U as User
    participant GW as API Gateway
    participant SA as Service A
    participant SB as Service B
    participant Q as Message Queue

    U->>GW: POST /orders
    GW->>SA: Create Order
    SA->>SA: Validate & Save
    SA->>Q: Publish OrderCreated
    SA-->>GW: 201 Created
    GW-->>U: Order Created

    Q->>SB: OrderCreated Event
    SB->>SB: Process Payment
    SB->>Q: Publish PaymentProcessed`,
    },
    variables: [
      {
        name: "serviceCount",
        description: "Number of microservices",
        type: "number",
        default: 3,
        required: false,
      },
      {
        name: "messageBroker",
        description: "Message broker technology",
        type: "select",
        options: ["RabbitMQ", "Kafka", "AWS SQS", "Redis Pub/Sub"],
        default: "RabbitMQ",
        required: false,
      },
    ],
    validations: [
      {
        id: "shared-db",
        description: "Services should not share databases",
        check: "Each service should have its own database",
        severity: "error",
      },
      {
        id: "sync-coupling",
        description: "Avoid synchronous coupling between services",
        check: "Prefer async communication via events",
        severity: "warning",
      },
    ],
    examples: [
      {
        name: "E-commerce Platform",
        description: "Order, Payment, Inventory, Shipping as separate services",
        mermaidCode: `flowchart TB
    subgraph "E-commerce Microservices"
        GW[API Gateway]
        OS[Order Service]
        PS[Payment Service]
        IS[Inventory Service]
        SS[Shipping Service]
        NS[Notification Service]
    end

    GW --> OS
    GW --> IS
    OS --> PS
    OS --> IS
    OS --> SS
    PS --> NS
    SS --> NS`,
      },
    ],
  },

  {
    id: "modular-monolith",
    name: "Modular Monolith",
    category: "architecture",
    description:
      "A single deployable unit with well-defined internal module boundaries, combining monolith simplicity with modularity benefits.",
    whenToUse: [
      "Small to medium team (3-15 developers)",
      "Clear domain boundaries but shared deployment is acceptable",
      "Want to prepare for future microservices extraction",
      "Need fast development velocity",
      "Simpler operations preferred",
    ],
    whenNotToUse: [
      "Team is already distributed across locations/time zones",
      "Wildly different scaling needs between modules",
      "Polyglot technology requirements",
      "Need independent release cycles per feature",
    ],
    tradeoffs: {
      pros: [
        "Simpler deployment and operations",
        "No network latency between modules",
        "Easier refactoring across modules",
        "Clear path to microservices if needed",
        "Single transaction context available",
      ],
      cons: [
        "All modules scale together",
        "Single technology stack",
        "Single release cycle",
        "Risk of coupling if boundaries not enforced",
        "Larger deployment artifact",
      ],
    },
    relatedPatterns: ["hexagonal", "layered-architecture", "cqrs"],
    templates: {
      c4Container: `C4Container
    title Container diagram - Modular Monolith

    Person(user, "User", "System user")

    System_Boundary(monolith, "Application") {
        Container(app, "Modular Monolith", "Node.js/Java/C#", "Single deployable with internal modules")

        Container_Boundary(modules, "Internal Modules") {
            Component(mod_orders, "Orders Module", "Handles order lifecycle")
            Component(mod_payment, "Payment Module", "Handles payments")
            Component(mod_inventory, "Inventory Module", "Manages stock")
            Component(mod_users, "Users Module", "User management")
        }

        ContainerDb(db, "Database", "PostgreSQL", "Shared DB with schema isolation")
        Container(cache, "Cache", "Redis", "Shared caching")
    }

    Rel(user, app, "Uses", "HTTPS")
    Rel(mod_orders, mod_payment, "Uses", "Internal API")
    Rel(mod_orders, mod_inventory, "Uses", "Internal API")
    Rel(app, db, "Reads/Writes")
    Rel(app, cache, "Caches")`,
      flowchart: `flowchart TB
    subgraph "Modular Monolith"
        subgraph "API Layer"
            API[REST API]
        end

        subgraph "Module: Orders"
            OC[Order Controller]
            OS[Order Service]
            OR[Order Repository]
        end

        subgraph "Module: Payments"
            PC[Payment Controller]
            PS[Payment Service]
            PR[Payment Repository]
        end

        subgraph "Module: Inventory"
            IC[Inventory Controller]
            IS[Inventory Service]
            IR[Inventory Repository]
        end

        subgraph "Shared"
            DB[(Database)]
            EV[Event Bus]
        end
    end

    API --> OC
    API --> PC
    API --> IC

    OC --> OS
    OS --> OR
    OS --> EV

    PC --> PS
    PS --> PR
    PS --> EV

    IC --> IS
    IS --> IR

    OR --> DB
    PR --> DB
    IR --> DB

    EV -.-> PS
    EV -.-> IS`,
    },
    variables: [
      {
        name: "moduleCount",
        description: "Number of modules",
        type: "number",
        default: 4,
        required: false,
      },
    ],
    validations: [
      {
        id: "module-boundaries",
        description: "Modules must communicate through defined interfaces",
        check: "No direct access to other module internals",
        severity: "error",
      },
      {
        id: "schema-isolation",
        description: "Each module should have its own database schema",
        check: "Tables should be prefixed or in separate schemas",
        severity: "warning",
      },
    ],
    examples: [
      {
        name: "SaaS Application",
        description: "Billing, Users, Projects, Analytics as modules",
        mermaidCode: `flowchart LR
    subgraph "SaaS Modular Monolith"
        API[API Gateway]
        UM[Users Module]
        PM[Projects Module]
        BM[Billing Module]
        AM[Analytics Module]
    end

    API --> UM
    API --> PM
    API --> BM
    API --> AM

    UM --> BM
    PM --> AM`,
      },
    ],
  },

  {
    id: "serverless-event-driven",
    name: "Serverless Event-Driven",
    category: "architecture",
    description:
      "Use serverless functions triggered by events for highly scalable, pay-per-use architectures.",
    whenToUse: [
      "Variable or unpredictable workloads",
      "Need automatic scaling to zero",
      "Event-driven business processes",
      "Cost optimization for sporadic traffic",
      "Rapid prototyping and MVPs",
    ],
    whenNotToUse: [
      "Consistent high-volume traffic",
      "Long-running processes (> 15 minutes)",
      "Need for persistent connections (WebSockets)",
      "Cold start latency is unacceptable",
      "Complex stateful workflows",
    ],
    tradeoffs: {
      pros: [
        "Auto-scaling including to zero",
        "Pay only for actual usage",
        "No server management",
        "Built-in high availability",
        "Fast time to market",
      ],
      cons: [
        "Cold start latency",
        "Vendor lock-in",
        "Limited execution time",
        "Harder to test locally",
        "Observability challenges",
      ],
    },
    relatedPatterns: ["event-sourcing", "saga-choreography", "circuit-breaker"],
    templates: {
      c4Container: `C4Container
    title Container diagram - Serverless Event-Driven

    Person(user, "User", "System user")

    System_Boundary(serverless, "Serverless Architecture") {
        Container(apigw, "API Gateway", "AWS API GW", "HTTP entry point")
        Container(fn_order, "Order Function", "Lambda", "Creates orders")
        Container(fn_payment, "Payment Function", "Lambda", "Processes payments")
        Container(fn_notify, "Notification Function", "Lambda", "Sends notifications")

        ContainerDb(dynamo, "Orders Table", "DynamoDB", "Order storage")
        Container(eventbridge, "Event Bus", "EventBridge", "Event routing")
        Container(sqs, "Queue", "SQS", "Async processing")
        Container(sns, "Notifications", "SNS", "Push notifications")
    }

    Rel(user, apigw, "POST /orders", "HTTPS")
    Rel(apigw, fn_order, "Triggers")
    Rel(fn_order, dynamo, "Writes")
    Rel(fn_order, eventbridge, "Publishes OrderCreated")

    Rel(eventbridge, fn_payment, "Triggers on OrderCreated")
    Rel(fn_payment, eventbridge, "Publishes PaymentProcessed")

    Rel(eventbridge, sqs, "Routes to")
    Rel(sqs, fn_notify, "Triggers")
    Rel(fn_notify, sns, "Sends notification")`,
      sequence: `sequenceDiagram
    participant U as User
    participant AG as API Gateway
    participant FO as Order Lambda
    participant DB as DynamoDB
    participant EB as EventBridge
    participant FP as Payment Lambda
    participant FN as Notify Lambda

    U->>AG: POST /orders
    AG->>FO: Invoke
    FO->>DB: Save Order
    FO->>EB: Emit OrderCreated
    FO-->>AG: 202 Accepted
    AG-->>U: Order Accepted

    EB->>FP: Trigger
    FP->>FP: Process Payment
    FP->>EB: Emit PaymentProcessed

    EB->>FN: Trigger
    FN->>FN: Send Email`,
    },
    variables: [
      {
        name: "cloudProvider",
        description: "Cloud provider for serverless",
        type: "select",
        options: ["AWS", "GCP", "Azure"],
        default: "AWS",
        required: true,
      },
    ],
    validations: [
      {
        id: "function-timeout",
        description: "Functions should complete within timeout limits",
        check: "Check if operations can complete in < 15 minutes",
        severity: "error",
      },
      {
        id: "cold-start",
        description: "Consider cold start impact on latency-sensitive paths",
        check: "Identify latency-critical functions",
        severity: "warning",
      },
    ],
    examples: [
      {
        name: "Image Processing Pipeline",
        description: "S3 trigger → Resize Lambda → Store → Notify",
        mermaidCode: `flowchart LR
    S3[S3 Upload] --> L1[Resize Lambda]
    L1 --> S3Out[S3 Output]
    L1 --> EB[EventBridge]
    EB --> L2[Metadata Lambda]
    EB --> L3[Notify Lambda]
    L2 --> DDB[(DynamoDB)]
    L3 --> SNS[SNS Topic]`,
      },
    ],
  },

  {
    id: "hexagonal",
    name: "Hexagonal Architecture (Ports & Adapters)",
    category: "architecture",
    description:
      "Isolate the core business logic from external concerns using ports (interfaces) and adapters (implementations).",
    whenToUse: [
      "Complex business logic that needs isolation",
      "Need to swap infrastructure easily (DB, APIs)",
      "High testability requirements",
      "Long-lived systems that will evolve",
      "Domain-Driven Design adoption",
    ],
    whenNotToUse: [
      "Simple CRUD applications",
      "Short-lived prototypes",
      "Team unfamiliar with DDD concepts",
      "Very tight deadlines",
    ],
    tradeoffs: {
      pros: [
        "Business logic fully isolated",
        "Easy to test (mock adapters)",
        "Infrastructure is replaceable",
        "Clear dependency direction",
        "Supports DDD practices",
      ],
      cons: [
        "More boilerplate code",
        "Steeper learning curve",
        "Can be overkill for simple apps",
        "Requires discipline to maintain boundaries",
      ],
    },
    relatedPatterns: ["modular-monolith", "cqrs", "layered-architecture"],
    templates: {
      flowchart: `flowchart TB
    subgraph "Driving Adapters (Input)"
        REST[REST Controller]
        GQL[GraphQL Resolver]
        CLI[CLI Handler]
        MSG[Message Consumer]
    end

    subgraph "Application Core"
        subgraph "Ports (Interfaces)"
            IP[Input Ports]
            OP[Output Ports]
        end

        subgraph "Domain"
            UC[Use Cases]
            ENT[Entities]
            VS[Value Objects]
            DS[Domain Services]
        end
    end

    subgraph "Driven Adapters (Output)"
        DB[Database Adapter]
        API[External API Adapter]
        MAIL[Email Adapter]
        CACHE[Cache Adapter]
    end

    REST --> IP
    GQL --> IP
    CLI --> IP
    MSG --> IP

    IP --> UC
    UC --> ENT
    UC --> DS
    ENT --> VS
    UC --> OP

    OP --> DB
    OP --> API
    OP --> MAIL
    OP --> CACHE`,
      c4Component: `C4Component
    title Component diagram - Hexagonal Architecture

    Container_Boundary(app, "Application") {
        Component(rest, "REST Adapter", "Express", "HTTP input")
        Component(grpc, "gRPC Adapter", "gRPC", "Service-to-service")

        Component_Boundary(core, "Domain Core") {
            Component(usecase, "Use Cases", "Application Services", "Orchestrates business operations")
            Component(domain, "Domain Model", "Entities, Value Objects", "Business rules")
            Component(ports, "Ports", "Interfaces", "Contracts for adapters")
        }

        Component(pg, "PostgreSQL Adapter", "Prisma", "Database access")
        Component(stripe, "Stripe Adapter", "SDK", "Payment processing")
        Component(redis, "Redis Adapter", "ioredis", "Caching")
    }

    Rel(rest, usecase, "Calls")
    Rel(grpc, usecase, "Calls")
    Rel(usecase, domain, "Uses")
    Rel(usecase, ports, "Depends on")
    Rel(pg, ports, "Implements")
    Rel(stripe, ports, "Implements")
    Rel(redis, ports, "Implements")`,
    },
    variables: [],
    validations: [
      {
        id: "dependency-direction",
        description:
          "Dependencies must point inward toward the domain",
        check: "Domain should not import from adapters",
        severity: "error",
      },
      {
        id: "port-interface",
        description: "All external access must go through ports",
        check: "No direct infrastructure access from domain",
        severity: "error",
      },
    ],
    examples: [
      {
        name: "Payment Service",
        description: "Domain isolated from payment providers",
        mermaidCode: `flowchart LR
    subgraph Input
        API[API]
        WH[Webhooks]
    end

    subgraph Core
        UC[ProcessPayment]
        PM[PaymentModel]
    end

    subgraph Output
        SP[Stripe Port]
        PP[PayPal Port]
        DB[DB Port]
    end

    API --> UC
    WH --> UC
    UC --> PM
    UC --> SP
    UC --> PP
    UC --> DB`,
      },
    ],
  },

  {
    id: "layered-architecture",
    name: "Layered Architecture (N-Tier)",
    category: "architecture",
    description:
      "Organize code into horizontal layers with clear responsibilities and dependencies flowing downward.",
    whenToUse: [
      "Traditional enterprise applications",
      "Team familiar with MVC patterns",
      "Clear separation of concerns needed",
      "Straightforward business logic",
      "Standard CRUD operations",
    ],
    whenNotToUse: [
      "Complex domain logic requiring DDD",
      "High-performance requirements",
      "Microservices architecture",
      "Event-driven systems",
    ],
    tradeoffs: {
      pros: [
        "Simple and well-understood",
        "Clear separation of concerns",
        "Easy to onboard new developers",
        "Good for standard business apps",
        "Straightforward testing per layer",
      ],
      cons: [
        "Can lead to anemic domain model",
        "Rigid structure limits flexibility",
        "All requests traverse all layers",
        "Tight coupling between layers",
        "Hard to extract to microservices",
      ],
    },
    relatedPatterns: ["hexagonal", "modular-monolith"],
    templates: {
      flowchart: `flowchart TB
    subgraph "Presentation Layer"
        UI[Web UI]
        API[REST API]
    end

    subgraph "Application Layer"
        CTRL[Controllers]
        SVC[Application Services]
        DTO[DTOs / ViewModels]
    end

    subgraph "Business Layer"
        BL[Business Logic]
        VAL[Validators]
        CALC[Calculators]
    end

    subgraph "Data Access Layer"
        REPO[Repositories]
        ORM[ORM / Data Mapper]
        ENT[Entities]
    end

    subgraph "Infrastructure"
        DB[(Database)]
        EXT[External Services]
        CACHE[Cache]
    end

    UI --> CTRL
    API --> CTRL
    CTRL --> SVC
    SVC --> DTO
    SVC --> BL
    BL --> VAL
    BL --> CALC
    BL --> REPO
    REPO --> ORM
    ORM --> ENT
    ORM --> DB
    SVC --> EXT
    SVC --> CACHE`,
      c4Container: `C4Container
    title Container diagram - Layered Architecture

    Person(user, "User", "End user")

    System_Boundary(app, "Application") {
        Container(web, "Web Layer", "React", "User interface")
        Container(api, "API Layer", "Express", "REST endpoints")
        Container(biz, "Business Layer", "Node.js", "Business logic")
        Container(dal, "Data Access Layer", "Prisma", "Database access")
        ContainerDb(db, "Database", "PostgreSQL", "Data storage")
    }

    Rel(user, web, "Uses")
    Rel(web, api, "Calls", "REST")
    Rel(api, biz, "Uses")
    Rel(biz, dal, "Uses")
    Rel(dal, db, "Reads/Writes")`,
    },
    variables: [
      {
        name: "layerCount",
        description: "Number of layers (3-5 typical)",
        type: "number",
        default: 4,
        required: false,
      },
    ],
    validations: [
      {
        id: "layer-skip",
        description: "Layers should not be skipped",
        check: "Presentation should not directly access Data layer",
        severity: "warning",
      },
      {
        id: "upward-dependency",
        description: "Dependencies must flow downward only",
        check: "Lower layers should not depend on upper layers",
        severity: "error",
      },
    ],
    examples: [
      {
        name: "Classic MVC Web App",
        description: "Controller → Service → Repository → Database",
        mermaidCode: `flowchart TB
    C[Controller] --> S[Service]
    S --> R[Repository]
    R --> D[(Database)]`,
      },
    ],
  },
];
