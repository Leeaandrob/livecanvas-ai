# PRP: LiveCanvas AI - Estado da Arte em System Design

**Version:** 1.0.0
**Date:** 2026-01-27
**Status:** Draft
**Codename:** Project Jarvis

---

## Executive Summary

Transformar o LiveCanvas AI de um "gerador de diagramas com AI" para um **Arquiteto de Software AI** - um parceiro de design que entende, questiona, sugere, valida e documenta decisões arquiteturais.

**Visão:** O primeiro sistema que combina o conhecimento profundo de LLMs sobre engenharia de software com uma experiência de design colaborativo e conversacional.

---

## O Problema

### Estado Atual do Mercado

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FERRAMENTAS ATUAIS                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Miro/Figma:        Desenham, não entendem                         │
│  Draw.ai/Eraser:    Geram código, não raciocinam                   │
│  ChatGPT/Claude:    Entendem, mas não visualizam bem               │
│                                                                     │
│  NENHUM combina:                                                    │
│  ✗ Entendimento profundo de arquitetura                            │
│  ✗ Raciocínio sobre trade-offs                                     │
│  ✗ Validação de decisões                                           │
│  ✗ Experiência visual colaborativa                                 │
│  ✗ Sessão de design guiada                                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### O Gap

Engenheiros precisam de um **parceiro de design**, não um gerador de diagramas. Alguém que:
- Pergunte as questões certas antes de desenhar
- Conheça padrões arquiteturais e quando aplicá-los
- Alerte sobre problemas antes que virem produção
- Documente decisões e trade-offs automaticamente
- Mantenha consistência entre múltiplos diagramas

---

## A Solução: LiveCanvas AI como Arquiteto de Software

### Princípios Fundamentais

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DESIGN PRINCIPLES                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. UNDERSTAND FIRST, DRAW SECOND                                   │
│     Nunca gere um diagrama sem entender o contexto                 │
│                                                                     │
│  2. SEMANTIC, NOT SYNTACTIC                                         │
│     Diagramas são conhecimento estruturado, não texto              │
│                                                                     │
│  3. OPINIONATED BUT FLEXIBLE                                        │
│     Tenha opiniões fortes baseadas em best practices,              │
│     mas aceite overrides justificados                              │
│                                                                     │
│  4. ALWAYS EXPLAIN WHY                                              │
│     Cada decisão deve ter justificativa documentada                │
│                                                                     │
│  5. PROACTIVE, NOT REACTIVE                                         │
│     Sugira melhorias, não espere ser perguntado                    │
│                                                                     │
│  6. MULTI-PERSPECTIVE                                               │
│     Um sistema precisa de múltiplas visões sincronizadas           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Arquitetura do Sistema

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LIVECANVAS AI - JARVIS MODE                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        INTERACTION LAYER                             │   │
│  │                                                                      │   │
│  │   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐        │   │
│  │   │  Canvas  │   │   Chat   │   │  Voice   │   │ Command  │        │   │
│  │   │  (Visual)│   │  (Text)  │   │ (Gemini) │   │ Palette  │        │   │
│  │   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘        │   │
│  │        │              │              │              │               │   │
│  │        └──────────────┴──────────────┴──────────────┘               │   │
│  │                              │                                       │   │
│  └──────────────────────────────┼───────────────────────────────────────┘   │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      ORCHESTRATION LAYER                             │   │
│  │                                                                      │   │
│  │   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   │   │
│  │   │ Design Session  │   │  Intent Router  │   │ Context Manager │   │   │
│  │   │    Manager      │   │                 │   │                 │   │   │
│  │   │                 │   │ • Analyze intent│   │ • All diagrams  │   │   │
│  │   │ • Session state │   │ • Route to agent│   │ • Entity graph  │   │   │
│  │   │ • Conv history  │   │ • Multi-turn    │   │ • Decisions     │   │   │
│  │   │ • Phase tracking│   │                 │   │ • Constraints   │   │   │
│  │   └─────────────────┘   └─────────────────┘   └─────────────────┘   │   │
│  │                                                                      │   │
│  └──────────────────────────────┼───────────────────────────────────────┘   │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      AI SPECIALIST AGENTS                            │   │
│  │                                                                      │   │
│  │   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐          │   │
│  │   │ Discovery │ │  Architect│ │ Validator │ │ Documenter│          │   │
│  │   │   Agent   │ │   Agent   │ │   Agent   │ │   Agent   │          │   │
│  │   │           │ │           │ │           │ │           │          │   │
│  │   │• Questions│ │• Patterns │ │• Security │ │• ADRs     │          │   │
│  │   │• Clarify  │ │• Generate │ │• Perf     │ │• README   │          │   │
│  │   │• Domain   │ │• Trade-off│ │• Avail    │ │• Specs    │          │   │
│  │   └───────────┘ └───────────┘ └───────────┘ └───────────┘          │   │
│  │                                                                      │   │
│  │   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐          │   │
│  │   │ Explainer │ │ Refactor  │ │  Pattern  │ │  C4 Model │          │   │
│  │   │   Agent   │ │   Agent   │ │   Agent   │ │   Agent   │          │   │
│  │   │           │ │           │ │           │ │           │          │   │
│  │   │• Why this │ │• Simplify │ │• Recognize│ │• Context  │          │   │
│  │   │• Teach    │ │• Optimize │ │• Suggest  │ │• Container│          │   │
│  │   │• Compare  │ │• Improve  │ │• Complete │ │• Component│          │   │
│  │   └───────────┘ └───────────┘ └───────────┘ └───────────┘          │   │
│  │                                                                      │   │
│  └──────────────────────────────┼───────────────────────────────────────┘   │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       KNOWLEDGE LAYER                                │   │
│  │                                                                      │   │
│  │   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   │   │
│  │   │ Pattern Library │   │  Semantic Model │   │  Decision Log   │   │   │
│  │   │                 │   │                 │   │                 │   │   │
│  │   │ • 50+ patterns  │   │ • Entities      │   │ • All ADRs      │   │   │
│  │   │ • Anti-patterns │   │ • Relations     │   │ • Trade-offs    │   │   │
│  │   │ • Templates     │   │ • Constraints   │   │ • Alternatives  │   │   │
│  │   │ • Examples      │   │ • Invariants    │   │ • Context       │   │   │
│  │   └─────────────────┘   └─────────────────┘   └─────────────────┘   │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Semantic Model

