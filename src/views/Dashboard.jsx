import { Typography, Box, useTheme, Paper } from "@mui/material";
import { tokens } from "../theme";
import Header from "../components/Header";
import { useEffect, useState } from "react";
import StatsCard from "../components/StatsCard";
import SchoolIcon from '@mui/icons-material/School';
import Cookies from "js-cookie";
import axiosClient from "../../axios-client";
import ToastNotification from "../components/ToastNotification.jsx";
import { ToastContainer } from "react-toastify";

const Dashboard = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [currentDate, setCurrentDate] = useState("");
    const [selectedClass, setSelectedClass] = useState(null);
    const [dashboardData, setDashboardData] = useState([]);

    useEffect(() => {
        // Format the current date
        const date = new Date();
        const formattedDate = `${date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "2-digit",
        })} - ${date.toLocaleDateString("en-US", { weekday: "long" })}`;
        setCurrentDate(formattedDate);

        // Get the selected class from cookies
        const storedClass = Cookies.get("selectedClass");

        // Fetch dashboard data from the backend
        if (storedClass) {
            axiosClient
                .post("/get-dashboard-data", { selectedClass: storedClass })
                .then((response) => {
                    setDashboardData(response.data.data);
                })
                .catch((error) => {
                    console.error("Error fetching dashboard data:", error);
                });
        }

        const userEmail = Cookies.get("userEmail");

        // Fetch payment reminders
        if (userEmail) {
            axiosClient
                .get("/send-payment-reminders", {
                    params: {
                        email: userEmail, // Pass the userEmail as a query parameter
                    },
                })
                .then((reminderResponse) => {
                    const message = reminderResponse.data.message

                    // Show toast notification only if the message is not "no"
                    if (message !== "no") {
                        // ToastNotification(message, "success", theme.palette.mode);
                    }
                })
                .catch((error) => {


                    // Show a toast notification for internet connection error
                    if (!navigator.onLine) {
                        ToastNotification(
                            "No internet connection. Please check your connection and try again.",
                            "error",
                            theme.palette.mode
                        );
                    } else {
                        console.error("Error fetching payment reminders:", error);
                    }

                });
        }

    }, []);

    const formatGrade = (grade) => {
        // Matches "Grade 1a" or "Grade 10b" etc. and converts to "Grade 1 - A"
        return grade.replace(/^Grade\s*(\d{1,2})([a-zA-Z])$/i, (match, num, letter) => {
            return `Grade ${num} - ${letter.toUpperCase()}`;
        });
    };



    return (
        <Box m="20px">
            <ToastContainer />
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "100px",
                    flexWrap: "wrap", // Ensures wrapping on smaller screens
                    "@media (max-width: 950px)": {
                        flexDirection: "column", // Stack elements on small screens
                        gap: "0", // Reduce gap for better spacing
                    },
                }}
            >
                <Header
                    title="Dashboard"
                    subtitle="Welcome to your dashboard."
                />
                <Typography
                    variant="h2"
                    color={colors.grey[100]}
                    fontWeight="bold"
                    sx={{
                        mb: "5px",
                        textAlign: { xs: "right", md: "left" }, // Right on mobile, left on desktop
                        "@media (max-width: 767px)": {
                            fontSize: "24px",
                        },
                    }}
                    textTransform={"capitalize"}
                >
                    {currentDate}
                </Typography>
            </Box>
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    mb: 2
                }}
            >

                {dashboardData.map((item) => (
                    <Box
                        key={item.id}
                        sx={{
                            flexBasis: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(25% - 12px)' },
                            flexGrow: 1
                        }}
                    >
                        <StatsCard
                            title={item.category}
                            value={formatGrade(item.grade)}
                            subtext={`Students: ${item.student_count}`}
                            icon={<SchoolIcon />}
                            color={colors.greenAccent[400]}
                        />
                    </Box>
                ))}

            </Box>
        </Box>

    );
};

export default Dashboard;
