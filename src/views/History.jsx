import { useState, useEffect } from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Checkbox, useTheme, Box, Button, IconButton, InputBase, MenuItem, Typography, FormControl, Select, InputLabel, useMediaQuery, TextField } from "@mui/material";
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
import CircularProgress, {
    circularProgressClasses,
} from '@mui/material/CircularProgress';
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { toast } from "react-toastify"; // Add this import if not already present
import StatsCard from "../components/StatsCard";
import PeopleIcon from '@mui/icons-material/People';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';

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

const History = () => {
    const [children, setChildren] = useState([]); // List of children
    const [filteredChildren, setFilteredChildren] = useState([]); // Filtered list for search
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false); // Loading state
    const [selectedClass, setSelectedClass] = useState(Cookies.get("selectedClass") || ""); const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const navigate = useNavigate();
    const themeMode = theme.palette.mode === "dark" ? "dark" : "light";
    const [gradeTitle, setGradeTitle] = useState("Nursery");
    const [selectedGrade, setSelectedGrade] = useState('');
    const [currentDate, setCurrentDate] = useState("");
    const [grades, setGrades] = useState(null);
    const [isPageLoading, setIsPageLoading] = useState(true);
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [years, setYears] = useState([]); // State to store years
    const [months, setMonths] = useState([]);
    const [tableDayHeaders, setDableDayHeaders] = useState([]);
    const [routeName, setRouteName] = useState('');
    const [isGradesLoading, setIsGradesLoading] = useState(false);
    const [userEmail, setUserEmail] = useState(Cookies.get("userEmail") || ""); // Selected class
    const isNonMobile = useMediaQuery("(min-width:800px)");
    const [totalActiveStudents, setTotalActiveStudents] = useState(0);
    const [totalPaidStudents, setTotalPaidStudents] = useState(0);
    const [hasFetched, setHasFetched] = useState(false); // Add this state
    const [paidCountForTuition, setPaidCountForTuition] = useState(0);
    const [selectedChildren, setSelectedChildren] = useState([]); // IDs of selected children
    const [message, setMessage] = useState(""); // Message input
    const [sendBtnLoading, setSendBtnLoading] = useState(false);

    // Function to determine which grades to show based on selectedClass
    const fetchGrades = async () => {
        setIsGradesLoading(true);
        try {
            const response = await axiosClient.post("/grades", {
                selectedClass, // Send the selected class ID
            });

            const gradesData = response.data.data || []; // Use the 'data' key from the backend response
            // console.log("Grades data:", gradesData); // Log the grades data for debugging

            // Update the grades dropdown options
            setGrades(gradesData);

            // Automatically select the first grade and its corresponding day_id if available
            if (gradesData.length > 0) {
                setSelectedGrade(gradesData[0].id || ""); // Set the first grade's ID
            } else {
                setSelectedGrade(""); // Reset if no grades are available
            }
        } catch (error) {
            console.error("Error fetching grades:", error);
            setGrades([]); // Reset grades on error
            setSelectedGrade(""); // Reset grade on error
        } finally {
            setIsGradesLoading(false);
        }
    };

    const fetchYearsAndMonths = async () => {
        try {
            // Fetch years
            const yearsResponse = await axiosClient.get('/years');
            const formattedYears = yearsResponse.data.map((year) => ({
                value: year.id, // Use the `id` as the value
                label: year.year, // Use the `year` for display
            }));
            setYears(formattedYears);

            // Fetch months
            const monthsResponse = await axiosClient.get('/months');
            const formattedMonths = monthsResponse.data.map((month) => ({
                value: month.id, // Use the `id` as the value
                name: month.month, // Use the `name` for display
            }));
            setMonths(formattedMonths);

            // Auto-select the current year and month
            const currentDate = new Date();
            setYear(currentDate.getFullYear().toString());
            setMonth((currentDate.getMonth() + 1).toString()); // Months are 0-indexed
        } catch (error) {
            console.error("Error fetching years and months:", error);
        } finally {
            setIsPageLoading(false); // Set loading to false after fetching
        }
    };


    // Fetch current date for display
    useEffect(() => {
        const date = new Date();
        const options = { month: "long" };
        const month = date.toLocaleDateString("en-US", options);
        const year = date.getFullYear();
        setCurrentDate(`${year} ${month}`);

        if (selectedClass) {
            fetchYearsAndMonths();
            fetchGrades();
        }
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
    }, []);

    // Fetch children data whenever the grades value is updated
    useEffect(() => {
        if (selectedGrade && year && month) {
            fetchFilteredReports(); // Fetch reports when the grades changes
        }
    }, [selectedGrade, year, month]); // Trigger this effect whenever the grades changes

    useEffect(() => {
        if (selectedGrade && grades) {
            // Find the grade name based on the selectedGrade ID
            const selectedGradeObject = grades.find((grade) => grade.id === selectedGrade);
            if (selectedGradeObject) {
                const gradeTitle = selectedGradeObject.grade;
                setGradeTitle(gradeTitle); // Update the gradeTitle state

                // Remove the word "Grade" and split the title into words
                let words = gradeTitle.replace(/Grade\s*/gi, '').split(' ');

                if (words.length > 1) {
                    // Get the first character of the last word
                    const firstCharOfLastWord = words[words.length - 1][0];

                    // Remove the last word
                    words.pop();

                    // Handle multiple grades separated by commas
                    words = words.map(word => word.replace(/,/g, '-')); // Replace commas with hyphens

                    // Generate the route name
                    const route = firstCharOfLastWord + words
                        .map(word => {
                            // Check if the word contains a hyphen (indicating multiple numbers)
                            if (word.includes('-')) {
                                return word; // Preserve the entire word if it contains a hyphen
                            }
                            // Check if the word is a number
                            return /^\d+$/.test(word.trim()) ? word : word[0];
                        })
                        .join(''); // Join the letters/numbers to form the route name

                    // console.log(route); // Log the route name for debugging
                    setRouteName(route); // Update the routeName state
                } else {
                    // Handle cases where there's only one word left after removing "Grade"
                    const route = /^\d+$/.test(words[0].trim()) ? words[0] : words[0][0];
                    setRouteName(route);
                }
            }
        }
    }, [selectedGrade, grades]);

    // Handle search input change
    const handleSearchChange = (event) => {
        const query = event.target.value.toLowerCase();
        setSearchQuery(query);

        // Filter children based on search query
        const filtered = children.filter((child) =>
            child.sno.toString().toLowerCase().includes(query) ||
            child.child_name.toLowerCase().includes(query) ||
            child.gWhatsapp.toLowerCase().includes(query)
        );
        setFilteredChildren(filtered);
    };


    const fetchFilteredReports = async () => {
        setLoading(true);
        setHasFetched(true); // Mark that a fetch has been attempted
        setChildren([]); // Clear previous data
        setFilteredChildren([]); // Clear previous data

        try {
            const response = await axiosClient.get('/history', {
                params: {
                    tuitionId: selectedGrade,
                    year,
                    month,
                },
            });

            const { students, dayHeaders } = response.data;

            setDableDayHeaders(dayHeaders);

            if (!students || students.length === 0) {
                setChildren([]); // No data
                setFilteredChildren([]);
                return;
            }

            // Filter the response data
            const filteredData = students.filter((child) => {
                const weeksTrueCount = [
                    child.week1,
                    child.week2,
                    child.week3,
                    child.week4,
                    child.week5,
                ].filter(Boolean).length;
                return (
                    child.status || (weeksTrueCount >= 2 || child.paid)
                );
            });

            setChildren(filteredData);
            setFilteredChildren(filteredData);
        } catch (error) {
            setChildren([]);
            setFilteredChildren([]);
            setDableDayHeaders([]);
            console.error("Error fetching reports:", error);
        } finally {
            setLoading(false);
        }
    };

    // Add this function inside your component
    // Modified handlePrintReport function with error handling
    const handlePrintReport = () => {
        try {
            const doc = new jsPDF();

            // Set font to Helvetica
            doc.setFont("Helvetica");

            // Add outer frame
            doc.setLineWidth(0.2); // Outer frame line thickness
            doc.rect(7, 7, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 14); // Outer frame

            // Title styling
            doc.setFontSize(20);
            doc.setFont("Helvetica", "bold");

            // Find the month name using the selected month ID
            const selectedMonth = months.find((m) => m.value == parseInt(month));
            const monthName = selectedMonth ? selectedMonth.name : "Unknown";

            // Subtitle with month and year
            doc.setFontSize(16);
            doc.text(`${gradeTitle} ${monthName} - ${year}`, doc.internal.pageSize.width / 2, 30, { align: "center" });

            // Create dynamic table headers
            const headers = [
                { content: '', styles: { halign: 'center' } },
                { content: 'Name', styles: { halign: 'center' } },
                ...tableDayHeaders.map((day) => ({ content: day, styles: { halign: 'center' } })),
            ];

            // Prepare student data
            const tableData = (filteredChildren && filteredChildren.length > 0)
                ? filteredChildren.map((student, index) => {
                    const createdAt = new Date(student.created_at);

                    return [
                        { content: (index + 1).toString().padStart(2, '0'), styles: { halign: 'center' } },
                        { content: student.child_name, styles: { halign: 'left' } },
                        { content: createdAt > new Date(year, month - 1, 7) ? '-' : (student.week1 ? '.' : '0'), styles: { halign: 'center' } },
                        { content: createdAt > new Date(year, month - 1, 14) ? '-' : (student.week2 ? '.' : '0'), styles: { halign: 'center' } },
                        { content: createdAt > new Date(year, month - 1, 21) ? '-' : (student.week3 ? '.' : '0'), styles: { halign: 'center' } },
                        { content: createdAt > new Date(year, month - 1, 28) ? '-' : (student.week4 ? '.' : '0'), styles: { halign: 'center' } },
                        { content: createdAt > new Date(year, month - 1, 35) ? '-' : (student.week5 ? '.' : '0'), styles: { halign: 'center' } },
                    ];
                })
                : []; // Empty body if no student data is available

            // Draw the table
            autoTable(doc, {
                head: [headers],
                body: tableData,
                startY: 40,
                theme: 'grid',
                styles: {
                    font: 'Helvetica',
                    fontSize: 10,
                    cellPadding: 2.5,
                    lineWidth: 0.5,
                },
                headStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    lineColor: [0, 0, 0],
                    lineWidth: 0.2,
                },
                bodyStyles: {
                    fillColor: [255, 255, 255],
                    textColor: [0, 0, 0],
                    lineColor: [0, 0, 0],
                    lineWidth: 0.2,
                },
                columnStyles: {
                    0: { cellWidth: 15 },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 25 },
                    3: { cellWidth: 25 },
                    4: { cellWidth: 25 },
                },
                tableWidth: 'auto',
                margin: { left: 30, right: 30 },
                didDrawCell: (data) => {
                    // Check if the cell contains a checkmark
                    if (data.column.index > 1 && data.row.raw[data.column.index]?.content === '.') {
                        const imagePath = '/assets/checkmark-icon.png'; // Path to your checkmark image
                        const { x, y, width, height } = data.cell; // Get cell dimensions
                        const iconSize = 5; // Size of the icon (width and height)

                        // Calculate the position to center the icon
                        const centerX = x + (width - iconSize) / 2; // Center horizontally
                        const centerY = y + (height - iconSize) / 2; // Center vertically

                        // Add the image to the cell
                        doc.addImage(imagePath, 'PNG', centerX, centerY, iconSize, iconSize);

                        // Clear the text content (so the ✔ doesn't appear)
                        data.cell.text = [];
                    }
                },
            });

            // Save the PDF
            doc.save(`${gradeTitle}_Attendance_${month}_${year}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
        }
    };

    // Define columns for DataGrid
    const columns = [
        {
            field: "select",
            headerName: "Select",
            flex: 0.6,
            renderHeader: () => (
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
                        color: params.row.register ? "#2ECC71" : "#E74C3C", // Green if registered, red if not
                    }}
                    onClick={() => {
                        navigate(`/${routeName.toLowerCase()}/student`, {
                            state: {
                                child: params.row.child_id, // Pass the selected child ID
                                tuitionId: selectedGrade,  // Pass the selected tuitionId
                            },
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
                    onChange={(e) => handlePaidChange(params.row, e.target.checked)}
                    sx={{
                        color: params.row.notpaid ? "#E74C3C" : "#F1C40F", // Red if notpaid is true, yellow otherwise
                        "&.Mui-checked": {
                            color: params.row.notpaid ? "#E74C3C" : "#e3bc22", // Red if notpaid is true, yellow otherwise
                        },
                    }}
                />
            ),
        },
    ];

    // Function to handle paid status change
    const handlePaidChange = async (child, checked) => {
        if (!userEmail) {
            toast.error("User email is missing. Please log in again.");
            return;
        }
        try {
            setLoading(true);
            // Call the new endpoint for updating paid status WITHOUT WhatsApp
            await axiosClient.post("/update-paid-status", {
                child_id: child.child_id,
                tuition_id: selectedGrade,
                paid: checked,
                email: userEmail,
                month: month,
                year: year,
            });
            setChildren((prev) =>
                prev.map((c) =>
                    c.child_id === child.child_id ? { ...c, paid: checked } : c
                )
            );
            setFilteredChildren((prev) =>
                prev.map((c) =>
                    c.child_id === child.child_id ? { ...c, paid: checked } : c
                )
            );
            toast.success("Paid status updated!");
        } catch (error) {
            toast.error("Failed to update paid status.");
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
            setSelectedChildren(filteredChildIds);
        } else {
            // Deselect all
            setSelectedChildren([]);
        }
    };

    // Handle sending messages
    const handleSendAll = async () => {
        if (message.trim() === "") {
            ToastNotification("Message is empty. Please enter a message.", "warning", themeMode);
            return;
        }
        if (!selectedGrade) {
            ToastNotification("Tuition ID is missing. Please try again.", "error", themeMode);
            return;
        }
        setSendBtnLoading(true);
        try {
            await axiosClient.post("/send-message-to-tuitions", {
                message,
                tuition_id: selectedGrade,
                child_ids: selectedChildren,
            });
            ToastNotification("Messages sent successfully!", "success", themeMode);
        } catch (error) {
            ToastNotification(`Error sending messages: ${error.response?.data?.message || error.message}`, "error", themeMode);
        } finally {
            setSendBtnLoading(false);
            setMessage("");
            setSelectedChildren([]);
        }
    };

    // Fetch paid student count for selected tuition
    useEffect(() => {
        if (selectedGrade && year && month) {
            axiosClient
                .get('/history', {
                    params: {
                        tuitionId: selectedGrade,
                        year,
                        month,
                    },
                })
                .then((response) => {
                    const students = response.data.students || [];
                    // Count students where paid is true
                    const paidCount = students.filter((s) => s.paid).length;
                    setPaidCountForTuition(paidCount);
                })
                .catch(() => setPaidCountForTuition(0));
        }
    }, [selectedGrade, year, month]);

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
                    mb: { xs: 3, md: 1 },
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
                        value={paidCountForTuition}
                        subtext="Students who paid this month"
                        icon={<PaidOutlinedIcon />}
                        color={colors.redAccent[400]}
                    />
                </Box>
            </Box>

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: { xs: "flex-start", md: "center" }, // Align items vertically centered in desktop, top in mobile
                    flexDirection: { xs: "column", md: "row" }, // Stack vertically in mobile, row in desktop
                    gap: { xs: 1, md: 0 }, // Add gap in mobile view for spacing between Header and Button
                    mb: 2,
                }}
            >
                <Header
                    title="History"
                    subtitle="Effortlessly Navigate History with Our Intuitive Interface.."
                />
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end", // Always align button to the right
                        width: { xs: "100%", md: "auto" }, // Full width in mobile, auto in desktop
                    }}
                >
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handlePrintReport}
                        sx={{
                            textTransform: "none",
                            backgroundColor: colors.greenAccent[700],
                            color: colors.grey[100],
                            fontSize: "17px",
                            paddingX: "25px",
                            height: "50px",
                            fontWeight: "500",
                            "&:hover": {
                                backgroundColor: colors.greenAccent[800],
                            },
                            "@media (max-width: 767px)": {
                                fontSize: "14px",
                                paddingX: "20px",
                                height: "40px",
                            },
                        }}
                    >
                        Print Report
                    </Button>
                </Box>
            </Box>

            <Box
                sx={{
                    display: "flex", justifyContent: "space-between", gap: "100px", mt: 4,
                    "@media (max-width: 1300px)": {
                        flexDirection: "column", // Stack elements on small screens
                        gap: "10px", // Reduce gap for better spacing
                        mt: "20px",
                    },
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "20px", // Add spacing between the selects
                        "@media (max-width: 767px)": {
                            flexDirection: "column", // Stack selects on smaller screens
                            gap: "10px",
                        },
                    }}
                >
                    {/* Grade Select */}
                    <FormControl
                        variant="filled"
                        sx={{
                            minWidth: 149,
                            "& .MuiInputBase-root": {
                                backgroundColor: colors.primary[400],
                            },
                            "& .MuiInputBase-root:hover": {
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
                            onChange={(e) => {
                                setSelectedGrade(e.target.value); // Only update state
                            }}
                        >
                            {isGradesLoading ? (
                                <MenuItem value="" disabled>
                                    Loading grades...
                                </MenuItem>
                            ) : grades.length > 0 ? (
                                grades.map((grade) => (
                                    <MenuItem key={grade.id} value={grade.id}>
                                        {grade.grade}
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem value="" disabled>
                                    No grades available
                                </MenuItem>
                            )}
                        </Select>
                    </FormControl>

                    {/* Year Select */}
                    <FormControl
                        variant="filled"
                        sx={{
                            minWidth: 149,
                            "& .MuiInputBase-root": {
                                backgroundColor: colors.primary[400],
                            },
                            "& .MuiInputBase-root:hover": {
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
                        <InputLabel id="year-select-label">Year</InputLabel>
                        <Select
                            labelId="year-select-label"
                            id="year-select"
                            value={year || ""}
                            onChange={(e) => {
                                setYear(e.target.value); // Update the year state
                            }}
                        >
                            {years.map((y) => (
                                <MenuItem key={y.value} value={y.label}>
                                    {y.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Month Select */}
                    <FormControl
                        variant="filled"
                        sx={{
                            minWidth: 149,
                            "& .MuiInputBase-root": {
                                backgroundColor: colors.primary[400],
                            },
                            "& .MuiInputBase-root:hover": {
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
                        <InputLabel id="month-select-label">Month</InputLabel>
                        <Select
                            labelId="month-select-label"
                            id="month-select"
                            value={month || ""}
                            onChange={(e) => {
                                setMonth(e.target.value); // Update the month state
                            }}
                        >
                            {months.map((m) => (
                                <MenuItem key={m.value} value={m.value}>
                                    {m.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
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
            {hasFetched && (
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
                    <ToastContainer />
                    <DataGrid
                        rows={filteredChildren}
                        columns={columns}
                        loading={loading}
                        components={{
                            NoRowsOverlay: () => (
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        height: "100%",
                                        color: colors.grey[400],
                                        fontSize: 18,
                                    }}
                                >
                                    No data
                                </Box>
                            ),
                        }}
                        pageSize={5}
                        rowsPerPageOptions={[5, 10, 20]}
                        disableSelectionOnClick
                        getRowId={(row) => row.child_id}
                        sx={{
                            minWidth: '1000px',
                        }}
                    />
                </Box>
            )}

            {/* Message input and send button */}
            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: "20px",
                    mt: 5,
                    width: "100%",
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

export default History;
