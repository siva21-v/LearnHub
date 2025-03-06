import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth, useUser } from "@clerk/clerk-react";
import humanizeDuration from "humanize-duration";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const currency = import.meta.env.VITE_CURRENCY;
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const { user } = useUser();

    const [showLogin, setShowLogin] = useState(false);
    const [isEducator, setIsEducator] = useState(false);
    const [allCourses, setAllCourses] = useState([]);
    const [userData, setUserData] = useState(null);
    const [enrolledCourses, setEnrolledCourses] = useState([]);

    // Fetch All Courses (with sessionStorage caching)
    useEffect(() => {
        const cachedCourses = sessionStorage.getItem("allCourses");
        if (cachedCourses) {
            setAllCourses(JSON.parse(cachedCourses));
        } else {
            fetchAllCourses();
        }
    }, []);

    const fetchAllCourses = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/course/all`);
            if (data.success) {
                setAllCourses(data.courses);
                sessionStorage.setItem("allCourses", JSON.stringify(data.courses));
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to fetch courses.");
        }
    };

    // Fetch User Data
    useEffect(() => {
        if (user?.id) {
            fetchUserData();
            fetchUserEnrolledCourses();
        }
    }, [user?.id]);

    const fetchUserData = async () => {
        try {
            if (user.publicMetadata.role === "educator") {
                setIsEducator(true);
            }
            const token = await getToken();
            const { data } = await axios.get(`${backendUrl}/api/user/data`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (data.success) {
                setUserData(data.user);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to load user data.");
        }
    };

    // Fetch Enrolled Courses
    const fetchUserEnrolledCourses = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get(`${backendUrl}/api/user/enrolled-courses`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (data.success) {
                setEnrolledCourses(data.enrolledCourses.reverse());
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to load enrolled courses.");
        }
    };

    // Utility Functions
    const calculateChapterTime = (chapter) => {
        let time = 0;
        chapter.chapterContent.forEach((lecture) => (time += lecture.lectureDuration));
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
    };

    const calculateCourseDuration = (course) => {
        let time = 0;
        course.courseContent.forEach((chapter) =>
            chapter.chapterContent.forEach((lecture) => (time += lecture.lectureDuration))
        );
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
    };

    const value = {
        showLogin, setShowLogin,
        backendUrl, currency, navigate,
        userData, setUserData, getToken,
        allCourses, fetchAllCourses,
        enrolledCourses, fetchUserEnrolledCourses,
        calculateChapterTime, calculateCourseDuration,
        isEducator, setIsEducator
    };

    return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};
