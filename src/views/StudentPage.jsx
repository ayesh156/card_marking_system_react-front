import { useState, useEffect, useCallback } from "react";
import {
    Box,
    TextField,
    useTheme,
    Typography,
    Button,
    FormLabel,
    FormControlLabel,
    RadioGroup,
    Radio,
    Autocomplete
} from "@mui/material";
import dayjs from "dayjs";
import { Formik } from "formik";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useLocation, useNavigate } from "react-router-dom";
import KeyboardArrowLeftOutlinedIcon from "@mui/icons-material/KeyboardArrowLeftOutlined";
import { tokens } from "../theme.js";
import SaveIcon from "@mui/icons-material/Save";
import * as yup from "yup";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import axiosClient from "../../axios-client.js";
import ToastNotification from "../components/ToastNotification.jsx";
import CircularProgress, {
    circularProgressClasses,
} from '@mui/material/CircularProgress';
import { student } from "../data/mockData.js";
import debounce from "lodash/debounce";

const phoneRegExp = /^[0-9]{10}$/; // Adjusted for 10-digit phone numbers

const customerSchema = yup.object().shape({
    sno: yup
        .string()
        .required("Student number is required")
        .max(20, "Student number must not exceed 20 characters"),
    name: yup
        .string()
        .required("Name is required")
        .max(100, "Name must not exceed 100 characters"),
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

const StudentPage = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const isNonMobile = useMediaQuery("(min-width:800px)");
    const [isLoading, setIsLoading] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation(); // Access the passed state
    const nextStudentNo = location.state?.nextStudentNo; // Get from navigation state
    const [initialFormValues, setInitialFormValues] = useState({
        sno: nextStudentNo || "",
        name: "",
        dob: null,
        address1: "",
        address2: "",
        school: "",
        gName: "",
        gMobile: "",
        gWhatsapp: "",
        gWhatsapp2: "",
        gender: "female",
    });
    // Extract the grade or primary from the URL
    const [pageTitle, setPageTitle] = useState("");
    const [buttonText, setButtonText] = useState("Save");
    const themeMode = theme.palette.mode === "dark" ? "dark" : "light";
    const [autocompleteKey, setAutocompleteKey] = useState(0); // Add this line

    const childId = location.state?.child; // Get the child_id from the state
    const tuitionId = location.state?.tuitionId; // Get the child_id from the state

    const status = location.state?.status;

    // Add a state for suggested tuitionId
    const [suggestedTuitionId, setSuggestedTuitionId] = useState("");

    // Determine if this is an update or a new customer
    const isUpdate = Boolean(childId);

    // State for autocomplete suggestions
    const [suggestions, setSuggestions] = useState([]);
    const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
    // ... (useEffect for pageTitle and fetching student data remains unchanged)

    // Debounced function to fetch suggestions
    const fetchSuggestions = useCallback(
        debounce(async (input) => {
            if (!input || input.length < 2) {
                setSuggestions([]);
                return;
            }
            setIsFetchingSuggestions(true);
            try {
                const response = await axiosClient.get(`/students/search`, {
                    params: { name: input },
                });
                setSuggestions(response.data || []);
                // console.log(response);
            } catch (error) {
                console.error("Error fetching suggestions:", error);
                ToastNotification("Failed to fetch suggestions", "error", themeMode);
                setSuggestions([]);
            } finally {
                setIsFetchingSuggestions(false);
            }
        }, 300),
        [themeMode]
    );

    useEffect(() => {
        const pathName = decodeURIComponent(location.pathname.split("/")[1]); // Get the part after "/" and decode URI

        // Map category abbreviations to full names
        const categoryMap = {
            s: "Spoken",
            t: "Theory",
            g: "Group",
            p: "Paper",
        };

        // Extract the category prefix and grade(s)
        const categoryPrefix = pathName.charAt(0); // First letter (e.g., 's', 't', 'g', 'p')
        const gradesRaw = pathName.slice(1).replace(/-/g, ", "); // Extract grades and replace '-' with ', '

        // Set the title dynamically
        if (categoryMap[categoryPrefix]) {
            const categoryName = categoryMap[categoryPrefix];

            // Special case for "P" to display "Nursery"
            if (gradesRaw.toLowerCase() === "n") {
                setPageTitle(isUpdate ? `Update Nursery ${categoryName} Student` : `New Nursery ${categoryName} Student`);
            } else {
                // Format "1b" as "1 - B" (and also handle multiple grades like "1b, 2a")
                // Also handle year suffix like "1a2026" -> "1 - A 2026"
                const formattedGrades = gradesRaw.replace(/(\d+)\s*([a-zA-Z])(\d{4})?/g, (m, num, letter, year) => 
                    year ? `${num} - ${letter.toUpperCase()} ${year}` : `${num} - ${letter.toUpperCase()}`
                );
                setPageTitle(isUpdate ? `Update Grade ${formattedGrades} ${categoryName} Student` : `New Grade ${formattedGrades} ${categoryName} Student`);
            }
        } else {
            setPageTitle(isUpdate ? "Update Student" : "New Student"); // Fallback for invalid routes
        }
    }, [location, isUpdate]);

    useEffect(() => {
        if (childId) {

            // Fetch data from the mockdata for the given child_id
            setIsPageLoading(true);

            // const studentData = student.find((item) => item.id === childId); // Find the object by id
            // if (studentData) {
            //     setInitialFormValues({
            //         sno: studentData.sno || "",
            //         name: studentData.name || "",
            //         dob: studentData.dob || null,
            //         address1: studentData.address1 || "",
            //         address2: studentData.address2 || "",
            //         school: studentData.school || "",
            //         gName: studentData.gName || "",
            //         gMobile: studentData.gMobile || "",
            //         gWhatsapp: studentData.gWhatsapp || "",
            //         gender: studentData.gender || "female",
            //     });
            //     setIsPageLoading(false);
            // } else {
            //     console.error("Student not found");
            // }

            // Backend

            axiosClient
                .get(`/student/${childId}`) // Replace with your backend endpoint                
                .then(({ data }) => {
                    setInitialFormValues({
                        sno: data.sno || "",
                        name: data.name || "",
                        dob: data.dob || null,
                        address1: data.address1 || "",
                        address2: data.address2 || "",
                        school: data.school || "",
                        gName: data.g_name || "",
                        gMobile: data.g_mobile || "",
                        gWhatsapp: data.g_whatsapp || "",
                        gWhatsapp2: data.g_whatsapp2 || "", // <-- Add new field
                        gender: data.gender || "female",
                    });
                    // console.log(data);
                })
                .catch((error) => {
                    ToastNotification("Failed to fetch student data", "error", theme.palette.mode);
                    console.error("Error fetching student data:", error);
                })
                .finally(() => {
                    setIsPageLoading(false);
                });
        }
    }, [childId]);

    useEffect(() => {
        if (!isUpdate && nextStudentNo) {
            setInitialFormValues((prev) => ({
                ...prev,
                sno: nextStudentNo,
            }));
        }
    }, [nextStudentNo, isUpdate]);

    const resetFormState = (resetForm, setFieldValue) => {
        resetForm();
        setInitialFormValues((prev) => ({ ...prev, name: "" }));
        setFieldValue("name", "");
        setAutocompleteKey((k) => k + 1);
        setSuggestions([]);
    };

    const handleFormSubmit = async (values, { resetForm, setFieldValue }) => {
        setIsLoading(true);

        const payload = {
            ...values,
            g_name: values.gName || "",
            g_mobile: values.gMobile || "",
            g_whatsapp: values.gWhatsapp || "",
            g_whatsapp2: values.gWhatsapp2 || "",
            tuitionId: status === "all" ? suggestedTuitionId : tuitionId,
        };

        try {
            if (isUpdate) {
                await axiosClient.put(`/student/${childId}`, payload).then(({ data }) => {
                    ToastNotification(data.message, "success", themeMode);
                    console.log("Form values after update:", values); // Debug log
                });
            } else {
                await axiosClient.post("/student", payload).then(({ data }) => {
                    ToastNotification(data.message, "success", themeMode);
                    resetFormState(resetForm, setFieldValue); // Call helper function
                });
            }
        } catch (err) {
            const response = err.response;
            if (response && response.data && response.data.message) {
                ToastNotification(response.data.message, "error", themeMode);
            } else {
                ToastNotification("An unexpected error occurred!", "error", themeMode);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Show loader while data is being fetched

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
                    {status === "all" ? "New Student" : pageTitle}
                </Typography>
            </Button>
            <Formik
                initialValues={initialFormValues}
                enableReinitialize
                validationSchema={customerSchema}
                onSubmit={async (values, { resetForm, setFieldValue }) => {
                    if (buttonText === "Enable") {
                        // Handle enabling the student status
                        try {
                            await axiosClient.put(`/student/status/${values.sno}`, {
                                tuitionId, // Pass the selectedClass
                            });
                            ToastNotification("Student status updated successfully!", "success", themeMode);
                            setButtonText("Save"); // Reset button text to "Save" after enabling
                            resetForm(); // Reset the form after enabling
                            handleFormSubmit
                        } catch (error) {
                            console.error("Error updating student status:", error);
                            ToastNotification("Failed to update student status", "error", themeMode);
                        }
                    } else {
                        // Handle normal save logic
                        await handleFormSubmit(values, { resetForm, setFieldValue });
                        if (!isUpdate) {
                            setFieldValue("name", ""); // Clear the Autocomplete value only for create
                        }
                    }
                }}
            >
                {({ values, errors, touched, handleBlur, handleChange, handleSubmit, resetForm, isValid, setFieldValue }) => {
                    useEffect(() => {
                        if (!values.name) {
                            setButtonText("Save");
                        }
                    }, [values.name]);

                    // Suggest tuitionId as user types S.No.
                    useEffect(() => {
                        if (status === "all" && values.sno) {
                            const snoNum = parseInt(values.sno, 10);
                            let tuitionId = "";
                            let exceeded = false;

                            if (!isNaN(snoNum) && snoNum >= 0) {
                                if (snoNum <= 99) tuitionId = 1;
                                else if (snoNum <= 149) tuitionId = 20;
                                else if (snoNum <= 199) tuitionId = 31;
                                else if (snoNum <= 299) tuitionId = 21;
                                else if (snoNum <= 399) tuitionId = 22;
                                else if (snoNum <= 499) tuitionId = 23;
                                else if (snoNum <= 599) tuitionId = 24;
                                else if (snoNum <= 699) tuitionId = 25;
                                else if (snoNum <= 799) tuitionId = 26;
                                else if (snoNum <= 899) tuitionId = 27;
                                else if (snoNum <= 999) tuitionId = 28;
                                else if (snoNum <= 1099) tuitionId = 29;
                                else if (snoNum <= 1199) tuitionId = 30;
                                else exceeded = true;
                            }

                            if (exceeded) {
                                setSuggestedTuitionId("");
                                ToastNotification("S.No. range exceeded. Please enter a value between 0 and 1199.", "error", themeMode);
                            } else {
                                setSuggestedTuitionId(tuitionId);
                            }
                        } else {
                            setSuggestedTuitionId("");
                        }
                    }, [values.sno, status]);

                    return (
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
                                    label="Student No"
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                    name="sno"
                                    error={touched.sno && Boolean(errors.sno)}
                                    helperText={touched.sno && errors.sno}
                                    value={values.sno}
                                    disabled={isUpdate}
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

                                {isUpdate ? (<TextField
                                    fullWidth
                                    variant="filled"
                                    type="text"
                                    label="Name"
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                    name="name"
                                    value={values.name}
                                    error={touched.name && Boolean(errors.name)}
                                    helperText={touched.name && errors.name}
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
                                />) : (
                                    <Autocomplete
                                        key={autocompleteKey} // <-- Add this line
                                        fullWidth
                                        freeSolo
                                        options={suggestions}
                                        getOptionLabel={(option) => (typeof option === "string" ? option : option.name)}
                                        onInputChange={(event, newInputValue) => {
                                            setFieldValue("name", newInputValue);
                                            fetchSuggestions(newInputValue);
                                        }}
                                        onChange={(event, newValue) => {
                                            if (newValue) {
                                                // If a suggestion is selected, update the necessary fields
                                                setFieldValue("name", typeof newValue === "string" ? newValue : newValue.name);
                                                setFieldValue("sno", newValue.sno || ""); // Update Student No
                                                setFieldValue("dob", newValue.dob || ""); // Update Date of Birth
                                                setFieldValue("address1", newValue.address1 || ""); // Update Address Line 1
                                                setFieldValue("address2", newValue.address2 || ""); // Update Address Line 2
                                                setFieldValue("school", newValue.school || ""); // Update School
                                                setFieldValue("gName", newValue.g_name || ""); // Update Guardian's Name
                                                setFieldValue("gMobile", newValue.g_mobile || ""); // Update Guardian's Mobile
                                                setFieldValue("gWhatsapp", newValue.g_whatsapp || ""); // Update Guardian's WhatsApp
                                                setFieldValue("gender", newValue.gender || "female"); // Update Gender
                                                setButtonText("Enable");
                                            }
                                        }}
                                        renderOption={(props, option, { index }) => {
                                            const { key, ...otherProps } = props;
                                            return (
                                                <li key={`${option.sno}-${index}`} {...otherProps}>
                                                    {option.name} (S.No: {option.sno})
                                                </li>
                                            );
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                variant="filled"
                                                label="Name"
                                                name="name"
                                                onBlur={handleBlur}
                                                error={touched.name && Boolean(errors.name)}
                                                helperText={touched.name && errors.name}
                                                InputProps={{
                                                    ...params.InputProps,
                                                    endAdornment: (
                                                        <>
                                                            {isFetchingSuggestions ? (
                                                                <CircularProgress color="inherit" size={20} />
                                                            ) : null}
                                                            {params.InputProps.endAdornment}
                                                        </>
                                                    ),
                                                }}
                                                sx={{
                                                    width: "100%",
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
                                        sx={{
                                            gridColumn: "span 4", // Ensure it spans 4 columns in the grid
                                            width: "100%", // Explicitly set the width to 100%
                                        }}
                                    />
                                )}

                                <Box sx={{
                                    display: "flex", gap: "20px", marginTop: "10px", gridColumn: "span 4",
                                    width: "100%",      // Ensure it takes full width up to the max width
                                    flexWrap: "wrap",
                                    // Media query for small screens
                                    "@media (max-width: 1150px)": {
                                        flexDirection: "column", // Stack items vertically
                                        gap: "10px", // Reduce gap between elements on small screens
                                    },
                                }}>
                                    <Box sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "10px",
                                        flex: 1,
                                        maxWidth: "50%",
                                        "@media (max-width: 1150px)": {
                                            maxWidth: "100%",
                                        }
                                    }}>
                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                            <DemoContainer components={["DatePicker"]}>
                                                <DatePicker
                                                    value={values.dob ? dayjs(values.dob) : null} // Convert Formik's string value to a Dayjs object
                                                    onChange={(newValue) => {
                                                        handleChange({
                                                            target: {
                                                                name: "dob",
                                                                value: newValue ? newValue.format("YYYY-MM-DD") : "", // Convert Dayjs object to string
                                                            },
                                                        });
                                                    }}
                                                    label="Date of Birth"
                                                    format="YYYY-MM-DD"
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            variant: "filled",
                                                            name: "dob",
                                                            onBlur: handleBlur,
                                                            sx: {
                                                                minWidth: "600px",
                                                                gridColumn: "span 4", // This line applies the grid styling
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
                                                            },
                                                        },
                                                    }}
                                                />
                                            </DemoContainer>
                                        </LocalizationProvider>
                                    </Box>
                                    <Box sx={{
                                        display: "flex",
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "30px",
                                        flex: 1,
                                        maxWidth: "50%",
                                        "@media (max-width: 1150px)": {
                                            maxWidth: "100%",
                                            mt: "20px"
                                        },
                                        "@media (max-width: 767px)": {
                                            gap: "10px",
                                        }
                                    }}>
                                        <FormLabel>Gender : </FormLabel>
                                        <RadioGroup
                                            row
                                            name="gender"
                                            onChange={handleChange}
                                            value={values.gender}
                                            sx={{
                                                display: "flex", gap: "10px", justifyContent: "space-between", "@media (max-width: 767px)": {
                                                    gap: "0px",
                                                }
                                            }}
                                        >
                                            <FormControlLabel value="female" control={<Radio sx={{
                                                color: "white",
                                                "&.Mui-checked": { color: "white" },
                                            }} />} label="Female" />
                                            <FormControlLabel value="male" control={<Radio sx={{
                                                color: "white",
                                                "&.Mui-checked": { color: "white" },
                                            }} />} label="Male" />
                                        </RadioGroup>
                                    </Box>
                                </Box>
                                <TextField
                                    fullWidth
                                    variant="filled"
                                    type="text"
                                    label="Address line 1"
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                    value={values.address1}
                                    name="address1"
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
                                    label="Address line 2"
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                    value={values.address2}
                                    name="address2"
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
                                    label="School"
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                    name="school"
                                    value={values.school}
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
                                    label="Guardian’s Name"
                                    onBlur={handleBlur}
                                    onChange={handleChange}
                                    name="gName"
                                    value={values.gName}
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

                                <Box
                                    display="grid"
                                    gap="30px"
                                    gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                                    sx={{
                                        gridColumn: "span 4",
                                    }}
                                >
                                    <TextField
                                        fullWidth
                                        variant="filled"
                                        type="text"
                                        label="Guardian’s Mobile"
                                        onBlur={handleBlur}
                                        onChange={handleChange}
                                        name="gMobile"
                                        value={values.gMobile}
                                        sx={{
                                            gridColumn: "span 2",
                                            "@media (max-width: 1150px)": {
                                                gridColumn: "span 4",// Reduce gap between elements on small screens
                                            },
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
                                        label="Guardian’s Whatsapp"
                                        onBlur={handleBlur}
                                        onChange={handleChange}
                                        value={values.gWhatsapp}
                                        name="gWhatsapp"
                                        sx={{
                                            gridColumn: "span 2",
                                            "@media (max-width: 1150px)": {
                                                gridColumn: "span 4",// Reduce gap between elements on small screens
                                            },
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
                                        label="Guardian’s Whatsapp 2"
                                        onBlur={handleBlur}
                                        onChange={handleChange}
                                        value={values.gWhatsapp2}
                                        name="gWhatsapp2"
                                        sx={{
                                            gridColumn: "span 2",
                                            "@media (max-width: 1150px)": {
                                                gridColumn: "span 4",// Reduce gap between elements on small screens
                                            },
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
                                </Box>


                                <Button
                                    endIcon={<SaveIcon />}
                                    variant="contained"
                                    type="submit"
                                    loading={isLoading}
                                    disabled={buttonText === "Enable" && status === "all"} // <-- Disable Enable button if status is all
                                    sx={{
                                        gridColumn: "span 4",
                                        marginTop: "15px",
                                        textTransform: "capitalize",
                                        color: colors.grey[100],
                                        fontSize: "17px",
                                        fontWeight: "500",
                                        paddingY: "10px",
                                        backgroundColor: buttonText === "Enable" ? colors.greenAccent[700] : (isUpdate ? colors.primary[700] : colors.blueAccent[700]),
                                        "&:hover": {
                                            backgroundColor: buttonText === "Enable" ? colors.greenAccent[600] : (isUpdate ? colors.primary[600] : colors.blueAccent[600]),
                                        },
                                        width: "150px", // Fixed width for larger screens
                                        justifySelf: "flex-end", // Right align the button
                                        "@media (max-width: 767px)": {
                                            width: "100%", // Full width for screens smaller than 767px
                                            justifySelf: "stretch", // Ensure the button stretches to full width
                                        },
                                    }}
                                >
                                    {isUpdate ? "Update" : buttonText}
                                </Button>
                            </Box>
                        </form>
                    )
                }}
            </Formik>
        </Box>
    );
};

export default StudentPage;
