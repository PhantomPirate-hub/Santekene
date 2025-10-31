buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        // Plugin Gradle Android
        classpath("com.android.tools.build:gradle:8.7.2")
        // Plugin Google Services (Firebase)
        classpath("com.google.gms:google-services:4.4.2")
        // Plugin Kotlin
        classpath(kotlin("gradle-plugin", version = "1.9.23"))
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: org.gradle.api.file.Directory =
    rootProject.layout.buildDirectory.dir("../../build").get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: org.gradle.api.file.Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)
}

subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
