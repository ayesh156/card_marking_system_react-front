import { Box, useTheme } from "@mui/material";
import HashLoader from "react-spinners/HashLoader";
import { tokens } from "../theme";

function Loader() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box
      sx={{
        position: "relative",
        height: "80vh", // Full viewport height
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Rectangle box */}
      <Box
        sx={{
          position: "absolute",
          width: "200px",
          height: "150px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.primary[800], // White color for the box
          borderRadius: "10px",
          zIndex: 1, // Higher z-index to appear above the loader
        }}
      >
        <HashLoader size={100} color={colors.greenAccent[400]} />
      </Box>
      {/* HashLoader spinner */}
    </Box>
  );
}

export default Loader;
