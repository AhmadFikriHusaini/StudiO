# Installation and running istruction

**1. Run initial project**

```
npm install
```

**2. Run Project**

```
npm start / bun start -c
```

**3. Create Android Prebuild**

```
npx expo prebuild -p android
```

**4. Go to Prebuild Android Directory**

```
cd android
```

**5. Enable android HTTP (cleartext)**

```
add to android/app/src/main/AndroidMAnifest.xml -> android:usesCleartextTraffic="true" at <application>
```

**6. Running Android Build Locale (APK) In Windows**

```
.\gradlew assembleRelease
```

**7. Or Run Prebuild in Development-Client Without Build The App**

```
bunx expo run:android
```
