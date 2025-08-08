#!/bin/bash

# Enhanced Security Report Generator
# This script generates comprehensive HTML security reports from audit results

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Initialize variables
START_TIME=$(date +%s)
VULN_COUNT=0
CRITICAL=0
HIGH=0
MODERATE=0
LOW=0
IOS_VULN_COUNT=0
ANDROID_ISSUES=0
SENSITIVE_COUNT=0

print_info "Generating comprehensive HTML security report..."

# Check if Node.js script is available
if [ ! -f "scripts/generate-audit-report.js" ]; then
    print_error "HTML report generator not found: scripts/generate-audit-report.js"
    print_error "This script is only available in CI/CD environments"
    print_error "For local development, use: npm run audit:mobile"
    exit 1
fi

# Generate audit output for the report generator
print_info "Collecting audit data..."

# NPM Security Data
if [ -f "audit-results/npm-audit-results/audit-results.json" ]; then
    VULN_COUNT=$(jq '.metadata.vulnerabilities.total // 0' audit-results/npm-audit-results/audit-results.json)
    CRITICAL=$(jq '.metadata.vulnerabilities.critical // 0' audit-results/npm-audit-results/audit-results.json)
    HIGH=$(jq '.metadata.vulnerabilities.high // 0' audit-results/npm-audit-results/audit-results.json)
    MODERATE=$(jq '.metadata.vulnerabilities.moderate // 0' audit-results/npm-audit-results/audit-results.json)
    LOW=$(jq '.metadata.vulnerabilities.low // 0' audit-results/npm-audit-results/audit-results.json)
fi

# iOS Security Data
if [ -f "ios/App/Podfile" ]; then
    VULNERABLE_IOS_LIBS=("AFNetworking" "SDWebImage" "Realm" "CocoaLumberjack" "GoogleMLKit" "MLKitBarcodeScanning")
    IOS_VULN_COUNT=0
    for lib in "${VULNERABLE_IOS_LIBS[@]}"; do
        if grep -q "$lib" ios/App/Podfile; then
            IOS_VULN_COUNT=$((IOS_VULN_COUNT + 1))
        fi
    done
fi

# Android Security Data
if [ -f "android/app/build.gradle" ]; then
    ANDROID_ISSUES=0
    if grep -q "debuggable.*true" android/app/build.gradle; then
        ANDROID_ISSUES=$((ANDROID_ISSUES + 1))
    fi
    if grep -q "allowBackup.*true" android/app/build.gradle; then
        ANDROID_ISSUES=$((ANDROID_ISSUES + 1))
    fi
    
    VULNERABLE_ANDROID_LIBS=("okhttp" "retrofit" "glide" "picasso" "volley" "universal-image-loader")
    for lib in "${VULNERABLE_ANDROID_LIBS[@]}"; do
        if grep -q "$lib" android/app/build.gradle; then
            ANDROID_ISSUES=$((ANDROID_ISSUES + 1))
        fi
    done
fi

# Sensitive Files Data
SENSITIVE_FILES=("google-services.json" "GoogleService-Info.plist" "*.keystore" "*.jks" "*.p12" "*.mobileprovision")
SENSITIVE_COUNT=0
for pattern in "${SENSITIVE_FILES[@]}"; do
    if find . -name "$pattern" -type f | grep -q .; then
        SENSITIVE_COUNT=$((SENSITIVE_COUNT + 1))
    fi
done

# Create audit output for the HTML report generator
print_info "Preparing data for HTML report..."
{
    echo "=== MOBILE DEPENDENCY AUDIT OUTPUT ==="
    echo "NPM dependencies: $VULN_COUNT vulnerabilities"
    echo "Critical: $CRITICAL"
    echo "High: $HIGH"
    echo "Moderate: $MODERATE"
    echo "Low: $LOW"
    
    # Capture NPM audit output
    if [ -f "audit-results/npm-audit-results/audit-results.json" ]; then
        cat audit-results/npm-audit-results/audit-results.json
    fi
    
    # Capture iOS issues
    echo ""
    echo "=== IOS DEPENDENCIES ==="
    if [ -f "audit-results/ios-audit-results/Podfile.lock" ]; then
        echo "iOS dependencies checked"
        echo "Vulnerable libraries found: $IOS_VULN_COUNT"
    fi
    
    # Capture Android issues
    echo ""
    echo "=== ANDROID DEPENDENCIES ==="
    if [ -d "audit-results/android-audit-results" ]; then
        echo "Android dependencies checked"
        echo "Security issues found: $ANDROID_ISSUES"
    fi
    
    # Capture sensitive files
    echo ""
    echo "=== SENSITIVE FILES ==="
    echo "Sensitive files found: $SENSITIVE_COUNT"
} > audit-output.txt

# Generate HTML report
print_info "Generating HTML report..."
if node scripts/generate-audit-report.js 2>/dev/null; then
    print_success "HTML report generated successfully"
    
    # Verify the report was created
    if [ -f "mobile-security-audit-report.html" ]; then
        print_success "Report file: mobile-security-audit-report.html"
        
        # Show report summary
        print_info "Report Summary:"
        print_info "- NPM Vulnerabilities: $VULN_COUNT"
        print_info "- iOS Issues: $IOS_VULN_COUNT"
        print_info "- Android Issues: $ANDROID_ISSUES"
        print_info "- Sensitive Files: $SENSITIVE_COUNT"
        
        # Determine overall risk level
        if [ "$CRITICAL" -gt 0 ] || [ "$SENSITIVE_COUNT" -gt 0 ]; then
            print_error "Overall Risk: HIGH - Immediate action required"
        elif [ "$HIGH" -gt 0 ] || [ "$IOS_VULN_COUNT" -gt 0 ] || [ "$ANDROID_ISSUES" -gt 0 ]; then
            print_warning "Overall Risk: MEDIUM - Review within 1 week"
        else
            print_success "Overall Risk: LOW - Continue monitoring"
        fi
    else
        print_error "HTML report file was not created"
        exit 1
    fi
else
    print_error "Failed to generate HTML report"
    print_error "Check Node.js script for errors"
    exit 1
fi

# Clean up temporary file
rm -f audit-output.txt

# Calculate and show execution time
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
print_success "Security report generation completed in ${DURATION} seconds"
print_info "Report available: mobile-security-audit-report.html"
