import styles from '../components/NavBar.module.css'
import clsx from 'clsx'
import { useState } from 'react'
import { FaSearch } from "react-icons/fa";
import { Upload } from 'lucide-react';
import ProfileDropdown from './ProfileDropdown';
import { Link, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar';
import UploadMaterialModal from './UploadMaterialModal';
import { useUserContext } from '../hooks/useUserContext';
import { MaterialsService } from '../services/materialsService';

function NavBar({ onSearch }) {
  const [open, setOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadNotification, setUploadNotification] = useState(null);
  const location = useLocation();
  const { user } = useUserContext();

  // Determine active button based on current path
  const getActiveBtn = () => {
    if (location.pathname === '/mainpg') return 'dashboard';
    if (location.pathname === '/my-courses') return 'my-courses';
    if (location.pathname === '/favorites') return 'favorites';
    if (location.pathname === '/donate') return 'donate'
    if (location.pathname === '/tutoring') return 'tutor'
    if (location.pathname === '/materials') return 'materials'
  };

  const activebtn = getActiveBtn();

  const handleSearch = (searchTerm) => {
    // Pass the search term to parent component
    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  const handleOpenUploadModal = () => {
    // if (!user) {
    //   // Show a notification that user needs to sign in
    //   setUploadNotification({
    //     type: 'warning',
    //     message: 'Please sign in to upload materials'
    //   });
    //   setTimeout(() => setUploadNotification(null), 3000);
    //   return;
    // }
    setIsUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  const handleMaterialSubmit = async (materialData) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      await MaterialsService.submitMaterial(user.id, materialData);
      
      // Show success notification
      setUploadNotification({
        type: 'success',
        message: 'Material submitted! Pending admin approval.'
      });
      
      // Clear notification after 5 seconds
      setTimeout(() => setUploadNotification(null), 5000);
      
    } catch (error) {
      console.error('Error submitting material:', error);
      throw error;
    }
  };

  return (
    <>
      <div className={styles["navBar"]}>
        <Link to={"/mainpg"} className={styles["left"]}>SFS</Link>
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search courses..."
        ></SearchBar>

        <div className={styles["right"]}>
          {/* Upload Material Button */}
          <button
            className={styles["upload-btn"]}
            onClick={handleOpenUploadModal}
            title="Upload study material"
          >
            <Upload size={16} />
            <span>Upload Material</span>
          </button>

          <Link
            style={{ textDecoration: "none" }}
            to={"/mainpg"}
            className={clsx(
              styles["nav-btn"],
              activebtn === "dashboard" && styles["active"]
            )}
          >
            dashboard
          </Link>
          <Link
            to={"/my-courses"}
            className={clsx(
              styles["nav-btn"],
              activebtn === "my-courses" && styles["active"]
            )}
          >
            my courses
          </Link>
          <Link
            to={'/donate'}
            className={clsx(styles['nav-btn'],
              activebtn === 'donate' && styles['active']
            )}
          >
            donate
          </Link>
          <Link
            to={'/tutoring'}
            className={clsx(styles['nav-btn'],
              activebtn === 'tutor' && styles['active']
            )}
          >
            tutoring
          </Link>
          <Link
            className={clsx(styles["favorites"], styles["nav-btn"])}
            to={"/favorites"}
            style={{ textDecoration: `none` }}
          >
            <svg
              className={clsx(
                styles["favorites-svg"],
                activebtn === "favorites" && styles["active"]
              )}
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
            >
              <path d="M200-120v-640q0-33 23.5-56.5T280-840h400q33 0 56.5 23.5T760-760v640L480-240 200-120Zm80-122 200-86 200 86v-518H280v518Zm0-518h400-400Z" />
            </svg>
          </Link>
          <button
            className={styles["profile-icon"]}
            onClick={() => {
              setOpen(!open);
            }}
          >
            <ProfileDropdown open={open}></ProfileDropdown>
          </button>
        </div>
      </div>

      {/* Upload Material Modal */}
      <UploadMaterialModal
        isOpen={isUploadModalOpen}
        onClose={handleCloseUploadModal}
        onSubmit={handleMaterialSubmit}
      />

      {/* Notification Toast */}
      {uploadNotification && (
        <div className={clsx(
          styles['notification-toast'],
          styles[`notification-${uploadNotification.type}`]
        )}>
          {uploadNotification.message}
        </div>
      )}
    </>
  );
}

export default NavBar