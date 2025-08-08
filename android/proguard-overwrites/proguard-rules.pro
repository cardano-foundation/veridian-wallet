# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# Keep freerasp plugin classes
-keep class com.aheaditec.freerasp.** { *; }
-keep class com.aheaditec.talsec.** { *; }

# Keep Kotlin serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt

# Keep string concatenation factory
-dontwarn java.lang.invoke.StringConcatFactory

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep generic signatures
-keepattributes Signature

# Keep source file and line number information for debugging
-keepattributes SourceFile,LineNumberTable

# Keep Capacitor plugin classes
-keep class com.getcapacitor.** { *; }
-keep class io.capawesome.** { *; }

# Keep MLKit classes
-keep class com.google.mlkit.** { *; }
-keep class com.google.android.gms.** { *; }

# Keep SQLite classes
-keep class org.sqlite.** { *; }
-keep class org.sqlite.database.** { *; }

# Keep biometric authentication classes
-keep class com.aaparajita.** { *; }
