#!/bin/bash

# Test Production Deployment
# This script verifies that all fixes have been applied correctly

BASE_URL="https://literexia.com"

echo "🧪 Testing Production Deployment for Literexia"
echo "=============================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test endpoint
test_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="$3"
    local expected_content="$4"

    echo -n "Testing $name... "

    # Get HTTP status code
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")

    if [ "$status" -eq "$expected_status" ]; then
        # Check content if provided
        if [ -n "$expected_content" ]; then
            content=$(curl -s "$url")
            if echo "$content" | grep -q "$expected_content"; then
                echo -e "${GREEN}✓ PASSED${NC} (Status: $status, Content: OK)"
                ((TESTS_PASSED++))
                return 0
            else
                echo -e "${RED}✗ FAILED${NC} (Status: $status, Content: Missing '$expected_content')"
                echo "   Response: $content"
                ((TESTS_FAILED++))
                return 1
            fi
        else
            echo -e "${GREEN}✓ PASSED${NC} (Status: $status)"
            ((TESTS_PASSED++))
            return 0
        fi
    else
        echo -e "${RED}✗ FAILED${NC} (Expected: $expected_status, Got: $status)"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Test 1: Main site loads
echo "📱 Frontend Tests"
echo "---"
test_endpoint "Homepage" "$BASE_URL/" 200

# Test 2: Static assets
test_endpoint "Admin Icon" "$BASE_URL/admin.png" 200
test_endpoint "Manifest" "$BASE_URL/manifest.json" 200 '"name"'

echo ""
echo "🔌 Backend API Tests"
echo "---"

# Test 3: API ping endpoint
test_endpoint "API Ping" "$BASE_URL/api/main-assessment/ping" 200 '"success"'

# Test 4: Other API endpoints (should require auth but at least not 404)
# These will return 401 (unauthorized) but that's expected - we just want to avoid 404
echo -n "Testing API Auth Endpoint... "
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/auth/login")
if [ "$status" -eq "405" ] || [ "$status" -eq "200" ] || [ "$status" -eq "400" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (Status: $status - Endpoint exists)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} (Status: $status - Expected 200/400/405, not 404)"
    ((TESTS_FAILED++))
fi

echo ""
echo "🔍 Manifest Icon Path Test"
echo "---"
manifest_content=$(curl -s "$BASE_URL/manifest.json")
if echo "$manifest_content" | grep -q '"/admin.png"'; then
    echo -e "${GREEN}✓ PASSED${NC} Manifest icon path is correct: /admin.png"
    ((TESTS_PASSED++))
elif echo "$manifest_content" | grep -q '"./admin.png"'; then
    echo -e "${YELLOW}⚠ WARNING${NC} Manifest icon path uses relative path: ./admin.png"
    echo "   This may work but /admin.png is preferred"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAILED${NC} Manifest icon path is incorrect"
    echo "   Content: $manifest_content"
    ((TESTS_FAILED++))
fi

echo ""
echo "☁️  CloudFront Origin Test"
echo "---"
echo -n "Checking if API routes go to EC2... "

# Check the server header - should NOT be AmazonS3 for API routes
server_header=$(curl -s -I "$BASE_URL/api/main-assessment/ping" | grep -i "server:" | tr -d '\r')

if echo "$server_header" | grep -qi "amazons3"; then
    echo -e "${RED}✗ FAILED${NC}"
    echo "   Server: $server_header"
    echo "   API routes are still going to S3 instead of EC2 backend!"
    echo "   Please configure CloudFront /api/* behavior (see CLOUDFRONT_FIX.md)"
    ((TESTS_FAILED++))
else
    echo -e "${GREEN}✓ PASSED${NC}"
    echo "   Server: $server_header"
    echo "   API routes are correctly going to EC2 backend"
    ((TESTS_PASSED++))
fi

echo ""
echo "=============================================="
echo "📊 Test Results"
echo "=============================================="
echo ""

total_tests=$((TESTS_PASSED + TESTS_FAILED))
pass_rate=$((TESTS_PASSED * 100 / total_tests))

echo "Total Tests: $total_tests"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo "Pass Rate: ${pass_rate}%"

echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Production deployment is successful.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please review the errors above.${NC}"
    echo ""
    echo "Common issues:"
    echo "1. If API endpoints return 404:"
    echo "   → Configure CloudFront /api/* behavior (see CLOUDFRONT_FIX.md)"
    echo ""
    echo "2. If admin.png returns 404:"
    echo "   → Run ./deploy-frontend.sh to upload assets to S3"
    echo ""
    echo "3. If CloudFront cache is stale:"
    echo "   → Invalidate cache: aws cloudfront create-invalidation --distribution-id YOUR_ID --paths '/*'"
    exit 1
fi
