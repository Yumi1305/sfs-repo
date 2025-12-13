import NavBar from "../../components/NavBar";
import styles from "../customer/MainPage.module.css";
import Sidebar from "../../components/Sidebar";
import { useState, useEffect } from "react";
import Course from "../../components/Course";
import MaterialCard from "../../components/MaterialCard";
import { useCourses } from "../../contexts/CourseContext";
import Loader from "../../components/Loader";
import clsx from "clsx";
import { decodeHtmlEntities } from "../../services/helpers";
import { useUserContext } from '../../hooks/useUserContext';
import { supabase } from "../../lib/supabase";

function MainPage() {
  const { courseList, loading: coursesLoading } = useCourses();
  const { user, error, clearError } = useUserContext();
  
  const [showLoader, setShowLoader] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  
  // Search & filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState({ courses: [], materials: [] });
  const [category, setCategory] = useState(null);
  const [categoryResults, setCategoryResults] = useState({ courses: [], materials: [] });
  const [contentType, setContentType] = useState('all');

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

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    setCategory(null);
    
    if (!term) {
      setSearchResults({ courses: [], materials: [] });
      return;
    }

    const lowerTerm = term.toLowerCase();
    
    const filteredCourses = courseList.filter(course => 
      decodeHtmlEntities(course.post_title)?.toLowerCase().includes(lowerTerm)
    );
    
    const filteredMaterials = materials.filter(material =>
      material.title?.toLowerCase().includes(lowerTerm) ||
      material.description?.toLowerCase().includes(lowerTerm) ||
      material.subjects?.some(s => s.toLowerCase().includes(lowerTerm))
    );
    
    setSearchResults({ courses: filteredCourses, materials: filteredMaterials });
  };

  // Handle category selection
  const handleSelectCategory = (cat) => {
    setCategory(cat);
    setSearchTerm('');
    setSearchResults({ courses: [], materials: [] });

    const getCourseTags = (course) => 
      course?.course_tag?.map(t => t.slug) || [];

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

    const filteredCourses = courseList.filter(course => 
      getCourseTags(course).includes(cat)
    );
    
    const subjectName = categoryToSubject[cat] || cat;
    const filteredMaterials = materials.filter(material =>
      material.subjects?.some(s => 
        s.toLowerCase() === subjectName.toLowerCase() ||
        s.toLowerCase().includes(cat.toLowerCase())
      )
    );
    
    setCategoryResults({ courses: filteredCourses, materials: filteredMaterials });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSearchResults({ courses: [], materials: [] });
    setCategory(null);
    setCategoryResults({ courses: [], materials: [] });
  };

  // Handle loader fade
  useEffect(() => {
    if (!coursesLoading && !materialsLoading) {
      setFadeOut(true);
      setTimeout(() => setShowLoader(false), 500);
    }
  }, [coursesLoading, materialsLoading]);

  // Clear errors on mount
  useEffect(() => {
    if (error) clearError();
  }, []);

  if (showLoader) {
    return (
      <div className={clsx(styles['loader-container'], fadeOut && styles['fade'])}>
        <Loader />
      </div>
    );
  }

  // Determine what to display
  let coursesToDisplay = courseList;
  let materialsToDisplay = materials;

  if (searchTerm) {
    coursesToDisplay = searchResults.courses;
    materialsToDisplay = searchResults.materials;
  } else if (category) {
    coursesToDisplay = categoryResults.courses;
    materialsToDisplay = categoryResults.materials;
  }

  // Apply content type filter
  if (contentType === 'courses') materialsToDisplay = [];
  if (contentType === 'materials') coursesToDisplay = [];

  const totalItems = coursesToDisplay.length + materialsToDisplay.length;
  const hasActiveFilter = searchTerm || category;

  return (
    <>
      <NavBar onSearch={handleSearch} />
      <Sidebar onSelectCategory={handleSelectCategory} />
      
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
          
          {hasActiveFilter && (
            <button className={styles["clear-filter-btn"]} onClick={clearFilters}>
              Clear filters ✕
            </button>
          )}
        </div>

        {/* Active filter indicator */}
        {hasActiveFilter && (
          <div className={styles["active-filter"]}>
            {searchTerm && <span>Searching: "{searchTerm}"</span>}
            {category && <span>Category: {category}</span>}
            <span className={styles["result-count"]}>
              ({totalItems} result{totalItems !== 1 ? 's' : ''})
            </span>
          </div>
        )}

        <section className={styles["main-section"]}>
          {error && (
            <div className={styles["error-message"]}>
              <p>⚠️ {error}</p>
              <button onClick={clearError} className={styles["clear-error-btn"]}>
                ✕ Dismiss
              </button>
            </div>
          )}

          {/* Courses */}
          {coursesToDisplay.map(course => (
            <Course key={`course-${course.ID}`} course={course} />
          ))}

          {/* Materials */}
          {materialsToDisplay.map(material => (
            <MaterialCard key={`material-${material.id}`} material={material} />
          ))}

          {/* No results */}
          {totalItems === 0 && (
            <div className={styles["no-results"]}>
              {searchTerm ? (
                <>
                  <p>No content found matching "{searchTerm}"</p>
                  <button onClick={clearFilters} className={styles["clear-search-btn"]}>
                    Clear Search
                  </button>
                </>
              ) : category ? (
                <>
                  <p>No content found in "{category}"</p>
                  <button onClick={clearFilters} className={styles["clear-search-btn"]}>
                    Clear Filter
                  </button>
                </>
              ) : (
                <p>No content available at the moment.</p>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default MainPage;