```typescript
// O coração do sistema: representação semântica dos diagramas

interface SemanticEntity {
  id: string;
  name: string;
  type: EntityType;
  domain: string;                    // Bounded context
  responsibilities: string[];
  dataOwnership: string[];           // Que dados esse componente "owns"
  dependencies: DependencyRef[];
  exposedInterfaces: Interface[];
  consumedInterfaces: Interface[];
  qualityAttributes: QualityAttribute[];
  constraints: Constraint[];
  metadata: Record<string, unknown>;
}

type EntityType =
  | 'user'           // Ator externo
  | 'system'         // Sistema externo
  | 'service'        // Microserviço/módulo
  | 'database'       // Persistência
  | 'queue'          // Mensageria
  | 'cache'          // Cache
  | 'gateway'        // API Gateway/BFF
  | 'function'       // Serverless
  | 'storage'        // Object storage
  | 'cdn'            // CDN
  | 'loadbalancer';  // Load balancer

interface SemanticRelationship {
  id: string;
  from: string;                      // Entity ID
  to: string;                        // Entity ID
  type: RelationType;
  protocol?: string;                 // HTTP, gRPC, WebSocket, etc
  async: boolean;
  dataFlow: DataFlowSpec[];
  constraints: Constraint[];
}

type RelationType =
  | 'calls'          // Chamada síncrona
  | 'publishes'      // Publica evento
  | 'subscribes'     // Consome evento
  | 'queries'        // Lê dados
  | 'commands'       // Escreve dados
  | 'authenticates'  // Auth flow
  | 'proxies';       // Proxy/forward

interface SemanticDiagram {
  id: string;
  type: DiagramType;
  level: C4Level;
  scope: string;                     // Que parte do sistema representa
  entities: SemanticEntity[];
  relationships: SemanticRelationship[];
  invariants: Invariant[];           // Regras que devem ser verdade
  linkedDiagrams: string[];          // Diagramas relacionados
}

interface ArchitectureDecision {
  id: string;
  title: string;
  status: 'proposed' | 'accepted' | 'deprecated' | 'superseded';
  context: string;
  decision: string;
  rationale: string;
  consequences: string[];
  alternatives: Alternative[];
  relatedEntities: string[];
  createdAt: Date;
  decidedBy: string;
}

interface DesignSession {
  id: string;
  goal: string;
  phase: SessionPhase;
  diagrams: SemanticDiagram[];
  decisions: ArchitectureDecision[];
  entities: Map<string, SemanticEntity>;
  conversationHistory: ConversationTurn[];
  validationResults: ValidationResult[];
}

type SessionPhase =
  | 'discovery'      // Entendendo requisitos
  | 'high-level'     // C4 Context
  | 'detailed'       // C4 Container/Component
  | 'validation'     // Revisando decisões
  | 'documentation'; // Gerando docs
```

---

## Design Session Flow

