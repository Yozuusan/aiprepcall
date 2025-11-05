#!/bin/bash
# System Test Script
# Tests the complete PDF extraction and case library system

echo "============================================================"
echo "SYSTEM TEST SUITE"
echo "============================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Test function
test_check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $1"
        ((FAILED++))
    fi
}

echo "1. Testing Dependencies"
echo "----------------------"

# Check Python
python3 --version > /dev/null 2>&1
test_check "Python 3 installed"

# Check pdfplumber
python3 -c "import pdfplumber" 2>/dev/null
test_check "pdfplumber installed"

# Check PyMuPDF
python3 -c "import fitz" 2>/dev/null
test_check "PyMuPDF installed"

# Check pdf2image
python3 -c "import pdf2image" 2>/dev/null
test_check "pdf2image installed"

# Check poppler
which pdftoppm > /dev/null 2>&1
test_check "poppler-utils installed"

# Check Node.js
node --version > /dev/null 2>&1
test_check "Node.js installed"

echo ""
echo "2. Testing Directory Structure"
echo "------------------------------"

# Check directories
[ -d "data/casebooks" ]
test_check "data/casebooks/ exists"

[ -d "data/exhibits" ]
test_check "data/exhibits/ exists"

[ -d "backend" ]
test_check "backend/ exists"

[ -d "tools" ]
test_check "tools/ exists"

echo ""
echo "3. Testing Scripts"
echo "------------------"

# Check extraction script
[ -f "backend/extractPDFsComplete.py" ]
test_check "extractPDFsComplete.py exists"

# Check segmentation script
[ -f "tools/segmentCasebooks.py" ]
test_check "segmentCasebooks.py exists"

# Check library API
[ -f "backend/caseLibrary.js" ]
test_check "caseLibrary.js exists"

# Check server
[ -f "backend/server.js" ]
test_check "server.js exists"

echo ""
echo "4. Testing Data Files"
echo "---------------------"

# Check if PDFs exist
PDF_COUNT=$(find data/casebooks -name "*.pdf" 2>/dev/null | wc -l)
if [ $PDF_COUNT -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Found $PDF_COUNT PDF(s) in casebooks/"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} No PDFs found (add PDFs to data/casebooks/)"
    echo "  Skip extraction tests"
fi

# Check if extraction has been run
if [ -f "data/casebooks_complete.json" ]; then
    echo -e "${GREEN}✓${NC} casebooks_complete.json exists"
    ((PASSED++))

    # Check case count
    CASE_COUNT=$(cat data/casebooks_complete.json | jq -r '.metadata.total_cases' 2>/dev/null)
    if [ ! -z "$CASE_COUNT" ] && [ "$CASE_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓${NC} Extraction has $CASE_COUNT cases"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} No cases in extraction"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠${NC} casebooks_complete.json not found"
    echo "  Run: python3 backend/extractPDFsComplete.py"
fi

# Check if library has been built
if [ -f "data/library/index.json" ]; then
    echo -e "${GREEN}✓${NC} library/index.json exists"
    ((PASSED++))

    # Check library size
    LIB_COUNT=$(cat data/library/index.json | jq -r '.total_cases' 2>/dev/null)
    if [ ! -z "$LIB_COUNT" ] && [ "$LIB_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✓${NC} Library has $LIB_COUNT cases"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} No cases in library"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠${NC} library/index.json not found"
    echo "  Run: python3 tools/segmentCasebooks.py"
fi

echo ""
echo "5. Testing API (if server is running)"
echo "--------------------------------------"

# Check if server is running
SERVER_HEALTH=$(curl -s http://localhost:3000/api/health 2>/dev/null)
if [ ! -z "$SERVER_HEALTH" ]; then
    echo -e "${GREEN}✓${NC} Server is running"
    ((PASSED++))

    # Test library endpoint
    LIB_STATS=$(curl -s http://localhost:3000/api/library/stats 2>/dev/null)
    if [ ! -z "$LIB_STATS" ]; then
        echo -e "${GREEN}✓${NC} Library API responding"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} Library API not responding"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠${NC} Server not running"
    echo "  Start with: node backend/server.js"
fi

echo ""
echo "============================================================"
echo "RESULTS"
echo "============================================================"
echo -e "Tests passed: ${GREEN}$PASSED${NC}"
echo -e "Tests failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "System is ready to use. See USAGE_GUIDE.md for details."
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed${NC}"
    echo ""
    echo "Next steps:"
    if [ $PDF_COUNT -eq 0 ]; then
        echo "1. Add PDFs to data/casebooks/"
    fi
    if [ ! -f "data/casebooks_complete.json" ]; then
        echo "2. Run: python3 backend/extractPDFsComplete.py"
    fi
    if [ ! -f "data/library/index.json" ]; then
        echo "3. Run: python3 tools/segmentCasebooks.py"
    fi
    echo "4. Start server: node backend/server.js"
    echo ""
    exit 1
fi
