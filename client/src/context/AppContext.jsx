import { createContext, useState, useEffect } from "react";
import { dummyCourses } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration";
import { useAuth, useUser } from "@clerk/clerk-react";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    const currency = import.meta.env.VITE_CURRENCY;
    const navigate = useNavigate();

    const { getToken } = useAuth();
    const { user } = useUser(); // Fix: Corrected variable name

    const [allCourses, setAllCourses] = useState([]);
    const [isEducator, setIsEducator] = useState(true);
    const [enrolledCourses, setEnrolledCourses] = useState({});

    // Fetch all courses
    const fetchAllCourses = async () => {
        setAllCourses(dummyCourses);
    };

    const calculateRating = (course) => {
        if (course.courseRatings.length === 0) {
            return 0;
        }
        let totalRating = 0;
        course.courseRatings.forEach((rating) => {
            totalRating += rating.rating;
        });
        return totalRating / course.courseRatings.length;
    };

    // Function to calculate chapter time
    const calculateChapterTime = (chapter) => {
        let time = 0;
        chapter.chapterContent.forEach((lecture) => (time += lecture.lectureDuration));
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
    };

    // Function to calculate course duration
    const calculateCourseDuration = (course) => {
        let time = 0;
        course.courseContent.forEach((chapter) => {
            chapter.chapterContent.forEach((lecture) => (time += lecture.lectureDuration));
        });
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
    };

    // Function to calculate the number of lectures in a course
    const calculateNoOfLectures = (course) => {
        let totalLectures = 0;
        course.courseContent.forEach((chapter) => {
            if (Array.isArray(chapter.chapterContent)) {
                totalLectures += chapter.chapterContent.length;
            }
        });
        return totalLectures;
    };

    const fetchUserEnrolledCourses = async () => {
        setEnrolledCourses(dummyCourses);
    };

    useEffect(() => {
        fetchAllCourses();
        fetchUserEnrolledCourses();
    }, []);

    useEffect(() => {
        if (user) {
            (async () => {
                console.log(await getToken()); // Fix: Async function wrapped inside useEffect
            })();
        }
    }, [user]);

    const value = {
        currency,
        allCourses,
        navigate,
        calculateRating,
        isEducator,
        setIsEducator,
        calculateChapterTime,
        calculateCourseDuration,
        calculateNoOfLectures,
        enrolledCourses,
        setEnrolledCourses,
        fetchUserEnrolledCourses,
    };

    return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};
