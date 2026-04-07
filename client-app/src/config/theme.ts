import {
  alpha,
  createTheme,
  responsiveFontSizes,
  type ThemeOptions,
} from "@mui/material/styles";

const baseThemeOptions: ThemeOptions = {
  palette: {
    mode: "light",
    primary: {
      main: "#0b4f7d",
      dark: "#083a5d",
      light: "#2b6f9f",
      contrastText: "#f5fbff",
    },
    secondary: {
      main: "#f59e0b",
      dark: "#c27b08",
      light: "#f7b23f",
    },
    success: {
      main: "#0f8d74",
      dark: "#0b6a57",
      light: "#1fa98b",
    },
    background: {
      default: "#eef4f8",
      paper: "#ffffff",
    },
    text: {
      primary: "#122033",
      secondary: "#55657a",
    },
    divider: "#d9e3ec",
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: '"Manrope", "Segoe UI", sans-serif',
    h1: {
      fontFamily: '"Sora", "Manrope", sans-serif',
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontFamily: '"Sora", "Manrope", sans-serif',
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h3: {
      fontFamily: '"Sora", "Manrope", sans-serif',
      fontWeight: 700,
      letterSpacing: "-0.015em",
    },
    h4: {
      fontFamily: '"Sora", "Manrope", sans-serif',
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
      letterSpacing: "0.01em",
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: "1px solid #d9e3ec",
          boxShadow: "0 14px 34px rgba(11, 37, 64, 0.09)",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 16,
          minHeight: 40,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid #d9e3ec",
        },
        head: {
          color: "#122033",
          fontWeight: 700,
          background: "#f4f8fc",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 18,
          boxShadow: "0 28px 58px rgba(15, 23, 42, 0.24)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "radial-gradient(1150px 520px at 102% -90px, rgba(11, 79, 125, 0.2), transparent 43%), radial-gradient(880px 380px at -3% -130px, rgba(245, 158, 11, 0.16), transparent 40%), #eef4f8",
        },
        "*::-webkit-scrollbar": {
          width: 10,
          height: 10,
        },
        "*::-webkit-scrollbar-thumb": {
          borderRadius: 999,
          border: "2px solid transparent",
          backgroundClip: "padding-box",
          backgroundColor: alpha("#64748b", 0.45),
        },
      },
    },
  },
};

const appTheme = responsiveFontSizes(createTheme(baseThemeOptions));

export default appTheme;
