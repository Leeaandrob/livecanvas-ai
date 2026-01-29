/**
 * Integration Architecture Patterns
 *
 * Patterns for service communication, API management, and system integration.
 */

import type { ArchitecturePattern } from "@live-canvas/protocols";

export const INTEGRATION_PATTERNS: ArchitecturePattern[] = [
  // ============================================
  // API Gateway Pattern
  // ============================================
  {
    id: "api-gateway",
    name: "API Gateway",
    category: "integration",
    description:
      "Single entry point for all client requests that routes to appropriate backend services, handles cross-cutting concerns like authentication, rate limiting, and request transformation.",
    whenToUse: [
      "Multiple microservices need to be exposed to clients",
      "Cross-cutting concerns like auth, logging, rate limiting are needed",
      "Different clients need different API interfaces",
      "API versioning and transformation is required",
      "Need to aggregate responses from multiple services",
    ],
    whenNotToUse: [
      "Simple monolithic application",
      "Single backend service",
      "Internal service-to-service communication only",
      "Latency is extremely critical (adds hop)",
    ],
    tradeoffs: {
      pros: [
        "Single entry point simplifies client code",
        "Centralized cross-cutting concerns",
        "Decouples clients from internal architecture",
        "Enables API versioning and transformation",
        "Can aggregate multiple service calls",
      ],
      cons: [
        "Single point of failure (requires HA setup)",
        "Adds latency (additional network hop)",
        "Can become a bottleneck",
        "Requires careful capacity planning",
        "Complex routing rules can be hard to maintain",
      ],
    },
    relatedPatterns: ["bff", "service-mesh", "circuit-breaker"],
    templates: {
      flowchart: `flowchart TB
    subgraph Clients
        WEB[Web App]
        MOB[Mobile App]
        EXT[External Partners]
    end

    subgraph "API Gateway"
        GW[Gateway]
        AUTH[Authentication]
        RL[Rate Limiter]
        CACHE[Response Cache]
        TRANS[Transformer]
    end

    subgraph "Backend Services"
        US[User Service]
        PS[Product Service]
        OS[Order Service]
        NS[Notification Service]
    end

    WEB --> GW
    MOB --> GW
    EXT --> GW

    GW --> AUTH
    AUTH --> RL
    RL --> CACHE
    CACHE --> TRANS

    TRANS --> US
    TRANS --> PS
    TRANS --> OS
    TRANS --> NS`,
      sequence: `sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant Auth as Auth Service
    participant S1 as Service A
    participant S2 as Service B

    C->>GW: Request /api/resource
    GW->>Auth: Validate Token
    Auth-->>GW: Token Valid

    GW->>GW: Check Rate Limit
    GW->>GW: Check Cache

    par Parallel Requests
        GW->>S1: Get Data A
        GW->>S2: Get Data B
    end

    S1-->>GW: Response A
    S2-->>GW: Response B

    GW->>GW: Aggregate & Transform
    GW-->>C: Combined Response`,
      c4Component: `C4Component
    title API Gateway Component Diagram

    Container_Boundary(gw, "API Gateway") {
        Component(router, "Router", "nginx/Kong", "Routes requests to services")
        Component(auth, "Auth Handler", "JWT/OAuth", "Validates tokens")
        Component(ratelimit, "Rate Limiter", "Redis", "Enforces rate limits")
        Component(cache, "Cache", "Redis", "Caches responses")
        Component(transform, "Transformer", "Custom", "Request/Response transformation")
    }

    Person(user, "API Consumer")
    System_Ext(services, "Backend Services")

    Rel(user, router, "HTTPS")
    Rel(router, auth, "Validates")
    Rel(auth, ratelimit, "Checks limits")
    Rel(ratelimit, cache, "Checks cache")
    Rel(cache, transform, "Transforms")
    Rel(transform, services, "Routes to")`,
    },
    variables: [
      {
        name: "gatewayTechnology",
        description: "Gateway technology (Kong, AWS API Gateway, nginx, etc.)",
        defaultValue: "Kong",
        type: "string",
      },
      {
        name: "authMethod",
        description: "Authentication method (JWT, OAuth2, API Key)",
        defaultValue: "JWT",
        type: "string",
      },
      {
        name: "rateLimitStrategy",
        description: "Rate limiting strategy",
        defaultValue: "sliding-window",
        type: "string",
      },
    ],
    validations: [
      {
        rule: "Gateway must have health check endpoints",
        severity: "error",
      },
      {
        rule: "Authentication should be enforced for all routes",
        severity: "error",
      },
      {
        rule: "Rate limiting should be configured",
        severity: "warning",
      },
      {
        rule: "Gateway should be deployed in HA configuration",
        severity: "warning",
      },
    ],
    examples: [
      {
        name: "E-commerce API Gateway",
        description: "Gateway for e-commerce platform with multiple services",
        code: `// Kong declarative configuration
_format_version: "3.0"

services:
  - name: user-service
    url: http://user-service:8080
    routes:
      - name: users-route
        paths: ["/api/v1/users"]

  - name: product-service
    url: http://product-service:8080
    routes:
      - name: products-route
        paths: ["/api/v1/products"]

plugins:
  - name: jwt
    config:
      secret_is_base64: false

  - name: rate-limiting
    config:
      minute: 100
      policy: redis`,
      },
    ],
  },

  // ============================================
  // Backend for Frontend (BFF)
  // ============================================
  {
    id: "bff",
    name: "Backend for Frontend (BFF)",
    category: "integration",
    description:
      "Dedicated backend service for each frontend application (web, mobile, etc.) that provides tailored APIs optimized for specific client needs.",
    whenToUse: [
      "Different frontends have significantly different data needs",
      "Mobile and web apps need different response formats",
      "Need to reduce over-fetching/under-fetching",
      "Different teams own different frontend applications",
      "Frontend-specific business logic is needed",
    ],
    whenNotToUse: [
      "Single frontend application",
      "All clients have similar data needs",
      "Small team managing all frontends",
      "Simple CRUD operations only",
    ],
    tradeoffs: {
      pros: [
        "Optimized APIs for each client",
        "Reduced over-fetching/under-fetching",
        "Independent deployment per frontend",
        "Frontend teams can own their BFF",
        "Better separation of concerns",
      ],
      cons: [
        "Code duplication across BFFs",
        "More services to maintain",
        "Potential for inconsistent business logic",
        "Increased operational complexity",
        "Need clear ownership boundaries",
      ],
    },
    relatedPatterns: ["api-gateway", "microservices-basic"],
    templates: {
      flowchart: `flowchart TB
    subgraph Clients
        WEB[Web Browser]
        IOS[iOS App]
        AND[Android App]
        TV[Smart TV App]
    end

    subgraph "BFF Layer"
        WEBFF[Web BFF]
        MOBFF[Mobile BFF]
        TVBFF[TV BFF]
    end

    subgraph "Core Services"
        US[User Service]
        CS[Content Service]
        RS[Recommendation Service]
        AS[Analytics Service]
    end

    WEB --> WEBFF
    IOS --> MOBFF
    AND --> MOBFF
    TV --> TVBFF

    WEBFF --> US
    WEBFF --> CS
    WEBFF --> RS

    MOBFF --> US
    MOBFF --> CS
    MOBFF --> RS

    TVBFF --> US
    TVBFF --> CS`,
      sequence: `sequenceDiagram
    participant Web as Web App
    participant BFF as Web BFF
    participant User as User Service
    participant Content as Content Service
    participant Rec as Recommendation Service

    Web->>BFF: GET /homepage

    par Parallel Backend Calls
        BFF->>User: Get User Profile
        BFF->>Content: Get Featured Content
        BFF->>Rec: Get Recommendations
    end

    User-->>BFF: Profile Data
    Content-->>BFF: Featured Items
    Rec-->>BFF: Personalized Recs

    BFF->>BFF: Aggregate & Format for Web
    BFF-->>Web: Homepage Data (optimized)`,
      c4Container: `C4Container
    title BFF Architecture

    Person(webUser, "Web User")
    Person(mobileUser, "Mobile User")

    System_Boundary(bffs, "BFF Layer") {
        Container(webBff, "Web BFF", "Node.js", "Optimized for web")
        Container(mobileBff, "Mobile BFF", "Node.js", "Optimized for mobile")
    }

    System_Boundary(core, "Core Services") {
        Container(userSvc, "User Service", "Go", "User management")
        Container(contentSvc, "Content Service", "Java", "Content management")
        Container(recSvc, "Recommendation Service", "Python", "ML recommendations")
    }

    Rel(webUser, webBff, "HTTPS", "REST/GraphQL")
    Rel(mobileUser, mobileBff, "HTTPS", "REST")

    Rel(webBff, userSvc, "gRPC")
    Rel(webBff, contentSvc, "gRPC")
    Rel(webBff, recSvc, "gRPC")

    Rel(mobileBff, userSvc, "gRPC")
    Rel(mobileBff, contentSvc, "gRPC")
    Rel(mobileBff, recSvc, "gRPC")`,
    },
    variables: [
      {
        name: "bffTechnology",
        description: "Technology for BFF services",
        defaultValue: "Node.js",
        type: "string",
      },
      {
        name: "clientProtocol",
        description: "Protocol for client communication",
        defaultValue: "REST",
        type: "string",
      },
      {
        name: "backendProtocol",
        description: "Protocol for backend communication",
        defaultValue: "gRPC",
        type: "string",
      },
    ],
    validations: [
      {
        rule: "BFF should not contain core business logic",
        severity: "warning",
      },
      {
        rule: "Each BFF should be independently deployable",
        severity: "error",
      },
      {
        rule: "BFF should handle client-specific error formatting",
        severity: "warning",
      },
    ],
    examples: [
      {
        name: "Netflix-style BFF",
        description: "BFF for streaming service with device-specific optimization",
        code: `// Mobile BFF endpoint - optimized for bandwidth
app.get('/api/mobile/homepage', async (req, res) => {
  const [profile, content, recs] = await Promise.all([
    userService.getProfile(req.userId),
    contentService.getFeatured({ imageSize: 'small' }),
    recService.getPersonalized(req.userId, { limit: 10 })
  ]);

  // Return minimal payload for mobile
  res.json({
    user: { name: profile.name, avatar: profile.avatarSmall },
    featured: content.map(c => ({
      id: c.id,
      title: c.title,
      thumbnail: c.thumbnailSmall
    })),
    recommendations: recs.slice(0, 10)
  });
});`,
      },
    ],
  },

  // ============================================
  // Service Mesh Pattern
  // ============================================
  {
    id: "service-mesh",
    name: "Service Mesh",
    category: "integration",
    description:
      "Infrastructure layer that handles service-to-service communication with features like load balancing, encryption, observability, and traffic management through sidecar proxies.",
    whenToUse: [
      "Many microservices with complex communication patterns",
      "Need consistent observability across all services",
      "mTLS encryption required between services",
      "Advanced traffic management (canary, A/B testing)",
      "Polyglot environment needing consistent policies",
    ],
    whenNotToUse: [
      "Few services (< 10)",
      "Simple request/response patterns",
      "Team lacks Kubernetes expertise",
      "Resource-constrained environment",
      "Latency-critical applications (adds ~1ms per hop)",
    ],
    tradeoffs: {
      pros: [
        "Consistent service-to-service security (mTLS)",
        "Unified observability (metrics, traces, logs)",
        "Advanced traffic management",
        "Language-agnostic policy enforcement",
        "Fault injection for testing",
      ],
      cons: [
        "Operational complexity",
        "Additional latency (~1-2ms per hop)",
        "Resource overhead (sidecar per pod)",
        "Steep learning curve",
        "Debugging can be more complex",
      ],
    },
    relatedPatterns: ["microservices-basic", "circuit-breaker", "api-gateway"],
    templates: {
      flowchart: `flowchart TB
    subgraph "Service Mesh (Istio)"
        subgraph "Control Plane"
            PILOT[Pilot<br/>Traffic Management]
            CITADEL[Citadel<br/>Security/mTLS]
            GALLEY[Galley<br/>Configuration]
        end

        subgraph "Data Plane"
            subgraph "Service A Pod"
                SA[Service A]
                EPA[Envoy Proxy]
            end

            subgraph "Service B Pod"
                SB[Service B]
                EPB[Envoy Proxy]
            end

            subgraph "Service C Pod"
                SC[Service C]
                EPC[Envoy Proxy]
            end
        end
    end

    PILOT --> EPA
    PILOT --> EPB
    PILOT --> EPC

    CITADEL --> EPA
    CITADEL --> EPB
    CITADEL --> EPC

    SA <--> EPA
    SB <--> EPB
    SC <--> EPC

    EPA <-->|mTLS| EPB
    EPB <-->|mTLS| EPC`,
      sequence: `sequenceDiagram
    participant A as Service A
    participant PA as Sidecar A
    participant CP as Control Plane
    participant PB as Sidecar B
    participant B as Service B

    Note over CP: Distributes certificates & policies
    CP-->>PA: mTLS Certs & Routing Rules
    CP-->>PB: mTLS Certs & Routing Rules

    A->>PA: HTTP Request to B
    PA->>PA: Apply policies (timeout, retry)
    PA->>PB: mTLS encrypted request
    PB->>PB: Verify certificate
    PB->>B: Forward request
    B-->>PB: Response
    PB-->>PA: mTLS encrypted response
    PA->>PA: Record metrics/traces
    PA-->>A: Response`,
      c4Deployment: `C4Deployment
    title Service Mesh Deployment

    Deployment_Node(k8s, "Kubernetes Cluster") {
        Deployment_Node(cp, "Control Plane Namespace") {
            Container(istiod, "Istiod", "Go", "Unified control plane")
        }

        Deployment_Node(ns1, "App Namespace") {
            Deployment_Node(pod1, "Pod") {
                Container(app1, "App Container", "Go", "Business logic")
                Container(proxy1, "Envoy Sidecar", "C++", "Traffic proxy")
            }
            Deployment_Node(pod2, "Pod") {
                Container(app2, "App Container", "Java", "Business logic")
                Container(proxy2, "Envoy Sidecar", "C++", "Traffic proxy")
            }
        }
    }

    Rel(istiod, proxy1, "xDS API", "Config push")
    Rel(istiod, proxy2, "xDS API", "Config push")
    Rel(proxy1, proxy2, "mTLS", "Service traffic")`,
    },
    variables: [
      {
        name: "meshTechnology",
        description: "Service mesh implementation",
        defaultValue: "Istio",
        type: "string",
      },
      {
        name: "proxyType",
        description: "Sidecar proxy type",
        defaultValue: "Envoy",
        type: "string",
      },
      {
        name: "mtlsMode",
        description: "mTLS enforcement mode",
        defaultValue: "STRICT",
        type: "string",
      },
    ],
    validations: [
      {
        rule: "mTLS should be enabled for all service communication",
        severity: "error",
      },
      {
        rule: "Observability (metrics, traces) must be configured",
        severity: "warning",
      },
      {
        rule: "Circuit breakers should be configured for resilience",
        severity: "warning",
      },
    ],
    examples: [
      {
        name: "Istio Traffic Management",
        description: "Canary deployment with traffic splitting",
        code: `# Istio VirtualService for canary deployment
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: product-service
spec:
  hosts:
    - product-service
  http:
    - match:
        - headers:
            x-canary:
              exact: "true"
      route:
        - destination:
            host: product-service
            subset: canary
    - route:
        - destination:
            host: product-service
            subset: stable
          weight: 90
        - destination:
            host: product-service
            subset: canary
          weight: 10`,
      },
    ],
  },

  // ============================================
  // Message Broker Pattern
  // ============================================
  {
    id: "message-broker",
    name: "Message Broker",
    category: "integration",
    description:
      "Intermediary component that enables asynchronous communication between services through message queues or topics, decoupling producers from consumers.",
    whenToUse: [
      "Services need to communicate asynchronously",
      "Need to handle traffic spikes (buffering)",
      "Decoupling producers and consumers is important",
      "Reliable message delivery is required",
      "Multiple consumers need same message (pub/sub)",
    ],
    whenNotToUse: [
      "Synchronous response is always needed",
      "Simple point-to-point communication",
      "Very low latency is critical",
      "Team lacks messaging expertise",
    ],
    tradeoffs: {
      pros: [
        "Decouples services (producer doesn't know consumers)",
        "Handles traffic spikes through buffering",
        "Enables reliable delivery with acknowledgments",
        "Supports multiple delivery patterns (queue, pub/sub)",
        "Enables replay and event sourcing",
      ],
      cons: [
        "Adds complexity (another system to manage)",
        "Eventually consistent (not immediate)",
        "Message ordering can be complex",
        "Debugging distributed flows is harder",
        "Requires careful capacity planning",
      ],
    },
    relatedPatterns: ["event-sourcing", "saga-choreography", "outbox-pattern"],
    templates: {
      flowchart: `flowchart TB
    subgraph Producers
        P1[Order Service]
        P2[Inventory Service]
        P3[User Service]
    end

    subgraph "Message Broker (Kafka)"
        subgraph Topics
            T1[orders]
            T2[inventory-updates]
            T3[user-events]
        end

        subgraph "Consumer Groups"
            CG1[notification-group]
            CG2[analytics-group]
            CG3[audit-group]
        end
    end

    subgraph Consumers
        C1[Notification Service]
        C2[Analytics Service]
        C3[Audit Service]
    end

    P1 --> T1
    P2 --> T2
    P3 --> T3

    T1 --> CG1
    T1 --> CG2
    T1 --> CG3

    T2 --> CG2
    T3 --> CG1

    CG1 --> C1
    CG2 --> C2
    CG3 --> C3`,
      sequence: `sequenceDiagram
    participant Producer as Order Service
    participant Broker as Message Broker
    participant C1 as Email Service
    participant C2 as Inventory Service
    participant C3 as Analytics Service

    Producer->>Broker: Publish OrderCreated
    Broker->>Broker: Persist to topic
    Broker-->>Producer: ACK

    par Fan-out to consumers
        Broker->>C1: OrderCreated
        C1-->>Broker: ACK
        Note over C1: Send confirmation email

        Broker->>C2: OrderCreated
        C2-->>Broker: ACK
        Note over C2: Reserve inventory

        Broker->>C3: OrderCreated
        C3-->>Broker: ACK
        Note over C3: Update metrics
    end`,
      c4Container: `C4Container
    title Message Broker Architecture

    System_Boundary(producers, "Producers") {
        Container(orderSvc, "Order Service", "Java", "Handles orders")
        Container(userSvc, "User Service", "Go", "User management")
    }

    System_Boundary(broker, "Message Broker") {
        ContainerDb(kafka, "Kafka Cluster", "Kafka", "Message streaming")
        Container(zk, "ZooKeeper", "ZooKeeper", "Cluster coordination")
    }

    System_Boundary(consumers, "Consumers") {
        Container(emailSvc, "Email Service", "Node.js", "Sends emails")
        Container(analyticsSvc, "Analytics", "Python", "Processes analytics")
        Container(searchSvc, "Search Service", "Java", "Updates search index")
    }

    Rel(orderSvc, kafka, "Publishes", "orders topic")
    Rel(userSvc, kafka, "Publishes", "users topic")

    Rel(kafka, emailSvc, "Consumes", "orders, users")
    Rel(kafka, analyticsSvc, "Consumes", "orders, users")
    Rel(kafka, searchSvc, "Consumes", "orders")

    Rel(kafka, zk, "Coordination")`,
    },
    variables: [
      {
        name: "brokerTechnology",
        description: "Message broker technology",
        defaultValue: "Kafka",
        type: "string",
      },
      {
        name: "deliveryGuarantee",
        description: "Message delivery guarantee",
        defaultValue: "at-least-once",
        type: "string",
      },
      {
        name: "retentionPeriod",
        description: "Message retention period",
        defaultValue: "7d",
        type: "string",
      },
    ],
    validations: [
      {
        rule: "Dead letter queue must be configured for failed messages",
        severity: "error",
      },
      {
        rule: "Message schemas should be versioned",
        severity: "warning",
      },
      {
        rule: "Consumer idempotency must be implemented",
        severity: "error",
      },
      {
        rule: "Monitoring and alerting for consumer lag",
        severity: "warning",
      },
    ],
    examples: [
      {
        name: "Kafka Producer/Consumer",
        description: "Basic Kafka setup with TypeScript",
        code: `// Producer
import { Kafka } from 'kafkajs';

const kafka = new Kafka({ brokers: ['localhost:9092'] });
const producer = kafka.producer();

async function publishOrder(order: Order) {
  await producer.send({
    topic: 'orders',
    messages: [{
      key: order.id,
      value: JSON.stringify(order),
      headers: { 'event-type': 'OrderCreated' }
    }]
  });
}

// Consumer
const consumer = kafka.consumer({ groupId: 'email-service' });

await consumer.subscribe({ topic: 'orders' });
await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const order = JSON.parse(message.value.toString());
    await sendConfirmationEmail(order);
  }
});`,
      },
    ],
  },

  // ============================================
  // Anti-Corruption Layer Pattern
  // ============================================
  {
    id: "anti-corruption-layer",
    name: "Anti-Corruption Layer (ACL)",
    category: "integration",
    description:
      "Translation layer that isolates a domain from external systems or legacy code, preventing foreign concepts from leaking into the domain model.",
    whenToUse: [
      "Integrating with legacy systems",
      "Domain model differs significantly from external API",
      "Protecting domain from external changes",
      "Migrating from monolith to microservices",
      "Integrating with third-party services",
    ],
    whenNotToUse: [
      "External API matches your domain well",
      "Simple pass-through integration",
      "Tight coupling is acceptable",
      "Very simple domain model",
    ],
    tradeoffs: {
      pros: [
        "Protects domain model integrity",
        "Isolates external system changes",
        "Enables gradual migration",
        "Cleaner domain code",
        "Easier to test domain logic",
      ],
      cons: [
        "Additional translation code to maintain",
        "Slight performance overhead",
        "Can hide integration complexity",
        "Requires understanding both models",
        "May duplicate some validation",
      ],
    },
    relatedPatterns: ["hexagonal", "api-gateway"],
    templates: {
      flowchart: `flowchart LR
    subgraph "Your Domain"
        DC[Domain Core]
        DS[Domain Service]
        DR[Domain Repository]
    end

    subgraph "Anti-Corruption Layer"
        direction TB
        TR[Translator]
        AD[Adapter]
        FA[Facade]
    end

    subgraph "External System"
        EA[External API]
        EM[External Model]
    end

    DC --> DS
    DS --> DR
    DR --> FA
    FA --> AD
    AD --> TR
    TR --> EA
    EA --> EM`,
      sequence: `sequenceDiagram
    participant Domain as Domain Service
    participant ACL as Anti-Corruption Layer
    participant External as Legacy System

    Domain->>ACL: getCustomer(customerId)
    Note over ACL: Translate domain request
    ACL->>External: GET /api/clients/{id}
    External-->>ACL: LegacyClientDTO
    Note over ACL: Translate to domain model
    ACL->>ACL: translateToDomain(dto)
    ACL-->>Domain: Customer (domain entity)`,
      class: `classDiagram
    class Customer {
        +String id
        +Email email
        +FullName name
        +Address billingAddress
        +CustomerStatus status
    }

    class CustomerRepository {
        <<interface>>
        +findById(id) Customer
        +save(customer) void
    }

    class LegacyCustomerAdapter {
        -LegacyApiClient client
        -CustomerTranslator translator
        +findById(id) Customer
        +save(customer) void
    }

    class CustomerTranslator {
        +toDomain(dto) Customer
        +toExternal(customer) LegacyClientDTO
    }

    class LegacyClientDTO {
        +int clientNum
        +String emailAddr
        +String firstName
        +String lastName
        +String street
        +String city
        +int statusCode
    }

    CustomerRepository <|.. LegacyCustomerAdapter
    LegacyCustomerAdapter --> CustomerTranslator
    CustomerTranslator --> Customer
    CustomerTranslator --> LegacyClientDTO`,
    },
    variables: [
      {
        name: "externalSystemName",
        description: "Name of the external/legacy system",
        defaultValue: "Legacy System",
        type: "string",
      },
      {
        name: "translationStrategy",
        description: "Translation strategy (mapper, adapter, facade)",
        defaultValue: "adapter",
        type: "string",
      },
    ],
    validations: [
      {
        rule: "ACL must not expose external system types to domain",
        severity: "error",
      },
      {
        rule: "Domain should not have direct dependencies on external system",
        severity: "error",
      },
      {
        rule: "Translation logic should be thoroughly tested",
        severity: "warning",
      },
    ],
    examples: [
      {
        name: "Legacy System Integration",
        description: "ACL for integrating with legacy customer system",
        code: `// Domain model
interface Customer {
  id: string;
  email: Email;
  name: FullName;
  status: 'active' | 'inactive' | 'suspended';
}

// Legacy DTO (external model)
interface LegacyClientDTO {
  clientNum: number;
  emailAddr: string;
  fName: string;
  lName: string;
  statusCd: 'A' | 'I' | 'S';
}

// Anti-Corruption Layer
class CustomerTranslator {
  toDomain(dto: LegacyClientDTO): Customer {
    return {
      id: \`CUST-\${dto.clientNum}\`,
      email: new Email(dto.emailAddr),
      name: new FullName(dto.fName, dto.lName),
      status: this.translateStatus(dto.statusCd)
    };
  }

  private translateStatus(code: string): Customer['status'] {
    const map = { 'A': 'active', 'I': 'inactive', 'S': 'suspended' };
    return map[code] || 'inactive';
  }
}

class LegacyCustomerAdapter implements CustomerRepository {
  constructor(
    private client: LegacyApiClient,
    private translator: CustomerTranslator
  ) {}

  async findById(id: string): Promise<Customer | null> {
    const clientNum = parseInt(id.replace('CUST-', ''));
    const dto = await this.client.getClient(clientNum);
    return dto ? this.translator.toDomain(dto) : null;
  }
}`,
      },
    ],
  },
];