### The Guided Design Experience

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DESIGN SESSION FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐                                                            │
│  │   START     │                                                            │
│  │  "Design a  │                                                            │
│  │   system"   │                                                            │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      PHASE 1: DISCOVERY                              │   │
│  │                                                                      │   │
│  │   AI asks structured questions:                                      │   │
│  │   ┌────────────────────────────────────────────────────────────┐    │   │
│  │   │ 🎯 GOAL: "O que esse sistema precisa fazer?"               │    │   │
│  │   │ 👥 USERS: "Quem são os usuários/atores?"                   │    │   │
│  │   │ 📊 SCALE: "Qual a escala esperada?"                        │    │   │
│  │   │ 🔒 CONSTRAINTS: "Requisitos não-funcionais?"               │    │   │
│  │   │ 🏗️  EXISTING: "Infraestrutura existente?"                  │    │   │
│  │   │ 💼 DOMAIN: "Domínio específico? (fintech, health, etc)"    │    │   │
│  │   └────────────────────────────────────────────────────────────┘    │   │
│  │                                                                      │   │
│  │   Output: Structured Requirements Document                           │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   PHASE 2: HIGH-LEVEL DESIGN                         │   │
│  │                                                                      │   │
│  │   AI generates C4 Context Diagram:                                   │   │
│  │   ┌────────────────────────────────────────────────────────────┐    │   │
│  │   │                                                            │    │   │
│  │   │     [User] ──────► [System] ──────► [External]            │    │   │
│  │   │                        │                                   │    │   │
│  │   │                   [Database]                               │    │   │
│  │   │                                                            │    │   │
│  │   └────────────────────────────────────────────────────────────┘    │   │
│  │                                                                      │   │
│  │   AI explains:                                                       │   │
│  │   "Identifiquei os seguintes bounded contexts: ..."                 │   │
│  │   "Recomendo separar X de Y porque ..."                             │   │
│  │                                                                      │   │
│  │   Output: C4 Context + Initial Decisions                             │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   PHASE 3: DETAILED DESIGN                           │   │
│  │                                                                      │   │
│  │   For each bounded context, AI generates:                            │   │
│  │                                                                      │   │
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │   │ C4 Container │  │  Sequence    │  │  ER Diagram  │              │   │
│  │   │   Diagram    │  │  Diagrams    │  │              │              │   │
│  │   └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │                                                                      │   │
│  │   AI proactively adds:                                               │   │
│  │   • State diagrams for complex entities                              │   │
│  │   • Deployment diagram if relevant                                   │   │
│  │                                                                      │   │
│  │   Output: Complete diagram set + ADRs                                │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    PHASE 4: VALIDATION                               │   │
│  │                                                                      │   │
│  │   AI runs automatic checks:                                          │   │
│  │   ┌────────────────────────────────────────────────────────────┐    │   │
│  │   │ ✅ Availability: Multi-AZ, no SPOF detected                │    │   │
│  │   │ ⚠️  Security: API exposta sem rate limiting               │    │   │
│  │   │ ✅ Scalability: Stateless services, horizontal scaling ok  │    │   │
│  │   │ ⚠️  Data: Possível inconsistência eventual não tratada    │    │   │
│  │   │ ✅ Cost: Estimativa ~$X/mês para escala informada          │    │   │
│  │   └────────────────────────────────────────────────────────────┘    │   │
│  │                                                                      │   │
│  │   AI suggests fixes for warnings                                     │   │
│  │                                                                      │   │
│  │   Output: Validated architecture + Remediation plan                  │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   PHASE 5: DOCUMENTATION                             │   │
│  │                                                                      │   │
│  │   AI generates:                                                      │   │
│  │   ┌────────────────────────────────────────────────────────────┐    │   │
│  │   │ 📄 Architecture Decision Records (ADRs)                    │    │   │
│  │   │ 📋 System Overview Document                                │    │   │
│  │   │ 🔌 API Contracts (OpenAPI skeleton)                        │    │   │
│  │   │ 💾 Database Schema (SQL/migrations)                        │    │   │
│  │   │ 🚀 Deployment Checklist                                    │    │   │
│  │   │ 📊 Monitoring Requirements                                 │    │   │
│  │   └────────────────────────────────────────────────────────────┘    │   │
│  │                                                                      │   │
│  │   Output: Complete documentation package                             │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Pattern Library

### Estrutura da Biblioteca de Padrões

```typescript
interface ArchitecturePattern {
  id: string;
  name: string;
  category: PatternCategory;
  description: string;
  whenToUse: string[];
  whenNotToUse: string[];
  tradeoffs: {
    pros: string[];
    cons: string[];
  };
  relatedPatterns: string[];

  // Templates para diferentes tipos de diagrama
  templates: {
    c4Context?: string;
    c4Container?: string;
    sequence?: string;
    flowchart?: string;
    er?: string;
    state?: string;
  };

  // Variáveis que podem ser customizadas
  variables: PatternVariable[];

  // Validações específicas do padrão
  validations: PatternValidation[];

  // Exemplos de uso real
  realWorldExamples: Example[];
}

type PatternCategory =
  | 'architecture'      // Microservices, Monolith, Serverless
  | 'data'              // CQRS, Event Sourcing, Saga
  | 'integration'       // API Gateway, BFF, Message Queue
  | 'resilience'        // Circuit Breaker, Bulkhead, Retry
  | 'security'          // OAuth, Zero Trust, mTLS
  | 'scalability'       // Sharding, Caching, CDN
  | 'deployment';       // Blue-Green, Canary, Feature Flags
```

### Catálogo de Padrões (50+)

