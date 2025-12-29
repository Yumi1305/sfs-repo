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
import MaterialsService from "../../services/materialsService";
import ErrorMessage from "../../components/ErrorMessage";

function MainPage() {
  const { courseList, loading: coursesLoading } = useCourses();
  const { user, error, clearError } = useUserContext();
  
  const [showLoader, setShowLoader] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [userUpvotes, setUserUpvotes] = useState([]);
  
  // Search & filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState({ courses: [], materials: [] });
  const [category, setCategory] = useState(null);
  const [categoryResults, setCategoryResults] = useState({ courses: [], materials: [] });
  const [contentType, setContentType] = useState('all');

  const [categories, setCategories] = useState([]); 

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

  // Fetch user's upvotes when user changes
  useEffect(() => {
    const fetchUserUpvotes = async () => {
      if (!user) {
        setUserUpvotes([]);
        return;
      }
      
      try {
        const upvotes = await MaterialsService.getUserUpvotes(user.id);
        setUserUpvotes(upvotes);
      } catch (err) {
        console.error('Error fetching user upvotes:', err);
      }
    };

    fetchUserUpvotes();
  }, [user]);

  // Handle upvote changes from MaterialCard
  const handleUpvoteChange = (materialId, isUpvoted) => {
    setUserUpvotes(prev => {
      if (isUpvoted) {
        return [...prev, materialId];
      } else {
        return prev.filter(id => id !== materialId);
      }
    });

    // Update local material upvote count
    setMaterials(prev => prev.map(m => {
      if (m.id === materialId) {
        return {
          ...m,
          upvote_count: (m.upvote_count || 0) + (isUpvoted ? 1 : -1)
        };
      }
      return m;
    }));
  };

  // Handle search
  const handleSearch = (term) => {
    setSearchTerm(term);
    setCategories([]); 
    
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
  const handleSelectCategory = (selectedCats) => {
    setCategories(selectedCats)
    console.log(selectedCats)
    setSearchTerm('');
    setSearchResults({ courses: [], materials: [] });

    const getCourseTags = (course) => 
      course?.course_tag?.map(t => t.slug) || [];

    const filteredCourses = courseList.filter(course => 
      getCourseTags(course).some(tag => selectedCats.includes(tag.toLowerCase()))
    );
  
    const filteredMaterials = materials.filter(material =>
      material.subjects?.some(s => selectedCats.includes(s))
    );
    
    setCategoryResults({ courses: filteredCourses, materials: filteredMaterials });
    console.log(categoryResults); 
    console.log(filteredMaterials); 
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSearchResults({ courses: [], materials: [] });
    setCategories([])
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
  } else if (categories.length > 0) {
    coursesToDisplay = categoryResults.courses;
    materialsToDisplay = categoryResults.materials;
  }

  // Apply content type filter
  if (contentType === 'courses') materialsToDisplay = [];
  if (contentType === 'materials') coursesToDisplay = [];

  const totalItems = coursesToDisplay.length + materialsToDisplay.length;
  const hasActiveFilter = searchTerm || categories.length > 0;

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
          
          <ErrorMessage error={error} onDismiss={() => { clearError() }} />
 
          {/* Courses */}
          {coursesToDisplay.map(course => (
            <Course key={`course-${course.ID}`} course={course} />
          ))}

          {/* Materials */}
          {materialsToDisplay.map(material => (
            <MaterialCard 
              key={`material-${material.id}`} 
              material={material}
              userUpvotes={userUpvotes}
              onUpvoteChange={handleUpvoteChange}
            />
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