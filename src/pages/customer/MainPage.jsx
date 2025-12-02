// Updated MainPage.jsx - Displays both courses and study materials

import NavBar from "../../components/NavBar";
import styles from "../customer/MainPage.module.css";
import Sidebar from "../../components/Sidebar";
import { useState, useEffect, useRef } from "react";
import Course from "../../components/Course";
import MaterialCard from "../../components/MaterialCard";
import { useCourses } from "../../contexts/CourseContext";
import Loader from "../../components/Loader";
import clsx from "clsx";
import { decodeHtmlEntities } from "../../services/helpers";
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../hooks/useUserContext';
import WelcomeModal from "../../components/WelcomeModal";
import { fetchAuthorInfo } from "../../services/wordpressapi";
import { supabase } from "../../lib/supabase";

function MainPage() {
  const { courseList, loading, users } = useCourses();
  const [showLoader, setShowLoader] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [categoryResults, setCategoryResults] = useState([]);
  const [category, setCategory] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [contentType, setContentType] = useState('all'); // 'all', 'courses', 'materials'
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

  // Fetch approved study materials
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        setMaterialsLoading(true);
        const { data, error } = await supabase
          .from('study_materials')
          .select('*')
          .eq('status', 'approved')
          .order('submitted_at', { ascending: false });
        
        if (error) throw error;
        setMaterials(data || []);
      } catch (err) {
        console.error('Error fetching materials:', err);
      } finally {
        setMaterialsLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  // Show welcome modal ONLY on fresh sign-in
  useEffect(() => {
    if (!user || !userProfile || userLoading) {
      return;
    }

    const isNewSignIn = lastUserId.current !== user.id;
    lastUserId.current = user.id;

    if (isNewSignIn && !hasShownModalThisSession.current) {
      const hideWelcome = localStorage.getItem('hideWelcomeModal');
      
      if (!hideWelcome) {
        hasShownModalThisSession.current = true;
        
        const timer = setTimeout(() => {
          setShowWelcomeModal(true);
        }, 800);
        
        return () => clearTimeout(timer);
      } else {
        hasShownModalThisSession.current = true;
      }
    }
  }, [user, userProfile, userLoading]);

  // Reset session tracking when user logs out
  useEffect(() => {
    if (!user) {
      hasShownModalThisSession.current = false;
      lastUserId.current = null;
      setShowWelcomeModal(false);
    }
  }, [user]);

  const handleSearch = async (searchTerm) => {
    setIsSearching(true);
    setSearchTerm(searchTerm);
    setCategory(null); // Clear category filter when searching
    
    try {
      // Search both courses and materials
      const filteredCourses = courseList.filter(course => 
        decodeHtmlEntities(course.post_title)?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const filteredMaterials = materials.filter(material =>
        material.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.subjects?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      setSearchResults({ courses: filteredCourses, materials: filteredMaterials });
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
    setSearchTerm(''); // Clear search when selecting category
    setIsSearching(true);
    
    try {
      // Filter courses by tag
      const filteredCourses = courseList.filter(course => 
        getCourseTags(course).includes(category)
      );
      
      // Filter materials by subject (map category to subject name)
      const categoryToSubject = {
        'math': 'Math',
        'science': 'Science',
        'english': 'English',
        'history': 'History',
        'computer-science': 'Computer Science',
        'foreign-language': 'Foreign Language',
        'art': 'Art',
        'music': 'Music',
        'economics': 'Economics',
        'psychology': 'Psychology',
        'biology': 'Biology',
        'chemistry': 'Chemistry',
        'physics': 'Physics',
        'sat-act-prep': 'SAT/ACT Prep',
        'ap-courses': 'AP Courses'
      };
      
      const subjectName = categoryToSubject[category] || category;
      const filteredMaterials = materials.filter(material =>
        material.subjects?.some(s => 
          s.toLowerCase() === subjectName.toLowerCase() ||
          s.toLowerCase().includes(category.toLowerCase())
        )
      );
      
      setCategoryResults({ courses: filteredCourses, materials: filteredMaterials });
    } catch (error) {
      console.error('Error filtering by category:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearCategory = () => {
    setCategory(null);
    setCategoryResults([]);
  };

  // Clear any errors when component mounts
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [error, clearError]);

  useEffect(() => {
    if (!loading && !materialsLoading) {
      setFadeOut(true);
      setTimeout(() => {
        setShowLoader(false);
      }, 500);
    }
  }, [loading, materialsLoading]);

  // Show loader while content is loading
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

  // Determine what to display
  let coursesToDisplay = courseList;
  let materialsToDisplay = materials;

  if (searchTerm && searchResults.courses) {
    coursesToDisplay = searchResults.courses;
    materialsToDisplay = searchResults.materials || [];
  } else if (category && categoryResults.courses) {
    coursesToDisplay = categoryResults.courses;
    materialsToDisplay = categoryResults.materials || [];
  }

  // Filter based on content type
  if (contentType === 'courses') {
    materialsToDisplay = [];
  } else if (contentType === 'materials') {
    coursesToDisplay = [];
  }

  const totalItems = coursesToDisplay.length + materialsToDisplay.length;

  return (
    <>
      <NavBar onSearch={handleSearch} />
      <Sidebar onSelectCategory={handleSelect}/>
      
      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleCloseWelcomeModal}
        userProfile={userProfile}
        enrolledCount={enrolledCourses?.length || 0}
        favoritesCount={favoritedCourses?.length || 0}
      />
      
      <div className={styles["container"]}>
        {/* Content Type Filter */}
        <div className={styles["content-filters"]}>
          <button 
            className={clsx(styles["filter-btn"], contentType === 'all' && styles["filter-active"])}
            onClick={() => setContentType('all')}
          >
            All ({courseList.length + materials.length})
          </button>
          <button 
            className={clsx(styles["filter-btn"], contentType === 'courses' && styles["filter-active"])}
            onClick={() => setContentType('courses')}
          >
            Courses ({courseList.length})
          </button>
          <button 
            className={clsx(styles["filter-btn"], contentType === 'materials' && styles["filter-active"])}
            onClick={() => setContentType('materials')}
          >
            Materials ({materials.length})
          </button>
          
          {(searchTerm || category) && (
            <button 
              className={styles["clear-filter-btn"]}
              onClick={() => {
                clearSearch();
                clearCategory();
              }}
            >
              Clear filters ✕
            </button>
          )}
        </div>

        {/* Active filter indicator */}
        {(searchTerm || category) && (
          <div className={styles["active-filter"]}>
            {searchTerm && <span>Searching: "{searchTerm}"</span>}
            {category && <span>Category: {category}</span>}
            <span className={styles["result-count"]}>
              ({totalItems} result{totalItems !== 1 ? 's' : ''})
            </span>
          </div>
        )}

        <section className={styles["main-section"]}>
          {/* Error message */}
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
              <Loader />
            </div>
          ) : (
            <>
              {/* Display Courses */}
              {coursesToDisplay && coursesToDisplay.length > 0 && (
                coursesToDisplay.map((course) => (
                  <Course 
                    key={`course-${course.ID}`} 
                    course={course}
                  />
                ))
              )}

              {/* Display Materials */}
              {materialsToDisplay && materialsToDisplay.length > 0 && (
                materialsToDisplay.map((material) => (
                  <MaterialCard 
                    key={`material-${material.id}`} 
                    material={material}
                  />
                ))
              )}

              {/* No results message */}
              {totalItems === 0 && (
                <div className={styles["no-results"]}>
                  {searchTerm ? (
                    <>
                      <p>No content found matching "{searchTerm}"</p>
                      <button onClick={clearSearch} className={styles["clear-search-btn"]}>
                        Clear Search
                      </button>
                    </>
                  ) : category ? (
                    <>
                      <p>No content found in "{category}"</p>
                      <button onClick={clearCategory} className={styles["clear-search-btn"]}>
                        Clear Filter
                      </button>
                    </>
                  ) : (
                    <p>No content available at the moment.</p>
                  )}
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