// Updated MainPage.jsx with sign-in only modal logic

import NavBar from "../../components/NavBar";
import styles from "../customer/MainPage.module.css";
import Sidebar from "../../components/Sidebar";
import { useState, useEffect, useRef } from "react";
import Course from "../../components/Course";
import { useCourses } from "../../contexts/CourseContext";
import Loader from "../../components/Loader";
import clsx from "clsx";
import { decodeHtmlEntities } from "../../services/helpers";
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../hooks/useUserContext';
import WelcomeModal from "../../components/WelcomeModal";
// import { fetchUsers } from "../../services/wordpressapi";
import { fetchAuthorInfo } from "../../services/wordpressapi";

function MainPage() {
  const { courseList, loading, users } = useCourses();
  const [fadeOut, setFadeOut] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [categoryResults, setCategoryResults] = useState([]);
  const [category, setCategory] = useState(null);
  const navigate = useNavigate();
  
  // Track if we've already shown the modal for this session
  const hasShownModalThisSession = useRef(false);
  const lastUserId = useRef(null);
  
  const {
    user,
    userProfile,
    enrolledCourses,
    favoritedCourses,
    loading: userLoading,
    error,
    clearError
  } = useUserContext();

  const [showLoader, setShowLoader] = useState(loading);
  
  // Show welcome modal ONLY on fresh sign-in
  useEffect(() => {
    // Only proceed if we have user data and it's not loading
    if (!user || !userProfile || userLoading) {
      return;
    }

    // Check if this is a new user sign-in (different from last user)
    let isNewSignIn = lastUserId.current !== user.id;
    
    // Update the last user ID
    lastUserId.current = user.id;

    if (isNewSignIn && !hasShownModalThisSession.current) {
      const hideWelcome = localStorage.getItem('hideWelcomeModal');
      
      if (!hideWelcome) {
        console.log('🎉 Showing welcome modal for fresh sign-in');
        
        // Mark that we've shown the modal this session
        hasShownModalThisSession.current = true;
        
        // Add a small delay for better UX
        const timer = setTimeout(() => {
          setShowWelcomeModal(true);
        }, 800);
        
        return () => clearTimeout(timer);
      } else {
        hasShownModalThisSession.current = true;
      }
    } else if (!isNewSignIn) {
      console.log('🔄 Same user - not showing welcome modal (page reload)');
    }
  }, [user, userProfile, userLoading]);

  // Reset session tracking when user logs out
  useEffect(() => {
    if (!user) {
      console.log('👋 User logged out - resetting session tracking');
      hasShownModalThisSession.current = false;
      lastUserId.current = null;
      setShowWelcomeModal(false);
    }
  }, [user]);

  const handleSearch = async (searchTerm) => {
    setIsSearching(true);
    setSearchTerm(searchTerm);
    
    try {
      const filteredCourses = courseList.filter(course => 
        decodeHtmlEntities(course.post_title)?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setSearchResults(filteredCourses);
      setIsSearching(false);
    } catch (error) {
      console.error('Search error:', error);
      setIsSearching(false);
    }
  };
  
  const clearSearch = () => {
    setSearchResults([]);
    setSearchTerm('');
  };

  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
  };

  // Manual trigger for welcome modal (from mini banner)
  const handleShowWelcomeModal = () => {
    setShowWelcomeModal(true);
  };

  const getCourseTags = (course) => {
    if (course?.course_tag && course.course_tag.length > 0){
      const tags = course.course_tag.map(course => course.slug)
      return tags
    }
    return []
  }

  const handleSelect = (category) => {
    console.log('Selected category:', category);
    setCategory(category);
    setIsSearching(true)
    try{
      courseList.forEach(course => console.log(getCourseTags(course)))
      console.log('RIGHT HERE!!!!', courseList[0]);
      console.log(getCourseTags(courseList[0]).includes("math"))
      const filteredCourses = courseList.filter(course => getCourseTags(course).includes(category));
      setCategoryResults(filteredCourses);
      console.log(filteredCourses)

    } catch (error) {
      console.error('Error filtering courses by category:', error);
    } finally{
      setIsSearching(false)
    }
  

  }

  // Clear any errors when component mounts
  useEffect(() => {
    if (error) {
      clearError();
    }
    console.log('Error cleared:', error);
  }, [error, clearError]);

  useEffect(() => {
    if (!loading) {
      setFadeOut(true);
      setTimeout(() => {
        setShowLoader(false);
      }, 500);
    }
  }, [loading]);

  const getAuthorInfo = async(id) => {
    try{
      const response = await fetchAuthorInfo(id);
      console.log('AUTHOR INFO', response.data.courses)
      return response || null
    } catch (error){
      console.log('error with author info', error)
    }
  }

  // Show loader while courses are loading
  if (showLoader) {
    return (
      <div className={clsx(
        styles['loader-container'], 
        fadeOut && styles['fade']
      )}>
        <Loader />
      </div>
    );
  }

  let coursesToDisplay = searchTerm ? searchResults : courseList;
  coursesToDisplay = category ? categoryResults : courseList;
  const usersMap = courseList.map(course => course.post_author);
  console.log('USERS MAP: ', usersMap)
  // let uniqueUsers = new Map();
  // usersMap.forEach(user => uniqueUsers.set(user.ID, user))
  // uniqueUsers = Array.from(uniqueUsers.values())

  // console.log('USERS RIGHT HERE.', users)
  // getAuthorInfo(users[0].ID)


  console.log('Courses to display:', coursesToDisplay);
  return (
    <>
      <NavBar onSearch={handleSearch} />
      <Sidebar onSelectCategory={handleSelect}/>
      
      {/* Welcome Modal - Only shows on fresh sign-in */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleCloseWelcomeModal}
        userProfile={userProfile}
        enrolledCount={enrolledCourses?.length || 0}
        favoritesCount={favoritedCourses?.length || 0}
      />
      
      <div className={styles["container"]}>
        <section className={styles["main-section"]}>
          {/* Display error message if there's an error */}
          {error && (
            <div className={styles["error-message"]}>
              <p>⚠️ {error}</p>
              <button onClick={clearError} className={styles["clear-error-btn"]}>
                ✕ Dismiss
              </button>
            </div>
          )}
          
          
          {isSearching ? (
            <div className={styles["search-loading"]}>
            </div>
          ) : (
            <>
              {coursesToDisplay && coursesToDisplay.length > 0 ? (
                coursesToDisplay.map((course) => {
                  return (
                    <Course 
                      key={course.ID} 
                      course={course}
                    />
                  );
                })
              ) : searchTerm ? (
                <div className={styles["no-results"]}>
                  <p>No courses found matching "{searchTerm}"</p>
                  <button onClick={clearSearch} className={styles["clear-search-btn"]}>
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className={styles["no-courses"]}>
                  <p>No courses available at the moment.</p>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}

export default MainPage;