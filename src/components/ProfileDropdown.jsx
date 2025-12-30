import styles from './ProfileDropdown.module.css';
import { User, HelpCircle, FlaskConical, Settings, LogOut } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useUserContext } from '../hooks/useUserContext';

export default function ProfileDropdown({ open, onLogoutClick }) {
  const navigate = useNavigate();
  const { user } = useUserContext();

  const handleLogoutClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onLogoutClick) {
      onLogoutClick();
    }
  };

  if (!open) return null;

  if (!user) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.signInDropdown}>
          <div 
            className={styles.signInItem}
            onClick={(e) => {
              e.stopPropagation();
              navigate('/login');
            }} 
          >
            Sign In
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper} onClick={(e) => e.stopPropagation()}>
      <div className={styles.dropdown}>
        <div className={styles.item}><User size={16} /> Profile</div>
        <div className={styles.item}><HelpCircle size={16} /> Help</div>
        <div className={styles.divider}></div>
        <div className={styles.item}><FlaskConical size={16} /> Developer Mode</div>
        <div className={styles.divider}></div>
        <Link to={'/settings'} onClick={(e) => e.stopPropagation()}>
          <div className={styles.item}><Settings size={16} /> Settings</div>
        </Link>
        <div className={styles.item} onClick={handleLogoutClick}>
          <LogOut size={16} /> Logout
        </div>
      </div>
    </div>
  );
}