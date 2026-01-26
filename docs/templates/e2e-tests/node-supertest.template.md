# E2E Test Template: Backend Node.js (Supertest + Jest)

## Overview

This template provides the structure for End-to-End API tests using Supertest with Jest for Node.js backend applications.

## Prerequisites

```bash
npm install --save-dev jest supertest @types/jest @types/supertest ts-jest
```

## Configuration

### jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
```

### tests/setup.ts

```typescript
import { beforeAll, afterAll } from '@jest/globals';

beforeAll(async () => {
  // Global setup: database connections, test data, etc.
});

afterAll(async () => {
  // Global teardown: close connections, cleanup
});
```

## Template Structure

```typescript
// tests/e2e/[feature-name].spec.ts

import request from 'supertest';
import app from '../../src/app';

describe('Feature: [FEATURE_NAME]', () => {
  // ============================================
  // SETUP & TEARDOWN
  // ============================================

  beforeAll(async () => {
    // Feature-specific setup
    // - Seed test data
    // - Initialize dependencies
  });

  afterAll(async () => {
    // Feature-specific cleanup
    // - Remove test data
    // - Close connections
  });

  beforeEach(async () => {
    // Per-test setup if needed
  });

  afterEach(async () => {
    // Per-test cleanup if needed
  });

  // ============================================
  // ACCEPTANCE CRITERIA TESTS
  // ============================================

  describe('AC1: [Acceptance Criteria Description]', () => {
    it('should [expected behavior] when [condition]', async () => {
      // Arrange
      const payload = {
        field1: 'value1',
        field2: 'value2',
      };

      // Act
      const response = await request(app)
        .post('/api/endpoint')
        .send(payload)
        .set('Authorization', 'Bearer token')
        .set('Content-Type', 'application/json');

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.field1).toBe('value1');
    });

    it('should return 400 when [invalid condition]', async () => {
      // Arrange
      const invalidPayload = {
        field1: '', // Invalid: empty
      };

      // Act
      const response = await request(app)
        .post('/api/endpoint')
        .send(invalidPayload);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('validation');
    });
  });

  describe('AC2: [Another Acceptance Criteria]', () => {
    it('should [expected behavior]', async () => {
      // Arrange
      const id = 'test-id';

      // Act
      const response = await request(app)
        .get(`/api/endpoint/${id}`)
        .set('Authorization', 'Bearer token');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(id);
    });
  });

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================

  describe('Error Handling', () => {
    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/protected-endpoint');

      expect(response.status).toBe(401);
    });

    it('should return 403 when not authorized', async () => {
      const response = await request(app)
        .delete('/api/admin-endpoint')
        .set('Authorization', 'Bearer user-token');

      expect(response.status).toBe(403);
    });

    it('should return 404 when resource not found', async () => {
      const response = await request(app)
        .get('/api/endpoint/non-existent-id')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(404);
    });

    it('should return 500 and log error on server failure', async () => {
      // Simulate server error scenario
      const response = await request(app)
        .post('/api/endpoint/trigger-error')
        .set('Authorization', 'Bearer token');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================

  describe('Edge Cases', () => {
    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/endpoint')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should handle large payload', async () => {
      const largePayload = {
        data: 'x'.repeat(10000),
      };

      const response = await request(app)
        .post('/api/endpoint')
        .send(largePayload);

      // Assert based on expected behavior
      expect([200, 413]).toContain(response.status);
    });

    it('should handle concurrent requests', async () => {
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/endpoint')
          .set('Authorization', 'Bearer token')
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});
```

## Running Tests

```bash
# Run all E2E tests
npm test -- --testPathPattern="tests/e2e"

# Run specific test file
npm test -- tests/e2e/feature-name.spec.ts

# Run with coverage
npm test -- --coverage --testPathPattern="tests/e2e"

# Run in watch mode
npm test -- --watch --testPathPattern="tests/e2e"
```

## Best Practices

1. **Isolate tests** - Each test should be independent
2. **Use descriptive names** - `should [action] when [condition]`
3. **Follow AAA pattern** - Arrange, Act, Assert
4. **Test error cases** - Include 4xx and 5xx scenarios
5. **Clean up after tests** - Remove test data in afterAll/afterEach
6. **Use realistic data** - Test with production-like payloads
