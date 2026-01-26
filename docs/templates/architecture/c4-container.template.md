# C4 Container Diagram Template

## Overview

The C4 Container diagram zooms into the system boundary showing the high-level technology choices, how responsibilities are distributed, and how containers communicate.

## Template

```markdown
# C4 Container Diagram: [System Name]

## Overview

[Description of the system's container architecture]

## Diagram

```mermaid
C4Container
    title Container Diagram - [System Name]

    Person(user, "User", "Primary user")

    Container_Boundary(system, "System Name") {
        Container(web, "Web Application", "React/Vue/Angular", "Delivers the static content and SPA")
        Container(mobile, "Mobile App", "React Native/Flutter", "Mobile application")
        Container(api, "API Gateway", "Node.js/Go", "Routes requests, handles auth")
        Container(backend, "Backend Service", "Node.js/Python", "Core business logic")
        Container(worker, "Background Worker", "Node.js/Python", "Async task processing")
        ContainerDb(db, "Database", "PostgreSQL", "Stores application data")
        ContainerDb(cache, "Cache", "Redis", "Session and data caching")
        ContainerDb(queue, "Message Queue", "RabbitMQ/SQS", "Async message processing")
        Container(search, "Search Engine", "Elasticsearch", "Full-text search")
    }

    System_Ext(cdn, "CDN", "Content delivery")
    System_Ext(email, "Email Service", "Transactional emails")
    System_Ext(payment, "Payment Gateway", "Payment processing")

    Rel(user, cdn, "Loads assets", "HTTPS")
    Rel(cdn, web, "Fetches from", "HTTPS")
    Rel(user, web, "Uses", "HTTPS")
    Rel(user, mobile, "Uses", "HTTPS")
    Rel(web, api, "API calls", "REST/GraphQL")
    Rel(mobile, api, "API calls", "REST/GraphQL")
    Rel(api, backend, "Routes to", "gRPC/HTTP")
    Rel(backend, db, "Reads/Writes", "SQL")
    Rel(backend, cache, "Caches", "Redis Protocol")
    Rel(backend, queue, "Publishes", "AMQP")
    Rel(worker, queue, "Consumes", "AMQP")
    Rel(worker, db, "Updates", "SQL")
    Rel(backend, search, "Queries", "HTTP")
    Rel(backend, email, "Sends", "API")
    Rel(backend, payment, "Processes", "API")
```

## Containers

### Frontend Containers

| Container | Technology | Purpose | Scaling Strategy |
|-----------|------------|---------|------------------|
| Web Application | React + TypeScript | Browser-based UI | CDN + Static hosting |
| Mobile App | React Native | iOS/Android app | App stores |

### Backend Containers

| Container | Technology | Purpose | Scaling Strategy |
|-----------|------------|---------|------------------|
| API Gateway | Node.js + Express | Request routing, auth | Horizontal (load balanced) |
| Backend Service | Node.js + NestJS | Business logic | Horizontal (stateless) |
| Background Worker | Node.js + Bull | Async processing | Horizontal (queue-based) |

### Data Containers

| Container | Technology | Purpose | Scaling Strategy |
|-----------|------------|---------|------------------|
| Database | PostgreSQL 15 | Primary data store | Vertical + Read replicas |
| Cache | Redis 7 | Caching, sessions | Cluster mode |
| Message Queue | RabbitMQ | Async messaging | Cluster mode |
| Search Engine | Elasticsearch 8 | Full-text search | Cluster mode |

## Communication Patterns

### Synchronous

| From | To | Protocol | Purpose |
|------|-----|----------|---------|
| Web App | API Gateway | REST/HTTPS | User requests |
| API Gateway | Backend | gRPC | Internal routing |
| Backend | Database | TCP/SQL | Data persistence |

### Asynchronous

| From | To | Protocol | Purpose |
|------|-----|----------|---------|
| Backend | Message Queue | AMQP | Task publishing |
| Message Queue | Worker | AMQP | Task consumption |

## Security

### Authentication Flow

[Describe how authentication works across containers]

### Network Boundaries

[Describe network segmentation and security groups]

## Deployment

### Infrastructure

[Describe deployment infrastructure - Kubernetes, ECS, etc.]

### Container Orchestration

[Describe how containers are orchestrated]

## Notes

[Additional technical considerations]
```

