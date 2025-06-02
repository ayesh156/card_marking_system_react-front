import { useState, useEffect } from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Checkbox, useTheme, Box, Button, IconButton, InputBase, Typography, TextField } from "@mui/material";
import { tokens } from "../theme";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { ToastContainer } from "react-toastify";
import axiosClient from "../../axios-client.js";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import SearchIcon from "@mui/icons-material/Search";
import SendIcon from "@mui/icons-material/Send";
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import ToastNotification from "../components/ToastNotification.jsx";
import { data } from "../data/mockData.js";
import Cookies from "js-cookie";

const GradePage = () => {
    const [children, setChildren] = useState([]); // List of children
    const [filteredChildren, setFilteredChildren] = useState([]); // Filtered list for search
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false); // Loading state
    const [selectedClass, setSelectedClass] = useState(null); // State to store selectedClass
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const [sendBtnLoading, setSendBtnLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation(); // Get the current location
    const themeMode = theme.palette.mode === "dark" ? "dark" : "light";
    const [gradeTitle, setGradeTitle] = useState("Nursery");
    const [currentDate, setCurrentDate] = useState("");
    const [grade, setGrade] = useState(null);
    const [category, setCategory] = useState(null);
    const [message, setMessage] = useState(""); // State to manage the TextField value
    const [tuitionId, setTuitionId] = useState(""); // State to manage the TextField value
    const [userEmail, setUserEmail] = useState(Cookies.get("userEmail") || ""); // Selected class
    const [selectedChildren, setSelectedChildren] = useState([]); // IDs of selected children


    // Set the header title based on the location path name
    useEffect(() => {
        const pathName = location.pathname.split("/")[1]; // Get the part after "/"

        // Map category abbreviations to full names
        const categoryMap = {
            s: "Spoken",
            t: "Theory",
            g: "Group",
            p: "Paper",
        };

        // Extract the category prefix and grade(s)
        const categoryPrefix = pathName.charAt(0); // First letter (e.g., 's', 't', 'g', 'p')
        const grades = pathName.slice(1).replace(/-/g, ", "); // Extract grades and replace '-' with ', '

        setGrade(grades); // Set the grade state
        // Set the category state

        // Set the title dynamically
        if (categoryMap[categoryPrefix]) {
            const categoryName = categoryMap[categoryPrefix];

            setCategory(categoryName);

            // Special case for "P" to display "Nursery"
            if (grades.trim().charAt(0).toLowerCase() === "n") {
                setGradeTitle(`Nursery ${categoryName}`);
            } else {
                // Format "1b" as "1 - B" (and also handle multiple grades like "1b, 2a")
                const formattedGrades = grades.replace(/(\d+)\s*([a-zA-Z])/g, (m, num, letter) => `${num} - ${letter.toUpperCase()}`);
                setGradeTitle(`Grade ${formattedGrades} ${categoryName}`);
            }
        } else {
            setGradeTitle("Unknown Category"); // Fallback for invalid routes
        }

    }, [location]);

    const fetchChildren = async () => {
    setLoading(true);
    try {
        const requestData = {
            grades: grade.split(",").map((g) => {
                const trimmedGrade = g.trim();
                return trimmedGrade.charAt(0).toLowerCase() === "n" ? "Nursery" : `Grade ${trimmedGrade}`;
            }),
            selectedClass,
            category: gradeTitle.split(" ").at(-1),
        };

        const response = await axiosClient.post('/fetch-student-data', requestData);

        if (!response.data.students) {
            setTuitionId(response.data.tuitionId || null);
            setChildren([]);
            setFilteredChildren([]);
            return;
        }

        // Normalize data to ensure required fields are present
        const activeChildren = response.data.students
            .filter((child) => child.status)
            .map((child) => ({
                ...child,
                sno: child.sno ?? '', // Default to empty string if null/undefined
                child_name: child.child_name ?? '',
                gWhatsapp: child.gWhatsapp || child.gWhatsapp2 || '', // Fallback to gWhatsapp2 or empty string
            }));

        setTuitionId(response.data.tuitionId);
        setChildren(activeChildren);
        setFilteredChildren(activeChildren);
    } catch (error) {
        console.error("Error fetching children:", error);
        setChildren([]);
        setFilteredChildren([]);
    } finally {
        setLoading(false);
    }
};

    // Fetch current date for display
    useEffect(() => {
        const date = new Date();
        const options = { month: "long" };
        const month = date.toLocaleDateString("en-US", options);
        const year = date.getFullYear();
        setCurrentDate(`${year} ${month}`);


        const storedClass = Cookies.get("selectedClass"); // Retrieve selectedClass from cookies
        setSelectedClass(storedClass || null); // Set it in state or default to null
    }, []);

    // Fetch children data whenever the grade value is updated
    useEffect(() => {
        if (grade) {
            fetchChildren();
        }
    }, [grade, category]); // Trigger this effect whenever the grade changes

    // Handle checkbox change for weeks (Auto-send update)
    const handleWeekCheckboxChange = async (childId, week) => {
        const isUnchecked = children.find((child) => child.child_id === childId)[week];

        const updatedChildren = children.map((child) => {
            if (child.child_id === childId) {
                return {
                    ...child,
                    [week]: !child[week], // Toggle the week value
                };
            }
            return child;
        });

        const updatedFilteredChildren = filteredChildren.map((child) => {
            if (child.child_id === childId) {
                return {
                    ...child,
                    [week]: !child[week], // Toggle the week value
                };
            }
            return child;
        });

        setChildren(updatedChildren); // Update the full list
        setFilteredChildren(updatedFilteredChildren); // Update the filtered list

        setLoading(true);

        try {
            await axiosClient.post("/reports", {
                child_id: childId,
                tuition_id: tuitionId,
                weeks: {
                    [week]: updatedChildren.find((child) => child.child_id === childId)[week],
                },
            });

            if (isUnchecked) {
                ToastNotification(`Week ${week.replace("week", "")} unchecked!`, "warning", themeMode);
            } else {
                ToastNotification(`Week ${week.replace("week", "")} checked!`, "success", themeMode);
            }
        } catch (error) {
            ToastNotification(`Error updating week report: ${error}`, "error", themeMode);
            console.error("Error updating week report:", error);
        } finally {
            setLoading(false);
        }
    };

    const getCurrentWeek = () => {
        const today = new Date(); // Current date: March 24, 2025
        // const today = new Date('2025-03-08');
        const dayOfMonth = today.getDate();
        const weekNumber = Math.ceil(dayOfMonth / 7);
        return Math.min(weekNumber, 5); // Cap at 5 weeks
    };

    const handleDelete = async (childId) => {
        if (!window.confirm("Are you sure you want to delete this record?")) {
            return; // Exit if the user cancels the confirmation
        }

        setLoading(true); // Show loading state
        try {
            // Send delete request to the backend
            await axiosClient.put(`/status/${childId}`, { tuitionId });

            ToastNotification("Record deleted successfully!", "success", themeMode);

            // Remove the deleted child from the `children` state
            const updatedChildren = children.filter((child) => child.child_id !== childId);
            setChildren(updatedChildren);

            // Reapply the search filter to update `filteredChildren`
            const filtered = updatedChildren.filter((child) =>
                child.sno.toString().toLowerCase().includes(searchQuery) ||
                child.child_name.toLowerCase().includes(searchQuery) ||
                child.gWhatsapp.toLowerCase().includes(searchQuery)
            );
            setFilteredChildren(filtered);
        } catch (error) {
            ToastNotification(`Error deleting record: ${error}`, "error", themeMode);
            console.error("Error deleting record:", error);
        } finally {
            setLoading(false); // Hide loading state
        }
    };

    const currentWeek = getCurrentWeek();

    // Handle search input change
    const handleSearchChange = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);

    // Filter children based on search query
    const filtered = children.filter((child) =>
        (child.sno?.toString().toLowerCase().includes(query) || '') ||
        (child.child_name?.toLowerCase().includes(query) || '') ||
        (child.gWhatsapp?.toLowerCase().includes(query) || '')
    );
    setFilteredChildren(filtered);
};

    // Handle checkbox change for paid status (Auto-send update)
    const handlePaidCheckboxChange = async (childId) => {
        const isUnchecked = children.find((child) => child.child_id === childId).paid;

        const updatedChildren = children.map((child) => {
            if (child.child_id === childId) {
                return {
                    ...child,
                    paid: !child.paid, // Toggle the paid value
                };
            }
            return child;
        });

        const updatedFilteredChildren = filteredChildren.map((child) => {
            if (child.child_id === childId) {
                return {
                    ...child,
                    paid: !child.paid, // Toggle the paid value
                };
            }
            return child;
        });

        setChildren(updatedChildren); // Update the full list
        setFilteredChildren(updatedFilteredChildren); // Update the filtered list

        setLoading(true);

        try {
            await axiosClient.post("/paid", {
                child_id: childId,
                tuition_id: tuitionId,
                paid: updatedChildren.find((child) => child.child_id === childId).paid,
                email: userEmail
            });

            if (isUnchecked) {
                ToastNotification(`Paid status unchecked!`, "warning", themeMode);
            } else {
                ToastNotification(`Paid status checked!`, "success", themeMode);
            }
        } catch (error) {

            // Show a toast notification for internet connection error
            if (!navigator.onLine) {
                ToastNotification(
                    "No internet connection. Please check your connection and try again.",
                    "error",
                    theme.palette.mode
                );
            } else {
                ToastNotification(`Error updating paid status: ${error}`, "error", themeMode);
                console.error("Error updating paid status:", error);
            }

        } finally {
            setLoading(false);
        }
    };

    // Handle checkbox selection for rows
    const handleRowSelection = (childId) => {
        setSelectedChildren((prevSelected) => {
            if (prevSelected.includes(childId)) {
                // If already selected, remove it
                return prevSelected.filter((id) => id !== childId);
            } else {
                // Otherwise, add it
                return [...prevSelected, childId];
            }
        });
    };

    // Handle "Select All" checkbox
    const handleSelectAll = (isChecked) => {
        if (isChecked) {
            // Select all filtered rows
            const filteredChildIds = filteredChildren.map((child) => child.child_id);
            setSelectedChildren((prevSelected) => [
                ...new Set([...prevSelected, ...filteredChildIds]), // Avoid duplicates
            ]);
        } else {
            // Deselect all filtered rows
            const filteredChildIds = filteredChildren.map((child) => child.child_id);
            setSelectedChildren((prevSelected) =>
                prevSelected.filter((id) => !filteredChildIds.includes(id))
            );
        }
    };

    // Handle sending messages
    const handleSendAll = async () => {
        if (message.trim() === "") {
            ToastNotification("Message is empty. Please enter a message.", "warning", theme.palette.mode);
            return;
        }

        if (!tuitionId) {
            ToastNotification("Tuition ID is missing. Please try again.", "error", theme.palette.mode);
            return;
        }

        setSendBtnLoading(true);

        try {

            await axiosClient.post("/send-message-to-tuitions", {
                message,
                tuition_id: tuitionId,
                child_ids: selectedChildren,
            });
            ToastNotification("Messages sent successfully!", "success", theme.palette.mode);

        } catch (error) {
            ToastNotification(`Error sending messages: ${error.response?.data?.message || error.message}`, "error", theme.palette.mode);
            console.error("Error sending messages:", error);
        } finally {
            setSendBtnLoading(false);
            setMessage(""); // Clear the message input
            setSelectedChildren([]); // Clear the selected students
        }
    };

    // Define columns for DataGrid
    const columns = [
        {
            field: "select",
            headerName: "Select", // Use a string here
            flex: 0.6,
            renderHeader: (params) => (
                <Checkbox
                    checked={selectedChildren.length === filteredChildren.length && filteredChildren.length > 0}
                    indeterminate={selectedChildren.length > 0 && selectedChildren.length < filteredChildren.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    sx={{
                        color: `${colors.grey[100]}`,
                        "&.Mui-checked": { color: `${colors.grey[100]}` },
                    }}
                />
            ),
            renderCell: (params) => (
                <Checkbox
                    checked={selectedChildren.includes(params.row.child_id)}
                    onChange={() => handleRowSelection(params.row.child_id)}
                    sx={{
                        color: `${colors.grey[100]}`,
                        "&.Mui-checked": { color: `${colors.grey[100]}` },
                    }}
                />
            ),
        },
        {
            field: "sno",
            headerName: "No.",
            flex: 0.5
        },
        {
            field: "child_name",
            headerName: "Student",
            flex: 1.2,
            cellClassName: "name-column--cell",
            renderCell: (params) => (
                <Button
                    className="name-column--cell"
                    style={{
                        textTransform: "capitalize",
                        color: params.row.register
                            ? "#2ECC71" // Green if registered
                            : "#E74C3C", // Red if not registered
                    }}
                    onClick={() => {
                        navigate(`student`, {
                            state: { child: params.row.child_id, tuitionId }, // Pass the selected child object as state
                        });
                    }}
                >
                    {params.value}
                </Button>
            )
        },
        {
            field: "gWhatsapp",
            headerName: "Contact",
            flex: 1,
            renderCell: (params) => (
                <Typography
                    style={{
                        display: "flex",
                        alignItems: "center",
                        paddingTop: "4px",
                        textAlign: "center",
                        height: "100%",
                        color: colors.grey[100]
                    }}
                >
                    {params.value}
                </Typography>
            ),
        },
        {
            field: "week1",
            headerName: "Week 1",
            flex: 0.7,
            renderCell: (params) => (
                <Checkbox
                    checked={params.row.week1}
                    onChange={() => handleWeekCheckboxChange(params.row.child_id, "week1")}
                    disabled={currentWeek > 1} // Disable if before current week
                    sx={{
                        color: `${colors.grey[100]}`,
                        "&.Mui-checked": { color: `${colors.grey[100]}` },
                        "&.Mui-disabled": { color: `${colors.grey[500]}` }, // Style for disabled state
                    }}
                />
            ),
        },
        {
            field: "week2",
            headerName: "Week 2",
            flex: 0.7,
            renderCell: (params) => (
                <Checkbox
                    checked={params.row.week2}
                    onChange={() => handleWeekCheckboxChange(params.row.child_id, "week2")}
                    disabled={currentWeek > 2} // Disable if before current week
                    sx={{
                        color: `${colors.grey[100]}`,
                        "&.Mui-checked": { color: `${colors.grey[100]}` },
                        "&.Mui-disabled": { color: `${colors.grey[500]}` },
                    }}
                />
            ),
        },
        {
            field: "week3",
            headerName: "Week 3",
            flex: 0.7,
            renderCell: (params) => (
                <Checkbox
                    checked={params.row.week3}
                    onChange={() => handleWeekCheckboxChange(params.row.child_id, "week3")}
                    disabled={currentWeek > 3} // Disable if before current week
                    sx={{
                        color: `${colors.grey[100]}`,
                        "&.Mui-checked": { color: `${colors.grey[100]}` },
                        "&.Mui-disabled": { color: `${colors.grey[500]}` },
                    }}
                />
            ),
        },
        {
            field: "week4",
            headerName: "Week 4",
            flex: 0.7,
            renderCell: (params) => (
                <Checkbox
                    checked={params.row.week4}
                    onChange={() => handleWeekCheckboxChange(params.row.child_id, "week4")}
                    disabled={currentWeek > 4} // Disable if before current week
                    sx={{
                        color: `${colors.grey[100]}`,
                        "&.Mui-checked": { color: `${colors.grey[100]}` },
                        "&.Mui-disabled": { color: `${colors.grey[500]}` },
                    }}
                />
            ),
        },
        {
            field: "week5",
            headerName: "Week 5",
            flex: 0.7,
            renderCell: (params) => (
                <Checkbox
                    checked={params.row.week5}
                    onChange={() => handleWeekCheckboxChange(params.row.child_id, "week5")}
                    sx={{
                        color: `${colors.grey[100]}`, // Unchecked color
                        "&.Mui-checked": {
                            color: `${colors.grey[100]}`, // Checked color
                        },
                    }}
                />
            ),
        },
        {
            field: "paid",
            headerName: "Paid",
            flex: 0.7,
            renderCell: (params) => (
                <Checkbox
                    checked={params.row.paid}
                    onChange={() => {
                        // Show confirmation dialog
                        const confirmAction = window.confirm(
                            "Are you sure you want to change the paid status for this student?"
                        );

                        if (confirmAction) {
                            handlePaidCheckboxChange(params.row.child_id);
                        }
                    }}
                    sx={{
                        color: params.row.notpaid ? "#E74C3C" : "#F1C40F", // Red if notpaid is true, yellow otherwise
                        "&.Mui-checked": {
                            color: params.row.notpaid ? "#E74C3C" : "#e3bc22", // Red if notpaid is true, yellow otherwise
                        },
                    }}
                />
            ),
        },
        {
            field: "action",
            headerName: "Action",
            flex: 0.5,
            renderCell: (params) => (
                <IconButton sx={{ color: "#E74C3C" }}
                    onClick={() => handleDelete(params.row.child_id)}>
                    <DeleteOutlineIcon />
                </IconButton>
            ),
        }
    ];

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
                    title={gradeTitle}
                    subtitle="Effortlessly manage grades with our intuitive interface."
                />
                <Link
                    to="student" // Dynamically set the path
                    state={{ tuitionId }} // Pass the parameters as state
                    style={{ marginLeft: "auto" }}
                >
                    <Button
                        sx={{
                            textTransform: "none",
                            backgroundColor: colors.blueAccent[700],
                            color: colors.grey[100],
                            fontSize: "17px",
                            paddingX: "25px",
                            height: "50px",
                            fontWeight: "500",
                            "&:hover": {
                                backgroundColor: colors.blueAccent[800],
                            },
                            "@media (max-width: 767px)": {
                                fontSize: "14px",
                                paddingX: "20px",
                                height: "40px",
                            },
                        }}
                    >
                        Register new student
                    </Button>
                </Link>
            </Box>
            <Box
                sx={{
                    display: "flex", justifyContent: "space-between", gap: "100px",
                    "@media (max-width: 997px)": {
                        flexDirection: "column", // Stack elements on small screens
                        gap: "10px", // Reduce gap for better spacing
                        mt: "20px",
                    },
                }}
            >
                <Typography
                    variant="h2"
                    color={colors.grey[100]}
                    fontWeight="bold"
                    sx={{
                        mb: "5px", "@media (max-width: 767px)": {
                            fontSize: "24px",
                        },
                    }}
                    textTransform={"capitalize"}
                >
                    {currentDate}
                </Typography>
                <Box
                    display="flex"
                    backgroundColor={colors.primary[400]}
                    borderRadius="3px"
                    sx={{
                        "@media (max-width: 767px)": {
                            maxWidth: 400,
                            ml: "auto",
                        },
                    }}
                >
                    <InputBase
                        sx={{
                            ml: 2,
                            flex: 1,
                            color: colors.grey[100],
                            p: 1.5,
                            fontSize: 16,
                            fontWeight: "500",
                            minWidth: 400,
                            "@media (max-width: 767px)": {
                                maxWidth: 350,
                                minWidth: 0,
                                fontSize: "14px",
                                p: 1,
                            },
                        }}
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Search by No. or Name"
                    />

                    <IconButton
                        type="button"
                        sx={{ p: 2 }}
                        onClick={() => {
                            if (searchQuery) { // Only call the function if there is a value
                                setSearchQuery(""); // Clear the search query
                                setFilteredChildren(children); // Reset the filtered children to the full list
                            }
                        }}
                    >
                        {searchQuery ? <RefreshOutlinedIcon /> : <SearchIcon />} {/* Show Refresh icon if there's text */}
                    </IconButton>

                </Box>
            </Box>
            <Box
                m="40px 0 0 0"
                height="75vh"
                sx={{
                    overflow: "auto",
                    "& .MuiDataGrid-cell": {
                        borderBottom: `1px solid ${colors.grey[300]}`, // Change this to your desired color
                    },
                    "& .MuiDataGrid-root": {
                        border: "none",
                    },
                    "& .name-column--cell": {
                        color: colors.greenAccent[300],
                    },
                    "& .MuiDataGrid-columnHeader": {
                        backgroundColor: colors.blueAccent[700],
                        borderBottom: "none",
                    },
                    "& .MuiDataGrid-virtualScroller": {
                        backgroundColor: colors.primary[400],
                    },
                    "& .MuiDataGrid-footerContainer": {
                        borderTop: "none",
                        backgroundColor: colors.blueAccent[700],
                    },
                    "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
                        color: `${colors.grey[500]} !important`,
                    },
                }}
            >
                <DataGrid
                    rows={filteredChildren} // Use the formatted data
                    columns={columns}
                    loading={loading}
                    sortModel={[
                        {
                            field: "sno", // The field to sort by
                            sort: "asc", // Sort in ascending order
                        },
                    ]}
                    slotProps={{
                        loadingOverlay: {
                            variant: 'linear-progress',
                            noRowsVariant: 'linear-progress',
                            sx: {
                                '& .MuiLinearProgress-bar': {
                                    backgroundColor: colors.grey[100], // White for dark mode, black for light mode
                                },
                            },
                        },
                    }}
                    pageSize={5}
                    rowsPerPageOptions={[5, 10, 20]}
                    disableSelectionOnClick
                    getRowId={(row) => row.child_id} // Use the `id` field as the unique identifier
                    sx={{
                        minWidth: '1000px',
                    }}
                />
            </Box>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" }, // Stack on small screens, inline on larger screens
                    gap: "20px",
                    mt: 5,
                    width: "100%", // Make the container span the full width
                }}
            >
                <TextField
                    label="Enter your message"
                    multiline
                    rows={1}
                    fullWidth
                    color="secondary"
                    value={message} // Bind the TextField value to the state
                    onChange={(e) => setMessage(e.target.value)} // Update the state on change
                    sx={{
                        width: "100%",
                        backgroundColor: colors.primary[400],
                    }}
                />
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        flexDirection: { xs: "column", sm: "row" }, // Stack on small screens, inline on larger screens
                        gap: { xs: 2, sm: 3 }, // Adjust gap for small and large screens
                        width: { xs: "100%", sm: "auto" }, // Full width on small screens
                    }}
                >
                    <Button
                        endIcon={<RefreshOutlinedIcon />}
                        variant="contained"
                        type="button"
                        onClick={() => setMessage("")} // Clear the TextField value
                        sx={{
                            gridColumn: "span 4",
                            width: "120px",
                            textTransform: "capitalize",
                            color: colors.grey[100],
                            fontSize: "17px",
                            fontWeight: "500",
                            paddingY: "10px",
                            backgroundColor: colors.redAccent[600],
                            "&:hover": {
                                backgroundColor: colors.redAccent[500],
                            },
                            "@media (max-width: 767px)": {
                                width: "100%",
                                fontSize: "14px",
                                paddingX: "20px",
                                height: "40px",
                            },
                        }}
                    >
                        Clear
                    </Button>
                    <Button
                        loading={sendBtnLoading}
                        loadingPosition="end"
                        endIcon={<SendIcon />}
                        variant="contained"
                        type="button"
                        onClick={handleSendAll}
                        sx={{
                            gridColumn: "span 4",
                            width: "150px",
                            textTransform: "capitalize",
                            color: colors.grey[100],
                            fontSize: "17px",
                            fontWeight: "500",
                            paddingY: "10px",
                            backgroundColor: colors.blueAccent[700],
                            "&:hover": {
                                backgroundColor: colors.blueAccent[600],
                            },
                            "@media (max-width: 767px)": {
                                width: "100%",
                                fontSize: "14px",
                                paddingX: "20px",
                                height: "40px",
                            },
                        }}
                    >
                        Send
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default GradePage;
