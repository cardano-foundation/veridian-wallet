#!/bin/bash

# Clear Veridian Wallet Data Script
# This script manually deletes all wallet data files

echo "=== Veridian Wallet Data Clear Script ==="

# Function to clear iOS data
clear_ios_data() {
    echo "Clearing iOS data..."
    # Find the IDWalletDatabase directory anywhere in simulator containers
    DB_DIR=$(find ~/Library/Developer/CoreSimulator/Devices/ -type d -name IDWalletDatabase | head -1)
    if [ -n "$DB_DIR" ]; then
        echo "Found database directory: $DB_DIR"
        rm -rf "$DB_DIR"/idw*.db*
        rm -rf "$DB_DIR"/idwSQLite.db*
        echo "✓ Database files deleted"
    else
        echo "⚠ Database directory not found"
    fi
}

# Function to clear Android data
clear_android_data() {
    echo "Clearing Android data..."
    
    # Check if device is connected
    if ! adb devices | grep -q "device$"; then
        echo "⚠ No Android device connected. Please connect a device or start an emulator."
        return
    fi
    
    echo "Connected devices:"
    adb devices
    
    # Delete database files
    echo "Deleting database files..."
    adb shell "rm -rf /data/data/org.cardanofoundation.idw/databases/idw.db*"
    adb shell "rm -rf /data/data/org.cardanofoundation.idw/databases/idw.db-journal"
    adb shell "rm -rf /data/data/org.cardanofoundation.idw/databases/idw.db-wal"
    adb shell "rm -rf /data/data/org.cardanofoundation.idw/databases/idw.db-shm"
    echo "✓ Database files deleted"
    
    # Delete cache
    echo "Deleting cache files..."
    adb shell "rm -rf /data/data/org.cardanofoundation.idw/cache/*"
    echo "✓ Cache files deleted"
    
    # Delete shared preferences
    echo "Deleting shared preferences..."
    adb shell "rm -rf /data/data/org.cardanofoundation.idw/shared_prefs/*"
    echo "✓ Shared preferences deleted"
}

# Function to clear web data (IndexedDB)
clear_web_data() {
    echo "Clearing web data..."
    
    # Clear browser storage for localhost:3003 (development server)
    echo "To clear web data, please:"
    echo "1. Open browser developer tools"
    echo "2. Go to Application/Storage tab"
    echo "3. Clear IndexedDB for localhost:3003"
    echo "4. Clear Local Storage for localhost:3003"
}

# Main script
echo "Select platform to clear:"
echo "1) iOS Simulator"
echo "2) Android Device/Emulator"
echo "3) Web Browser"
echo "4) All platforms"
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        clear_ios_data
        ;;
    2)
        clear_android_data
        ;;
    3)
        clear_web_data
        ;;
    4)
        clear_ios_data
        echo ""
        clear_android_data
        echo ""
        clear_web_data
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "=== Data Clear Complete ==="
echo "Note: You may need to restart the app for changes to take effect."
echo "Note: Secure storage (keychain/keystore) may need to be cleared manually." 