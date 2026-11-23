
  import { createRoot } from "react-dom/client";
  import { PostHogProvider } from "posthog-js/react";
  import App from "./app/App.tsx";
  import { initAnalytics, posthog } from "./app/utils/analytics";
  import "./styles/index.css";

  initAnalytics();

  createRoot(document.getElementById("root")!).render(
    <PostHogProvider client={posthog}>
      <App />
    </PostHogProvider>
  );
