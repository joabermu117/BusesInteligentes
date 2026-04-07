import { Box, CircularProgress, Typography } from "@mui/material";

const Loader = ({ message = "Cargando información..." }: { message?: string }) => {
  return (
    <Box
      sx={{
        minHeight: 240,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        py: 6,
      }}
    >
      <Box>
        <CircularProgress size={42} thickness={4.2} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {message}
        </Typography>
      </Box>
    </Box>
  );
};

export default Loader;
  