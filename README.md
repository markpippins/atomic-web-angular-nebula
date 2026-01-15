
# Nebula RMS (Requirements Management System)

A high-performance, hierarchical Requirements Management System built with Angular and AI capabilities. Nebula RMS allows teams to structure projects into Systems, Subsystems, and Features, manage requirements via a Kanban board, and leverage Google's Gemini AI to decompose user stories into technical tasks automatically.

## 🚀 Features

### 🏗 Hierarchical Project Management
- **Three-level Structure**: Organize work into **Systems** → **Subsystems** → **Features**.
- **Contextual Documentation**: Maintain specific `README` documentation for every level of the hierarchy to track architecture and decisions.

### 📋 Requirements Management
- **Kanban Board**: Drag-and-drop interface to manage requirement status (Backlog, ToDo, InProgress, Done).
- **Table View**: Sortable, list-based view for quick editing and bulk review.
- **CRUD Operations**: Create, Read, Update, and Delete requirements with priority levels (Low, Medium, High).

### 🤖 AI-Powered Decomposition
- **Context-Aware Generation**: Uses the documentation from the current System/Subsystem/Feature to generate technically relevant requirements.
- **User Story to Tasks**: Converts high-level user stories into granular technical requirements using the **Gemini 2.5 Flash** model.

### 🎨 UX & Theming
- **Dark Mode**: Fully supported dark/light theme toggle.
- **Responsive Design**: Built with Tailwind CSS for a clean, modern interface.
- **Local Persistence**: All data and preferences are saved automatically to the browser's `localStorage`.

## 🛠 Tech Stack

- **Framework**: Angular v21+ (Zoneless, Signals, Standalone Components)
- **Styling**: Tailwind CSS
- **AI Integration**: Google GenAI SDK (`@google/genai`)
- **State Management**: Angular Signals & Computed properties
- **Build/Env**: Standard Angular Environment configuration

## ⚙️ Configuration & Setup

### API Key Configuration

To use the AI generation features, a Google Gemini API key is required.

**Option 1: Environment Variable (Deployment)**
If deploying, you can inject the API key into the `process.env` polyfill in `index.html` or replace the environment files during build.
- The app looks for `process.env.API_KEY`.

**Option 2: UI Input (Local/Session)**
1. Open the application.
2. Click the **"Setup AI"** button in the top right toolbar.
3. Enter your Gemini API Key.
4. The key is stored in memory for the current session.

### Running the Application

This project is designed as a standalone Angular application.

1. **Install Dependencies**:
   Ensure you have the necessary node modules if running locally with a build tool, or serve the files via a static server if using the CDN-based setup provided in the applet.

2. **Start**:
   Serve the application using your preferred web server.

## 📂 Project Structure

- `src/components/`: Standalone Angular components (Board, Table, Nav, etc.).
- `src/services/`: Singleton services for Data (State) and AI interaction.
- `src/models/`: TypeScript interfaces for the data domain.
- `src/environments/`: Environment configuration files.
- `src/app.component.ts`: Root component handling layout.

## 💡 Usage Guide

1. **Create Structure**: Use the sidebar to add a System (e.g., "E-Commerce"). Add a Subsystem (e.g., "Checkout") and a Feature (e.g., "Payment").
2. **Add Context**: Select a Feature and switch to the **Docs** view to add technical details (e.g., "Use Stripe API v3").
3. **Generate Requirements**:
   - Click **"Setup AI"** (if not configured).
   - Click **"AI Gen"**.
   - Enter a User Story (e.g., "As a user, I want to pay with credit card").
   - The AI will use your documentation to generate specific tasks.
4. **Manage Work**: Switch to **Board** view to drag tasks through the workflow.
