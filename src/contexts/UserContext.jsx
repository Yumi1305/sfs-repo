import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { UserDataService } from '../services/userData';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [favoritedCourses, setFavoritedCourses] = useState([]);
  const [favoritedMaterialIds, setFavoritedMaterialIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Initialize user data
  useEffect(() => {
    let mounted = true;

    const initializeUser = async () => {
      try {
        setLoading(true);
        setInitializing(true);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(sessionError.message);
        } else if (session?.user && mounted) {
          setUser(session.user);
          await loadUserData(session.user.id);
        }
      } catch (err) {
        console.error('Error initializing user:', err);
        if (mounted) setError(err.message);
      } finally {
        if (mounted) {
          setLoading(false);
          setInitializing(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          if (session?.user) {
            setUser(session.user);
            setError(null);
            if (!loading) {
              setLoading(true);
              await loadUserData(session.user.id);
              setLoading(false);
            }
          }
          break;
          
        case 'SIGNED_OUT':
          setUser(null);
          setUserProfile(null);
          setEnrolledCourses([]);
          setFavoritedCourses([]);
          setFavoritedMaterialIds(new Set());
          setError(null);
          break;
          
        case 'USER_UPDATED':
          if (session?.user) setUser(session.user);
          break;
      }
    });

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
      const [profile, dashboardData, favoritedMaterials] = await Promise.all([
        UserDataService.getUserProfile(userId),
        UserDataService.getUserDashboardData(userId),
        loadFavoritedMaterialIds(userId)
      ]);

      setUserProfile(profile);
      setEnrolledCourses(dashboardData.enrolledCourses || []);
      setFavoritedCourses(dashboardData.favoritedCourses || []);
      setFavoritedMaterialIds(favoritedMaterials);
      setError(null);
    } catch (err) {
      console.error('Error loading user data:', err);
      setError(err.message);
    }
  };

  // Load favorited material IDs
  const loadFavoritedMaterialIds = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_favorited_materials')
        .select('material_id')
        .eq('user_id', userId);
      
      if (error) throw error;
      return new Set(data?.map(f => f.material_id) || []);
    } catch (err) {
      console.error('Error loading favorited materials:', err);
      return new Set();
    }
  };

  // Toggle material favorite - single source of truth
  const toggleMaterialFavorite = useCallback(async (materialId) => {
    if (!user) {
      setError('Please sign in to save favorites');
      return { success: false, isFavorited: false };
    }

    const wasFavorited = favoritedMaterialIds.has(materialId);
    
    // Optimistic update
    setFavoritedMaterialIds(prev => {
      const next = new Set(prev);
      if (wasFavorited) {
        next.delete(materialId);
      } else {
        next.add(materialId);
      }
      return next;
    });

    try {
      if (wasFavorited) {
        const { error } = await supabase
          .from('user_favorited_materials')
          .delete()
          .eq('user_id', user.id)
          .eq('material_id', materialId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_favorited_materials')
          .insert({
            user_id: user.id,
            material_id: materialId,
            favorited_at: new Date().toISOString()
          });
        
        if (error && error.code !== '23505') throw error;
      }
      
      return { success: true, isFavorited: !wasFavorited };
    } catch (err) {
      console.error('Error toggling favorite:', err);
      
      // Rollback on error
      setFavoritedMaterialIds(prev => {
        const next = new Set(prev);
        if (wasFavorited) {
          next.add(materialId);
        } else {
          next.delete(materialId);
        }
        return next;
      });
      
      setError('Failed to update favorite');
      return { success: false, isFavorited: wasFavorited };
    }
  }, [user, favoritedMaterialIds]);

  // Check if material is favorited
  const isMaterialFavorited = useCallback((materialId) => {
    return favoritedMaterialIds.has(materialId);
  }, [favoritedMaterialIds]);

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
      const result = await UserDataService.enrollUserInCourse(user.id, courseId);
      
      if (result) {
        const newEnrollment = {
          course_id: String(courseId),
          user_id: user.id,
          progress: 0,
          enrolled_at: new Date().toISOString()
        };
        
        setEnrolledCourses(prev => {
          if (prev.some(c => String(c.course_id) === String(courseId))) return prev;
          return [...prev, newEnrollment];
        });
        
        setError(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error enrolling in course:', err);
      setError(err.message);
      return false;
    }
  };

  const unenrollFromCourse = async (courseId) => {
    if (!user) return false;

    try {
      const success = await UserDataService.unenrollUserFromCourse(user.id, courseId);
      
      if (success) {
        setEnrolledCourses(prev => prev.filter(c => String(c.course_id) !== String(courseId)));
        setError(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error unenrolling from course:', err);
      setError(err.message);
      return false;
    }
  };

  // Course favorites functions
  const addCourseToFavorites = async (courseId) => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    try {
      const result = await UserDataService.addCourseToFavorites(user.id, courseId);
      
      if (result) {
        const newFavorite = {
          course_id: String(courseId),
          user_id: user.id,
          favorited_at: new Date().toISOString()
        };
        
        setFavoritedCourses(prev => {
          if (prev.some(c => String(c.course_id) === String(courseId))) return prev;
          return [...prev, newFavorite];
        });
        
        setError(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error adding course to favorites:', err);
      setError(err.message);
      return false;
    }
  };

  const removeCourseFromFavorites = async (courseId) => {
    if (!user) return false;

    try {
      const success = await UserDataService.removeCourseFromFavorites(user.id, courseId);
      
      if (success) {
        setFavoritedCourses(prev => prev.filter(c => String(c.course_id) !== String(courseId)));
        setError(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error removing course from favorites:', err);
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
        setEnrolledCourses(prev => prev.map(c => 
          String(c.course_id) === String(courseId) ? { ...c, progress } : c
        ));
        setError(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating course progress:', err);
      setError(err.message);
      return false;
    }
  };

  // Helper functions
  const isEnrolledInCourse = (courseId) => {
    return enrolledCourses.some(c => String(c.course_id) === String(courseId));
  };

  const isCourseFavorited = (courseId) => {
    return favoritedCourses.some(c => String(c.course_id) === String(courseId));
  };

  const getCourseProgress = (courseId) => {
    const course = enrolledCourses.find(c => String(c.course_id) === String(courseId));
    return course?.progress || 0;
  };

  const clearError = () => setError(null);

  const contextValue = {
    // User state
    user,
    userProfile,
    enrolledCourses,
    favoritedCourses,
    favoritedMaterialIds,
    loading: loading || initializing,
    error,

    // Material favorites
    toggleMaterialFavorite,
    isMaterialFavorited,

    // Course actions
    enrollInCourse,
    unenrollFromCourse,
    addCourseToFavorites,
    removeCourseFromFavorites,
    updateCourseProgress,
    refreshUserData,

    // Helper functions
    isEnrolledInCourse,
    isCourseFavorited,
    getCourseProgress,
    clearError,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};