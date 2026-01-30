import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router";
import { useKERIAuth } from "../AuthContext";
import { Box, CircularProgress, Typography } from "@mui/material";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const { isAuthorized, aid, loading, extensionId } = useKERIAuth();

  useEffect(() => {
    // Wait for extension check to complete (extensionId won't be null anymore)
    if (extensionId === null) {
      return; // Still checking for extension
    }

    // If not authorized after check is complete, redirect to auth page
    if (!isAuthorized || !aid) {
      navigate("/auth");
    }
  }, [isAuthorized, aid, extensionId, navigate]);

  // Show loading while checking extension
  if (extensionId === null || loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 2,
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="body1" color="textSecondary">
          Checking authorization...
        </Typography>
      </Box>
    );
  }

  // If not authorized, don't render children (will redirect in useEffect)
  if (!isAuthorized || !aid) {
    return null;
  }

  // User is authorized, render the protected content
  return <>{children}</>;
};

export { ProtectedRoute };

