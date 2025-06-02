import * as React from "react";
import { useContext, useState } from "react"; // Add this import
import {
    Box,
    Button,
    IconButton,
    TextField,
    useMediaQuery,
    useTheme,
    InputAdornment,
    FormControlLabel,
    Checkbox,
    Typography,
} from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import { ColorModeContext, tokens } from "../theme.js";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useEffect } from "react";
import Cookies from "js-cookie";
import axiosClient from "../../axios-client.js"; // Import axios client
import ToastNotification from "../components/ToastNotification.jsx";
import { ToastContainer } from "react-toastify";

const userSchemaIn = yup.object().shape({
    email: yup.string().email("invalid email").required("required"),
    password: yup.string().required("required"),
});


const SignIn = ({ onLogin }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const themeMode = theme.palette.mode === "dark" ? "dark" : "light";
    const colorMode = useContext(ColorModeContext);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [initialValuesSignIn, setInitialValuesSignIn] = useState({
        email: "",
        password: "",
    });


    // Load user data from localStorage on component mount
    useEffect(() => {
        const savedEmail = Cookies.get("rememberedEmail");
        const savedPassword = Cookies.get("rememberedPassword");
        if (savedEmail && savedPassword) {
            setInitialValuesSignIn({
                email: savedEmail,
                password: savedPassword,
            });
            setRememberMe(true); // Set the checkbox to checked      
        }
    }, []);

    const handleTogglePassword = () => {
        setShowPassword((prevShowPassword) => !prevShowPassword);
    };

    const handleFormSubmitSignIn = async (values) => {
        if (rememberMe) {
            // Save email and password to localStorage
            Cookies.set("rememberedEmail", values.email, { expires: 30 });
            Cookies.set("rememberedPassword", values.password, { expires: 30 });
        } else {
            // Clear email and password from localStorage
            Cookies.remove("rememberedEmail");
            Cookies.remove("rememberedPassword");
        }

        // Simulate login
        setIsLoading(true);

        try {
            const response = await axiosClient.post("/login", {
                email: values.email,
                password: values.password,
            });

            const { token, user } = response.data;

            // Save the token in localStorage
            localStorage.setItem("ACCESS_TOKEN", token);

            onLogin(user.email);
        } catch (error) {
            ToastNotification(error.response?.data?.message, "error", themeMode); // Log the error details
            console.error(
                error.response?.data?.message || "Login failed. Please try again.",
                "error",
                theme.palette.mode
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleRememberMeChange = (event) => {
        const isChecked = event.target.checked;
        setRememberMe(isChecked);
    };


    return (
        <Box
            sx={{
                backgroundImage: 'url("../../assets/login-bg.png")',
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                // Add other styles as needed
            }}
            display="flex"
            alignItems="center"
            justifyContent="center"
            height="100vh" // Optionally, if you want to center vertically
        >
            <ToastContainer />
            <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                sx={{
                    backgroundColor:
                        theme.palette.mode === "dark" ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.3)",
                }}
            />

            <Box
                p="50px"
                sx={{
                    background: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.5)",
                    borderRadius: "10px",
                    backdropFilter: "blur(5px)",
                    boxShadow: "0 25px 45px rgba(0, 0, 0, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.5",
                    borderRight: "1px solid rgba(255, 255, 255, 0.2",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.2",
                }}
            >
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    mt="10px"
                    mb="30px"
                >
                    <Typography
                        variant="h2"
                        color={colors.grey[100]}
                        fontWeight="bold"
                        sx={{ mb: "5px" }}
                        textTransform={"capitalize"}
                    >
                        Welcome back!
                    </Typography>
                    <Box position="absolute" top={0} right={0}>
                        <IconButton onClick={colorMode.toggleColorMode}>
                            {theme.palette.mode === "dark" ? (
                                <LightModeOutlinedIcon />
                            ) : (
                                <DarkModeOutlinedIcon color="#00ffff" />
                            )}
                        </IconButton>
                    </Box>
                </Box>
                <Formik
                    onSubmit={handleFormSubmitSignIn}
                    initialValues={initialValuesSignIn}
                    enableReinitialize
                    validationSchema={userSchemaIn}
                >
                    {({
                        values,
                        errors,
                        touched,
                        handleBlur,
                        handleChange,
                        handleSubmit,
                    }) => (
                        <form onSubmit={handleSubmit}>
                            <Box>
                                <TextField
                                    fullWidth
                                    variant="filled"
                                    type="text"
                                    label="Email"
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                    value={values.email}
                                    name="email"
                                    error={!!touched.email && !!errors.email}
                                    helperText={touched.email && errors.email}
                                    sx={{
                                        "& .MuiInputLabel-root.Mui-focused": {
                                            color: colors.primary[100], // Change focus color here
                                        },
                                    }}
                                />
                                <TextField
                                    fullWidth
                                    variant="filled"
                                    type={showPassword ? "password" : "text"}
                                    label="Password"
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                    value={values.password}
                                    name="password"
                                    error={!!touched.password && !!errors.password}
                                    helperText={touched.password && errors.password}
                                    sx={{
                                        marginTop: "20px",
                                        "& .MuiInputLabel-root.Mui-focused": {
                                            color: colors.primary[100],
                                        },
                                    }}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={handleTogglePassword} edge="end">
                                                    {showPassword ? (
                                                        <VisibilityIcon />
                                                    ) : (
                                                        <VisibilityOffIcon />
                                                    )}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Box>

                            <Box display="flex" flexDirection="column" justifyContent="center">
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={rememberMe}
                                            style={{
                                                color: colors.primary[100],
                                            }}
                                            sx={{ "& .MuiSvgIcon-root": { fontSize: 18 } }}
                                            onChange={handleRememberMeChange}
                                        />
                                    }
                                    sx={{
                                        marginTop: 1,
                                        marginBottom: 1,
                                        color: colors.primary[100], // Replace 'customColor' with the color you desire
                                    }}
                                    label="Remember me"
                                />
                                <Button
                                    loading={isLoading} // Pass loading state to LoadingButton
                                    loadingPosition="start"
                                    type="submit"
                                    fullWidth
                                    sx={{
                                        textTransform: "capitalize",
                                        backgroundColor: colors.blueAccent[700],
                                        color: colors.grey[100],
                                        fontSize: "17px",
                                        fontWeight: "500",
                                        paddingY: "10px",
                                        "&:hover": {
                                            backgroundColor: colors.blueAccent[800],
                                        },
                                    }}
                                >
                                    Login
                                </Button>
                            </Box>

                        </form>
                    )}
                </Formik>
            </Box>
        </Box>
    );
};

export default SignIn;
