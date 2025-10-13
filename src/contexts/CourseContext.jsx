import React, { createContext, useContext, useState, useEffect } from 'react';
import fetchAllCourses from '../services/wordpressapi';
import { fetchAuthorInfo } from '../services/wordpressapi';

const CourseContext = createContext();

export const CourseProvider = ({children}) => {
  const [courseList, setCourseList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  useEffect(()=>{
    const fetchCourses = async() => {
      const response = await fetchAllCourses();
      if (response){
        setCourseList(response.data.posts);
      }
      setLoading(false)
    };

    fetchCourses();
  }, [])

  const getAuthorInfo = async(id) => {
    try{
      const response = await fetchAuthorInfo(id);
      console.log('THIS IS THE AUTHOR INFORMATION', response)
      return response
    } catch (error){
      console.log('error with author info', error)
      return {courses: null}
    }
    
  }

// useEffect(() => {
//   const fetchData = async () => {
//     if (courseList.length > 0) {
//       const usersMap = courseList.map(course => course.post_author);
//       const uniqueUsers = [...new Map(usersMap.map(user => [user.ID, user])).values()];
      
//       uniqueUsers.map(async user => {
//         const authorCourses = await fetchAuthorInfo(user.ID);
//         return {...user, courses:authorCourses.data.courses}
//       })
//       // const addCourses = async(userList) => {
//       //   try{
//       //     userList.map(user=>{
//       //       const authorCourses = await fetchAuthorInfo(user.ID)
//       //     })
//       //   }catch (error){

//       //   }
//       // }
//       // const usersWithCourses = await Promise.all(
//       //   uniqueUsers.map(async (user) => {
//       //     const authorInfo = await fetchAuthorInfo(user.ID).data.courses;
//       //     return {
//       //       ...user,
//       //       courses: authorInfo?.data // optional chaining in case of null
//       //     };
//       //   })
//       // );
      
//       setUsers(uniqueUsers);
//     }
//   };

//   fetchData();
// }, [courseList]);

useEffect(() => {
  const fetchUsersWithCourses = async () => {
    if (courseList.length > 0) {
      const usersMap = courseList.map(course => course.post_author);
      const uniqueUsers = [...new Map(usersMap.map(user => [user.ID, user])).values()];
      
      const usersWithCourses = await Promise.all(
        uniqueUsers.map(async user => {
          const authorCourses = await fetchAuthorInfo(user.ID);
          return {...user, courses: authorCourses.data.courses}
        })
      );
      
      setUsers(usersWithCourses); 
    }
  };

  fetchUsersWithCourses();
}, [courseList]);

  const contextValue = {
    courseList, 
    loading, 
    users
  }

  return(
    <>
    <CourseContext.Provider value={contextValue}>
      {children}
    </CourseContext.Provider>
    </>
  )
}

export const useCourses = () => {
  const context = useContext(CourseContext);
  if (!context){
      throw new Error('useCourses must be used within a CourseProvider');
  }
  return context;

}

export const useCourse = () => {

}
