# E2E Test Template: Golang (go test)

## Overview

This template provides the structure for End-to-End API tests using Go's built-in testing framework for Go backend applications.

## Prerequisites

Go's testing framework is built-in. For additional utilities:

```bash
go get github.com/stretchr/testify/assert
go get github.com/stretchr/testify/require
go get github.com/stretchr/testify/suite
```

## Project Structure

```
project/
├── cmd/
│   └── api/
│       └── main.go
├── internal/
│   ├── handler/
│   ├── service/
│   └── repository/
├── tests/
│   └── e2e/
│       ├── setup_test.go
│       ├── feature_name_test.go
│       └── testdata/
│           └── fixtures.json
└── go.mod
```

## Configuration

### tests/e2e/setup_test.go

```go
package e2e

import (
	"context"
	"net/http/httptest"
	"os"
	"testing"

	"your-module/internal/handler"
	"your-module/internal/config"
)

var (
	testServer *httptest.Server
	testClient *http.Client
)

func TestMain(m *testing.M) {
	// Setup
	setup()

	// Run tests
	code := m.Run()

	// Teardown
	teardown()

	os.Exit(code)
}

func setup() {
	// Initialize test configuration
	cfg := config.NewTestConfig()

	// Create handler with test dependencies
	h := handler.New(cfg)

	// Create test server
	testServer = httptest.NewServer(h.Router())
	testClient = testServer.Client()
}

func teardown() {
	testServer.Close()
}

// Helper function to get base URL
func baseURL() string {
	return testServer.URL
}
```

## Template Structure