```yaml
# patterns/catalog.yaml

architecture:
  - id: microservices-basic
    name: "Microservices Architecture"
    description: "Decomposição em serviços independentes por domínio"

  - id: modular-monolith
    name: "Modular Monolith"
    description: "Monolito com boundaries claros, preparado para split"

  - id: serverless-event-driven
    name: "Serverless Event-Driven"
    description: "Functions + eventos para workloads variáveis"

  - id: hexagonal
    name: "Hexagonal Architecture"
    description: "Ports and adapters para isolamento de domínio"

data:
  - id: cqrs
    name: "CQRS"
    description: "Separação de modelos de leitura e escrita"

  - id: event-sourcing
    name: "Event Sourcing"
    description: "Estado como sequência de eventos"

  - id: saga-orchestration
    name: "Saga (Orchestration)"
    description: "Transações distribuídas com orquestrador central"

  - id: saga-choreography
    name: "Saga (Choreography)"
    description: "Transações distribuídas via eventos"

  - id: outbox-pattern
    name: "Outbox Pattern"
    description: "Garantia de publicação de eventos"

integration:
  - id: api-gateway
    name: "API Gateway"
    description: "Ponto único de entrada com cross-cutting concerns"

  - id: bff
    name: "Backend for Frontend"
    description: "API específica por tipo de cliente"

  - id: service-mesh
    name: "Service Mesh"
    description: "Comunicação service-to-service gerenciada"

resilience:
  - id: circuit-breaker
    name: "Circuit Breaker"
    description: "Proteção contra falhas em cascata"

  - id: bulkhead
    name: "Bulkhead"
    description: "Isolamento de recursos por funcionalidade"

  - id: retry-with-backoff
    name: "Retry with Exponential Backoff"
    description: "Retentativas inteligentes"

security:
  - id: oauth2-authorization-code
    name: "OAuth2 Authorization Code"
    description: "Fluxo padrão para web apps"

  - id: jwt-refresh
    name: "JWT with Refresh Token"
    description: "Autenticação stateless com refresh"

  - id: zero-trust
    name: "Zero Trust Architecture"
    description: "Never trust, always verify"

# ... mais 30+ padrões
```

---

## Validation Engine

### Regras de Validação Arquitetural

```typescript
interface ValidationRule {
  id: string;
  name: string;
  category: 'availability' | 'security' | 'scalability' | 'performance' | 'cost' | 'maintainability';
  severity: 'error' | 'warning' | 'info';
  description: string;
  check: (diagram: SemanticDiagram) => ValidationResult;
  remediation: string;
  references: string[];
}

// Exemplo de regras
const VALIDATION_RULES: ValidationRule[] = [
  {
    id: 'spof-database',
    name: 'Single Point of Failure: Database',
    category: 'availability',
    severity: 'warning',
    description: 'Database sem réplica é ponto único de falha',
    check: (diagram) => {
      const databases = diagram.entities.filter(e => e.type === 'database');
      const issues = databases.filter(db =>
        !db.qualityAttributes.some(qa => qa.name === 'replicated')
      );
      return {
        passed: issues.length === 0,
        issues: issues.map(db => ({
          entity: db.id,
          message: `${db.name} não tem réplica configurada`
        }))
      };
    },
    remediation: 'Adicione réplica de leitura ou configure multi-AZ',
    references: ['https://aws.amazon.com/rds/features/multi-az/']
  },

  {
    id: 'missing-circuit-breaker',
    name: 'Missing Circuit Breaker',
    category: 'resilience',
    severity: 'warning',
    description: 'Chamadas a serviços externos sem circuit breaker',
    check: (diagram) => {
      const externalCalls = diagram.relationships.filter(r =>
        r.type === 'calls' &&
        diagram.entities.find(e => e.id === r.to)?.type === 'system'
      );
      const unprotected = externalCalls.filter(call =>
        !call.constraints.some(c => c.type === 'circuit-breaker')
      );
      return {
        passed: unprotected.length === 0,
        issues: unprotected.map(call => ({
          relationship: call.id,
          message: `Chamada externa sem circuit breaker`
        }))
      };
    },
    remediation: 'Adicione circuit breaker pattern na chamada',
    references: ['https://martinfowler.com/bliki/CircuitBreaker.html']
  },

  {
    id: 'sync-payment-flow',
    name: 'Synchronous Payment Processing',
    category: 'performance',
    severity: 'info',
    description: 'Processamento de pagamento síncrono pode impactar UX',
    check: (diagram) => {
      const paymentRelations = diagram.relationships.filter(r =>
        r.dataFlow.some(df => df.includes('payment'))
      );
      const syncPayments = paymentRelations.filter(r => !r.async);
      return {
        passed: syncPayments.length === 0,
        issues: syncPayments.map(r => ({
          relationship: r.id,
          message: 'Considere processar pagamento de forma assíncrona'
        }))
      };
    },
    remediation: 'Use padrão assíncrono: aceite pagamento, processe em background, notifique',
    references: ['https://stripe.com/docs/payments/payment-intents']
  },

  // ... 50+ regras adicionais
];
```

