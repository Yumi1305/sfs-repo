import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserDataService } from '../services/userData';
import MaterialsService from '../services/materialsService';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [favoritedCourses, setFavoritedCourses] = useState([]);
  const [favoritedMaterials, setFavoritedMaterials] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Initialize user data
  useEffect(() => {
    let mounted = true;

    const initializeUser = async () => {
      try {
        console.log('🚀 UserContext: Initializing user...');
        setLoading(true);
        setInitializing(true);
        
        // CRITICAL FIX: Wait for auth to be ready first
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get current session with explicit refresh
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(sessionError.message);
        } else if (session?.user && mounted) {
          console.log('Session found on initialization:', session.user.id);
          setUser(session.user);
          await loadUserData(session.user.id);
        } else {
          console.log('ℹ️ No active session found');
          // Don't clear user data immediately, let auth state change handle it
        }
      } catch (err) {
        console.error('❌ Error initializing user:', err);
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setInitializing(false);
        }
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, 'User ID:', session?.user?.id);
      
      if (!mounted) return;

      // Handle different auth events
      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          if (session?.user) {
            console.log('✅ User signed in/token refreshed:', session.user.id);
            setUser(session.user);
            setError(null);
            
            // Only load data if not already loading
            if (!loading) {
              setLoading(true);
              await loadUserData(session.user.id);
              setLoading(false);
            }
          }
          break;
          
        case 'SIGNED_OUT':
          console.log('👋 User signed out');
          setUser(null);
          setUserProfile(null);
          setEnrolledCourses([]);
          setFavoritedCourses([]);
          setError(null);
          break;
          
        case 'USER_UPDATED':
          if (session?.user) {
            console.log('📝 User updated:', session.user.id);
            setUser(session.user);
          }
          break;
          
        default:
          console.log('🔄 Other auth event:', event);
      }
    });

    // Initialize after a brief delay to ensure Supabase is ready
    const initTimer = setTimeout(initializeUser, 50);

    return () => {
      mounted = false;
      clearTimeout(initTimer);
      subscription.unsubscribe();
    };
  }, []);

  // Load user data from database
  const loadUserData = async (userId) => {
    try {
      console.log('📊 Loading user data for:', userId);
      
      const [profile, dashboardData] = await Promise.all([
        UserDataService.getUserProfile(userId),
        UserDataService.getUserDashboardData(userId)
      ]);

      console.log('✅ Loaded data:', { 
        profileExists: !!profile, 
        enrolledCount: dashboardData.enrolledCourses?.length || 0,
        favoritedCount: dashboardData.favoritedCourses?.length || 0 
      });

      setUserProfile(profile);
      setEnrolledCourses(dashboardData.enrolledCourses || []);
      setFavoritedCourses(dashboardData.favoritedCourses || []);
      setError(null);
      
    } catch (err) {
      console.error('❌ Error loading user data:', err);
      setError(err.message);
    }
  };

  // Refresh user data
  const refreshUserData = async () => {
    if (user && !loading) {
      setLoading(true);
      await loadUserData(user.id);
      setLoading(false);
    }
  };

  // Course enrollment functions
  const enrollInCourse = async (courseId) => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    try {
      console.log('📝 Enrolling in course:', courseId);
      
      const result = await UserDataService.enrollUserInCourse(user.id, courseId);
      
      if (result) {
        // Update local state immediately
        const newEnrollment = {
          course_id: String(courseId),
          user_id: user.id,
          progress: 0,
          enrolled_at: new Date().toISOString()
        };
        
        setEnrolledCourses(prev => {
          const exists = prev.some(course => 
            String(course.course_id) === String(courseId)
          );
          
          if (exists) return prev;
          return [...prev, newEnrollment];
        });
        
        console.log('✅ Successfully enrolled in course');
        setError(null);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('❌ Error enrolling in course:', err);
      setError(err.message);
      return false;
    }
  };

  const unenrollFromCourse = async (courseId) => {
    if (!user) return false;

    try {
      console.log('🗑️ Unenrolling from course:', courseId);
      
      const success = await UserDataService.unenrollUserFromCourse(user.id, courseId);
      
      if (success) {
        setEnrolledCourses(prev => prev.filter(course => 
          String(course.course_id) !== String(courseId)
        ));
        
        console.log('✅ Successfully unenrolled from course');
        setError(null);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('❌ Error unenrolling from course:', err);
      setError(err.message);
      return false;
    }
  };

  const addMaterialToFavorites = async (material) => {
    if (!user) {
          setError('User not authenticated');
          return false;
        }
    try{

      let result = await MaterialsService.addToFavorites(user.id, material.id); 
       if (result) {
        const newFavorite = {
          material_id: String(material.id),
          user_id: user.id,
          favorited_at: new Date().toISOString()
        };
        
        setFavoritedMaterials(prev => {
          const exists = prev.some(mat => 
            String(mat.id) === String(material.id)
          );
          
          if (exists) return prev;
          return [...prev, newFavorite];
        });
        
        console.log('✅ Successfully added course to favorites');
        setError(null);
        return true;
      }

    } catch (err) {
      console.log("couldn't add material to favorites", err);
    }
  }


  // Course favorites functions
  const addCourseToFavorites = async (courseId) => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    try {
      console.log('⭐ Adding course to favorites:', courseId);
      
      const result = await UserDataService.addCourseToFavorites(user.id, courseId);
      
      if (result) {
        const newFavorite = {
          course_id: String(courseId),
          user_id: user.id,
          favorited_at: new Date().toISOString()
        };
        
        setFavoritedCourses(prev => {
          const exists = prev.some(course => 
            String(course.course_id) === String(courseId)
          );
          
          if (exists) return prev;
          return [...prev, newFavorite];
        });
        
        console.log('✅ Successfully added course to favorites');
        setError(null);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('❌ Error adding course to favorites:', err);
      setError(err.message);
      return false;
    }
  };

  const removeCourseFromFavorites = async (courseId) => {
    if (!user) return false;

    try {
      console.log('🗑️ Removing course from favorites:', courseId);
      
      const success = await UserDataService.removeCourseFromFavorites(user.id, courseId);
      
      if (success) {
        setFavoritedCourses(prev => prev.filter(course => 
          String(course.course_id) !== String(courseId)
        ));
        
        console.log('✅ Successfully removed course from favorites');
        setError(null);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('❌ Error removing course from favorites:', err);
      setError(err.message);
      return false;
    }
  };

  // Progress functions
  const updateCourseProgress = async (courseId, progress) => {
    if (!user) return false;

    try {
      const result = await UserDataService.updateCourseProgress(user.id, courseId, progress);
      
      if (result) {
        setEnrolledCourses(prev => prev.map(course => 
          String(course.course_id) === String(courseId) 
            ? { ...course, progress }
            : course
        ));
        
        setError(null);
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('❌ Error updating course progress:', err);
      setError(err.message);
      return false;
    }
  };

  // Helper functions
  const isEnrolledInCourse = (courseId) => {
    const normalizedId = String(courseId);
    return enrolledCourses.some(course => 
      String(course.course_id) === normalizedId
    );
  };

  const isCourseFavorited = (courseId) => {
    const normalizedId = String(courseId);
    return favoritedCourses.some(course => 
      String(course.course_id) === normalizedId
    );
  };

  const getCourseProgress = (courseId) => {
    const course = enrolledCourses.find(course => 
      String(course.course_id) === String(courseId)
    );
    return course?.progress || 0;
  };

  const clearError = () => {
    setError(null);
  };

  // Debug function
  const debugUserData = () => {
    console.log('=== USER CONTEXT DEBUG ===');
    console.log('User:', user?.id);
    console.log('User Profile:', userProfile);
    console.log('Enrolled Courses:', enrolledCourses.length);
    console.log('Favorited Courses:', favoritedCourses.length);
    console.log('Loading:', loading);
    console.log('Initializing:', initializing);
    console.log('Error:', error);
    console.log('=========================');
  };

  const contextValue = {
    // User state
    user,
    userProfile,
    enrolledCourses,
    favoritedCourses,
    favoritedMaterials, 
    loading: loading || initializing, // Include initializing in loading state
    error,

    // Actions
    enrollInCourse,
    unenrollFromCourse,
    addCourseToFavorites,
    removeCourseFromFavorites,
    addMaterialToFavorites,
    updateCourseProgress,
    refreshUserData,

    // Helper functions
    isEnrolledInCourse,
    isCourseFavorited,
    getCourseProgress,
    clearError,
    debugUserData,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};