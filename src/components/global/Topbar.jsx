import { Box, IconButton, Typography, useTheme, useMediaQuery } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ColorModeContext, tokens } from "../../theme.js";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import ChatOutlinedIcon from "@mui/icons-material/ChatOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import Cookies from "js-cookie";
import axiosClient from "../../../axios-client";

const userEmail = "zynergyedu@gmail.com"; // Replace with actual user email

const Topbar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const isSmallScreen = useMediaQuery("(max-width:768px)");
  const [selectedClass, setSelectedClass] = useState(null);

  // Retrieve selected class from Cookies
  useEffect(() => {
    const storedClass = Cookies.get("selectedClass"); // Get the selected class from cookies
    setSelectedClass(storedClass); // Set the selected class from cookies

    fetchUserMode();
  }, []);

  const fetchUserMode = async () => {
    try {
      const response = await axiosClient.get(`/mode/${userEmail}`);
      const mode = response.data.mode === "L" ? "light" : "dark";
      // console.log(mode);
      colorMode.setMode(mode); // <-- set mode using context
    } catch (error) {
      colorMode.setMode("dark"); // fallback
    } 
  };

  // Map selectedClass to full class name
  const getClassName = (classCode) => {
    switch (classCode) {
      case "E":
        return "English";
      case "S":
        return "Scholarship";
      case "M":
        return "Mathematics";
      default:
        return null; // Return null if no matching class
    }
  };


  // Handle theme toggle and save to backend
  const handleThemeToggle = () => {
    if (theme.palette.mode === "dark") {
      colorMode.setMode("light");
      axiosClient.put(`/mode/${userEmail}`, { mode: "L" });
    } else {
      colorMode.setMode("dark");
      axiosClient.put(`/mode/${userEmail}`, { mode: "D" });
    }
  };

  const className = getClassName(selectedClass);

  return (
    <Box
      display="flex"
      flexDirection={isSmallScreen ? "column" : "row"} // Column for mobile, row for desktop
      alignItems={isSmallScreen ? "center" : "flex-start"} // Center for mobile, left-align for desktop
      justifyContent="space-between"
      p={2}
    >
      {/* Selected Class Name */}
      {!isSmallScreen && (
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            color: colors.grey[100],
            textAlign: "left",
            wordWrap: "break-word",
            maxWidth: "300px", // Limit width for desktop
          }}
        >
          {className ? `${className} Class` : "No Class Selected"}
        </Typography>
      )}

      {/* ICONS */}
      <Box display="flex" gap={2} justifyContent="center" mb={isSmallScreen ? 2 : 0}>
        <IconButton onClick={handleThemeToggle}>
          {theme.palette.mode === "dark" ? (
            <DarkModeOutlinedIcon />
          ) : (
            <LightModeOutlinedIcon />
          )}
        </IconButton>
        <Link to="/history" style={{ textDecoration: "none" }}>
          <IconButton>
            <HistoryOutlinedIcon />
          </IconButton>
        </Link>
        <Link to="/message" style={{ textDecoration: "none" }}>
          <IconButton>
            <ChatOutlinedIcon />
          </IconButton>
        </Link>
        <Link to="/settings" style={{ textDecoration: "none" }}>
          <IconButton>
            <SettingsOutlinedIcon />
          </IconButton>
        </Link>
      </Box>

      {/* Selected Class Name for Mobile */}
      {isSmallScreen && (
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            color: colors.grey[100],
            textAlign: "center",
            wordWrap: "break-word",
            maxWidth: "100%", // Full width for mobile
          }}
        >
          {className ? `${className} Class` : "No Class Selected"}
        </Typography>
      )}
    </Box>
  );
};

export default Topbar;