### Categorias de Validação

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        VALIDATION CATEGORIES                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🔴 AVAILABILITY                                                            │
│  ├─ Single Point of Failure detection                                      │
│  ├─ Missing redundancy                                                      │
│  ├─ No failover strategy                                                    │
│  └─ Missing health checks                                                   │
│                                                                             │
│  🔒 SECURITY                                                                │
│  ├─ Unauthenticated endpoints                                               │
│  ├─ Missing encryption (data in transit/at rest)                            │
│  ├─ Direct database access from frontend                                    │
│  ├─ Missing rate limiting                                                   │
│  ├─ Secrets in configuration                                                │
│  └─ PCI/HIPAA/GDPR scope detection                                          │
│                                                                             │
│  📈 SCALABILITY                                                             │
│  ├─ Stateful services                                                       │
│  ├─ Missing caching layer                                                   │
│  ├─ Synchronous bottlenecks                                                 │
│  ├─ Missing load balancer                                                   │
│  └─ Database as bottleneck                                                  │
│                                                                             │
│  ⚡ PERFORMANCE                                                              │
│  ├─ N+1 query patterns                                                      │
│  ├─ Chatty communication                                                    │
│  ├─ Missing async processing                                                │
│  └─ Large payload transfers                                                 │
│                                                                             │
│  💰 COST                                                                    │
│  ├─ Over-provisioned resources                                              │
│  ├─ Missing auto-scaling                                                    │
│  ├─ Expensive synchronous patterns                                          │
│  └─ Data transfer costs                                                     │
│                                                                             │
│  🔧 MAINTAINABILITY                                                         │
│  ├─ God services (too many responsibilities)                                │
│  ├─ Circular dependencies                                                   │
│  ├─ Missing bounded contexts                                                │
│  ├─ Distributed monolith patterns                                           │
│  └─ Missing observability                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Agent Prompts

### Discovery Agent

```typescript
const DISCOVERY_AGENT_PROMPT = `
Você é um Arquiteto de Software especialista conduzindo uma sessão de discovery.

SEU OBJETIVO: Entender profundamente o que o usuário precisa ANTES de desenhar qualquer coisa.

PROCESSO:
1. Faça perguntas estruturadas, uma categoria por vez
2. Não assuma - sempre confirme
3. Identifique requisitos implícitos baseado no domínio
4. Documente constraints e decisões já tomadas

CATEGORIAS DE PERGUNTAS:

🎯 OBJETIVO E ESCOPO
- Qual o problema de negócio que estamos resolvendo?
- Qual o resultado esperado para o usuário final?
- O que está OUT OF SCOPE?

👥 USUÁRIOS E ATORES
- Quem são os usuários do sistema?
- Existem diferentes perfis/roles?
- Existem sistemas externos que interagem?
- Qual o volume de usuários esperado?

📊 ESCALA E PERFORMANCE
- Quantas requisições/transações por segundo?
- Qual latência aceitável?
- Precisa de real-time?
- Picos de uso previsíveis?

🔒 SEGURANÇA E COMPLIANCE
- Quais dados sensíveis serão tratados?
- Requisitos regulatórios? (PCI, HIPAA, LGPD)
- Modelo de autenticação preferido?
- Requisitos de auditoria?

🏗️ INFRAESTRUTURA
- Cloud provider definido?
- Infraestrutura existente a considerar?
- Preferências tecnológicas do time?
- Restrições de budget?

💼 DOMÍNIO
- É um domínio específico? (fintech, health, e-commerce)
- Existem padrões de indústria a seguir?
- Integrações obrigatórias?

FORMATO DE OUTPUT:
Após discovery, gere um Requirements Document estruturado:

