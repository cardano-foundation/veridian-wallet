import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import { CheckCircleOutline, Close, WarningAmber } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { closeSnackbar, SnackbarProvider } from "notistack";
import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { RoutePath } from "./const/route";
import { Layout } from "./layouts/Layout";
import { ConnectionDetails } from "./pages/ConnectionDetails/ConnectionDetails";
import { Connections } from "./pages/Connections";
import { Credentials } from "./pages/Credentials";
import { NoPage } from "./pages/NoPage";
import { Notifications } from "./pages/Notifications";
import { Settings } from "./pages/Settings";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import {
  fetchContactCredentials,
  fetchContacts,
} from "./store/reducers/connectionsSlice";
import "./styles/colors.scss";
import { theme } from "./theme/theme"; // Import the theme
import { CredentialDetails } from "./pages/CredentialDetails";
import { RequestPresentation } from "./pages/RequestPresentation";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { fetchSchemas } from "./store/reducers/schemasSlice";
import { ReduxError } from "./components/ReduxError/ReduxError";

const App = () => {
  const MAX_TOAST_MESSAGES = 10;
  const TOAST_MESSAGE_DURATION = 2000;

  const dispatch = useAppDispatch();
  const contacts = useAppSelector((state) => state.connections.contacts);

  useEffect(() => {
    dispatch(fetchContacts());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchSchemas());
  }, [dispatch]);

  useEffect(() => {
    contacts.forEach((contact) => {
      dispatch(fetchContactCredentials(contact.id));
    });
  }, [contacts, dispatch]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider
          maxSnack={MAX_TOAST_MESSAGES}
          autoHideDuration={TOAST_MESSAGE_DURATION}
          iconVariant={{
            success: <CheckCircleOutline />,
            error: <WarningAmber />,
          }}
          action={(snackbarId) => (
            <IconButton
              aria-label="actions"
              onClick={() => closeSnackbar(snackbarId)}
            >
              <Close />
            </IconButton>
          )}
        >
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={<Layout />}
              >
                {/* TODO: Bring back when we're ready to ship Overview */}
                {/* <Route
                index
                element={<Overview />}
              /> */}
                <Route
                  index
                  //path={RoutePath.Connections}
                  element={<Connections />}
                />
                <Route
                  path={RoutePath.ConnectionDetails}
                  element={<ConnectionDetails />}
                />
                <Route
                  path={RoutePath.Credentials}
                  element={<Credentials />}
                />
                <Route
                  path={RoutePath.CredentialDetails}
                  element={<CredentialDetails />}
                />
                <Route
                  path={RoutePath.Credentials}
                  element={<Credentials />}
                />
                <Route
                  path={RoutePath.Notifications}
                  element={<Notifications />}
                />
                <Route
                  path={RoutePath.Settings}
                  element={<Settings />}
                />
                <Route
                  path={RoutePath.RequestPresentation}
                  element={<RequestPresentation />}
                />
                <Route
                  path="*"
                  element={<NoPage />}
                />
              </Route>
            </Routes>
          </BrowserRouter>
        </SnackbarProvider>
      </ThemeProvider>
      <ReduxError />
    </LocalizationProvider>
  );
};

export { App };
