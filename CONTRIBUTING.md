# Contributing to LiveCanvas

Thank you for your interest in contributing to LiveCanvas! This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/leeaandrob/live-canvas-ai/issues)
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser and OS information
   - Screenshots if applicable

### Suggesting Features

1. Check existing issues and discussions for similar suggestions
2. Create a new issue with the `enhancement` label
3. Describe the feature and its use case
4. Explain why it would benefit users

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes following our coding standards
4. Write or update tests as needed
5. Run linting and type checking: `pnpm lint && pnpm typecheck`
6. Commit with conventional commits (see below)
7. Push and create a Pull Request

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm 8+
- Cloudflare account (for Workers development)

### Local Development

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Run linting
pnpm lint

# Run type checking
pnpm typecheck

# Build all packages
pnpm build
```

### Project Structure

```
live-canvas/
├── apps/
│   ├── web/          # React frontend
│   └── worker/       # Cloudflare Worker backend
├── packages/
│   ├── protocols/    # Shared types and interfaces
│   └── ai-providers/ # AI provider abstractions
└── docs/             # Documentation
```

## Coding Standards

### TypeScript

- Use TypeScript for all code
- Enable strict mode
- Avoid `any` types; use `unknown` when type is truly unknown
- Export types from `packages/protocols` for shared interfaces

### React

- Use functional components with hooks
- Keep components focused and single-purpose
- Use custom hooks for reusable logic
- Prefer composition over inheritance

### Styling

- Use CSS variables for theming
- Follow BEM-like naming conventions
- Keep styles co-located with components when practical

### Code Style

- Use ESLint and Prettier configurations provided
- 2-space indentation
- Semicolons required
- Double quotes for strings

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(canvas): add zoom controls with keyboard shortcuts
fix(voice): resolve audio playback stuttering on Firefox
docs(readme): update installation instructions
refactor(hooks): simplify useBoard state management
```

## Testing

### Manual Testing

Before submitting a PR, test:

1. Diagram creation via chat
2. Diagram modification
3. Voice control (if applicable)
4. Real-time collaboration (open in multiple tabs)
5. Canvas navigation (pan, zoom)
6. Different diagram types

### Browser Compatibility

Test in:
- Chrome 64+
- Firefox 76+
- Safari 14.1+

## API Changes

When modifying API endpoints:

1. Update types in `packages/protocols`
2. Update worker routes
3. Update frontend API client
4. Document breaking changes

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public APIs
- Update CHANGELOG.md for notable changes

## Questions?

Feel free to open an issue for questions or discussions about contributions.

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
