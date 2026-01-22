import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
import "./styles/main.scss";
import { App } from "./App";
import { KERIAuthProvider } from "./components/AuthContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <KERIAuthProvider>
        <App />
      </KERIAuthProvider>
    </Provider>
  </StrictMode>
);
