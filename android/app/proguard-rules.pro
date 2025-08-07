# Add project-specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Basic ProGuard rules for optimization and minification
-optimizationpasses 5
-dontpreverify
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses

-renamesourcefileattribute SourceFile       # Uncomment to hide original source file names for extra obfuscation

# Rules for WebView with JavaScript (if your app uses WebView)
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepclassmembers class fqcn.of.javascript.interface.for.webview {
    public *;
}
-dontwarn android.webkit.**

# Rules for Capacitor and its plugins
-keep class com.getcapacitor.** { *; }
-keep class org.apache.cordova.** { *; }
-dontwarn com.getcapacitor.**
-dontwarn org.apache.cordova.**

# Rules for specific dependencies from your package.json
-keep class androidx.** { *; }
-dontwarn androidx.**
-keep class com.google.android.material.** { *; }
-dontwarn com.google.android.material.**

# Rules for Capacitor plugins used in your project
-keep class com.aparajita.capacitor.biometricauth.** { *; }
-dontwarn com.aparajita.capacitor.biometricauth.**
-keep class com.capacitorjs.plugins.** { *; }
-dontwarn com.capacitorjs.plugins.**
-keep class io.evva.capacitor.securestorage.** { *; }
-dontwarn io.evva.capacitor.securestorage.**

# Rules for capacitor-freerasp to fix R8 minification errors
-keep class com.aheaditec.freerasp.** { *; }
-dontwarn com.aheaditec.freerasp.**
-keep class java.lang.invoke.StringConcatFactory { *; }
-dontwarn java.lang.invoke.StringConcatFactory

# Suppress warnings from common libraries
-dontwarn com.google.**
-dontwarn org.chromium.**

# Keep annotated classes (useful for libraries like SQLite or MLKit)
-keep class * {
    @androidx.annotation.Keep *;
}

# This will exclude minification of all SQLCipher classes and class-members so Capacitor Community SQLite does not error on minified function names
-keep class net.sqlcipher.** { *; }
-keepclassmembers class net.sqlcipher.** { *; }