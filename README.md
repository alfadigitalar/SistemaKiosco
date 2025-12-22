# Novy POS System

Architecture: **Electron + Vite + React + SQLite**

## Setup

1.  **Install Dependencies:**

    ```bash
    npm install
    ```

2.  **Run in Development Mode:**

    ```bash
    npm run dev
    ```

    _This starts the Vite server and the Electron app concurrently._

3.  **Build for Production:**
    ```bash
    npm run build
    ```

## Project Structure

- `src/main`: Back-end logic (Electron main process, Database, API handlers).
- `src/preload`: Security bridge between front-end and back-end.
- `src/renderer`: Front-end React application (UI).

## TODOs

Check the code comments for implementation details!

- `src/main/db.js`: Define your table schemas.
- `src/main/ipcHandlers.js`: Write the SQL queries.
- `src/renderer/src/screens/PosScreen.jsx`: Implement the UI logic.
