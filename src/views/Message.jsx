import { Typography, Box, useTheme, Button, TextField, useMediaQuery, IconButton } from "@mui/material";
import { tokens } from "../theme";
import KeyboardArrowLeftOutlinedIcon from "@mui/icons-material/KeyboardArrowLeftOutlined";
import { Formik } from "formik";
import { useState } from "react";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import axiosClient from "../../axios-client";
import ToastNotification from "../components/ToastNotification";
import { ToastContainer } from "react-toastify";

const customerSchema = yup.object().shape({
    enteredMessage: yup
        .string()
        .required("Message is required"),
});


const Message = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isNonMobile = useMediaQuery("(min-width:800px)");
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const initialFormValues = {
        enteredMessage: "",
    };

    const handleFormSubmit = async (values, { resetForm }) => {
        setIsLoading(true);

        const payload = {
            message: values.enteredMessage,
        };

        axiosClient.post('/send-whatsapp-messages', payload)
            .then((response) => {
                // Handle success response
                // const data = response.data;
                // console.log("Message sent successfully:", data);

                ToastNotification("Messages sent successfully!", "success", theme.palette.mode);

                // Reset the form after successful submission
                resetForm();
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
                    // Handle error response
                    console.error("Error sending message:", error);
                    ToastNotification("Failed to send messages.", "error", theme.palette.mode);
                }

            })
            .finally(() => {
                // Stop the loading spinner
                setIsLoading(false);
            });

    };

    return (
        <Box m="20px">
            <ToastContainer />
            <Button
                sx={{ display: "flex", alignItems: "center" }}
                color="inherit"
                onClick={() => {
                    navigate(-1);
                }}
            >
                <KeyboardArrowLeftOutlinedIcon sx={{ fontSize: "35px" }} />
                <Typography
                    variant="h3"
                    fontWeight="bold"
                    textTransform={"capitalize"}
                    color={colors.grey[100]}
                >
                    Message
                </Typography>
            </Button>
            <Formik
                initialValues={initialFormValues}
                enableReinitialize
                validationSchema={customerSchema}
                onSubmit={handleFormSubmit}
            >
                {({ values, handleBlur, handleChange, handleSubmit, resetForm }) => (
                    <form onSubmit={handleSubmit}>
                        <Box
                            display="grid"
                            gap="30px"
                            gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                            sx={{
                                mt: 5,
                                gridColumn: "span 4",
                                marginX: isNonMobile ? "15vw" : undefined,
                            }}
                        >

                            <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="Enter Message Template Name"
                                name="enteredMessage"
                                multiline
                                rows={3}
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={values.enteredMessage}
                                sx={{
                                    gridColumn: "span 4",
                                    "& .MuiInputBase-root": {
                                        backgroundColor: colors.primary[400],
                                    },
                                    "& .MuiInputBase-root.Mui-hovered": {
                                        backgroundColor: colors.primary[400],
                                    },
                                    "& .MuiInputBase-root.Mui-focused": {
                                        backgroundColor: colors.primary[400],
                                    },
                                    "& .MuiInputLabel-root.Mui-focused": {
                                        color: colors.primary[100],
                                    },
                                }}
                            />

                            <Box
                                sx={{
                                    display: "flex",
                                    gap: "15px",
                                    justifyContent: "flex-end",
                                    gridColumn: "span 4",
                                    marginTop: "15px",
                                    "@media (max-width: 767px)": {
                                        flexDirection: "column",
                                        alignItems: "stretch",
                                    },
                                }}
                            >
                                <Button
                                    endIcon={<RefreshOutlinedIcon />}
                                    variant="contained"
                                    onClick={() => {
                                        resetForm(); // Use Formik's resetForm to clear the form
                                    }}
                                    sx={{
                                        gridColumn: "span 4",
                                        marginTop: "15px",
                                        textTransform: "capitalize",
                                        color: colors.grey[100],
                                        fontSize: "17px",
                                        fontWeight: "500",
                                        paddingY: "10px",
                                        backgroundColor: colors.redAccent[500],
                                        "&:hover": {
                                            backgroundColor: colors.redAccent[600],
                                        },
                                        width: "120px", // Fixed width for larger screens
                                        justifySelf: "flex-end", // Right align the button
                                        "@media (max-width: 767px)": {
                                            width: "100%", // Full width for screens smaller than 767px
                                            justifySelf: "stretch", // Ensure the button stretches to full width
                                        },
                                    }}
                                >
                                    Clear
                                </Button>

                                <Button
                                    endIcon={<SendOutlinedIcon />}
                                    variant="contained"
                                    type="submit"
                                    loading={isLoading}
                                    sx={{
                                        gridColumn: "span 4",
                                        marginTop: "15px",
                                        textTransform: "capitalize",
                                        color: colors.grey[100],
                                        fontSize: "17px",
                                        fontWeight: "500",
                                        paddingY: "10px",
                                        backgroundColor: colors.blueAccent[700],
                                        "&:hover": {
                                            backgroundColor: colors.blueAccent[600],
                                        },
                                        width: "150px", // Fixed width for larger screens
                                        justifySelf: "flex-end", // Right align the button
                                        "@media (max-width: 767px)": {
                                            marginTop: "5px",
                                            width: "100%", // Full width for screens smaller than 767px
                                            justifySelf: "stretch", // Ensure the button stretches to full width
                                        },
                                    }}
                                >
                                    Send All
                                </Button>
                            </Box>
                        </Box>
                    </form>
                )}
            </Formik>
        </Box>
    );
};

export default Message;
