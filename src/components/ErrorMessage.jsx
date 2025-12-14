import styles from './ErrorMessage.module.css'; 
import clsx from 'clsx';
import { useState, useEffect } from 'react'; 
import SignInModal from './SignInModal';

function ErrorMessage({ error, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);
  const [signIn, setSignIn] = useState(false)
  
  useEffect(() => {
    if (error) {
      if (error == 'Please sign in to save favorites'){
        setSignIn(true);
      }
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onDismiss) onDismiss();
    }, 400); 
  };

  if (!error) return null;

  if (signIn){
    return(
      <SignInModal onClose={()=>{
        setSignIn(false)
      }}></SignInModal>
    )
  }
  return (
    <div className={clsx(
      styles['error-message'],
      isVisible && styles['visible']
    )}>
      <span>{error}</span>
      <button 
        onClick={handleDismiss}
        className={styles['dismiss-btn']}
      >
        ✕
      </button>
    </div>
  );
}

export default ErrorMessage;