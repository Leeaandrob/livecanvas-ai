# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-26

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
- **Multi-Provider Support**: Support for OpenAI and Gemini API providers

### Technical Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Cloudflare Workers, Hono, Durable Objects
- **Collaboration**: Yjs, y-websocket
- **Diagrams**: Mermaid.js 10.9
- **Audio**: Web Audio API, AudioWorklet for voice processing
- **Build**: Turborepo, pnpm workspaces
