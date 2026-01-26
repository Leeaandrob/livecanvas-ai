# E2E Test Template: Backend Python (pytest + httpx)

## Overview

This template provides the structure for End-to-End API tests using pytest with httpx for Python backend applications (FastAPI, Django, Flask, etc.).

## Prerequisites

```bash
pip install pytest pytest-asyncio httpx
# or
poetry add --dev pytest pytest-asyncio httpx
```

## Configuration

### pyproject.toml

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py", "*_test.py"]
python_functions = ["test_*"]
asyncio_mode = "auto"
addopts = "-v --tb=short"

[tool.pytest.markers]
e2e = "End-to-end tests"
slow = "Slow running tests"
```

### conftest.py

```python
# tests/conftest.py

import pytest
from httpx import AsyncClient, ASGITransport
from typing import AsyncGenerator

# Import your app - adjust based on your framework
# FastAPI
from app.main import app

# Django
# from django.test import AsyncClient as DjangoAsyncClient

# Flask
# from app import create_app


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Async HTTP client for testing."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        yield client


@pytest.fixture
def auth_headers() -> dict:
    """Authentication headers for protected endpoints."""
    return {"Authorization": "Bearer test-token"}


@pytest.fixture
async def test_user(client: AsyncClient) -> dict:
    """Create a test user and return its data."""
    user_data = {
        "email": "test@example.com",
        "password": "testpassword123",
        "name": "Test User"
    }
    response = await client.post("/api/users", json=user_data)
    return response.json()
```

## Template Structure

```python
# tests/e2e/test_[feature_name].py

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.e2e


