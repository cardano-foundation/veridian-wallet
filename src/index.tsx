import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { App } from "./ui/App";
import reportWebVitals from "./reportWebVitals";
import "./i18n";
import { store } from "./store";
import { ConfigurationService } from "./core/configuration";
import { LoggerProvider } from "./ui/context/LoggerContext";

await new ConfigurationService().start();
const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <LoggerProvider>
    <Provider store={store}>
      <App />
    </Provider>
  </LoggerProvider>
);

reportWebVitals();
