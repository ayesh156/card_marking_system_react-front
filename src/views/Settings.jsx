import { Typography, Select, Box, useTheme, Button, TextField, useMediaQuery, IconButton, FormControl, InputLabel, MenuItem } from "@mui/material";
import { tokens } from "../theme";
import KeyboardArrowLeftOutlinedIcon from "@mui/icons-material/KeyboardArrowLeftOutlined";
import { Formik } from "formik";
import { useEffect, useRef, useState } from "react";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import SaveIcon from "@mui/icons-material/Save";
import ClearIcon from "@mui/icons-material/Clear";
import PeopleIcon from '@mui/icons-material/People';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import StatsCard from "../components/StatsCard";
import Cookies from "js-cookie";
import { useMemo } from "react";
import axiosClient from "../../axios-client";
import { ToastContainer } from "react-toastify";
import ToastNotification from "../components/ToastNotification.jsx";
import CircularProgress, {
    circularProgressClasses,
} from '@mui/material/CircularProgress';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const customerSchema = yup.object().shape({
    name: yup
        .string()
        .required("Name is required"),
    email: yup
        .string()
        .required("Email is required")
});

// Custom Circular Progress
function FacebookCircularProgress(props) {
    return (
        <Box sx={{ position: "relative" }}>
            <CircularProgress
                variant="determinate"
                sx={(theme) => ({
                    color: theme.palette.grey[200],
                    ...(theme.palette.mode === "dark" && {
                        color: theme.palette.grey[800],
                    }),
                })}
                size={60}
                thickness={4}
                {...props}
                value={100}
            />
            <CircularProgress
                variant="indeterminate"
                disableShrink
                sx={(theme) => ({
                    color: "#1a90ff",
                    animationDuration: "550ms",
                    position: "absolute",
                    left: 0,
                    [`& .${circularProgressClasses.circle}`]: {
                        strokeLinecap: "round",
                    },
                    ...(theme.palette.mode === "dark" && {
                        color: "#308fe8",
                    }),
                })}
                size={60}
                thickness={4}
                {...props}
            />
        </Box>
    );
}

