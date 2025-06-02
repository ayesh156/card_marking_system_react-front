/* eslint-disable react/prop-types */
import { createContext, useState, useContext, useEffect } from 'react';
import Cookies from 'js-cookie';
const user_token = import.meta.env.VITE_USER_TOKEN;
const apiUrl = import.meta.env.VITE_API_BASE_URL;

const AuthContext = createContext();
export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = Cookies.get(user_token)
    const [currentUser, setCurrentUser] = useState(user);



    const login = async (user, token) => {
        Cookies.set('user_token', token); // Session cookie
        localStorage.setItem('user', JSON.stringify(user));
        window.location.reload();
    };

    const logout = () => {
        localStorage.removeItem('user');
        Cookies.remove(user_token)
        setCurrentUser(null);
        window.location = '/'
    };



    useEffect(() => {
        // const checkSession = async () => {
        //     try {
        //         const res = await fetch(
        //             `${apiUrl}login`,
        //             {
        //                 method: "GET",
        //                 headers: {
        //                     Authorization: token,
        //                     Role: user.role
        //                 }

        //             }
        //         );
        //         const data = await res.json();
        //         if (data.unauthorized) {
        //             localStorage.removeItem('user')
        //             Cookies.remove(user_token)
        //             setCurrentUser(null)
        //         }
        //         if (data.authorized) {
        //             localStorage.setItem('user', JSON.stringify(data.authorized))
        //             setCurrentUser(user);

        //         }



        //     } catch (error) {
        //         console.log(error)

        //     }


        // }


        // if (!token || !user) {
        //     localStorage.removeItem('user')
        //     Cookies.remove(user_token)
        //     setCurrentUser(null)
        // } else {

        //     checkSession();
        // }
        
        const handleStorageChange = (event) => {
            if (event.key === 'user') {
                checkSession();

            }
        }
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ currentUser, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
