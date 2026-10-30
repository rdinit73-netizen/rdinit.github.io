# ExLibris Proguard Rules
# Keep WebKit and JavaScript interfaces
-keepattributes JavascriptInterface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

-keepclassmembers class com.exlibris.readingjournal.MainActivity$AndroidNativeBridge {
    <methods>;
}

# Keep Google Play Services Ads
-keep class com.google.android.gms.ads.** { *; }
-dontwarn com.google.android.gms.ads.**