const Settings = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isNonMobile = useMediaQuery("(min-width:800px)");
    const navigate = useNavigate();
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [fileName, setFileName] = useState("No selected file");
    const [selectedImage, setSelectedImage] = useState(null);
    const [initialFormValues, setInitialFormValues] = useState({
        name: "",
        email: "",
        beforePaymentWeek3: "",
        beforePaymentWeek4: "",
        afterPaymentTemplate: "",
        afterSpokenPaymentTemplate: "",
        afterGroupPaymentTemplate: "",
    });
    const [grades, setGrades] = useState([]); // Grades for the "Grade" dropdown
    const [selectedGrade, setSelectedGrade] = useState(""); // Initialize to empty string
    const [days, setDays] = useState([
        { value: 1, label: "Monday" },
        { value: 2, label: "Tuesday" },
        { value: 3, label: "Wednesday" },
        { value: 4, label: "Thursday" },
        { value: 5, label: "Friday" },
        { value: 6, label: "Saturday" },
        { value: 7, label: "Sunday" },
    ]); // Days of the week
    const [selectedDay, setSelectedDay] = useState(""); // Selected day
    const hasGradeSet = useRef(false); // Ref to track if grades have been set
    const [selectedClass, setSelectedClass] = useState(Cookies.get("selectedClass") || ""); // Selected class
    const [userEmail, setUserEmail] = useState(Cookies.get("userEmail") || ""); // Selected class
    const [selectedUser, setSelectedUser] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [users, setUsers] = useState([]);
    const [totalActiveStudents, setTotalActiveStudents] = useState(0);
    const [totalPaidStudents, setTotalPaidStudents] = useState(0);
    const [templateFields, setTemplateFields] = useState([]);
    const [selectedTemplateKey, setSelectedTemplateKey] = useState("");

    // Function to fetch day_id from backend
    const fetchGrades = async () => {
        try {
            const response = await axiosClient.post("/gradesAndDays", {
                selectedClass, // Send the selected class ID
            });

            const gradesData = response.data.data || []; // Use the 'data' key from the backend response
            // console.log("Grades data:", gradesData); // Log the grades data for debugging

            // Update the grades dropdown options
            setGrades(gradesData);

            // Check if the current selectedGrade exists in the updated grades list
            const currentGradeExists = gradesData.some((grade) => grade.id === selectedGrade);

            if (currentGradeExists) {
                // If the current selectedGrade exists, retain it
                const currentGradeData = gradesData.find((grade) => grade.id === selectedGrade);
                setSelectedDay(currentGradeData.day_id || ""); // Update the day_id for the current grade
            } else if (gradesData.length > 0) {
                // If the current selectedGrade doesn't exist, select the first grade
                setSelectedGrade(gradesData[0].id || ""); // Set the first grade's ID
                setSelectedDay(gradesData[0].day_id || ""); // Set the first grade's day_id
            } else {
                // Reset if no grades are available
                setSelectedGrade("");
                setSelectedDay("");
            }
        } catch (error) {
            console.error("Error fetching grades:", error);
            setGrades([]); // Reset grades on error
            setSelectedGrade(""); // Reset grade on error
            setSelectedDay(""); // Reset day on error
        }
    };

    // Fetch all users if logged-in user is admin
    useEffect(() => {
        if (userEmail === "admin@gmail.com") {
            axiosClient.get("/users")
                .then((response) => {
                    const usersData = response.data.data || [];
                    // Map users to include status as "enable" or "disable"
                    const mappedUsers = usersData.map((user) => ({
                        ...user,
                        statusText: user.status === 0 ? "disable" : "enable",
                    }));

                    setUsers(mappedUsers);

                    // Auto-select the first user and their status
                    if (usersData.length > 0) {
                        setSelectedUser(mappedUsers[0].email); // Select the first user's email
                        setSelectedStatus(mappedUsers[0].statusText); // Select the first user's status
                    }
                })
                .catch((error) => {
                    console.error("Error fetching users:", error);
                    setUsers([]); // Reset users to an empty array on error
                });
        }
    }, [userEmail]);



    // Fetch grades on page load
    useEffect(() => {
        fetchGrades();
    }, [selectedClass]);

    useEffect(() => {
        if (selectedClass) {
            // Fetch total active students and paid students for this month, filtered by selectedClass
            axiosClient
                .post("/dashboard-stats", { selectedClass: selectedClass })
                .then((res) => {
                    setTotalActiveStudents(res.data.totalActiveStudents);
                    setTotalPaidStudents(res.data.totalPaidStudents);
                })
                .catch((err) => {
                    console.error("Error fetching dashboard stats:", err);
                });
        }

        // Replace with the actual user's email (from auth or route)
        axiosClient.get(`/users/${userEmail}`)
            .then(res => {
                const user = res.data;
                setInitialFormValues({
                    name: user.name || "",
                    email: user.email || "",
                    beforePaymentWeek3: user.before_payment_week3 || "",
                    beforePaymentWeek4: user.before_payment_week4 || "",
                    afterPaymentTemplate: user.after_payment_template || "",
                    afterSpokenPaymentTemplate: user.after_payment_spoken_template || "",
                    afterGroupPaymentTemplate: user.after_payment_group_template || "",
                });
                // Extract template fields
                const templates = Object.keys(user)
                    .filter(key => /^after_payment_(nursery|grade\d+)_template$/.test(key))
                    .map(key => ({ key, value: user[key] || "" }));
                setTemplateFields(templates);
                if (templates.length > 0) setSelectedTemplateKey(templates[0].key);
                if (user.image_path) {
                    setSelectedImage(`${API_BASE_URL}/storage/${user.image_path}`);
                }
            })
            .catch(err => {
                console.error("Failed to load user:", err);
            })
            .finally(() => {
                setIsPageLoading(false); // loading done
            });
    }, []);

    const handleFormSubmit = async (values) => {

        setIsLoading(true); // Set loading state to true

        // Merge templateFields into the payload
        const templatePayload = templateFields.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        // Construct the payload as a plain object
        const payload = {
            name: values.name,
            email: values.email,
            beforePaymentWeek3: values.beforePaymentWeek3,
            beforePaymentWeek4: values.beforePaymentWeek4,
            afterPaymentTemplate: values.afterPaymentTemplate,
            afterSpokenPaymentTemplate: values.afterSpokenPaymentTemplate,
            afterGroupPaymentTemplate: values.afterGroupPaymentTemplate,
            status: true, // Default status
            mode: 'A', // Example mode
            image: selectedImage, // Include the image as a base64 string if needed
            ...templatePayload,
        };

        // console.log(payload); 

        try {
            // Send the payload to the backend
            await axiosClient.put(`/users/${values.email}`, payload, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        } catch (error) {
            console.error('Error saving user:', error);
            ToastNotification("An error occurred while saving the user. Please try again.", "error", theme.palette.mode);
        }

        try {
            // Send the grade ID and day ID to the backend
            await axiosClient.post("/update-day", {
                id: selectedGrade, // Send the selected grade ID
                day_id: selectedDay,    // Send the selected day ID
            });

        } catch (error) {
            console.error("Error updating day:", error);
            ToastNotification("An error occurred while updating the day. Please try again.", "error", theme.palette.mode);
        } finally {
            setIsLoading(false); // Set loading state to false
            fetchGrades();
        }

        if (userEmail === "admin@gmail.com") {
            if (!selectedUser || !selectedStatus) {
                ToastNotification("Please select a user and status.", "error");
                return;
            }

            axiosClient.put(`/users/${selectedUser}/status`, { status: selectedStatus === "enable" ? 1 : 0 })
                .then(() => {
                    ToastNotification("User status updated successfully.", "success");
                })
                .catch((error) => {
                    console.error("Error updating user status:", error);
                    ToastNotification("Failed to update user status.", "error");
                });
        }

        ToastNotification("Setting Updated Successfully", "success", theme.palette.mode);
    };

    const selectImage = (event, setFieldValue) => {
        const file = event.currentTarget.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFieldValue("image", reader.result);
                setSelectedImage(reader.result);
                setFileName(file.name);
            };
            reader.readAsDataURL(file);
        }
    };

    if (isPageLoading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="100vh"
            >
                {/* Use the custom circular progress */}
                <FacebookCircularProgress />
            </Box>
        );
    }


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
                    Settings
                </Typography>
            </Button>
            {/* Stats Cards - Using Flexbox instead of Grid */}
            <Box
                display="grid"
                gap="30px"
                gridTemplateColumns={{
                    xs: "repeat(1, 1fr)", // 1 column for small screens
                    sm: "repeat(2, minmax(0, 1fr))"
                }}
                sx={{
                    mt: 5,
                    gridColumn: "span 4",
                    marginX: isNonMobile ? "15vw" : undefined,
                }}
            >
                <Box >
                    <StatsCard
                        title="Total Students"
                        value={totalActiveStudents}
                        subtext="All active students"
                        icon={<PeopleIcon />}
                        color={colors.blueAccent[400]}
                    />
                </Box>
                <Box >
                    <StatsCard
                        title="Paid Students"
                        value={totalPaidStudents}
                        subtext="Students who paid this month"
                        icon={<PaidOutlinedIcon />}
                        color={colors.redAccent[400]}
                    />
                </Box>
            </Box>
            <Formik
                initialValues={initialFormValues}
                enableReinitialize
                validationSchema={customerSchema}
                onSubmit={handleFormSubmit}
            >
                {({ values, errors, touched, handleBlur, handleChange, handleSubmit, setFieldValue, resetForm, isValid }) => (
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
                            <Box
                                sx={{
                                    gridColumn: "span 4",
                                    position: "relative",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                            >
                                {selectedImage ? (
                                    <IconButton
                                        sx={{ position: "absolute", top: -35, right: isNonMobile ? 35 : 0 }}
                                        onClick={() => {
                                            setFileName("No selected file");
                                            setSelectedImage(null);
                                        }}
                                    >
                                        <ClearIcon
                                            sx={{
                                                fontSize: "25px",
                                                color: colors.redAccent[500],
                                                fontWeight: "bold",
                                            }}
                                        />
                                    </IconButton>
                                ) : undefined}
                                <Box
                                    className="image-area"
                                    style={{
                                        border: `2px dashed ${colors.blueAccent[500]}`,
                                        width: isNonMobile ? "30vw" : "100vw",
                                    }}
                                    onClick={() => document.querySelector(".input-field").click()}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="input-field"
                                        hidden
                                        onChange={(event) => selectImage(event, setFieldValue)}
                                    />
                                    {selectedImage ? (
                                        <img src={"../assets/logo.jpg"} height={230} alt={fileName} />
                                    ) : (
                                        <>
                                            <CloudUploadIcon
                                                sx={{ fontSize: "60px", color: colors.blueAccent[500] }}
                                            />
                                            <Typography
                                                variant="h5"
                                                sx={{ fontWeight: "bold" }}
                                                color={colors.grey[400]}
                                            >
                                                Browse logo to upload
                                            </Typography>
                                            <Typography
                                                sx={{ marginTop: "15px" }}
                                                variant="h6"
                                                color={colors.grey[400]}
                                            >
                                                Maximum file size : 5MB
                                            </Typography>
                                            <Typography variant="h6" color={colors.grey[400]}>
                                                JPG or PNG formats{" "}
                                            </Typography>
                                            <Typography variant="h6" color={colors.grey[400]}>
                                                Recommended size 225x225 pixels
                                            </Typography>
                                            {touched.image && errors.image && (
                                                <Typography variant="body2" color="error">
                                                    {errors.image}
                                                </Typography>
                                            )}
                                        </>
                                    )}
                                </Box>
                            </Box>
                            {userEmail === "admin@gmail.com" && (
                                <Box
                                    sx={{
                                        display: "flex",
                                        gridColumn: "span 4",
                                        justifyContent: "space-between",
                                        gap: "20px", // Add spacing between the selects
                                        "@media (max-width: 767px)": {
                                            flexDirection: "column", // Stack selects on smaller screens
                                            gap: 3,
                                        },
                                    }}>
                                    {/* Select Box for Users */}
                                    <FormControl fullWidth variant="filled" sx={{
                                        "& .MuiInputBase-root": {
                                            backgroundColor: colors.primary[400],
                                        },
                                        "& .MuiInputBase-root.Mui-disabled": {
                                            backgroundColor: colors.primary[400], // Change the background color when disabled
                                            color: colors.grey[100], // Optional: Change the text color when disabled
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
                                    }}>
                                        <InputLabel id="user-select-label">Select User</InputLabel>
                                        <Select
                                            labelId="user-select-label"
                                            value={selectedUser}
                                            onChange={(e) => setSelectedUser(e.target.value)}
                                        >
                                            {users.map((user) => (
                                                <MenuItem key={user.email} value={user.email}>
                                                    {user.email}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>

                                    {/* Select Box for Status */}
                                    <FormControl fullWidth variant="filled" sx={{
                                        "& .MuiInputBase-root": {
                                            backgroundColor: colors.primary[400],
                                        },
                                        "& .MuiInputBase-root.Mui-disabled": {
                                            backgroundColor: colors.primary[400], // Change the background color when disabled
                                            color: colors.grey[100], // Optional: Change the text color when disabled
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
                                    }}>
                                        <InputLabel id="status-select-label">Select Status</InputLabel>
                                        <Select
                                            labelId="status-select-label"
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                        >
                                            <MenuItem value="enable">Enable</MenuItem>
                                            <MenuItem value="disable">Disable</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box>
                            )}
                            <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="Name"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                error={touched.name && Boolean(errors.name)}
                                helperText={touched.name && errors.name}
                                value={values.name}
                                name="name"
                                sx={{
                                    gridColumn: "span 4",
                                    "& .MuiInputBase-root": {
                                        backgroundColor: colors.primary[400],
                                    },
                                    "& .MuiInputBase-root.Mui-disabled": {
                                        backgroundColor: colors.primary[400], // Change the background color when disabled
                                        color: colors.grey[100], // Optional: Change the text color when disabled
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
                            <TextField
                                fullWidth
                                variant="filled"
                                type="email"
                                label="Email"
                                name="email"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                error={touched.email && Boolean(errors.email)}
                                helperText={touched.email && errors.email}
                                value={values.email}
                                disabled
                                sx={{
                                    gridColumn: "span 4",
                                    "& .MuiInputBase-root": {
                                        backgroundColor: colors.primary[400],
                                    },
                                    "& .MuiInputBase-root.Mui-disabled": {
                                        backgroundColor: colors.primary[400], // Change the background color when disabled
                                        color: colors.grey[100], // Optional: Change the text color when disabled
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
                            <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="Before Payment Template Week 3"
                                name="beforePaymentWeek3"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={values.beforePaymentWeek3}
                                sx={{
                                    gridColumn: "span 4",
                                    "& .MuiInputBase-root": {
                                        backgroundColor: colors.primary[400],
                                    },
                                    "& .MuiInputBase-root.Mui-disabled": {
                                        backgroundColor: colors.primary[400], // Change the background color when disabled
                                        color: colors.grey[100], // Optional: Change the text color when disabled
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
                            <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="Before Payment Template Week 4"
                                name="beforePaymentWeek4"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={values.beforePaymentWeek4}
                                sx={{
                                    gridColumn: "span 4",
                                    "& .MuiInputBase-root": {
                                        backgroundColor: colors.primary[400],
                                    },
                                    "& .MuiInputBase-root.Mui-disabled": {
                                        backgroundColor: colors.primary[400], // Change the background color when disabled
                                        color: colors.grey[100], // Optional: Change the text color when disabled
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
                            <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="After Payment Template"
                                name="afterPaymentTemplate"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={values.afterPaymentTemplate}
                                sx={{
                                    gridColumn: "span 4",
                                    "& .MuiInputBase-root": {
                                        backgroundColor: colors.primary[400],
                                    },
                                    "& .MuiInputBase-root.Mui-disabled": {
                                        backgroundColor: colors.primary[400], // Change the background color when disabled
                                        color: colors.grey[100], // Optional: Change the text color when disabled
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
                            <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="After Spoken Payment Template"
                                name="afterSpokenPaymentTemplate"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={values.afterSpokenPaymentTemplate}
                                sx={{
                                    gridColumn: "span 4",
                                    "& .MuiInputBase-root": {
                                        backgroundColor: colors.primary[400],
                                    },
                                    "& .MuiInputBase-root.Mui-disabled": {
                                        backgroundColor: colors.primary[400], // Change the background color when disabled
                                        color: colors.grey[100], // Optional: Change the text color when disabled
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
                            <TextField
                                fullWidth
                                variant="filled"
                                type="text"
                                label="After Group Payment Template"
                                name="afterGroupPaymentTemplate"
                                onBlur={handleBlur}
                                onChange={handleChange}
                                value={values.afterGroupPaymentTemplate}
                                sx={{
                                    gridColumn: "span 4",
                                    "& .MuiInputBase-root": {
                                        backgroundColor: colors.primary[400],
                                    },
                                    "& .MuiInputBase-root.Mui-disabled": {
                                        backgroundColor: colors.primary[400], // Change the background color when disabled
                                        color: colors.grey[100], // Optional: Change the text color when disabled
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
                            {selectedClass === "E" && (
                            <Box
                                sx={{
                                    display: "flex",
                                    gridColumn: "span 4",
                                    justifyContent: "space-between",
                                    gap: "20px", // Add spacing between the selects
                                    "@media (max-width: 767px)": {
                                        flexDirection: "column", // Stack selects on smaller screens
                                        gap: 3,
                                    },
                                }}
                            >
                                <FormControl fullWidth variant="filled" sx={{
                                        "& .MuiInputBase-root": {
                                            backgroundColor: colors.primary[400],
                                        },
                                        "& .MuiInputBase-root.Mui-disabled": {
                                            backgroundColor: colors.primary[400], // Change the background color when disabled
                                            color: colors.grey[100], // Optional: Change the text color when disabled
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
                                    }}>
                                    <InputLabel id="template-select-label">After Payment Template (Nursery to Grade 11)</InputLabel>
                                    <Select
                                        labelId="template-select-label"
                                        value={selectedTemplateKey}
                                        onChange={e => setSelectedTemplateKey(e.target.value)}
                                    >
                                        {templateFields.map(f => (
                                            <MenuItem key={f.key} value={f.key}>
                                                {f.key.replace("after_payment_", "").replace("_template", "").replace(/grade/, "Grade ").replace(/nursery/, "Nursery")}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                {selectedTemplateKey && (
                                    <TextField
                                        fullWidth
                                        variant="filled"
                                        label="Template Value"
                                        value={templateFields.find(f => f.key === selectedTemplateKey)?.value || ""}
                                        onChange={e => {
                                            setTemplateFields(fields =>
                                                fields.map(f =>
                                                    f.key === selectedTemplateKey ? { ...f, value: e.target.value } : f
                                                )
                                            );
                                        }}
                                        sx={{
                                    gridColumn: "span 2",
                                    "& .MuiInputBase-root": {
                                        backgroundColor: colors.primary[400],
                                    },
                                    "& .MuiInputBase-root.Mui-disabled": {
                                        backgroundColor: colors.primary[400], // Change the background color when disabled
                                        color: colors.grey[100], // Optional: Change the text color when disabled
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
                                )}
                            </Box>
                            )}
                            {/* Grade Dropdown */}
                            <Box
                                sx={{
                                    display: "flex",
                                    gridColumn: "span 4",
                                    justifyContent: "space-between",
                                    gap: "20px", // Add spacing between the selects
                                    "@media (max-width: 767px)": {
                                        flexDirection: "column", // Stack selects on smaller screens
                                        gap: 3,
                                    },
                                }}
                            >

                                {/* Grade Dropdown */}
                                <FormControl fullWidth variant="filled"
                                    sx={{
                                        "& .MuiInputBase-root": {
                                            backgroundColor: colors.primary[400],
                                        },
                                        "& .MuiInputBase-root.Mui-disabled": {
                                            backgroundColor: colors.primary[400], // Change the background color when disabled
                                            color: colors.grey[100], // Optional: Change the text color when disabled
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
                                >
                                    <InputLabel id="grade-select-label">Grade</InputLabel>
                                    <Select
                                        labelId="grade-select-label"
                                        id="grade-select"
                                        value={selectedGrade || ""}
                                        onChange={(event) => {
                                            const selectedGradeId = event.target.value;
                                            setSelectedGrade(selectedGradeId);

                                            // Find the selected grade's day_id and update the day dropdown
                                            const selectedGradeData = grades.find((grade) => grade.id === selectedGradeId);
                                            if (selectedGradeData) {
                                                setSelectedDay(selectedGradeData.day_id || ""); // Update the day dropdown
                                            }
                                        }}
                                    >
                                        {grades.map((grade) => (
                                            <MenuItem key={grade.id} value={grade.id}>
                                                {grade.grade} {/* Use the 'grade' key from the backend */}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {/* Day Dropdown */}
                                <FormControl fullWidth variant="filled"
                                    sx={{
                                        "& .MuiInputBase-root": {
                                            backgroundColor: colors.primary[400],
                                        },
                                        "& .MuiInputBase-root.Mui-disabled": {
                                            backgroundColor: colors.primary[400], // Change the background color when disabled
                                            color: colors.grey[100], // Optional: Change the text color when disabled
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
                                >
                                    <InputLabel id="day-select-label">Day</InputLabel>
                                    <Select
                                        labelId="day-select-label"
                                        id="day-select"
                                        value={selectedDay || ""}
                                        onChange={(event) => setSelectedDay(event.target.value)} // Handle day change
                                    >
                                        {days.map((day, index) => (
                                            <MenuItem key={index} value={day.value}>
                                                {day.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>

                            <Button
                                endIcon={<SaveIcon />}
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
                                        width: "100%", // Full width for screens smaller than 767px
                                        justifySelf: "stretch", // Ensure the button stretches to full width
                                    },
                                }}
                            >
                                Save
                            </Button>


                        </Box>
                    </form>
                )}
            </Formik>
        </Box>
    );
};

export default Settings;
