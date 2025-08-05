# Agent Dash: Your AI Assistant for Interactive Dashboards
Agent Dash is a sophisticated desktop application that transforms raw data into beautiful, interactive dashboards using the power of generative AI. The project's journey began as a proof-of-concept within LangFlow and has evolved into a fully-featured Micro-SaaS product, combining a robust front-end with powerful AI capabilities.

# Project Evolution: A Step-by-Step Journey
The creation of Agent Dash was a deliberate process, moving from a conceptual workflow to a polished application:

<img width="960" height="459" alt="Captura de Tela (46)" src="https://github.com/user-attachments/assets/98e26156-9dd6-4375-b5bf-626c3569ab31" />

- Initial Concept (LangFlow Agent): As shown in the LangFlow screenshot, the project's foundation was an AI agent built in LangFlow. This visual workflow demonstrated the core logic of using AI to process data and generate an output. It was the crucial first step to prove the concept's viability.

- Front-End Prototype (Bolt.new): To give the project a user-facing interface, a front-end prototype was developed using Bolt.new. This initial app provided the basic application structure, allowing for the "Welcome to Agent Dash" screen and navigation between different views.

<img width="1920" height="1006" alt="Captura de Tela (43)" src="https://github.com/user-attachments/assets/ef3ac4fe-3654-4ae0-8307-48db7bb51223" />


- Logic and UI Enhancement (Dyad): The final stage involved a significant upgrade using Dyad. This app was used to enhance the front-end logic and create the full-featured user interface. Dyad enabled the creation of dynamic, interactive components, such as the dashboard creation wizard and the "My Saved Dashboards" view.

<img width="1920" height="1000" alt="Captura de Tela (45)" src="https://github.com/user-attachments/assets/d4106488-b001-449d-bd21-8adab1396fe2" />
<img width="1920" height="991" alt="Captura de Tela (44)" src="https://github.com/user-attachments/assets/24933b59-26cc-4d72-868c-3b3324ff07b9" />

# Core Technology
Our platform is built on a modern and powerful stack:

- Initial Workflow (LangFlow): The conceptual foundation for the AI logic.

- Front-End (Dyad): Powers the current, full-featured user interface and complex front-end logic.

<img width="1920" height="1121" alt="Captura de Tela (48)" src="https://github.com/user-attachments/assets/5f72a3a5-889c-428d-99af-72ce618bcb3b" />

- AI Engine (Gemini API): We leverage Google's Gemini API for the core AI functionality: Reasoning Model (gemini-1.5-flash): This model interprets user requests and data, determining the best approach to structure and visualize the dashboard. Coding Model (gemini-2.5-pro): This highly capable model generates the code needed to build the interactive dashboard based on the reasoning output.

- Data and Dashboard Storage (Supabase): All user data files and generated dashboards are securely stored in Supabase, providing a reliable and scalable database solution for persistence and management.

# How It Works: A Simple 4-Step Process
Agent Dash streamlines dashboard creation into an intuitive, AI-powered workflow:

- Upload Data: You begin by uploading your data files (CSV, JSON, Excel, etc.).

- Provide a Prompt: You tell Agent Dash what kind of dashboard you want to create.

- AI Generation: The gemini-1.5-flash model reasons through your request, and the gemini-2.5-pro model generates the necessary code. A preview of the dashboard appears in the right-hand panel.

- Save and Manage: Once generated, the dashboard is saved to your account in Supabase, accessible from the "My Saved Dashboards" screen.

# Key Features
- AI-Powered Creation: Effortlessly create dashboards from data and simple text prompts.

- Intuitive UI: A clean and modern user interface powered by Dyad.

- Secure Storage: Your data and dashboards are securely managed with Supabase.

