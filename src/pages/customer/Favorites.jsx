import styles from '../customer/Favorites.module.css'
import { useEffect, useState } from 'react';
import NavBar from '../../components/NavBar';
import Course from '../../components/Course';
import { Link, useNavigate } from 'react-router-dom';
import Lottie from "lottie-react";
import animationData from '../../assets/sad-face.json';
import {gsap} from 'gsap';
import { useCourses } from '../../contexts/CourseContext';
import { useUserContext } from '../../hooks/useUserContext';
import { decodeHtmlEntities } from '../../services/helpers';
import MaterialsService from '../../services/materialsService';

function Favorites() {
  const { courseList, loading: coursesLoading } = useCourses();
  const {
    user,
    enrolledCourses,
    favoritedCourses,
    favoritedMaterials,
    loading: userLoading,
    error,
    refreshUserData,
    clearError, 
  } = useUserContext();

  const [favoriteCourses, setFavoriteCourses] = useState([]);
  const [favoriteMaterials, setFavoriteMaterials] = useState([]); 
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      navigate('/login');
    }
  }, [user, userLoading, navigate]);

  const handleSearch = async (searchTerm) => {
    setIsSearching(true);
    setSearchTerm(searchTerm);
    
    try {
      const filteredCourses = favoriteCourses.filter(course => 
        decodeHtmlEntities(course.post_title)?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setSearchResults(filteredCourses);
      setIsSearching(false);
      
    } catch (error) {
      console.error('Search error:', error);
      setIsSearching(false);
    }
  };

  // Handle course state changes - refresh data when actions complete
  const handleCourseChange = async () => {
    console.log('Course state changed, refreshing data...');
    await refreshUserData();
  };

  // Get favorited courses with full course data
  const getFavoritedCoursesWithData = () => {
    if (!favoritedCourses || !courseList) {
      console.log('Missing data - favoritedCourses:', favoritedCourses, 'courseList:', courseList);
      return [];
    }
    
    console.log('Getting favorited courses with data...', { favoritedCourses, courseListLength: courseList.length });
    
    const coursesWithData = favoritedCourses.map(favoritedCourse => {
      // Handle different possible property names for course ID
      const courseId = favoritedCourse.course_id || favoritedCourse.courseId || favoritedCourse.id;
      
      // Convert to string for comparison
      const courseIdStr = String(courseId);
      
      const fullCourse = courseList.find(course => {
        const fullCourseId = course.ID || course.id;
        return String(fullCourseId) === courseIdStr;
      });
      
      if (fullCourse) {
        const courseData = {
          ...fullCourse,
          favoriteData: favoritedCourse,
          favoritedAt: favoritedCourse.favorited_at,
        };
        
        console.log('Course data for', courseId, ':', courseData);
        return courseData;
      } else {
        console.log('Full course not found for ID:', courseId);
        return null;
      }
    }).filter(Boolean);
    
    console.log('Final courses with data:', coursesWithData);
    return coursesWithData;
  };

  // Update favoriteCourses when favoritedCourses or courseList changes
  useEffect(() => {
    console.log('Effect triggered - updating favorite courses display');
    
    if (favoritedCourses && courseList) {
      const coursesWithData = getFavoritedCoursesWithData();
      setFavoriteCourses(coursesWithData);
    } else {
      setFavoriteCourses([]);
    }
  }, [favoritedCourses, courseList]);

  useEffect(()=>{
    if (favoritedMaterials){
      setFavoriteMaterials()
    }
  }, [favoritedMaterials])
  // Clear any errors when component mounts
  useEffect(() => {
    if (error) {
      console.error('Error in favorites:', error);
      // Optionally auto-clear after some time
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Show loading state
  if (coursesLoading || userLoading) {
    return (
      <div>
        <NavBar onSearch={handleSearch} />
        <div className={styles['loading-container']}>
          <div className={styles['spinner']}></div>
          <p>Loading your favorites...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  const coursesToDisplay = searchTerm ? searchResults : favoriteCourses;

  return (
    <>
      <NavBar onSearch={handleSearch} />
      
      {/* Display error message if there's an error */}
      {error && (
        <div className={styles["error-message"]}>
          <p>⚠️ {error}</p>
          <button onClick={clearError} className={styles["clear-error-btn"]}>
            ✕ Dismiss
          </button>
        </div>
      )}

      {favoriteCourses.length > 0 ? (
        <section className={styles["main-section"]}>
          {/* <div className={styles['header']}>
            <h2>My Favorite Courses ({favoriteCourses.length})</h2>
            <button 
              onClick={refreshUserData}
              className={styles['refresh-btn']}
              title="Refresh data"
            >
              🔄 Refresh
            </button>
          </div> */}
          
          {isSearching ? (
            <div className={styles["search-loading"]}>
              <div className={styles['spinner']}></div>
              <p>Searching...</p>
            </div>
          ) : (
            <>
              {coursesToDisplay.length > 0 ? (
                coursesToDisplay.map((course) => {
                  return (
                    <Course
                      key={`${course.ID}-${course.favoritedAt}`} // Unique key including timestamp
                      course={course}
                      onFavoriteChange={handleCourseChange}
                      onEnrolledChange={handleCourseChange}
                      showProgress={false}
                    />
                  );
                })
              ) : searchTerm ? (
                <div className={styles["no-results"]}>
                  <p>No favorite courses found matching "{searchTerm}"</p>
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setSearchResults([]);
                    }}
                    className={styles["clear-search-btn"]}
                  >
                    Clear Search
                  </button>
                </div>
              ) : null}
            </>
          )}
        </section>
      ) : (
        <section className={styles.section2}>
          <Lottie
            animationData={animationData}
            loop={true}
            style={{ width: 200, marginBottom: '-2rem'}}
          />
          <div className={styles.no}>You have no favorites!</div>
          <Link to={"/mainpg"} className={styles.return}>
            Return to dashboard
          </Link>
        </section>
      )}
    </>
  );
}

export default Favorites;