# LiveCanvas

A real-time collaborative diagramming platform with voice control and natural language diagram generation.

![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)

## Features

- **Real-time Collaboration** - Multiple users can work on the same canvas simultaneously with live cursor tracking and instant sync
- **Voice Control** - Create and modify diagrams using voice commands via Gemini Live API
- **Natural Language Generation** - Describe what you want and get a diagram instantly
- **Smart Modifications** - Select a diagram and describe changes in plain language
- **Multiple Diagram Types** - Support for flowcharts, sequence diagrams, class diagrams, state diagrams, ER diagrams, and more
- **Auto Syntax Fix** - Automatic correction of Mermaid syntax errors
- **Infinite Canvas** - Pan and zoom with drag-and-drop block positioning
- **Dark Theme** - Modern dark interface optimized for diagramming

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite |
| Backend | Cloudflare Workers, Hono, Durable Objects |
| Collaboration | Yjs, y-websocket |
| Diagrams | Mermaid.js 10.9 |
| Voice | Web Audio API, AudioWorklet |
| Build | Turborepo, pnpm |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Cloudflare account (for Workers)
- OpenAI or Gemini API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/live-canvas.git
cd live-canvas

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env with your API keys
```

### Development

```bash
# Start all services (frontend + worker)
pnpm dev

# Or start individually:
pnpm dev:web      # Frontend on http://localhost:5173
pnpm dev:worker   # Worker on http://localhost:8787
```

### Building

```bash
# Build all packages
pnpm build

# Type check
pnpm typecheck

# Lint
pnpm lint
```

## Project Structure

```
live-canvas/
├── apps/
│   ├── web/              # React frontend
│   │   ├── src/
│   │   │   ├── components/   # UI components
│   │   │   ├── hooks/        # React hooks
│   │   │   ├── lib/          # Utilities
│   │   │   └── pages/        # Page components
│   │   └── ...
│   └── worker/           # Cloudflare Worker backend
│       └── src/
│           ├── durable-objects/  # Durable Objects
│           ├── routes/           # API routes
│           └── lib/              # Utilities
├── packages/
│   ├── protocols/        # Shared types and interfaces
│   └── ai-providers/     # AI provider abstractions
└── docs/                 # Documentation
```

## Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
# API Keys (configure in the app settings UI)
VITE_DEFAULT_PROVIDER=gemini

# Worker URL (for local development)
VITE_WORKER_URL=http://localhost:8787
```

### Voice Control (Gemini Live)

Voice control requires:
1. Gemini API key with Live API access
2. HTTPS or localhost (AudioWorklet security requirement)
3. Microphone permissions

## Usage

### Creating Diagrams

1. **Chat Panel**: Type a description like "Create a flowchart for user authentication"
2. **Voice**: Click the microphone and speak your request
3. **Manual**: Double-click on the canvas to add a block, then double-click to edit

### Modifying Diagrams

1. Click a diagram to select it (blue border)
2. In the chat panel, describe changes: "Add a database node" or "Include error handling"
3. The diagram updates automatically

### Navigation

- **Pan**: Hold Space + drag, or middle mouse button
- **Select**: Click on a diagram
- **Edit**: Double-click a diagram
- **Delete**: Select and press Delete, or use toolbar

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/generate` | POST | Generate diagram from description |
| `/api/modify` | POST | Modify existing diagram |
| `/api/analyze` | POST | Analyze diagram structure |
| `/api/refactor` | POST | Suggest improvements |
| `/api/fix-syntax` | POST | Fix Mermaid syntax errors |
| `/board/:id` | WebSocket | Real-time collaboration |

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests and linting: `pnpm lint && pnpm typecheck`
5. Commit with conventional commits: `git commit -m "feat: add new feature"`
6. Push and create a Pull Request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Mermaid.js](https://mermaid.js.org/) - Diagram rendering
- [Yjs](https://yjs.dev/) - Real-time collaboration
- [Cloudflare Workers](https://workers.cloudflare.com/) - Serverless backend
- [Hono](https://hono.dev/) - Web framework
