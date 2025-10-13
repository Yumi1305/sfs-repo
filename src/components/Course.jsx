import clsx from "clsx";
import styles from '../components/Course.module.css'
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { decodeHtmlEntities } from "../services/helpers";
import ConfirmationModal from "./ConfirmationModal";
import { useCursor } from "../contexts/CursorContext";
import { fetchSingleCourse, fetchCourseTopics } from "../services/wordpressapi";
import { prettierWord } from "../services/helpers";
import { useUserContext } from "../hooks/useUserContext";
import { useCourseStorage } from "../contexts/CourseStorageContext";

function Course({ course, onFavoriteChange, onEnrolledChange, showProgress = false }) {
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [courseDetails, setCourseDetails] = useState({});
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const location = useLocation();
  const { hover, resetCursor } = useCursor();
  const { addLoadedCourse, getLoadedCourse } = useCourseStorage();
  
  // Use UserContext
  const {
    user,
    isEnrolledInCourse,
    isCourseFavorited,
    enrollInCourse,
    unenrollFromCourse,
    addCourseToFavorites,
    removeCourseFromFavorites,
    refreshUserData
  } = useUserContext();

  // Get current states from context
  const isEnrolled = user ? isEnrolledInCourse(course.ID) : false;
  const isFavorited = user ? isCourseFavorited(course.ID) : false;

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const details = await fetchSingleCourse(course.ID);
        setCourseDetails(details.data);
        addLoadedCourse(course.ID, details.data);
      } catch (error) {
        console.error("Couldn't get course details:", error);
      } finally {
        setDetailsLoading(false);
      }
    };

    const getCourseTopics = async () => {
      try {
        const response = await fetchCourseTopics(course.ID);
        if (response) {
          console.log('topics: ', response);
        }
      } catch (error) {
        console.error("Couldn't get course topics:", error);
      }
    };

    const courseLoadedData = getLoadedCourse(course.ID);
    if(courseLoadedData){
      setCourseDetails(courseLoadedData);
      setDetailsLoading(false);
    }
    fetchCourseDetails();
    getCourseTopics();
  }, [course.ID]);

  const handleFavoriteToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      console.log("User not authenticated");
      return;
    }

    if (actionLoading) return;

    try {
      setActionLoading(true);
      
      let success;
      if (isFavorited) {
        success = await removeCourseFromFavorites(course.ID);
      } else {
        success = await addCourseToFavorites(course.ID);
      }
      
      if (success) {
        // Call parent callback if provided
        if (onFavoriteChange) {
          onFavoriteChange();
        }
        
        // Optionally refresh user data
        // await refreshUserData();
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowRemoveModal(true);
  };

  const handleConfirmRemove = async () => {
    if (!user || actionLoading) return;
    
    try {
      setActionLoading(true);
      const success = await unenrollFromCourse(course.ID);
      
      if (success) {
        setShowRemoveModal(false);
        
        // Call parent callback if provided
        if (onEnrolledChange) {
          onEnrolledChange();
        }
        
        // Refresh user data
        await refreshUserData();
      }
    } catch (error) {
      console.error("Error removing course:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRemove = () => {
    setShowRemoveModal(false);
  };

  const handleEnrollClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      console.log("User not authenticated");
      return;
    }

    if (actionLoading) return;

    try {
      setActionLoading(true);
      const success = await enrollInCourse(course.ID);
      
      if (success) {
        // Call parent callback if provided
        if (onEnrolledChange) {
          onEnrolledChange();
        }
        
        // Refresh user data
        await refreshUserData();
      }
    } catch (error) {
      console.error("Error enrolling in course:", error);
    } finally {
      setActionLoading(false);
    }
  };

  if (detailsLoading) {
    return <></>;
  }

  return (
    <>
      <div
        className={styles["course"]}
        onMouseEnter={hover}
        onMouseLeave={resetCursor}
      >
        <Link
          to={`/course/${course.ID}`}
          className={styles.courseWrapper}
          style={{ textDecoration: "none" }}
        >
          <div
            className={styles["course-thumbnail"]}
            style={{ backgroundImage: `url(${course.thumbnail_url})` }}
          >
            <div className={styles["figcaption"]}>
              <p className={styles["fig-desc"]}></p>

              {/* Show different buttons based on enrollment status */}
              {isEnrolled ? (
                <button
                  className={clsx(
                    styles["remove"],
                    actionLoading && styles["loading"]
                  )}
                  onClick={handleRemoveClick}
                  type="button"
                  title="Remove from enrolled courses"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <div className={styles["spinner"]}>⟳</div>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#FF4444"
                    >
                      <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                    </svg>
                  )}
                </button>
              ) : (
                <>
                  {/* Favorite button */}
                  <button
                    className={clsx(
                      styles["favorite"],
                      actionLoading && styles["loading"]
                    )}
                    onClick={handleFavoriteToggle}
                    type="button"
                    title={
                      isFavorited ? "Remove from favorites" : "Add to favorites"
                    }
                    disabled={actionLoading}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill={isFavorited ? "#f7edff" : "none"}
                      stroke="#f7edff"
                      strokeWidth={"80"}
                    >
                      <path d="M200-120v-640q0-33 23.5-56.5T280-840h400q33 0 56.5 23.5T760-760v640L480-240 200-120Z" />
                    </svg>
                  </button>

                  {/* Enroll button - only show if not enrolled */}
                </>
              )}
            </div>
          </div>

          <div className={styles["bottom-desc"]}>
            <div className={styles.left}>
              <div className={styles["desc-container"]}>
                <div className={styles["desc"]}>
                  {decodeHtmlEntities(course.post_title)}
                </div>
              </div>
              <div className={styles["profile-section"]}>
                <button className={styles["icon"]}></button>
                <div>
                  <div className={styles["creator"]}>
                    {course.post_author.display_name}
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.right}>
              {courseDetails.course_level &&
                courseDetails.course_level[0] &&
                prettierWord(courseDetails.course_level[0])}
              {showProgress && isEnrolled && (
                <div className={styles["progress-info"]}>
                  <span>Progress: {course.progress || 0}%</span>
                </div>
              )}
            </div>
          </div>
        </Link>
      </div>

      <ConfirmationModal
        isOpen={showRemoveModal}
        onClose={handleCancelRemove}
        onConfirm={handleConfirmRemove}
        title="Are you sure you want to remove this course?"
        message="This will remove the course from your enrolled courses."
        subMessage="Don't worry, you can re-enroll at any time."
        confirmText={actionLoading ? "Removing..." : "Remove Course"}
        cancelText="Cancel"
        disabled={actionLoading}
      />
    </>
  );
}

export default Course;