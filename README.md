# Safr — AI Travel Safety Companion

**Safr** (currently piloted in Goa) is a comprehensive travel companion application designed with a core focus on safety, real-time AI intelligence, and accessibility. Whether you are traveling solo or in a group, Safr acts as your local guide and guardian, ensuring a seamless and secure experience.

## 🚀 Key Features

*   **Intelligent Place Exploration**
    *   Search and explore popular tourist destinations (beaches, monuments, nightlife).
    *   View real-time, AI-estimated crowd levels to avoid packed areas.
    *   Get smart alternative suggestions for crowded locations (e.g., "If Baga is 95% full, try this quieter beach 10 mins away").
    *   Access critical local rules, regulations, and safety warnings (e.g., recent accidents or rip-current warnings).
*   **Smart Routing (Safe vs. Fast)**
    *   Integrates mapping to provide routes to destinations.
    *   Offers a choice between the *fastest* route and the *safest* route, prioritizing well-lit, populated, or better-maintained roads.
*   **AI Itinerary Generator**
    *   Create personalized travel itineraries based on your interests (e.g., history, food, nightlife) and the duration of your stay.
*   **Family Safety & QR Tags**
    *   Dedicated safety features for children and the elderly.
    *   Generate printable QR codes containing emergency contact information. 
    *   If a dependent gets lost, anyone who scans their QR tag can instantly contact you.
*   **Emergency Hub**
    *   Quick, one-tap access to local emergency contacts (Police, Ambulance, Fire, Coast Guard).
*   **Universal Translator**
    *   Built-in website translator accessible from the navigation bar.
    *   Instantly translates the entire application into major Indian languages (Hindi, Marathi, Bengali, Telugu, etc.) breaking down language barriers for domestic tourists.

## 🛠️ Technology Stack

*   **Frontend Framework**: React 19, Vite, TypeScript
*   **Routing & State**: TanStack Router, TanStack Query
*   **Styling**: Tailwind CSS v4, Radix UI (Accessible components), Lucide Icons
*   **Authentication & Backend**: Supabase
*   **Internationalization**: Custom Google Translate Integration
*   **Mapping**: Leaflet
*   **Utilities**: Zod (schema validation), React Hook Form, date-fns

## 💻 Local Development Setup

To run this project locally, ensure you have Node.js installed (v18+ recommended).

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd goa-guide-buddy-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Ensure you have your Supabase credentials and any required AI API keys set up in a `.env` file at the root of the project.

4. **Start the development server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## 🤝 Contributing

This project is actively being developed. Feel free to open issues or submit pull requests with improvements, bug fixes, or new feature ideas.

## 📜 License

This project is proprietary and built for the Safr initiative.
