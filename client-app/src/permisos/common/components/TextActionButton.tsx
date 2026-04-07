import { Button } from "@mui/material";
import type { ReactNode } from "react";

type TextActionButtonProps = {
  label: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  color?: "primary" | "error" | "inherit";
};

const TextActionButton = ({
  label,
  onClick,
  disabled = false,
  color = "primary",
}: TextActionButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      color={color}
      sx={{
        textDecoration: "underline",
        textTransform: "none",
        minWidth: "auto",
        px: 0,
        py: 0.5,
        fontSize: "0.875rem",
        "&:hover": {
          backgroundColor: "transparent",
          textDecoration: "underline",
        },
      }}
    >
      {label}
    </Button>
  );
};

export default TextActionButton;