## Example

```markdown
# C4 Container Diagram: E-Commerce Platform

## Overview

The E-Commerce Platform uses a microservices-oriented architecture with separate containers for web serving, API processing, and background tasks.

## Diagram

```mermaid
C4Container
    title Container Diagram - E-Commerce Platform

    Person(customer, "Customer", "Shops online")
    Person(seller, "Seller", "Manages products")

    Container_Boundary(ecommerce, "E-Commerce Platform") {
        Container(spa, "Web SPA", "React 18", "Single-page storefront application")
        Container(seller_portal, "Seller Portal", "React 18", "Seller management dashboard")
        Container(api_gw, "API Gateway", "Kong", "Rate limiting, auth, routing")
        Container(catalog, "Catalog Service", "Node.js", "Product catalog management")
        Container(orders, "Order Service", "Node.js", "Order processing")
        Container(users, "User Service", "Node.js", "User management, auth")
        Container(payments, "Payment Service", "Node.js", "Payment orchestration")
        Container(notifications, "Notification Worker", "Node.js", "Email, SMS, push")
        ContainerDb(postgres, "PostgreSQL", "PostgreSQL 15", "Relational data")
        ContainerDb(redis, "Redis", "Redis 7", "Cache, sessions")
        ContainerDb(rabbitmq, "RabbitMQ", "RabbitMQ", "Message broker")
        ContainerDb(elastic, "Elasticsearch", "ES 8", "Product search")
    }

    System_Ext(stripe, "Stripe", "Payment processing")
    System_Ext(sendgrid, "SendGrid", "Email delivery")

    Rel(customer, spa, "Uses", "HTTPS")
    Rel(seller, seller_portal, "Uses", "HTTPS")
    Rel(spa, api_gw, "API calls", "REST")
    Rel(seller_portal, api_gw, "API calls", "REST")
    Rel(api_gw, catalog, "Routes", "HTTP")
    Rel(api_gw, orders, "Routes", "HTTP")
    Rel(api_gw, users, "Routes", "HTTP")
    Rel(catalog, postgres, "Reads/Writes", "SQL")
    Rel(catalog, elastic, "Indexes", "HTTP")
    Rel(orders, postgres, "Reads/Writes", "SQL")
    Rel(orders, rabbitmq, "Publishes", "AMQP")
    Rel(orders, payments, "Calls", "HTTP")
    Rel(payments, stripe, "Processes", "HTTPS")
    Rel(notifications, rabbitmq, "Consumes", "AMQP")
    Rel(notifications, sendgrid, "Sends", "HTTPS")
    Rel(users, postgres, "Reads/Writes", "SQL")
    Rel(users, redis, "Sessions", "Redis")
```

## Containers

### Frontend

| Container | Technology | Port | Replicas |
|-----------|------------|------|----------|
| Web SPA | React 18 + Vite | 80 | CDN |
| Seller Portal | React 18 + Vite | 80 | CDN |

### Backend Services

| Container | Technology | Port | Replicas |
|-----------|------------|------|----------|
| API Gateway | Kong 3.x | 8000 | 3 |
| Catalog Service | Node.js 20 + NestJS | 3001 | 3 |
| Order Service | Node.js 20 + NestJS | 3002 | 3 |
| User Service | Node.js 20 + NestJS | 3003 | 2 |
| Payment Service | Node.js 20 + NestJS | 3004 | 2 |
| Notification Worker | Node.js 20 + Bull | N/A | 2 |

### Data Stores

| Container | Technology | Storage | Backup |
|-----------|------------|---------|--------|
| PostgreSQL | 15.x | 500GB SSD | Daily |
| Redis | 7.x | 16GB RAM | AOF |
| RabbitMQ | 3.12 | 50GB SSD | Mirrored |
| Elasticsearch | 8.x | 200GB SSD | Snapshots |
```

## Best Practices

1. **Show all containers** - Include databases, caches, queues
2. **Label technologies** - Be specific about versions
3. **Show communication** - Protocols and data flow
4. **Group logically** - Use boundaries effectively
5. **Include external systems** - Show integration points