```go
// tests/e2e/[feature_name]_test.go

package e2e

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"

	"your-module/internal/handler"
	"your-module/internal/model"
)

// ============================================
// TEST SUITE SETUP
// ============================================

type FeatureNameTestSuite struct {
	suite.Suite
	server *httptest.Server
	client *http.Client
}

func TestFeatureNameSuite(t *testing.T) {
	suite.Run(t, new(FeatureNameTestSuite))
}

func (s *FeatureNameTestSuite) SetupSuite() {
	// Initialize test server
	h := handler.New()
	s.server = httptest.NewServer(h.Router())
	s.client = s.server.Client()
}

func (s *FeatureNameTestSuite) TearDownSuite() {
	s.server.Close()
}

func (s *FeatureNameTestSuite) SetupTest() {
	// Reset state before each test if needed
}

func (s *FeatureNameTestSuite) TearDownTest() {
	// Cleanup after each test if needed
}

// ============================================
// ACCEPTANCE CRITERIA TESTS
// ============================================

func (s *FeatureNameTestSuite) TestAC1_ShouldCreateResourceSuccessfully() {
	// Feature: [FEATURE_NAME]
	// AC1: [Acceptance Criteria Description]

	// Arrange
	payload := map[string]interface{}{
		"name":        "Test Resource",
		"description": "Test description",
		"value":       100,
	}
	body, _ := json.Marshal(payload)

	req, err := http.NewRequest(
		http.MethodPost,
		s.server.URL+"/api/resources",
		bytes.NewReader(body),
	)
	require.NoError(s.T(), err)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer test-token")

	// Act
	resp, err := s.client.Do(req)
	require.NoError(s.T(), err)
	defer resp.Body.Close()

	// Assert
	assert.Equal(s.T(), http.StatusCreated, resp.StatusCode)

	var result map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	require.NoError(s.T(), err)

	assert.NotEmpty(s.T(), result["id"])
	assert.Equal(s.T(), "Test Resource", result["name"])
}

func (s *FeatureNameTestSuite) TestAC1_ShouldReturn400ForInvalidInput() {
	// Arrange
	invalidPayload := map[string]interface{}{
		"name":  "", // Invalid: empty
		"value": -1, // Invalid: negative
	}
	body, _ := json.Marshal(invalidPayload)

	req, err := http.NewRequest(
		http.MethodPost,
		s.server.URL+"/api/resources",
		bytes.NewReader(body),
	)
	require.NoError(s.T(), err)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer test-token")

	// Act
	resp, err := s.client.Do(req)
	require.NoError(s.T(), err)
	defer resp.Body.Close()

	// Assert
	assert.Equal(s.T(), http.StatusBadRequest, resp.StatusCode)

	var result map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	require.NoError(s.T(), err)
	assert.NotEmpty(s.T(), result["error"])
}

func (s *FeatureNameTestSuite) TestAC2_ShouldRetrieveResourceByID() {
	// AC2: [Another Acceptance Criteria]

	// Arrange - Create resource first
	createPayload := map[string]interface{}{
		"name":  "Test",
		"value": 100,
	}
	createBody, _ := json.Marshal(createPayload)
	createReq, _ := http.NewRequest(
		http.MethodPost,
		s.server.URL+"/api/resources",
		bytes.NewReader(createBody),
	)
	createReq.Header.Set("Content-Type", "application/json")
	createReq.Header.Set("Authorization", "Bearer test-token")

	createResp, err := s.client.Do(createReq)
	require.NoError(s.T(), err)
	defer createResp.Body.Close()

	var created map[string]interface{}
	json.NewDecoder(createResp.Body).Decode(&created)
	resourceID := created["id"].(string)

	// Act
	getReq, _ := http.NewRequest(
		http.MethodGet,
		fmt.Sprintf("%s/api/resources/%s", s.server.URL, resourceID),
		nil,
	)
	getReq.Header.Set("Authorization", "Bearer test-token")

	getResp, err := s.client.Do(getReq)
	require.NoError(s.T(), err)
	defer getResp.Body.Close()

	// Assert
	assert.Equal(s.T(), http.StatusOK, getResp.StatusCode)

	var result map[string]interface{}
	json.NewDecoder(getResp.Body).Decode(&result)
	assert.Equal(s.T(), resourceID, result["id"])
}

// ============================================
// ERROR HANDLING TESTS
// ============================================

func (s *FeatureNameTestSuite) TestShouldReturn401WithoutAuth() {
	// Arrange
	req, _ := http.NewRequest(
		http.MethodGet,
		s.server.URL+"/api/protected-resource",
		nil,
	)
	// No Authorization header

	// Act
	resp, err := s.client.Do(req)
	require.NoError(s.T(), err)
	defer resp.Body.Close()

	// Assert
	assert.Equal(s.T(), http.StatusUnauthorized, resp.StatusCode)
}

func (s *FeatureNameTestSuite) TestShouldReturn403ForUnauthorizedAction() {
	// Arrange
	req, _ := http.NewRequest(
		http.MethodDelete,
		s.server.URL+"/api/admin/resource/123",
		nil,
	)
	req.Header.Set("Authorization", "Bearer regular-user-token")

	// Act
	resp, err := s.client.Do(req)
	require.NoError(s.T(), err)
	defer resp.Body.Close()

	// Assert
	assert.Equal(s.T(), http.StatusForbidden, resp.StatusCode)
}

func (s *FeatureNameTestSuite) TestShouldReturn404ForNonexistentResource() {
	// Arrange
	req, _ := http.NewRequest(
		http.MethodGet,
		s.server.URL+"/api/resources/nonexistent-id",
		nil,
	)
	req.Header.Set("Authorization", "Bearer test-token")

	// Act
	resp, err := s.client.Do(req)
	require.NoError(s.T(), err)
	defer resp.Body.Close()

	// Assert
	assert.Equal(s.T(), http.StatusNotFound, resp.StatusCode)
}

// ============================================
// EDGE CASES
// ============================================

func (s *FeatureNameTestSuite) TestShouldHandleEmptyRequestBody() {
	// Arrange
	req, _ := http.NewRequest(
		http.MethodPost,
		s.server.URL+"/api/resources",
		bytes.NewReader([]byte("{}")),
	)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer test-token")

	// Act
	resp, err := s.client.Do(req)
	require.NoError(s.T(), err)
	defer resp.Body.Close()

	// Assert
	assert.Equal(s.T(), http.StatusBadRequest, resp.StatusCode)
}

func (s *FeatureNameTestSuite) TestShouldHandleLargePayload() {
	// Arrange
	largePayload := map[string]interface{}{
		"name":        "Test",
		"description": strings.Repeat("x", 10000),
	}
	body, _ := json.Marshal(largePayload)

	req, _ := http.NewRequest(
		http.MethodPost,
		s.server.URL+"/api/resources",
		bytes.NewReader(body),
	)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer test-token")

	// Act
	resp, err := s.client.Do(req)
	require.NoError(s.T(), err)
	defer resp.Body.Close()

	// Assert - Accept either success or payload too large
	assert.Contains(s.T(), []int{http.StatusCreated, http.StatusBadRequest, http.StatusRequestEntityTooLarge}, resp.StatusCode)
}

func (s *FeatureNameTestSuite) TestShouldHandleConcurrentRequests() {
	// Arrange
	numRequests := 10
	results := make(chan int, numRequests)

	// Act
	for i := 0; i < numRequests; i++ {
		go func() {
			req, _ := http.NewRequest(
				http.MethodGet,
				s.server.URL+"/api/resources",
				nil,
			)
			req.Header.Set("Authorization", "Bearer test-token")

			resp, err := s.client.Do(req)
			if err != nil {
				results <- 0
				return
			}
			defer resp.Body.Close()
			results <- resp.StatusCode
		}()
	}

	// Assert
	for i := 0; i < numRequests; i++ {
		status := <-results
		assert.Equal(s.T(), http.StatusOK, status)
	}
}

// ============================================
// INTEGRATION TESTS
// ============================================

func (s *FeatureNameTestSuite) TestCompleteCRUDFlow() {
	// CREATE
	createPayload := map[string]interface{}{
		"name":  "CRUD Test",
		"value": 100,
	}
	createBody, _ := json.Marshal(createPayload)
	createReq, _ := http.NewRequest(http.MethodPost, s.server.URL+"/api/resources", bytes.NewReader(createBody))
	createReq.Header.Set("Content-Type", "application/json")
	createReq.Header.Set("Authorization", "Bearer test-token")

	createResp, err := s.client.Do(createReq)
	require.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusCreated, createResp.StatusCode)

	var created map[string]interface{}
	json.NewDecoder(createResp.Body).Decode(&created)
	createResp.Body.Close()
	resourceID := created["id"].(string)

	// READ
	readReq, _ := http.NewRequest(http.MethodGet, fmt.Sprintf("%s/api/resources/%s", s.server.URL, resourceID), nil)
	readReq.Header.Set("Authorization", "Bearer test-token")

	readResp, err := s.client.Do(readReq)
	require.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, readResp.StatusCode)
	readResp.Body.Close()

	// UPDATE
	updatePayload := map[string]interface{}{
		"name": "Updated Name",
	}
	updateBody, _ := json.Marshal(updatePayload)
	updateReq, _ := http.NewRequest(http.MethodPut, fmt.Sprintf("%s/api/resources/%s", s.server.URL, resourceID), bytes.NewReader(updateBody))
	updateReq.Header.Set("Content-Type", "application/json")
	updateReq.Header.Set("Authorization", "Bearer test-token")

	updateResp, err := s.client.Do(updateReq)
	require.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusOK, updateResp.StatusCode)

	var updated map[string]interface{}
	json.NewDecoder(updateResp.Body).Decode(&updated)
	updateResp.Body.Close()
	assert.Equal(s.T(), "Updated Name", updated["name"])

	// DELETE
	deleteReq, _ := http.NewRequest(http.MethodDelete, fmt.Sprintf("%s/api/resources/%s", s.server.URL, resourceID), nil)
	deleteReq.Header.Set("Authorization", "Bearer test-token")

	deleteResp, err := s.client.Do(deleteReq)
	require.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusNoContent, deleteResp.StatusCode)
	deleteResp.Body.Close()

	// VERIFY DELETED
	verifyReq, _ := http.NewRequest(http.MethodGet, fmt.Sprintf("%s/api/resources/%s", s.server.URL, resourceID), nil)
	verifyReq.Header.Set("Authorization", "Bearer test-token")

	verifyResp, err := s.client.Do(verifyReq)
	require.NoError(s.T(), err)
	assert.Equal(s.T(), http.StatusNotFound, verifyResp.StatusCode)
	verifyResp.Body.Close()
}

// ============================================
// STANDALONE TEST FUNCTIONS (Alternative)
// ============================================

func TestFeatureName_CreateResource(t *testing.T) {
	// For tests that don't need suite setup
	handler := handler.New()
	server := httptest.NewServer(handler.Router())
	defer server.Close()

	// Test implementation...
}

// ============================================
// BENCHMARK TESTS
// ============================================

func BenchmarkGetResource(b *testing.B) {
	handler := handler.New()
	server := httptest.NewServer(handler.Router())
	defer server.Close()

	client := server.Client()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		req, _ := http.NewRequest(http.MethodGet, server.URL+"/api/resources/test-id", nil)
		req.Header.Set("Authorization", "Bearer test-token")

		resp, _ := client.Do(req)
		resp.Body.Close()
	}
}
```

## Running Tests

```bash
# Run all E2E tests
go test ./tests/e2e/... -v

# Run specific test file
go test ./tests/e2e/feature_name_test.go -v

# Run specific test
go test ./tests/e2e/... -v -run TestFeatureNameSuite/TestAC1

# Run with coverage
go test ./tests/e2e/... -v -coverprofile=coverage.out
go tool cover -html=coverage.out

# Run benchmarks
go test ./tests/e2e/... -bench=. -benchmem

# Run with race detection
go test ./tests/e2e/... -race -v

# Run with timeout
go test ./tests/e2e/... -timeout 5m -v
```

## Best Practices

1. **Use test suites** - Group related tests with testify/suite
2. **Use httptest** - Built-in test server for HTTP testing
3. **Use table-driven tests** - For testing multiple scenarios
4. **Clean up resources** - Use teardown functions
5. **Test concurrency** - Verify thread-safety
6. **Add benchmarks** - Measure performance
7. **Use race detector** - Find race conditions
