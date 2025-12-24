import styles from '../components/NavBar.module.css';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { Upload, Menu, X } from 'lucide-react';
import ProfileDropdown from './ProfileDropdown';
import { Link, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar';
import UploadMaterialModal from './UploadMaterialModal';
import { useUserContext } from '../hooks/useUserContext';
import SignInModal from './SignInModal'; 
import MaterialsService from '../services/materialsService'

function NavBar({ onSearch }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadNotification, setUploadNotification] = useState(null);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const location = useLocation();
  const { user } = useUserContext();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const getActiveBtn = () => {
    if (location.pathname === '/mainpg') return 'dashboard';
    if (location.pathname === '/my-courses') return 'my-courses';
    if (location.pathname === '/favorites') return 'favorites';
    if (location.pathname === '/donate') return 'donate';
    if (location.pathname === '/tutoring') return 'tutor';
    if (location.pathname === '/materials') return 'materials';
  };

  const activebtn = getActiveBtn();

  const handleSearch = (searchTerm) => {
    if (onSearch) onSearch(searchTerm);
    setMobileMenuOpen(false);
  };

  const handleOpenUploadModal = () => {
    if (user){
      setIsUploadModalOpen(true);
      setMobileMenuOpen(false);
    } else {
      setIsSignInModalOpen(true); 
    }
    
    
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  const handleCloseSignInModal =() => {
    setIsSignInModalOpen(false); 
    }

  const handleMaterialSubmit = async (materialData) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await MaterialsService.submitMaterial(user.id, materialData);
      setUploadNotification({
        type: 'success',
        message: 'Material submitted! Pending admin approval.'
      });
      setTimeout(() => setUploadNotification(null), 5000);
    } catch (error) {
      console.error('Error submitting material:', error);
      throw error;
    }
  };

  return (
    <>
      <nav className={styles.navBar}>
        <Link to="/mainpg" className={styles.left}>SFS</Link>
        
        {/* Desktop Search */}
        <div className={styles.desktopSearch}>
          <SearchBar onSearch={handleSearch} placeholder="Search courses..." />
        </div>

        {/* Desktop Navigation */}
        <div className={styles.right}>
          <button className={styles.uploadBtn} onClick={handleOpenUploadModal} title="Upload study material">
            <Upload size={16} />
            <span>Upload Material</span>
          </button>

          <Link to="/mainpg" className={clsx(styles.navBtn, activebtn === 'dashboard' && styles.active)}>
            dashboard
          </Link>
          <Link to="/my-courses" className={clsx(styles.navBtn, activebtn === 'my-courses' && styles.active)}>
            my courses
          </Link>
          <Link to="/donate" className={clsx(styles.navBtn, activebtn === 'donate' && styles.active)}>
            donate
          </Link>
          {/* <Link to="/tutoring" className={clsx(styles.navBtn, activebtn === 'tutor' && styles.active)}>
            tutoring
          </Link> */}
          <Link to="/favorites" className={clsx(styles.favorites, styles.navBtn)}>
            <svg
              className={clsx(styles.favoritesSvg, activebtn === 'favorites' && styles.active)}
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
            >
              <path d="M200-120v-640q0-33 23.5-56.5T280-840h400q33 0 56.5 23.5T760-760v640L480-240 200-120Zm80-122 200-86 200 86v-518H280v518Zm0-518h400-400Z" />
            </svg>
          </Link>
          <button className={styles.profileIcon} onClick={() => setProfileOpen(!profileOpen)}>
            <ProfileDropdown open={profileOpen} />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button className={styles.mobileMenuBtn} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={clsx(styles.mobileOverlay, mobileMenuOpen && styles.open)} onClick={() => setMobileMenuOpen(false)} />

      {/* Mobile Menu */}
      <div className={clsx(styles.mobileMenu, mobileMenuOpen && styles.open)}>
        <div className={styles.mobileSearchWrapper}>
          <SearchBar onSearch={handleSearch} placeholder="Search courses..." />
        </div>

        <div className={styles.mobileNavLinks}>
          <Link to="/mainpg" className={clsx(styles.mobileNavBtn, activebtn === 'dashboard' && styles.active)}>
            Dashboard
          </Link>
          <Link to="/my-courses" className={clsx(styles.mobileNavBtn, activebtn === 'my-courses' && styles.active)}>
            My Courses
          </Link>
          <Link to="/favorites" className={clsx(styles.mobileNavBtn, activebtn === 'favorites' && styles.active)}>
            Favorites
          </Link>
          <Link to="/donate" className={clsx(styles.mobileNavBtn, activebtn === 'donate' && styles.active)}>
            Donate
          </Link>
          <Link to="/tutoring" className={clsx(styles.mobileNavBtn, activebtn === 'tutor' && styles.active)}>
            Tutoring
          </Link>
        </div>

        <button className={styles.mobileUploadBtn} onClick={handleOpenUploadModal}>
          <Upload size={18} />
          <span>Upload Material</span>
        </button>

        <div className={styles.mobileProfileSection}>
          <button className={styles.mobileProfileBtn} onClick={() => setProfileOpen(!profileOpen)}>
            <div className={styles.mobileProfileIcon} />
            <span>Profile</span>
          </button>
        </div>
      </div>

      <UploadMaterialModal
        isOpen={isUploadModalOpen}
        onClose={handleCloseUploadModal}
        onSubmit={handleMaterialSubmit}
      />
      <SignInModal isOpen={isSignInModalOpen} onClose={handleCloseSignInModal}></SignInModal>

      {uploadNotification && (
        <div className={clsx(styles.notificationToast, styles[`notification-${uploadNotification.type}`])}>
          {uploadNotification.message}
        </div>
      )}
    </>
  );
}

export default NavBar;