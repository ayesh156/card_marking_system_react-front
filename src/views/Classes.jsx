import React from "react";
import { Button, Card, CardContent, Typography, Box } from "@mui/material";
import ClassesCard from "../components/ClassesCard";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const Classes = ({ onClassSelect }) => {
    const classes = [
        { image: "../../assets/english.png", title: "English" },
        { image: "../../assets/scholarship.png", title: "Scholarship" },
        { image: "../../assets/mathematics.png", title: "Mathematics" },
    ];
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("ACCESS_TOKEN"); // Remove the token
        Cookies.remove("userEmail"); // Remove the email cookie
        Cookies.remove("classSelected"); // Remove class selection cookie
        Cookies.remove("selectedClass"); // Remove selected class cookie
        navigate("/"); // Navigate to the login page
        window.location.reload(); // Reload the page to reset the state
    };

    return (
        <Box
            sx={{
                minHeight: "100vh", // Full height
                display: "flex", // Flexbox for centering
                flexDirection: "column", // Stack content vertically
                alignItems: "center", // Center horizontally
                justifyContent: "center", // Center vertically
                backgroundImage: `url("../../assets/classes-bg-image.png")`, // Replace with your background image URL
                backgroundSize: "cover", // Cover the entire background
                backgroundPosition: "center", // Center the background image
                position: "relative",
                "@media (max-width: 1200px)": {
                    paddingTop: 6, // Margin top for screens wider than 1200px
                    paddingBottom: 6, // Margin bottom for screens wider than 1200px
                },
            }}
        >

            {/* Logo */}
            <Box
                component="img"
                sx={{
                    height: 233,
                    width: 350,
                    maxHeight: { xs: 63 },
                    maxWidth: { xs: 63 },
                    borderRadius: "50%",
                }}
                alt="Logo"
                src="../../assets/logo.jpg"
            />

            {/* Title */}
            <Typography variant="h3" sx={{ color: "white", fontWeight: "semibold", marginBottom: 2, marginTop: 2 }}>
                What is the system used for?
            </Typography>

            <Typography
                variant="h6"
                sx={{
                    fontWeight: "semibold",
                    color: "white",
                    maxWidth: 400, // Fixed width
                    width: "90%",
                    wordWrap: "break-word", // Ensure long words break to the next line
                    overflow: "hidden", // Prevent content overflow
                    textAlign: "center", // Center text
                }}
            >
                With this option, the web system provides access to different main classes.
            </Typography>

            {/* Options */}
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: {
                        xs: "1fr", // 1 column for small screens
                        sm: "repeat(2, 1fr)", // 2 columns for medium screens
                        lg: "repeat(3, 1fr)", // 3 columns for large screens
                    },
                    gap: 3, // Spacing between grid items
                    marginBottom: 8,
                    marginTop: 10,
                }}
            >
                {classes.map((classItem) => (
                    <ClassesCard
                        key={classItem.title}
                        image={classItem.image}
                        title={classItem.title}
                        onClick={onClassSelect} // Pass the onClassSelect function
                    />
                ))}
            </Box>

            {/* Logout Button */}
            <Button
                variant="outlined"
                onClick={handleLogout}
                sx={{
                    backgroundColor: "transparent", // Transparent background
                    color: "#A8C7FA", // Text color
                    fontSize: "18px",
                    fontWeight: "bold",
                    textTransform: "capitalize",
                    paddingX: 8,
                    paddingY: 1,
                    borderRadius: 30, // Circular button
                    border: "2px solid #A8C7FA", // Border color
                    "&:hover": {
                        backgroundColor: "rgba(168, 199, 250, 0.1)", // Slight background on hover
                        borderColor: "#A8C7FA", // Keep border color on hover
                    },
                }}
            >
                Logout
            </Button>

        </Box>
    );
};

export default Classes;