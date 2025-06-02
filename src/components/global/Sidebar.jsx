import { useState, useEffect, useRef } from "react";
import { Menu, MenuItem, ProSidebar } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { tokens } from "../../theme";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import ListIcon from '@mui/icons-material/List';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import "react-toastify/dist/ReactToastify.css";
import "react-pro-sidebar/dist/css/styles.css";
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import Cookies from "js-cookie";
import axiosClient from "../../../axios-client.js";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'; // Add this import

const Item = ({ title, to, icon, selected, setSelected, onClick }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    return (
        <MenuItem
            active={selected === title}
            style={{
                color: colors.grey[100],
            }}
            onClick={() => {
                if (onClick) onClick();
                setSelected(title);

                // Set the grade cookie based on the title
                if (title === "Primary") {
                    Cookies.set("grade", "P"); // Set "P" for Primary
                } else if (title.startsWith("Grade")) {
                    const gradeNumber = title.replace("Grade", ""); // Extract the grade number
                    Cookies.set("grade", gradeNumber); // Set the grade number

                }
            }}
            icon={icon}
        >
            <Typography>{title}</Typography>
            <Link to={to} />
        </MenuItem>
    );
};

const Sidebar = ({ userEmail }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(window.innerWidth <= 767);
    const [selected, setSelected] = useState("Dashboard");
    const [selectedClass, setSelectedClass] = useState(null);
    const hasGradeSet = useRef(false);
    const [categoriesWithGrades, setCategoriesWithGrades] = useState([]);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [userDetails, setUserDetails] = useState(null);

    useEffect(() => {
        const storedClass = Cookies.get("selectedClass"); // Get the selected class from cookies
        setSelectedClass(storedClass);

        const pathName = location.pathname.split("/")[1]; // Get the first part of the path

        if (pathName) {
            // Capitalize the first letter of the pathName
            const capitalizedPathName = pathName.charAt(0).toUpperCase() + pathName.slice(1);
            setSelected(capitalizedPathName); // Set the selected state
        } else {
            setSelected("Dashboard"); // Default to "Dashboard" if pathName is empty
        }
    }, [location]);

    const fetchData = async () => {
        try {
            const response = await axiosClient.get('/category-with-grades', {
                params: { class: selectedClass }, // Replace 'E' with the selected class ('E', 'S', or 'M')
            });
            // console.log(response.data);
            setCategoriesWithGrades(response.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const fetchUserDetails = async () => {
        if (userEmail) {
            try {
                const response = await axiosClient.get(`/user/${userEmail}`);
                setUserDetails(response.data); // Set user details in state
                // console.log(response.data); // Log the user details
            } catch (error) {
                console.error("Error fetching user details:", error);
            }
        }
    };

    // Function to handle window resize
    useEffect(() => {
        fetchUserDetails();

        const handleResize = () => {
            setIsCollapsed(window.innerWidth <= 767);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);

    }, []);


    useEffect(() => {
        if (selectedClass) {
            fetchData();
        }

    }, [selectedClass]);

    const handleClasses = () => {
        Cookies.set("classSelected", "false");
        navigate("/");
        window.location.reload();
    };

    const handleLogout = () => {
        localStorage.removeItem("ACCESS_TOKEN"); // Remove the token
        Cookies.remove("user_email"); // Remove the email cookie
        Cookies.remove("classSelected"); // Remove class selection cookie
        Cookies.remove("selectedClass"); // Remove selected class cookie
        navigate("/"); // Navigate to the login page
        window.location.reload(); // Reload the page to reset the state
    };

    // Refresh the page only once when gradeItems are set
    useEffect(() => {
        if (hasGradeSet.current) {
            window.location.reload(); // Reload the page
        }
    }, [hasGradeSet]);

    const toggleCategory = (categoryName) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [categoryName]: !prev[categoryName], // Toggle the expanded state
        }));
    };

    return (
        <Box
            sx={{
                "& .pro-sidebar-inner": {
                    background: `${colors.primary[900]} !important`,
                },
                "& .pro-icon-wrapper": {
                    backgroundColor: "transparent !important",
                },
                "& .pro-inner-item": {
                    padding: "5px 15px 5px 20px !important",
                },
                "& .pro-inner-item:hover": {
                    color: "#868dfb !important",
                },
                "& .pro-menu-item.active": {
                    color: "#6870fa !important",
                },
            }}
        >
            <ProSidebar width="220px" image="../../assets/bg.png" collapsed={isCollapsed}>
                <Menu iconShape="square">
                    {/* LOGO AND MENU ICON */}
                    <MenuItem
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
                        style={{
                            color: colors.grey[100],
                        }}
                    >
                        {!isCollapsed && (
                            <Box
                                display="flex"
                                justifyContent="end"
                                alignItems="center"
                            >
                                <IconButton onClick={() => setIsCollapsed(!isCollapsed)}>
                                    {isCollapsed ? <MenuOutlinedIcon /> : <CloseOutlinedIcon />}
                                </IconButton>
                            </Box>
                        )}
                    </MenuItem>

                    {!isCollapsed && userDetails && (
                        <Box mb="5px">
                            <Box display="flex" justifyContent="center" alignItems="center">
                                <img
                                    width="100px"
                                    height="100px"
                                    src={"../../assets/logo.jpg"}
                                    alt="User Avatar"
                                    style={{ cursor: "pointer", borderRadius: "50%" }}
                                />
                            </Box>
                            <Box textAlign="center">
                                <Typography
                                    variant="h2"
                                    color={colors.grey[100]}
                                    fontWeight="bold"
                                    sx={{ m: "10px 0 0 0" }}
                                >
                                    {userDetails.name || "User"}
                                </Typography>
                                <Typography variant="h5" color={colors.greenAccent[400]}>
                                    {userEmail}
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {/* MENU ITEMS */}
                    <Box paddingLeft={isCollapsed ? undefined : "13%"}>
                        <Item
                            title="Logout"
                            to="/"
                            icon={<ExitToAppIcon />}
                            onClick={handleLogout}
                        />
                        <Item
                            title="Classes"
                            to="/"
                            icon={<ListIcon />}
                            onClick={handleClasses}
                        />
                    </Box>

                    <Box mb="10px" paddingLeft={isCollapsed ? undefined : "10%"}>
                        <Item
                            title="Dashboard"
                            to="/"
                            icon={<HomeOutlinedIcon />}
                            selected={selected}
                            setSelected={setSelected}
                        />
                        {/* ...inside the return, after other menu items... */}
                        <Item
                            title="+ Student"
                            to="/student"
                            icon={<PersonAddAltIcon />}
                            selected={selected}
                            setSelected={setSelected}
                            onClick={() => navigate("/student", { state: { status: "all" } })}
                        />

                        {/* Dynamically Render Categories and Grades */}
                        {categoriesWithGrades.map((category, index) => (
                            <Box key={index}>
                                {/* Category Name */}
                                <MenuItem
                                    onClick={() => toggleCategory(category.category_name)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <Box display="flex" gap={isCollapsed ? 0 : 2} alignItems="center" width="100%">
                                        <Typography variant="h6" color={colors.grey[100]}>
                                            {isCollapsed
                                                ? category.category_name.charAt(0)
                                                : category.category_name}
                                        </Typography>
                                        <IconButton>
                                            {expandedCategories[category.category_name] ? (
                                                <ExpandLess />
                                            ) : (
                                                <ExpandMore />
                                            )}
                                        </IconButton>
                                    </Box>
                                </MenuItem>

                                {/* Grades (Sub-items) */}
                                {expandedCategories[category.category_name] && (
                                    <Box pl={isCollapsed ? 0 : 1} >
                                        {category.grades.map((grade, gradeIndex) => {
                                            // Generate route name with the first letter of the category
                                            const categoryPrefix = category.category_name.charAt(0).toLowerCase(); // First letter of category
                                            const routeName = grade === "Nursery"
                                                ? `${categoryPrefix}n` // Special case for "Primary"
                                                : `${categoryPrefix}${grade
                                                    .replace(/Grade\s/g, "") // Remove "Grade"
                                                    .replace(/,\s/g, "-") // Replace ", " with "-"
                                                    .toLowerCase()}`; // Convert to lowercase

                                            // Display logic: convert "grade1b" to "Grade 1 - B"
                                            let displayGrade = grade;
                                            const match = grade.match(/^grade\s*(\d+)[\s-]*([a-z])$/i);
                                            if (match) {
                                                displayGrade = `Grade ${match[1]} - ${match[2].toUpperCase()}`;
                                            }

                                            return (

                                                <MenuItem
                                                    key={`${category.category_name}-${grade}-${gradeIndex}`}
                                                    active={selected === routeName} // Highlight the selected sub-item
                                                    style={{
                                                        color: selected === routeName ? "inherit" : colors.grey[100], // Purple for selected, default for others
                                                    }}
                                                    onClick={() => setSelected(routeName)} // Set the selected sub-item
                                                >
                                                    <Link to={`/${routeName}`} style={{ textDecoration: "none", color: "inherit" }}>
                                                        <Box display="flex" alignItems="center" pt={1}>
                                                            <RadioButtonCheckedIcon
                                                                fontSize="1px"
                                                                style={{
                                                                    marginRight: isCollapsed ? "2px" : "8px",
                                                                    color: selected === routeName ? "inherit" : colors.grey[100], // Purple for selected
                                                                }}
                                                            />
                                                            <Typography color="inherit" variant="body2">
                                                                {!isCollapsed ? (
                                                                    displayGrade
                                                                ) : (
                                                                    displayGrade.replace("Grade ", "")
                                                                )}
                                                            </Typography>
                                                        </Box>
                                                    </Link>
                                                </MenuItem>
                                            )
                                        })}

                                    </Box>
                                )}
                            </Box>
                        ))}

                        <Typography
                            variant="h6"
                            color={colors.grey[100]}
                            sx={{ m: "15px 0 5px 20px" }}
                        >
                            Others
                        </Typography>
                        <Item
                            title="Message"
                            to="/message"
                            icon={<ChatOutlinedIcon />}
                            selected={selected}
                            setSelected={setSelected}
                        />
                        <Item
                            title="Settings"
                            to="/settings"
                            icon={<SettingsOutlinedIcon />}
                            selected={selected}
                            setSelected={setSelected}
                        />
                        <Item
                            title="History"
                            to="/history"
                            icon={<HistoryOutlinedIcon />}
                            selected={selected}
                            setSelected={setSelected}
                        />
                    </Box>
                </Menu>
            </ProSidebar>
        </Box>
    );
};

export default Sidebar;
