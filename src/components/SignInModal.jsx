import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';
import styles from './SignInModal.module.css';

function SignInModal({isOpen, onClose}) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
    } catch (err) {
      console.error('Sign in error:', err);
      alert('Failed to sign in with Google');
    }
  };

  const handleEmailSignIn = () => {
    navigate('/login');
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className={styles.content}>
          <div className={styles.icon}>🔒</div>
          <h2>Sign in required</h2>
          <p>Please sign in to use this feature</p>
          
          <div className={styles.buttons}>
            <button 
              className={styles.googleBtn}
              onClick={handleGoogleSignIn}
            >
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <g fill="none" fillRule="evenodd">
                  <path d="M17.6 9.2l-.1-1.8H9v3.4h4.8C13.6 12 13 13 12 13.6v2.2h3a8.8 8.8 0 0 0 2.6-6.6z" fill="#4285F4"/>
                  <path d="M9 18c2.4 0 4.5-.8 6-2.2l-3-2.2a5.4 5.4 0 0 1-8-2.9H1V13a9 9 0 0 0 8 5z" fill="#34A853"/>
                  <path d="M4 10.7a5.4 5.4 0 0 1 0-3.4V5H1a9 9 0 0 0 0 8l3-2.3z" fill="#FBBC05"/>
                  <path d="M9 3.6c1.3 0 2.5.4 3.4 1.3L15 2.3A9 9 0 0 0 1 5l3 2.4a5.4 5.4 0 0 1 5-3.7z" fill="#EA4335"/>
                </g>
              </svg>
              Continue with Google
            </button>
            
            <button 
              className={styles.emailBtn}
              onClick={handleEmailSignIn}
            >
              Sign in with Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignInModal;