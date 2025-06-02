import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";

const ClassesCard = ({ image, title, onClick }) => {
    return (
        <Card
            onClick={() => onClick(title.charAt(0))} 
            sx={{
                width: 193, // Set card width
                height: 212, // Set card height
                backgroundColor: "transparent", // Transparent background
                border: "1px solid white", // White border
                borderRadius: 2, // Rounded corners
                display: "flex", // Flexbox for centering content
                flexDirection: "column", // Stack content vertically
                alignItems: "center", // Center horizontally
                justifyContent: "center", // Center vertically
                boxShadow: 3, // Add shadow
                cursor: "pointer", // Add pointer cursor on hover
                transition: "background-color 0.3s", // Smooth hover effect
                "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)", // Slight background change on hover
                },
            }}
        >
            <CardContent sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Box
                    component="img"
                    sx={{
                        height: 87, // Adjust image height
                        width: 87, // Adjust image width
                        borderRadius: "50%", // Circular image
                        marginBottom: "1.8rem",
                    }}
                    alt={title}
                    src={image}
                />
                <Typography variant="h6" sx={{ color: "white", fontSize: "16px", fontWeight: "semibold" }}>
                    {title}
                </Typography>
            </CardContent>
        </Card>
    );
};

export default ClassesCard;