class TestFeatureName:
    """
    Feature: [FEATURE_NAME]

    E2E tests for [feature description].
    """

    # ============================================
    # SETUP & TEARDOWN
    # ============================================

    @pytest.fixture(autouse=True)
    async def setup(self, client: AsyncClient):
        """Setup before each test."""
        # Seed test data if needed
        self.test_data = {"field": "value"}
        yield
        # Cleanup after each test
        # await client.delete("/api/cleanup")

    # ============================================
    # ACCEPTANCE CRITERIA TESTS
    # ============================================

    @pytest.mark.asyncio
    async def test_ac1_should_create_resource_successfully(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """
        AC1: [Acceptance Criteria Description]

        Given [precondition]
        When [action]
        Then [expected result]
        """
        # Arrange
        payload = {
            "name": "Test Resource",
            "description": "Test description",
            "value": 100
        }

        # Act
        response = await client.post(
            "/api/resources",
            json=payload,
            headers=auth_headers
        )

        # Assert
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["name"] == payload["name"]
        assert data["description"] == payload["description"]

    @pytest.mark.asyncio
    async def test_ac1_should_return_400_for_invalid_input(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Should return validation error for invalid input."""
        # Arrange
        invalid_payload = {
            "name": "",  # Invalid: empty
            "value": -1  # Invalid: negative
        }

        # Act
        response = await client.post(
            "/api/resources",
            json=invalid_payload,
            headers=auth_headers
        )

        # Assert
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data or "error" in data

    @pytest.mark.asyncio
    async def test_ac2_should_retrieve_resource_by_id(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """
        AC2: [Another Acceptance Criteria]
        """
        # Arrange - Create resource first
        create_response = await client.post(
            "/api/resources",
            json={"name": "Test", "value": 100},
            headers=auth_headers
        )
        resource_id = create_response.json()["id"]

        # Act
        response = await client.get(
            f"/api/resources/{resource_id}",
            headers=auth_headers
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == resource_id

    # ============================================
    # ERROR HANDLING TESTS
    # ============================================

    @pytest.mark.asyncio
    async def test_should_return_401_without_auth(self, client: AsyncClient):
        """Should return 401 for unauthenticated requests."""
        response = await client.get("/api/protected-resource")

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_should_return_403_for_unauthorized_action(
        self,
        client: AsyncClient
    ):
        """Should return 403 when user lacks permission."""
        # Use regular user token for admin endpoint
        user_headers = {"Authorization": "Bearer regular-user-token"}

        response = await client.delete(
            "/api/admin/resource/123",
            headers=user_headers
        )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_should_return_404_for_nonexistent_resource(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Should return 404 for non-existent resource."""
        response = await client.get(
            "/api/resources/nonexistent-id",
            headers=auth_headers
        )

        assert response.status_code == 404

    # ============================================
    # EDGE CASES
    # ============================================

    @pytest.mark.asyncio
    async def test_should_handle_empty_request_body(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Should handle empty request body gracefully."""
        response = await client.post(
            "/api/resources",
            json={},
            headers=auth_headers
        )

        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_should_handle_large_payload(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Should handle large payloads appropriately."""
        large_payload = {
            "name": "Test",
            "description": "x" * 10000,  # Large description
        }

        response = await client.post(
            "/api/resources",
            json=large_payload,
            headers=auth_headers
        )

        # Assert based on expected behavior
        assert response.status_code in [201, 400, 413]

    @pytest.mark.asyncio
    async def test_should_handle_concurrent_requests(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Should handle concurrent requests correctly."""
        import asyncio

        async def make_request():
            return await client.get("/api/resources", headers=auth_headers)

        # Make 10 concurrent requests
        responses = await asyncio.gather(*[make_request() for _ in range(10)])

        # All should succeed
        for response in responses:
            assert response.status_code == 200

    # ============================================
    # PAGINATION & FILTERING
    # ============================================

    @pytest.mark.asyncio
    async def test_should_paginate_results(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Should return paginated results."""
        response = await client.get(
            "/api/resources?page=1&limit=10",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert len(data["items"]) <= 10

    @pytest.mark.asyncio
    async def test_should_filter_results(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Should filter results by query parameters."""
        response = await client.get(
            "/api/resources?status=active&sort=created_at:desc",
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        # Verify filtering is applied
        for item in data.get("items", []):
            assert item.get("status") == "active"


# ============================================
# INTEGRATION TESTS
# ============================================

class TestFeatureIntegration:
    """Integration tests involving multiple endpoints."""

    @pytest.mark.asyncio
    async def test_complete_crud_flow(
        self,
        client: AsyncClient,
        auth_headers: dict
    ):
        """Test complete CRUD workflow."""
        # CREATE
        create_response = await client.post(
            "/api/resources",
            json={"name": "CRUD Test", "value": 100},
            headers=auth_headers
        )
        assert create_response.status_code == 201
        resource_id = create_response.json()["id"]

        # READ
        read_response = await client.get(
            f"/api/resources/{resource_id}",
            headers=auth_headers
        )
        assert read_response.status_code == 200

        # UPDATE
        update_response = await client.put(
            f"/api/resources/{resource_id}",
            json={"name": "Updated Name"},
            headers=auth_headers
        )
        assert update_response.status_code == 200
        assert update_response.json()["name"] == "Updated Name"

        # DELETE
        delete_response = await client.delete(
            f"/api/resources/{resource_id}",
            headers=auth_headers
        )
        assert delete_response.status_code == 204

        # VERIFY DELETED
        verify_response = await client.get(
            f"/api/resources/{resource_id}",
            headers=auth_headers
        )
        assert verify_response.status_code == 404
```

## Running Tests

```bash
# Run all E2E tests
pytest tests/e2e/ -v

# Run specific test file
pytest tests/e2e/test_feature_name.py -v

# Run with markers
pytest -m e2e -v

# Run with coverage
pytest tests/e2e/ --cov=app --cov-report=html

# Run only fast tests (exclude slow)
pytest tests/e2e/ -m "not slow"

# Run in parallel
pytest tests/e2e/ -n auto
```

## Best Practices

1. **Use async tests** - Python async APIs work better with async tests
2. **Isolate tests** - Each test should be independent
3. **Use fixtures** - Share setup code via pytest fixtures
4. **Follow AAA pattern** - Arrange, Act, Assert
5. **Test error cases** - Include 4xx and 5xx scenarios
6. **Use markers** - Categorize tests (e2e, slow, integration)
