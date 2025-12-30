import React, { useState, useEffect, useRef } from 'react';
import styles from './MaterialCard.module.css';
import { Link as LinkIcon, Youtube, FileText, File, Bookmark, ArrowUp, ExternalLink } from 'lucide-react';
import { useUserContext } from '../hooks/useUserContext';
import MaterialsService from '../services/materialsService';
import SignInModal from './SignInModal';

const TYPE_CONFIG = {
  link: { icon: LinkIcon, label: 'Link', color: '#3b82f6' },
  youtube: { icon: Youtube, label: 'Video', color: '#ef4444' },
  pdf: { icon: FileText, label: 'PDF', color: '#f59e0b' },
  document: { icon: File, label: 'Document', color: '#10b981' },
  course: { icon: FileText, label: 'Course', color: '#8b5cf6' }
};

function MaterialCard({ material, userUpvotes = [], onUpvoteChange }) {
  const { user, toggleMaterialFavorite, isMaterialFavorited } = useUserContext();
  const [isToggling, setIsToggling] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [localUpvoteCount, setLocalUpvoteCount] = useState(material.upvote_count || 0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const cardRef = useRef(null);
  
  const config = TYPE_CONFIG[material.type] || TYPE_CONFIG.link;
  const IconComponent = config.icon;
  const isFavorited = isMaterialFavorited(material.id);

  // Check if user has upvoted this material
  useEffect(() => {
    setHasUpvoted(userUpvotes.includes(material.id));
  }, [userUpvotes, material.id]);

  // Update local count when material prop changes
  useEffect(() => {
    setLocalUpvoteCount(material.upvote_count || 0);
  }, [material.upvote_count]);

  // Handle card expansion (click to toggle for both desktop and mobile)
  const handleCardInteraction = (e) => {
    // Don't expand if clicking on interactive elements
    if (e.target.closest(`.${styles.favoriteButton}`) || 
        e.target.closest(`.${styles.upvoteButton}`) ||
        e.target.closest(`.${styles.openLink}`)) {
      return;
    }
    
    e.preventDefault();
    setIsExpanded(prev => !prev);
  };

  const handleOpenLink = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = material.url || material.file_url;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      // Show sign-in modal
      setShowSignInModal(true);
      return;
    }
    
    if (isToggling) return;
    
    setIsToggling(true);
    await toggleMaterialFavorite(material.id);
    setIsToggling(false);
  };

  const handleUpvoteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      // Show sign-in modal
      setShowSignInModal(true);
      return;
    }
    
    if (isUpvoting) return;
    
    setIsUpvoting(true);
    
    try {
      if (hasUpvoted) {
        await MaterialsService.removeUpvote(user.id, material.id);
        setLocalUpvoteCount(prev => Math.max(0, prev - 1));
        setHasUpvoted(false);
        if (onUpvoteChange) onUpvoteChange(material.id, false);
      } else {
        await MaterialsService.addUpvote(user.id, material.id);
        setLocalUpvoteCount(prev => prev + 1);
        setHasUpvoted(true);
        if (onUpvoteChange) onUpvoteChange(material.id, true);
      }
    } catch (error) {
      console.error('Error toggling upvote:', error);
    } finally {
      setIsUpvoting(false);
    }
  };

  const getYoutubeThumbnail = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match?.[1] ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
  };

  const thumbnail = material.type === 'youtube' 
    ? getYoutubeThumbnail(material.url) 
    : material.thumbnail_url;

  return (
    <>
      <div 
        ref={cardRef}
        className={`${styles.card} ${isExpanded ? styles.expanded : ''}`}
        onClick={handleCardInteraction}
      >
        {/* Thumbnail */}
        {thumbnail ? (
          <div className={styles.thumbnail}>
            <img src={thumbnail} alt={material.title} />
            {material.type === 'youtube' && (
              <div className={styles.playButton}>
                <Youtube size={20} />
              </div>
            )}
            {material.type === 'pdf' && (
              <div className={styles.typeOverlay}>
                <FileText size={16} />
                <span>PDF</span>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.placeholderThumbnail} style={{ backgroundColor: `${config.color}15` }}>
            <IconComponent size={32} style={{ color: config.color }} />
            <span style={{ color: config.color }}>{config.label}</span>
          </div>
        )}
        
        {/* Content */}
        <div className={styles.content}>
          <div className={styles.header}>
            <div 
              className={styles.typeBadge}
              style={{ backgroundColor: `${config.color}20`, color: config.color }}
            >
              <IconComponent size={12} />
              <span>{config.label}</span>
            </div>
            {material.difficulties?.[0] && (
              <span className={styles.difficultyTag}>{material.difficulties[0]}</span>
            )}
          </div>

          <h3 className={styles.title}>{material.title}</h3>

          {/* Collapsed content - animates out */}
          <div className={styles.collapsedWrapper}>
            <div className={styles.collapsedInner}>
              <div className={styles.collapsedContent}>
                {material.description && (
                  <p className={styles.description}>{material.description}</p>
                )}

                <div className={styles.footer}>
                  <div className={styles.tags}>
                    {material.subjects?.slice(0, 2).map((subject, i) => (
                      <span key={i} className={styles.subjectTag}>{subject}</span>
                    ))}
                    {material.subjects?.length > 2 && (
                      <span className={styles.moreTag}>+{material.subjects.length - 2}</span>
                    )}
                  </div>
                  
                  <div className={styles.footerActions}>
                    <div className={styles.upvoteDisplay}>
                      <ArrowUp size={14} />
                      <span>{localUpvoteCount}</span>
                    </div>
                    
                    <button
                      className={`${styles.favoriteButton} ${isFavorited ? styles.favorited : ''}`}
                      onClick={handleFavoriteClick}
                      disabled={isToggling}
                      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Bookmark size={16} fill={isFavorited ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expanded content - animates in */}
          <div className={styles.expandedWrapper}>
            <div className={styles.expandedInner}>
              <div className={styles.expandedContent}>
                {/* Full description */}
                {material.description && (
                  <p className={styles.fullDescription}>{material.description}</p>
                )}

                {/* All tags */}
                <div className={styles.allTags}>
                  {material.subjects?.map((subject, i) => (
                    <span key={i} className={styles.subjectTag}>{subject}</span>
                  ))}
                  {material.difficulties?.map((diff, i) => (
                    <span key={`diff-${i}`} className={styles.difficultyTagExpanded}>{diff}</span>
                  ))}
                </div>

                {/* Upvote section */}
                <div className={styles.upvoteSection}>
                  <button
                    className={`${styles.upvoteButton} ${hasUpvoted ? styles.upvoted : ''}`}
                    onClick={handleUpvoteClick}
                    disabled={isUpvoting}
                    title={!user ? 'Sign in to upvote' : hasUpvoted ? 'Remove upvote' : 'Upvote this material'}
                  >
                    <ArrowUp size={18} />
                    <span>{localUpvoteCount}</span>
                  </button>
                  
                  {!user && (
                    <span className={styles.signInHint}>Sign in to upvote</span>
                  )}
                </div>

                {/* Action buttons */}
                <div className={styles.expandedActions}>
                  <button
                    className={styles.openLink}
                    onClick={handleOpenLink}
                  >
                    <ExternalLink size={16} />
                    <span>Open {config.label}</span>
                  </button>
                  
                  <button
                    className={`${styles.favoriteButton} ${isFavorited ? styles.favorited : ''}`}
                    onClick={handleFavoriteClick}
                    disabled={isToggling}
                    title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Bookmark size={16} fill={isFavorited ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sign In Modal */}
      <SignInModal 
        isOpen={showSignInModal} 
        onClose={() => setShowSignInModal(false)} 
      />
    </>
  );
}

export default MaterialCard;