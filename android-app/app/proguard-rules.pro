# Retrofit / Gson models — keep field names for (de)serialization.
-keepattributes Signature, *Annotation*
-keep class com.kuklabs.kuktrip.data.model.** { *; }
-keepclassmembers,allowobfuscation class * { @com.google.gson.annotations.SerializedName <fields>; }
# Retrofit
-keepclasseswithmembers class * { @retrofit2.http.* <methods>; }
-dontwarn okhttp3.**
-dontwarn retrofit2.**