\`\`\`markdown
# Requirements Document: [Nome do Sistema]

## Business Goal
[Descrição clara do objetivo]

## Actors
- [Actor 1]: [Descrição]
- [Actor 2]: [Descrição]

## Functional Requirements
1. [FR-001] [Descrição]
2. [FR-002] [Descrição]

## Non-Functional Requirements
- Scale: [X] users, [Y] TPS
- Latency: [Z]ms p99
- Availability: [N]%

## Constraints
- [C-001] [Descrição]

## Assumptions
- [A-001] [Descrição]

## Out of Scope
- [OS-001] [Descrição]
\`\`\`
`;
```

### Architect Agent

```typescript
const ARCHITECT_AGENT_PROMPT = `
Você é um Arquiteto de Software senior projetando sistemas.

PRINCÍPIOS:
1. SEMPRE justifique suas decisões com trade-offs
2. Use padrões conhecidos quando aplicável
3. Considere o contexto e constraints do usuário
4. Prefira simplicidade quando possível
5. Pense em evolução futura, mas não over-engineer

PROCESSO DE DESIGN:

1. BOUNDED CONTEXTS
   - Identifique os domínios principais
   - Defina fronteiras claras
   - Mapeie dependências entre contextos

2. ESCOLHA DE PADRÃO BASE
   - Avalie: Monolith, Modular Monolith, Microservices, Serverless
   - Justifique com base em: escala, time, complexidade

3. COMPONENTES CORE
   - Defina serviços/módulos necessários
   - Identifique responsabilidades únicas
   - Mapeie dados que cada um "owns"

4. COMUNICAÇÃO
   - Defina: sync vs async
   - Escolha protocolos: REST, gRPC, eventos
   - Identifique pontos de acoplamento

5. PERSISTÊNCIA
   - Escolha databases por caso de uso
   - Defina estratégia de consistência
   - Considere caching

6. CROSS-CUTTING
   - Auth/AuthZ
   - Observability
   - Error handling

FORMATO DE OUTPUT:
Para cada diagrama gerado, inclua:

\`\`\`
DIAGRAM: [Tipo] - [Escopo]
[Mermaid code]

DECISIONS:
- D1: [Decisão] porque [Razão]
- D2: [Decisão] porque [Razão]

TRADE-OFFS:
- [Decisão] traz [benefício] mas implica [custo]

NEXT STEPS:
- Detalhar [componente X]
- Definir [aspecto Y]
\`\`\`

PADRÕES DISPONÍVEIS:
Você tem acesso a uma biblioteca de padrões. Quando identificar que um padrão
se aplica, referencie-o e adapte ao contexto.
`;
```

### Validator Agent

```typescript
const VALIDATOR_AGENT_PROMPT = `
Você é um revisor de arquitetura especializado em encontrar problemas.

SEU PAPEL: Ser o "advogado do diabo" - questionar decisões e encontrar falhas.

ÁREAS DE ANÁLISE:

🔴 AVAILABILITY
- Existem pontos únicos de falha?
- O que acontece se [componente X] falhar?
- Existe estratégia de failover?
- Health checks estão definidos?

🔒 SECURITY
- Todos endpoints estão autenticados?
- Dados sensíveis estão criptografados?
- Rate limiting está presente?
- Princípio do menor privilégio aplicado?
- Compliance requirements atendidos?

📈 SCALABILITY
- Serviços são stateless?
- Bottlenecks identificados?
- Auto-scaling possível?
- Caching adequado?

⚡ PERFORMANCE
- Padrões N+1 presentes?
- Comunicação muito chatty?
- Processamentos síncronos desnecessários?
- Latência end-to-end aceitável?

💰 COST
- Recursos over-provisioned?
- Padrões caros sem necessidade?
- Data transfer otimizado?

🔧 MAINTAINABILITY
- God services?
- Dependências circulares?
- Acoplamento excessivo?
- Observability presente?

FORMATO DE OUTPUT:

\`\`\`
ARCHITECTURE REVIEW: [Nome do Sistema]

CRITICAL ISSUES (must fix):
🔴 [ISSUE-001] [Descrição]
   Impact: [Impacto se não corrigido]
   Remediation: [Como corrigir]

WARNINGS (should fix):
⚠️ [WARN-001] [Descrição]
   Impact: [Impacto potencial]
   Remediation: [Sugestão]

RECOMMENDATIONS (nice to have):
💡 [REC-001] [Descrição]
   Benefit: [Benefício]

VALIDATED ✅:
- [Aspecto 1] está adequado
- [Aspecto 2] segue best practices

OVERALL ASSESSMENT:
[Resumo da avaliação com score de maturidade]
\`\`\`
`;
```

---

## UI/UX Design

### Design Session Interface

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LiveCanvas AI                                           [Session: Payment] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────┬───────────────────────────┤
│  │                                             │                           │
│  │                 CANVAS                      │      DESIGN ASSISTANT     │
│  │                                             │                           │
│  │   ┌─────────────────────────────────────┐   │  ┌───────────────────────┐│
│  │   │                                     │   │  │ Phase: Discovery  2/5 ││
│  │   │     [C4 Context Diagram]            │   │  │ ████████░░░░░░░░ 40%  ││
│  │   │                                     │   │  └───────────────────────┘│
│  │   │   ┌──────┐      ┌──────────┐        │   │                           │
│  │   │   │ User │─────►│ Payment  │        │   │  🤖 Arquiteto AI:         │
│  │   │   └──────┘      │ System   │        │   │                           │
│  │   │                 └────┬─────┘        │   │  "Entendi que vocês       │
│  │   │                      │              │   │   precisam processar      │
│  │   │                 ┌────▼─────┐        │   │   pagamentos Pix e cartão.│
│  │   │                 │  Stripe  │        │   │                           │
│  │   │                 └──────────┘        │   │   Algumas perguntas:      │
│  │   │                                     │   │                           │
│  │   └─────────────────────────────────────┘   │   1. Qual volume diário   │
│  │                                             │      de transações?       │
│  │   ┌─────────────────────────────────────┐   │                           │
│  │   │ Related Diagrams:                   │   │   2. Precisam de split    │
│  │   │ [Sequence: Payment Flow] [ER: Data] │   │      de pagamento?        │
│  │   └─────────────────────────────────────┘   │                           │
│  │                                             │   3. Qual o requisito de  │
│  │                                             │      latência?            │
│  │                                             │                           │
│  │                                             │  ─────────────────────────│
│  │                                             │                           │
│  │                                             │  [Voice Mode 🎤]          │
│  │                                             │                           │
│  │                                             │  ┌───────────────────────┐│
│  │                                             │  │ Type your answer...   ││
│  │                                             │  └───────────────────────┘│
│  │                                             │                           │
│  └─────────────────────────────────────────────┴───────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┤
│  │ Decisions Log                                                    [ADRs] │
│  │ ────────────────────────────────────────────────────────────────────────│
│  │ ✓ ADR-001: Usar Stripe como gateway (simplicidade > controle)          │
│  │ ✓ ADR-002: Processamento assíncrono de webhooks                        │
│  │ ○ ADR-003: Pending - Estratégia de retry                               │
│  └─────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Start New Session] [Export All] [Share] [Validate Architecture]          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Command Palette

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🔍 Command Palette                                              [Cmd + K] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  > _                                                                        │
│                                                                             │
│  DESIGN COMMANDS                                                            │
│  ├─ /design [system name]     Start new design session                     │
│  ├─ /expand [component]       Detail a component                           │
│  ├─ /sequence [flow name]     Generate sequence diagram                    │
│  ├─ /er [domain]              Generate ER diagram                          │
│  └─ /c4 [level]               Generate C4 diagram at level                 │
│                                                                             │
│  PATTERN COMMANDS                                                           │
│  ├─ /pattern [name]           Apply architecture pattern                   │
│  ├─ /patterns                 List available patterns                      │
│  └─ /suggest-pattern          AI suggests patterns for current design      │
│                                                                             │
│  VALIDATION COMMANDS                                                        │
│  ├─ /validate                 Run full architecture validation             │
│  ├─ /security-review          Focus on security aspects                    │
│  └─ /cost-estimate            Estimate infrastructure costs                │
│                                                                             │
│  DOCUMENTATION COMMANDS                                                     │
│  ├─ /export-adrs              Export Architecture Decision Records         │
│  ├─ /generate-readme          Generate system README                       │
│  └─ /export-openapi           Generate API contracts                       │
│                                                                             │
│  SESSION COMMANDS                                                           │
│  ├─ /phase [name]             Jump to session phase                        │
│  ├─ /history                  Show design history                          │
│  └─ /compare [version]        Compare with previous version                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal:** Semantic model + basic design session

```
Tasks:
├─ Define SemanticEntity and SemanticDiagram types
├─ Create DesignSession state management
├─ Implement basic Intent Router
├─ Create Discovery Agent prompt
├─ Add session phases UI
├─ Integrate with existing chat/voice
└─ Basic context persistence

