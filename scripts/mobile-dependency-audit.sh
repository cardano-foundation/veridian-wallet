#!/bin/bash

# Mobile Dependency Audit Script
# This script performs comprehensive security audits for iOS and Android dependencies

set -e

echo "🔍 Starting Mobile Dependency Security Audit..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Checking NPM dependencies for mobile-specific vulnerabilities..."

# Run NPM audit with focus on mobile dependencies
if npm audit --audit-level=moderate --production; then
    print_success "NPM audit passed - no critical vulnerabilities found"
else
    print_warning "NPM audit found vulnerabilities. Review the output above."
    echo "Vulnerable packages:"
    # Fix the jq error by handling null values properly and using a more robust approach
    audit_json=$(npm audit --audit-level=moderate --production --json 2>/dev/null || echo '{"advisories":{}}')
    echo "$audit_json" | jq -r '.advisories | to_entries[] | select(.value.severity == "moderate" or .value.severity == "high" or .value.severity == "critical") | .value.module_name // empty' 2>/dev/null | grep -v '^$' | sort | uniq || {
        echo "Unable to parse vulnerable packages"
    }
fi

print_status "Checking for outdated mobile dependencies..."

# Check for outdated Capacitor and mobile-specific dependencies
npx npm-check-updates --target minor --reject "@capacitor/*,@aparajita/*,@evva/*,capacitor-*" --format group || {
    print_warning "Some mobile dependencies may have updates available"
}

# iOS specific checks
if [ -d "ios" ]; then
    print_status "Checking iOS dependencies..."
    
    if command -v pod &> /dev/null; then
        cd ios/App
        if [ -f "Podfile" ]; then
            print_status "Checking iOS dependencies..."
            
            # Check if Podfile.lock exists and is up to date
            if [ -f "Podfile.lock" ]; then
                print_status "Podfile.lock found - checking for outdated dependencies..."
                if pod outdated --silent; then
                    print_warning "Some iOS dependencies may be outdated"
                else
                    print_success "iOS dependencies appear to be up to date"
                fi
            else
                print_warning "Podfile.lock not found - run 'pod install' first"
            fi
            
            # Enhanced iOS vulnerability scanning
            print_status "Running iOS vulnerability scan..."
            
            # Check for cocoapods-audit
            if command -v pod-audit &> /dev/null; then
                print_status "Running cocoapods-audit for vulnerability scanning..."
                if pod-audit; then
                    print_success "cocoapods-audit passed - no iOS vulnerabilities found"
                else
                    print_warning "cocoapods-audit found iOS vulnerabilities"
                fi
            else
                print_warning "cocoapods-audit not installed. Install with: gem install cocoapods-audit"
            fi
            
            # Check for known vulnerable iOS dependencies
            print_status "Checking for known vulnerable iOS dependencies..."
            VULNERABLE_IOS_LIBS=("AFNetworking" "SDWebImage" "Realm" "CocoaLumberjack" "GoogleMLKit" "MLKitBarcodeScanning")
            for lib in "${VULNERABLE_IOS_LIBS[@]}"; do
                if grep -q "$lib" Podfile; then
                    print_warning "Found potentially vulnerable iOS library: $lib"
                fi
            done
            
            # Check for specific security issues in Podfile
            if grep -q "source.*http://" Podfile; then
                print_warning "Found HTTP source in Podfile - consider using HTTPS"
            fi
            
        else
            print_warning "Podfile not found in ios/App directory"
        fi
        cd ../..
    else
        print_warning "CocoaPods not installed. Install with: gem install cocoapods"
    fi
else
    print_warning "iOS directory not found"
fi

