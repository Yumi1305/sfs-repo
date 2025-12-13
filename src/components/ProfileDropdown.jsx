import styles from './ProfileDropdown.module.css';
import { User, HelpCircle, FlaskConical, Settings, LogOut } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useState } from 'react';
import LogoutModal from './LogoutModal';
import { Link } from 'react-router-dom';

export default function ProfileDropdown({ open }) {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleCloseModal = () => {
    if (!loggingOut) {
      setShowLogoutModal(false);
    }
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        // Handle error - maybe show a toast notification
      } else {
        // Success - the auth state change will handle navigation
        setShowLogoutModal(false);
      }
    } catch (err) {
      console.error('Unexpected error during logout:', err);
    } finally {
      navigate('/login');
      setLoggingOut(false);
    }
  };
  return (
    <div className={styles.wrapper}>
      {open && !showLogoutModal ? (
        <div className={styles.dropdown}>
          <div className={styles.item}><User size={16} /> Profile</div>
          <div className={styles.item}><HelpCircle size={16} /> Help</div>
          <div className={styles.divider}></div>
          <div className={styles.item}><FlaskConical size={16} /> Developer Mode</div>
          <div className={styles.divider}></div>
          <Link
          to={'/settings'}>
          <div className={styles.item}><Settings size={16} /> Settings</div>
          </Link>
          <div className={styles.item} onClick={handleLogoutClick}><LogOut size={16} /> Logout</div>
        </div>
        
      ) : (
        <LogoutModal
        isOpen={showLogoutModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmLogout}
        loading={loggingOut}
      />
      )}
    </div>
  );
} 
