# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-29

### Added

#### Pattern Library (20 Architecture Patterns)
- **Architecture Patterns**: Microservices, Modular Monolith, Serverless Event-Driven, Hexagonal, Layered Architecture
- **Data Patterns**: CQRS, Event Sourcing, Saga (Orchestration/Choreography), Outbox Pattern
- **Integration Patterns**: API Gateway, BFF, Service Mesh, Message Broker, Anti-Corruption Layer
- **Resilience Patterns**: Circuit Breaker, Bulkhead, Retry with Backoff, Timeout, Fallback
- Smart pattern detection from natural language descriptions
- Pattern templates with Mermaid diagrams
- Trade-offs and validation rules for each pattern

#### Design Session System
- Semantic model for architecture understanding
- Discovery Agent for requirements gathering
- Architect Agent for system design
- Validator Agent for architecture review
- Intent routing for smart agent selection
- Design session context provider

#### Cloudflare Persistence
- D1 Database integration for board metadata
- KV Namespace for sessions/caching
- Board management API routes
- Database migrations

#### Voice Integration Improvements
- Pattern-aware voice commands
- `suggest_patterns` tool for voice
- `apply_pattern` tool for voice
- `list_patterns` tool for voice
- Enhanced system instruction with pattern knowledge

#### Chat Integration
- Real-time pattern detection while typing
- Pattern suggestion tags in chat input
- Enhanced prompts with pattern templates
- Pattern-aware diagram generation

### Changed
- Updated `wrangler.toml` with D1 and KV bindings
- Enhanced `vite.config.ts` with tunnel support (Cloudflare, ngrok)
- Improved voice assistant system instruction

## [1.0.0] - 2026-01-26

### Added

- **Real-time Collaborative Canvas**: Infinite canvas for creating and editing Mermaid diagrams with live collaboration via Yjs and WebSocket
- **Mermaid Diagram Support**: Full support for flowcharts, sequence diagrams, class diagrams, state diagrams, ER diagrams, and more
- **Voice Control Integration**: Gemini Live API integration for voice-controlled diagram creation and manipulation
- **Smart Diagram Generation**: Generate diagrams from natural language descriptions
- **Diagram Modification**: Modify existing diagrams with natural language instructions
- **Auto Syntax Fix**: Automatic syntax error correction for Mermaid diagrams
- **Drag & Drop**: Drag blocks around the canvas with real-time sync
- **Pan Navigation**: Space + drag or middle mouse button to pan the canvas
- **User Presence**: See other users' cursors and activities in real-time
- **Dark Theme**: Modern dark theme optimized for diagramming
- **Cloudflare Workers Backend**: Serverless backend with Durable Objects for collaboration
- **Multi-Provider Support**: Support for OpenAI, Anthropic, and Gemini API providers

### Technical Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Cloudflare Workers, Hono, Durable Objects
- **Collaboration**: Yjs, y-websocket
- **Diagrams**: Mermaid.js 10.9
- **Audio**: Web Audio API, AudioWorklet for voice processing
- **Build**: Turborepo, pnpm workspaces
