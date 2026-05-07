import { Component, type ErrorInfo, type ReactNode } from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import ErrorOutlineRounded from "@mui/icons-material/ErrorOutlineRounded";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            p: 2,
          }}
        >
          <Paper
            sx={{
              p: 6,
              maxWidth: 480,
              textAlign: "center",
              borderRadius: 3,
            }}
          >
            <ErrorOutlineRounded
              sx={{ fontSize: 64, color: "error.main", mb: 2 }}
            />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Algo salió mal
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ocurrió un error inesperado. Por favor intenta recargar la página.
            </Typography>
            {this.state.error && (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mb: 3,
                  p: 1.5,
                  bgcolor: "grey.100",
                  borderRadius: 1,
                  fontFamily: "monospace",
                  color: "error.main",
                  wordBreak: "break-all",
                }}
              >
                {this.state.error.message}
              </Typography>
            )}
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
              <Button variant="contained" onClick={this.handleGoHome}>
                Ir al inicio
              </Button>
              <Button variant="outlined" onClick={this.handleReset}>
                Intentar de nuevo
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