# Android specific checks
if [ -d "android" ]; then
    print_status "Checking Android dependencies..."
    
    if [ -f "android/gradlew" ]; then
        cd android
        print_status "Checking Android dependencies..."
        
        # Make gradlew executable
        chmod +x gradlew
        
        # Download dependencies for analysis
        print_status "Downloading Android dependencies for analysis..."
        ./gradlew dependencies --no-daemon > /dev/null 2>&1 || {
            print_warning "Failed to download Android dependencies"
        }
        
        # Enhanced Android vulnerability checking
        print_status "Checking for known vulnerable Android dependencies..."
        
        # Check for vulnerable AndroidX versions
        if grep -q "androidx.appcompat.*1\.[0-5]\." app/build.gradle; then
            print_warning "Outdated AndroidX AppCompat detected"
        fi
        
        # Check for vulnerable support library versions
        if grep -q "com.android.support" app/build.gradle; then
            print_warning "Android Support Library detected - consider migrating to AndroidX"
        fi
        
        # Check for known vulnerable Android libraries
        VULNERABLE_ANDROID_LIBS=("okhttp" "retrofit" "glide" "picasso" "volley" "universal-image-loader")
        for lib in "${VULNERABLE_ANDROID_LIBS[@]}"; do
            if grep -q "$lib" app/build.gradle; then
                print_warning "Found potentially vulnerable Android library: $lib"
            fi
        done
        
        # Check for security issues in build.gradle
        if grep -q "debuggable.*true" app/build.gradle; then
            print_warning "Found debuggable=true in build.gradle - security risk"
        fi
        
        if grep -q "allowBackup.*true" app/build.gradle; then
            print_warning "Found allowBackup=true in build.gradle - review for security implications"
        fi
        
        cd ..
    else
        print_warning "Android Gradle wrapper not found"
    fi
else
    print_warning "Android directory not found"
fi

# Check for known vulnerable mobile-specific packages
print_status "Checking for known vulnerable mobile packages..."

VULNERABLE_PACKAGES=(
    "@capacitor/core"
    "@capacitor/android"
    "@capacitor/ios"
    "@aparajita/capacitor-biometric-auth"
    "@evva/capacitor-secure-storage-plugin"
    "capacitor-freerasp"
    "capacitor-native-settings"
    "capacitor-plugin-safe-area"
)

for package in "${VULNERABLE_PACKAGES[@]}"; do
    if npm list "$package" > /dev/null 2>&1; then
        version=$(npm list "$package" --depth=0 --json 2>/dev/null | jq -r ".dependencies[\"$package\"].version // empty" 2>/dev/null || echo "unknown")
        print_status "Found $package@$version"
        
        # Check if this version has known vulnerabilities
        audit_result=$(npm audit --audit-level=moderate --production --json 2>/dev/null || echo '{"advisories":{}}')
        if echo "$audit_result" | jq -r '.advisories | to_entries[] | select(.value.module_name == "'$package'") | .value.title // empty' 2>/dev/null | grep -q .; then
            print_warning "$package has known vulnerabilities"
        else
            print_success "$package appears to be secure"
        fi
    fi
done

print_status "Checking for security best practices..."

# Check for security-related configurations
if [ -f "capacitor.config.ts" ]; then
    print_status "Checking Capacitor configuration for security settings..."
    if grep -q "allowNavigation" capacitor.config.ts; then
        print_warning "Found allowNavigation in Capacitor config - review for security implications"
    fi
    if grep -q "server" capacitor.config.ts; then
        print_warning "Found server configuration in Capacitor config - review for security implications"
    fi
    if grep -q "cleartext.*true" capacitor.config.ts; then
        print_warning "Found cleartext=true in Capacitor config - security risk"
    fi
fi

# Check for sensitive files
SENSITIVE_FILES=(
    "google-services.json"
    "GoogleService-Info.plist"
    "*.keystore"
    "*.jks"
    "*.p12"
    "*.mobileprovision"
)

for pattern in "${SENSITIVE_FILES[@]}"; do
    if find . -name "$pattern" -type f | grep -q .; then
        print_warning "Found sensitive files matching pattern: $pattern"
        find . -name "$pattern" -type f
    fi
done

print_success "Mobile dependency audit completed!"
print_status "Summary:"
# Fix the jq error by handling null values properly
audit_result=$(npm audit --audit-level=moderate --production --json 2>/dev/null || echo '{"metadata":{"vulnerabilities":{"total":0}}}')
vuln_count=$(echo "$audit_result" | jq -r '.metadata.vulnerabilities.total // 0' 2>/dev/null || echo 'unknown')
echo "  - NPM dependencies: $vuln_count vulnerabilities"
echo "  - iOS dependencies: Checked"
echo "  - Android dependencies: Checked"
echo "  - Mobile-specific packages: Reviewed"

echo ""
print_status "Recommendations:"
echo "  1. Regularly update Capacitor and mobile plugins"
echo "  2. Monitor security advisories for mobile dependencies"
echo "  3. Consider using dependency scanning tools in CI/CD"
echo "  4. Review and update .nsprc for mobile-specific vulnerabilities"
echo "  5. Install cocoapods-audit for enhanced iOS vulnerability scanning"
echo "  6. Consider using OWASP Dependency Check for Android in local development" 