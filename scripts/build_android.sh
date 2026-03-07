#!/bin/bash

# Configuration
export PATH=$PATH:/usr/local/bin
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
VERSION_NAME="1.5"
VERSION_CODE="100"

echo "🚀 Starting Android Build for NextMove Cargo v$VERSION_NAME ($VERSION_CODE)"
echo "========================================================="

# 1. Web Build
echo "📦 Step 1/4: Building Web Assets..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# 2. Capacitor Sync
echo "🔄 Step 2/4: Syncing Capacitor..."
npx cap sync android
if [ $? -ne 0 ]; then
    echo "❌ Capacitor sync failed!"
    exit 1
fi

# 3. Android Bundle (AAB)
echo "🏗️  Step 3/4: Generating Android App Bundle (AAB)..."
cd android
./gradlew bundleRelease
if [ $? -ne 0 ]; then
    echo "❌ Gradle build failed!"
    exit 1
fi
cd ..

# 4. Success
echo "✅ SUCCESS: AAB generated successfully!"
echo "📍 Location: android/app/build/outputs/bundle/release/app-release.aab"
echo "========================================================="
echo "Note: You can now upload this file to the Google Play Console."