Deliverables:
├─ User can start a "design session"
├─ AI asks structured questions
├─ Session state is tracked
└─ Basic C4 Context generation works
```

### Phase 2: Pattern Library (Week 2-3)
**Goal:** 20+ patterns with smart suggestion

```
Tasks:
├─ Define Pattern schema
├─ Create initial 20 patterns
│   ├─ 5 architecture patterns
│   ├─ 5 data patterns
│   ├─ 5 integration patterns
│   └─ 5 resilience patterns
├─ Implement Pattern Agent
├─ Pattern suggestion based on context
├─ Pattern application to diagrams
└─ Pattern customization UI

Deliverables:
├─ /patterns command works
├─ AI suggests relevant patterns
├─ Patterns can be applied and customized
└─ Generated diagrams use patterns
```

### Phase 3: Validation Engine (Week 3-4)
**Goal:** Automatic architecture review

```
Tasks:
├─ Define ValidationRule interface
├─ Implement 30+ validation rules
│   ├─ 5 availability rules
│   ├─ 8 security rules
│   ├─ 5 scalability rules
│   ├─ 5 performance rules
│   ├─ 3 cost rules
│   └─ 4 maintainability rules
├─ Create Validator Agent
├─ Validation results UI
├─ Remediation suggestions
└─ One-click fixes for common issues

Deliverables:
├─ /validate command works
├─ Issues displayed with severity
├─ AI explains each issue
└─ Suggested fixes can be applied
```

### Phase 4: Multi-Diagram Coherence (Week 4-5)
**Goal:** Diagrams as connected knowledge

```
Tasks:
├─ Implement cross-diagram entity linking
├─ Automatic diagram suggestions
├─ Sync updates across diagrams
├─ C4 drill-down (Context → Container → Component)
├─ Entity consistency validation
└─ Related diagrams sidebar

Deliverables:
├─ Double-click component → generates detail
├─ Entity changes propagate
├─ Inconsistencies are flagged
└─ Related diagrams are shown
```

### Phase 5: Documentation Generation (Week 5-6)
**Goal:** Automatic architecture documentation

```
Tasks:
├─ ADR template and generation
├─ System overview document
├─ OpenAPI skeleton generation
├─ Database schema generation
├─ Deployment checklist
├─ Export to Markdown/Notion/Confluence
└─ Version history

Deliverables:
├─ /export-adrs generates ADRs
├─ Full documentation package
├─ Multiple export formats
└─ Design history tracked
```

### Phase 6: Voice Design Session (Week 6-7)
**Goal:** Full voice-driven design experience

```
Tasks:
├─ Enhance Gemini Live integration
├─ Voice commands for all features
├─ Proactive AI suggestions via voice
├─ Voice navigation of diagrams
├─ Dictation of requirements
└─ Voice-to-ADR

