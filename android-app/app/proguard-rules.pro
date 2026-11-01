# Petal Pounce does not expose a JavaScript bridge or use reflection.
# Keep the WebView client callbacks used by the platform.
-keepclassmembers class com.glowstate.petalpounce.MainActivity$* {
    public *;
}
