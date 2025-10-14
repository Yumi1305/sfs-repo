import NavBar from "../../components/NavBar";
import styles from "../customer/CoursePage.module.css";
import { useEffect, useState } from "react";
import { Heart, Play, Clock, Users, Star, ExternalLink, User } from "lucide-react";
import { useParams } from "react-router-dom";
import { useCourses } from "../../contexts/CourseContext";
import { useUserContext } from "../../hooks/useUserContext";
import {
  decodeHtmlEntities,
  getLink,
  prettierWord,
} from "../../services/helpers";
import Loader from "../../components/Loader";
import clsx from "clsx";
import { Link } from "react-router-dom";
import { fetchSingleCourse, fetchCourseTopics } from "../../services/wordpressapi";

export default function CoursePage() {
  const { id } = useParams();
  const { courseList, loading } = useCourses();
  const { 
    isEnrolledInCourse, 
    isCourseFavorited, 
    enrollInCourse, 
    addCourseToFavorites, 
    removeCourseFromFavorites 
  } = useUserContext();
  
  const course = courseList.find((c) => String(c.ID) === id);
  const [Favorited, setFavorited] = useState(false);
  const [showLoading, setShowLoading] = useState(loading);
  const [fadeOut, setFadeOut] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [showEnrolledMessage, setShowEnrolledMessage] = useState(false);
  const [buttonState, setButtonState] = useState('enroll'); // 'enroll' | 'enrolling' | 'enrolled' | 'open'
  const [courseDetails, setCourseDetails] = useState({});
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [courseTopics, setCourseTopics] = useState([])
  const [topicsLoading, setTopicsLoading] = useState(true)

  useEffect(() => {
    const getCourseDetails = async() => {
      const response = await fetchSingleCourse(id);
      try {
        response ? setCourseDetails(response.data) : {};
      } catch {
        throw new Error("couldn't fetch courses")
      } finally{
        setDetailsLoading(false)
      }
    }

    const getCourseTopics = async() => {
      const response = await fetchCourseTopics(id); 
      try {
        response ? setCourseTopics(response.data) : []
      } catch {
        throw new Error("couldn't fetch topics")
      } finally {
        setTopicsLoading(false)
      }
    }
    
    if (isEnrolledInCourse(id)) {
      setEnrolled(true);
      setButtonState('open');
    }
    getCourseDetails();
    getCourseTopics();
  }, [id, isEnrolledInCourse]);

  useEffect(() => {
    if (course && isCourseFavorited(course.ID)) {
      setFavorited(true);
    }
    
    console.log('course in course page:', course)
    console.log('course details in course page', courseDetails)
    console.log('course topics in course page', courseTopics)

  }, [course, isCourseFavorited]);

  useEffect(() => {
    if (!loading) {
      setFadeOut(true);
      setTimeout(() => {
        setShowLoading(false);
      }, 500);
    }
  }, [loading]);

  const handleEnrollClick = async () => {
  if (!enrolled) {
    // Start enrollment process
    setButtonState('enrolling');
    
    try {
      const success = await enrollInCourse(id);
      if (success) {
        setEnrolled(true);
        setShowEnrolledMessage(true);
        setButtonState('enrolled');
        
        setTimeout(() => {
          setShowEnrolledMessage(false);
          setButtonState('open');
        }, 2000);
      } else {
        setButtonState('enroll');
      }
    } catch (error) {
      console.error('Enrollment failed:', error);
      setButtonState('enroll');
    }
  } else {
    // Wait for topics to load before opening course
    if (topicsLoading) {
      console.log('Topics still loading, please wait...');
      return;
    }
    
    window.open(getLink(decodeHtmlEntities(course.title), courseTopics), '_blank');
  }
};

  const handleFavoriteClick = async () => {
    try {
      if (Favorited) {
        await removeCourseFromFavorites(course.ID);
        setFavorited(false);
      } else {
        await addCourseToFavorites(course.ID);
        setFavorited(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const getButtonConfig = () => {
    switch (buttonState) {
      case 'enroll':
        return { text: 'Enroll Now', disabled: false, icon: null };
      case 'enrolling':
        return { text: 'Enrolling...', disabled: true, icon: null };
      case 'enrolled':
        return { text: 'Enrolled!', disabled: true, icon: null };
      case 'open':
        return { text: 'Open Course', disabled: false, icon: <ExternalLink size={16} /> };
      default:
        return { text: 'Enroll Now', disabled: false, icon: null };
    }
  };

  // Helper function to get course category name
  const getCourseCategory = () => {
    if (course?.course_category && course.course_category.length > 0) {
      return course.course_category[0].name || 'Programming';
    }
    return "Existential";
  };

  const getCourseTags = () => {
    if (course?.course_tag && course.course_tag.length > 0){
      const tags = course.course_tag.map(tag => prettierWord(tag.name));
      return tags; 
    }
  }
  // Helper function to get course level with proper formatting
  const getCourseLevel = () => {
    if (courseDetails?.course_level && courseDetails.course_level.length > 0) {
      return prettierWord(courseDetails.course_level[0]);
    }
    return 'All Levels';
  };

  // Helper function to get course duration
  const getCourseDuration = () => {
    if (courseDetails?.course_duration && courseDetails.course_duration.length > 0) {
      return courseDetails.course_duration[0].hours || '10';
    }
    return '0';
  };

  if (showLoading || detailsLoading || topicsLoading) {
    return (
      <div
        className={clsx(styles["loader-container"], fadeOut ? styles.fade : "")}
      >
        <Loader></Loader>
      </div>
    );
  }

  if (!course) {
    return <div>Course not found</div>;
  }

  const buttonConfig = getButtonConfig();
  console.log('Course tags:', getCourseTags());

  return (
    <div className={styles.container}>
      <NavBar />

      {/* Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          {/* Left Content */}
          <div className={styles.leftContent}>
            <div className={styles.courseInfo}>
              <div className={styles.courseTags}>
                {
                  getCourseTags()?.map(tag => (
                    <span className={`${styles.tag} ${styles.tagProgramming}`}>
                      {tag}
                      </span>
                  ))
                }
                <span className={`${styles.tag} ${styles.tagBeginner}`}>
                  {getCourseLevel()}
                </span>
              </div>

              <h1 className={`${styles.title} ${styles.titleGradient}`}>
                {course.post_title}
              </h1>

              {/* <p className={styles.description}>{course.post_content?.replace(/<[^>]*>/g, '') || course.author}</p> */}
            </div>

            {/* Course Stats */}
            <div className={styles.courseStats}>
              <div className={styles.stat}>
                <Clock className={styles.statIcon} />
                <span>{getCourseDuration()} hours</span>
              </div>
              <div className={styles.stat}>
                <Users className={styles.statIcon} />
                <span>2.3k students</span>
              </div>
              <div className={styles.stat}>
                <Star className={`${styles.statIcon} ${styles.starIcon}`} />
                <span>4.8 (324 reviews)</span>
              </div>
            </div>

            {/* Instructor Card */}
            <div className={styles.instructorCard}>
              <div className={styles.instructorContent}>
                <div className={styles.instructorAvatar}>
                  <div className={styles.instructorImageContainer}>
                    <User className={styles.instructorPlaceholderIcon} />
                  </div>
                </div>
                <div className={styles.instructorInfo}>
                  <div className={styles.instructorLabel}>Instructor</div>
                  <div className={styles.instructorName}>
                    {course.post_author?.display_name || course.post_author?.user_login || 'Course Instructor'}
                  </div>
                  <div className={styles.instructorTitle}>
                    {course.post_author?.user_email ? course.post_author?.user_email: 'Course Creator'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className={styles.rightContent}>
            {/* Course Thumbnail */}
            <div className={styles.thumbnailContainer}>
              <div className={styles.thumbnail}>
                <img
                  src={`${course.thumbnail_url}`}
                  alt="Course Thumbnail"
                  className={styles.thumbnailImage}
                />

                {/* Play Button Overlay */}
                <div className={styles.playOverlay}>
                  <button className={styles.playBtn}>
                    <Play className={styles.playIcon} />
                  </button>
                </div>

                {/* Favorite Button */}
                <button
                  onClick={handleFavoriteClick}
                  className={`${styles.thumbnailFavoriteBtn} ${
                    Favorited
                      ? styles.thumbnailFavoriteBtnActive
                      : styles.thumbnailFavoriteBtnDefault
                  }`}
                >
                  <Heart
                    className={`${styles.thumbnailHeartIcon} ${
                      Favorited ? styles.heartIconFilled : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* CTA Buttons - Desktop */}
            <div className={styles.ctaButtonsDesktop}>
              <div className={styles["btn-container"]}>
                <button
                  className={clsx(
                    styles.purchaseBtn,
                    buttonState === 'open' && styles.openCourseBtn,
                    buttonState === 'enrolled' && styles.enrolledBtn,
                    buttonState === 'enrolling' && styles.enrollingBtn
                  )}
                  onClick={handleEnrollClick}
                  disabled={buttonConfig.disabled}
                  style={{
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    transform: buttonState === 'enrolled' ? 'scale(1.05)' : 'scale(1)',
                    display: 'flex', 
                    justifyContent:'center',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    textAlign: 'center'
                  }}>
                    {buttonConfig.text}
                    {buttonConfig.icon}
                  </span>
                  
                  {/* Loading spinner for enrolling state */}
                  {buttonState === 'enrolling' && (
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #ffffff40',
                      borderTop: '2px solid #ffffff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginLeft: '8px'
                    }} />
                  )}
                </button>
              </div>
            </div>
            
            {/* Enrollment Success Notification */}
            <div
              className={clsx(
                styles["enrolled-notif"],
                showEnrolledMessage && styles["visible"]
              )}
              style={{
                transition: 'all 0.4s ease',
                transform: showEnrolledMessage ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)',
                opacity: showEnrolledMessage ? 1 : 0
              }}
            >
              <div style={{ display: "block" }}>
                🎊
                <span className={styles.enrolled}>
                  {" "}
                  Enrolled successfully!{" "}
                </span>
                🎉
              </div>
              View course in{" "}
              <Link
                to={"/my-courses"}
                style={{ textDecoration: "none" }}
                className={styles["my-courses-link"]}
              >
                my courses
              </Link>
            </div>
          </div>
        </div>
      </div>
       <div className={styles.line}></div>
      
      {/* Course Contents & Benefits Section */}
      <section className={styles.mainContent}>
        <div className={styles.contentContainer}>
          {/* Left Column - Course Contents */}
          <div className={styles.leftColumn}>
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Course Contents</h2>
              <div className={styles.topicsList}>
                {courseTopics.map((topic, index) => (
                  <div key={topic.ID} className={styles.topicItem}>
                    <div className={styles.topicNumber}>{index + 1}</div>
                    <div className={styles.topicContent}>
                      <h3 className={styles.topicTitle}>{topic.post_title}</h3>
                      <p className={styles.topicDescription}>{topic.post_content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Course Benefits & Author */}
          <div className={styles.rightColumn}>
            {/* Course Benefits */}
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>What You'll Learn</h2>
              <div className={styles.benefitsList}>
                {courseDetails.course_benefits?.map((benefit, index) => (
                  <div key={index} className={styles.benefitItem}>
                    <div className={styles.benefitIcon}>✓</div>
                    <span className={styles.benefitText}>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Requirements */}
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Prerequisites</h2>
              <div className={styles.requirementsList}>
                {courseDetails.course_requirements?.map((requirement, index) => (
                  <div key={index} className={styles.requirementItem}>
                    <div className={styles.requirementIcon}>•</div>
                    <span className={styles.requirementText}>{requirement}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Target Audience */}
            {courseDetails.course_target_audience.length > 0 &&
             (<div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Target Audience</h2>
              <div className={styles.audienceList}>
                {courseDetails.course_target_audience?.map((audience, index) => (
                  <div key={index} className={styles.audienceItem}>
                    <div className={styles.audienceIcon}>👥</div>
                    <span className={styles.audienceText}>{audience}</span>
                  </div>
                ))}
              </div>
            </div>
)}
            
            {/* Course Materials */}
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Course Materials</h2>
              <div className={styles.materialsList}>
                {courseDetails.course_material_includes?.map((material, index) => (
                  <div key={index} className={styles.materialItem}>
                    <div className={styles.materialIcon}>📚</div>
                    <span className={styles.materialText}>{material}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}