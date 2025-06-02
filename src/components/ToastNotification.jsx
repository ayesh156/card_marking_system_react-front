import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ToastNotification = (message, type = "success", themeMode = "dark") => {
    toast[type](message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: themeMode, // Use the passed theme mode
    });
};

export default ToastNotification;