Deliverables:
├─ Complete design session via voice
├─ AI proactively asks questions
├─ Hands-free diagram creation
└─ Voice feedback on validations
```

---

## Success Metrics

### Quantitative

| Metric | Current | Target |
|--------|---------|--------|
| Time to first diagram | ~2 min | < 30 sec |
| Diagrams per session | 1-2 | 5+ (auto-generated) |
| User questions before design | 0 | 5+ (discovery phase) |
| Validation issues caught | 0 | 10+ per design |
| ADRs generated | 0 | 3+ per design |

### Qualitative

- Users feel like they're working with a senior architect
- Designs are more complete (no missing pieces)
- Trade-offs are explicitly documented
- Patterns are correctly applied
- Common mistakes are prevented

---

## Technical Requirements

### LLM Requirements
- Context window: 128k+ tokens (for full session history)
- Tool calling support (for structured outputs)
- Streaming (for real-time feedback)
- Multi-modal (future: analyze existing diagrams as images)

### Performance Requirements
- Response time: < 3s for diagram generation
- Validation: < 2s for full analysis
- Voice: < 500ms latency

### Storage Requirements
- Session persistence (Cloudflare D1/KV)
- Pattern library (bundled + user custom)
- Decision log history

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM hallucinations in architecture | High | Strong validation, pattern constraints |
| Complex prompts = slow responses | Medium | Caching, streaming, async processing |
| Users skip discovery phase | Medium | Make it engaging, show value early |
| Too opinionated = user frustration | Medium | Allow overrides, explain reasoning |
| Pattern library maintenance | Low | Community contributions, versioning |

---

## Competitive Moat

O que torna isso difícil de copiar:

1. **Integrated Experience**: Não é só AI, é canvas + voice + collaboration + AI
2. **Semantic Understanding**: Modelo proprietário de entendimento de arquitetura
3. **Pattern Library**: Curada e testada com casos reais
4. **Validation Engine**: Regras específicas de arquitetura de software
5. **Session Memory**: Contexto completo mantido durante design
6. **Voice-First Design**: Único a oferecer design por voz completo

---

## Appendix: Example Interaction

```
USER: "Quero criar um sistema de delivery de comida"

AI: "Ótimo! Vou ajudar você a desenhar a arquitetura. Primeiro, algumas
     perguntas para garantir que o design atenda suas necessidades:

     🎯 ESCOPO
     1. É um marketplace (múltiplos restaurantes) ou delivery próprio?
     2. Vocês vão ter entregadores próprios ou integrar com iFood/Rappi?

     👥 ESCALA
     3. Qual região geográfica? (cidade, estado, país)
     4. Quantos pedidos/dia vocês esperam no primeiro ano?"

USER: "Marketplace, entregadores próprios, São Paulo, 1000 pedidos/dia"

AI: "Entendi. Baseado nisso, identifiquei os seguintes bounded contexts:

     📦 Domains:
     • Catalog - Restaurantes e cardápios
     • Orders - Pedidos e checkout
     • Delivery - Tracking e entregadores
     • Payments - Processamento financeiro
     • Users - Clientes e restaurantes

     Vou criar o C4 Context Diagram inicial..."

[GERA DIAGRAMA]

AI: "Aqui está a visão geral. Algumas decisões que tomei:

     ✅ ADR-001: Separei Payments em serviço próprio
        Razão: Isolamento para PCI compliance, diferentes ciclos de release

     ✅ ADR-002: Delivery como domínio separado
        Razão: Lógica complexa de routing, tracking real-time

     ⚠️  ATENÇÃO: Com 1000 pedidos/dia em SP, vocês vão ter picos
        no almoço e jantar. Recomendo pensar em auto-scaling desde o início.

     Quer que eu detalhe algum desses domínios? Sugiro começar pelo
     fluxo de pedidos (Orders) que é o core do negócio."

USER: "Sim, detalha o Orders"

AI: "Gerando visão detalhada do domínio Orders..."

[GERA C4 CONTAINER + SEQUENCE DIAGRAM + STATE DIAGRAM DO PEDIDO]

AI: "Criei 3 diagramas complementares:

     1. C4 Container: Componentes internos do Orders
     2. Sequence: Fluxo completo de um pedido
     3. State: Ciclo de vida do pedido (created → confirmed → preparing → ...)

     🔍 VALIDAÇÃO AUTOMÁTICA:
     ✅ Sem single points of failure
     ⚠️  Warning: Pagamento está síncrono no fluxo
        Recomendo: Aceitar pedido → processar pagamento async → confirmar
     ✅ Eventos para comunicação entre domínios (baixo acoplamento)

     Quer que eu aplique o padrão de pagamento assíncrono?"
```

---

*PRP generated on 2026-01-27*
*Project Jarvis - Making LiveCanvas AI the state-of-the-art in System Design*
