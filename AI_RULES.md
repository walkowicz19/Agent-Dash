# AI Development Rules for Agent Dash

This document outlines the technical stack and development guidelines for the Agent Dash application. Adhering to these rules ensures consistency, maintainability, and a high-quality codebase.

## Tech Stack

The application is built on a modern, lightweight, and powerful tech stack:

-   **Framework:** React with TypeScript for building a type-safe, component-based user interface.
-   **Build Tool:** Vite for fast development and optimized builds.
-   **Styling:** Tailwind CSS for a utility-first approach to styling. All styling should be done via Tailwind classes.
-   **Icons:** `lucide-react` for a comprehensive and consistent set of icons.
-   **AI Integration:** `@google/generative-ai` (Gemini) for all generative AI capabilities, managed through the `GeminiService`.
-   **Data Visualization:** ApexCharts for creating interactive and responsive charts and graphs.
-   **Data Manipulation:** D3.js for robust data parsing and manipulation, especially for preparing data for visualization.
-   **State Management:** React Hooks (`useState`, `useCallback`, `useContext`) for managing local and shared component state.

## Library Usage Rules

To maintain clarity and consistency, please follow these rules for using libraries:

-   **Styling:**
    -   **DO:** Use Tailwind CSS classes for all styling directly in your JSX.
    -   **DO NOT:** Write custom CSS in `.css` files or use inline `style` objects unless absolutely necessary for dynamic properties that cannot be handled by Tailwind.

-   **Components:**
    -   **DO:** Create small, single-purpose components in the `src/components/` directory.
    -   **DO NOT:** Create monolithic components that handle too many responsibilities.

-   **Icons:**
    -   **DO:** Use icons from the `lucide-react` library exclusively.
    -   **DO NOT:** Use SVGs directly or install other icon libraries.

-   **AI Functionality:**
    -   **DO:** Interact with the Gemini API through the methods provided in `src/services/geminiService.ts`.
    -   **DO NOT:** Make direct API calls to the AI model from components.

-   **Charts & Graphs:**
    -   **DO:** Use ApexCharts for all data visualizations. The `geminiService` is configured to generate dashboards using this library.
    -   **DO NOT:** Introduce other charting libraries like Chart.js or Recharts.

-   **State Management:**
    -   **DO:** Rely on React's built-in hooks for state management. For complex, shared state, use the Context API.
    -   **DO NOT:** Add external state management libraries like Redux, Zustand, or MobX.

-   **Dependencies:**
    -   **DO:** Utilize the existing packages in `package.json`.
    -   **DO NOT:** Add new npm packages without a clear and justified reason. The current stack is intentionally minimal and should be sufficient for most tasks.