# Streats 
*LA Street Food Finder App*  


## Overview 
Streats is a mobile app designed to make finding LA's best street food (food trucks, stands, carts, ice cream trucks and more) easy. The goal is to provide an easy way for users to explore LA's vast food culture and support local businesses, and for local street vendors to expand their reach and customer accessibility.

## Features 
- 📍 **Real-time vendor locations**  
- 🔍 **Search & filter by cuisine** 
- 🍦 **Vendor specific markers**
- 📃 **View up-to-date menus and hours**
- ⭐ **User reviews & ratings**
- ❤️ **User favorited vendors**
- 💸 **Vendor mode**

## Tech Stack  
- **Frontend:** React Native w/ Expo
- **Backend:** Firebase  
- **Database:** Firestore

---
<br>
<p float="left">
  <img src="./assets/images/streatswelcome.png" width="200" />
  <img src="./assets/images/streatsmapvendorview.png" width="200" />
  <img src="./assets/images/streatsvendordetailsmenu.png" width="200" />
  <img src="./assets/images/streatsvendordetailsinfo.png" width="200" />
  <img src="./assets/images/streatsvendordetailsreviews.png" width="200" />
  <img src="./assets/images/streatsvendordetailsphotos.png" width="200" />
  <img src="./assets/images/streatsvendorslist.png" width="200" />
  <img src="./assets/images/streatsprofiletab.png" width="200" />
</p>

### Prerequisites

*   **Node.js and npm (or yarn):** Ensure Node.js (which includes npm) is installed.
*   **Expo CLI:** Install the Expo CLI globally if you haven't already:
    ```bash
    npm install -g expo-cli
    ```
*   **Expo Go App:** For testing on a physical device, install the Expo Go app.
*   **Firebase Project:**
    *   You'll need a Firebase project set up.
    *   Enable **Authentication** (Email/Password provider).
    *   Enable **Firestore Database**.
    *   Enable **Firebase Storage**.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/romanguillermo/Streats.git
    cd Streats
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Firebase:**
    *   Create a directory named `config` at the root of the project if it doesn't exist.
    *   Inside the `config` directory, create a file named `firebaseConfig.ts`.
    *   Populate `config/firebaseConfig.ts` with your Firebase project's configuration details. It should look like:

        ```typescript
        // config/firebaseConfig.ts
        import { initializeApp } from "firebase/app";
        import { getAuth } from "firebase/auth";
        import { getFirestore } from "firebase/firestore";
        import { getStorage } from "firebase/storage";

        const firebaseConfig = {
          apiKey: "API_KEY",
          authDomain: "AUTH_DOMAIN",
          projectId: "PROJECT_ID",
          storageBucket: "STORAGE_BUCKET",
          messagingSenderId: "MESSAGING_SENDER_ID",
          appId: "APP_ID",
        };

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);
        const storage = getStorage(app);

        export { auth, db, storage };
        ```

4.  **Firebase Security Rules:**
    Ensure your Firestore and Firebase Storage security rules are configured to allow the necessary read/write operations for users and vendors as developed during the project. Refer to the latest rules discussed for full functionality.

### Running the App

1.  **Start the Expo Development Server:**
    ```bash
    npx expo start
    ```
    This command will start the Metro Bundler, which builds your app and serves it. If it does not work properly, try using:  
    ```bash
    npx expo start --tunnel
    ```

2.  **Open the app on a device or emulator:**
    *   **Using Expo Go on a Physical Device:**
        *   Open the Expo Go app on your iOS or Android phone.
        *   Scan the QR code displayed in the terminal or in the web browser tab that Metro Bundler opens.
    *   **Using an Emulator/Simulator:**
        *   In the terminal where Metro Bundler is running, press `a` to open on an Android Emulator (if configured).
        *   Press `i` to open on an iOS Simulator (if on macOS and Xcode is configured).

The app should now build and launch, connecting to your configured Firebase backend.
