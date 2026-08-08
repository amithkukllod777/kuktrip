plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.kuklabs.kuktrip"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.kuklabs.trip"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        // KukTrip product API. The authoritative production source remains
        // trip.kuklabs.com; local persistence is only an offline/cache concern.
        buildConfigField("String", "API_BASE_URL", "\"https://trip.kuklabs.com/\"")

        // One Kuklabs Account — canonical native/separate-repo AuthKit REST
        // contract from kukbook-erp/KUKLABS_IDENTITY.md.
        buildConfigField("String", "AUTHKIT_BASE_URL", "\"https://www.kuklabs.com/v1/auth/\"")
        buildConfigField("String", "KUKLABS_PRODUCT_ID", "\"kuktrip\"")
    }

    buildTypes {
        debug {
            buildConfigField("String", "API_BASE_URL", "\"https://trip.kuklabs.com/\"")
            buildConfigField("String", "AUTHKIT_BASE_URL", "\"https://www.kuklabs.com/v1/auth/\"")
            buildConfigField("String", "KUKLABS_PRODUCT_ID", "\"kuktrip\"")
        }
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    packaging {
        resources { excludes += "/META-INF/{AL2.0,LGPL2.1}" }
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.09.02")
    implementation(composeBom)

    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.activity:activity-compose:1.9.2")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.6")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.6")
    implementation("androidx.navigation:navigation-compose:2.8.1")

    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")

    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    debugImplementation("androidx.compose.ui:ui-tooling")
}
