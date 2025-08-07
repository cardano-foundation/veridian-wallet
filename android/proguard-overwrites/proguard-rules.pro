# ProGuard rules for capacitor-freerasp
-keep class com.aheaditec.freerasp.** { *; }
-dontwarn com.aheaditec.freerasp.**
-keep class java.lang.invoke.StringConcatFactory { *; }
-dontwarn java.lang.invoke.StringConcatFactory
