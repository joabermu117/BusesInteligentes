import { Box, type BoxProps, Typography } from "@mui/material";
import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  containerProps?: BoxProps;
};

const PageHeader = ({ title, subtitle, actions, containerProps }: PageHeaderProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", md: "center" },
        gap: 2,
        mb: 3,
      }}
      {...containerProps}
    >
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>

      {actions ? <Box>{actions}</Box> : null}
    </Box>
  );
};

export default PageHeader;
