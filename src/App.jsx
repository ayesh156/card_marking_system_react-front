import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./theme.js";
import { useState, useEffect } from "react";
import Sidebar from "./components/global/Sidebar.jsx";
import Topbar from "./components/global/Topbar.jsx";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import GradePage from "./views/GradePage.jsx";
import StudentPage from "./views/StudentPage.jsx";
import Classes from "./views/Classes.jsx";
import Login from "./views/Login.jsx";
import Dashboard from "./views/Dashboard.jsx";
import Cookies from "js-cookie";
import Message from "./views/Message.jsx";
import Settings from "./views/Settings.jsx";
import History from "./views/History.jsx";


function App() {
    const [theme, colorMode] = useMode();
    const navigate = useNavigate();

    // Load initial states from localStorage
    const [authenticated, setAuthenticated] = useState(() => {
        return !!localStorage.getItem("ACCESS_TOKEN"); // Check if the token exists
    });
    const [classSelected, setClassSelected] = useState(() => {
        return Cookies.get("classSelected") === "true";
    });
    const [selectedClass, setSelectedClass] = useState(() => {
        return Cookies.get("selectedClass") || null;
    });

    const [userEmail, setUserEmail] = useState(() => {
        return Cookies.get("userEmail") || null; // Retrieve email from cookies
    });


    // Save states to cookies whenever they change
    useEffect(() => {
        Cookies.set("classSelected", classSelected);
        Cookies.set("selectedClass", selectedClass);
    }, [classSelected, selectedClass]);

    const handleLogin = (email) => {
        Cookies.set("userEmail", email, { expires: 30 })
        setUserEmail(email); // Update the userEmail state
        setAuthenticated(true); // Set authenticated to true
        navigate("/"); // Navigate to the main app layout
    };


    const handleClassSelection = (className) => {
        Cookies.set("classSelected", true);
        Cookies.set("selectedClass", className);
        setClassSelected(true);
        setSelectedClass(className);

        setTimeout(() => {
            navigate("/"); // Navigate after a short delay
        }, 100); // 100ms delay
    };

    window.addEventListener('beforeunload', function () {
        const perf = performance.navigation;

        if (perf.type === PerformanceNavigation.TYPE_RELOAD) {
            console.log("Page is reloading");
        } else if (
            perf.type === PerformanceNavigation.TYPE_NAVIGATE ||
            perf.type === PerformanceNavigation.TYPE_BACK_FORWARD
        ) {
           // Example: Send a quick beacon to the server
        localStorage.removeItem("ACCESS_TOKEN"); // Remove the token
        Cookies.remove("userEmail"); // Remove the email cookie
        Cookies.remove("classSelected"); // Remove class selection cookie
        Cookies.remove("selectedClass"); // Remove selected class cookie
        }
    });

    // window.addEventListener('unload', function (e) {
    //     // Example: Send a quick beacon to the server
    //     localStorage.removeItem("ACCESS_TOKEN"); // Remove the token
    //     Cookies.remove("userEmail"); // Remove the email cookie
    //     Cookies.remove("classSelected"); // Remove class selection cookie
    //     Cookies.remove("selectedClass"); // Remove selected class cookie
    // });

    return (
        <>
            <ColorModeContext.Provider value={colorMode}>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    {authenticated ? (
                        classSelected ? (
                            <div className="app">
                                <Sidebar userEmail={userEmail} />
                                <main className="content">
                                    {/* Pass selectedClass to Topbar */}
                                    <Topbar />
                                    <Routes>
                                        {/* Pass selectedClass to GradePage and StudentPage */}
                                        <Route path="/" element={<Dashboard />} />

                                        <Route path="/:gradePath" element={<GradePage />} />

                                        <Route path={`/:gradePath/student`} element={<StudentPage />} />
                                        <Route path={`/student`} element={<StudentPage />} />

                                        <Route path="/message" element={<Message />} />
                                        <Route path="/settings" element={<Settings />} />
                                        <Route path="/history" element={<History />} />
                                        <Route path="*" element={<Dashboard />} />
                                    </Routes>
                                </main>
                            </div>
                        ) : (
                            <Routes>
                                <Route path="/" element={<Classes onClassSelect={handleClassSelection} />} />
                                <Route path="*" element={<Navigate to={"/"} />} />
                            </Routes>
                        )
                    ) : (
                        <Routes>
                            <Route path="/" element={<Login onLogin={handleLogin} />} />
                            <Route path="*" element={<Navigate to={"/"} />} />
                        </Routes>
                    )}
                </ThemeProvider>
            </ColorModeContext.Provider>
        </>
    );
}

export default App;
