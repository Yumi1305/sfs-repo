import './App.css'
import WelcomePage from './pages/WelcomePage'
import MainPage from './pages/customer/MainPage'
import { BrowserRouter, Routes, Route} from 'react-router-dom'
import CoursePage from './pages/customer/CoursePage'
import Favorites from './pages/customer/Favorites'
import { useEffect, useRef } from 'react'
import { CourseProvider } from './contexts/CourseContext'
import MyCourses from './pages/customer/MyCourses'
import Donations from './pages/customer/Donations'
import { CursorProvider } from './contexts/CursorContext'
import SignupPage from './pages/SignupPage'
import { UserProvider } from './contexts/UserContext'
import ProtectedRoute from './components/ProtectedRoute'
import ResetPasswordPage from './pages/ResetPasswordPage'
import Settings from './pages/customer/Settings'
import Tutor from './pages/customer/Tutoring'

function App() {
  const cursor = useRef();
  
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (cursor.current) {
        cursor.current.style.left = `${e.clientX}px`;
        cursor.current.style.top = `${e.clientY}px`; 
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  return (
    <BrowserRouter>
    <UserProvider>
    <CursorProvider>
    <CourseProvider>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/mainpg" element={
          <ProtectedRoute>
            <MainPage />
            </ProtectedRoute>
          } />
        <Route path="/course/:id" element={
          <ProtectedRoute>
          <CoursePage />
          </ProtectedRoute>}
           />
        <Route path="/favorites" element={
          <ProtectedRoute>
          <Favorites />
          </ProtectedRoute>
          } />
        <Route path='/my-courses' element={
          <ProtectedRoute>
          <MyCourses/>
          </ProtectedRoute>
          }/>
        <Route path='/settings' element={<Settings/>}/>
        <Route path='/donate' element={<Donations/>}/>
        <Route path='/signup' element={<SignupPage/>}/>
        <Route path='/tutoring' element={<Tutor/>}/>
        <Route path='/reset-password' element={<ResetPasswordPage/>}/>

      </Routes>
    </CourseProvider>
    </CursorProvider>
    </UserProvider>
    </BrowserRouter>
  );
}

export default App
