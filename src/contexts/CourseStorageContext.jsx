import React, { createContext, useContext, useState } from 'react';

const CourseStorageContext = createContext();

export const CourseStorageProvider = ({children}) => {
  const [loadedCourses, setLoadedCourses] = useState(new Object());

  const addLoadedCourse = (id, courseData) => {
    if(loadedCourses){
      loadedCourses[id] = courseData;
      console.log("Added course "+id+" to storage");
    }
    else{
      console.log('loadedCourses does not exist');
    }
  }

  const getLoadedCourse = (id) => {
    console.log("Loading course data, id: "+id);

    if(loadedCourses){
      if(loadedCourses.hasOwnProperty(id)){
        console.log("Course data for id "+id+" found! :)");
        return loadedCourses[id];
      }
      else{
        console.log("Course data for id "+id+" not found :(");
      }
    }
    else{
      console.log('loadedCourses does not exist');
    }
    return false;
  }

  const contextValue = {
    addLoadedCourse,
    getLoadedCourse
  }

  return(
    <>
    <CourseStorageContext.Provider value={contextValue}>
      {children}
    </CourseStorageContext.Provider>
    </>
  )
}

export const useCourseStorage = () => {
  const context = useContext(CourseStorageContext);
  if (!context){
      throw new Error('useCourseStorage must be used within a CourseStorageProvider');
  }
  return context;

}