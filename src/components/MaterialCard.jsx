import React, { useState } from 'react';
import styles from './MaterialCard.module.css';
import { Link as LinkIcon, Youtube, FileText, File, ExternalLink, Clock, Bookmark } from 'lucide-react';
import { useUserContext } from '../hooks/useUserContext';
import { supabase } from '../lib/supabase';

const TYPE_ICONS = {
  link: LinkIcon,
  youtube: Youtube,
  pdf: FileText,
  document: File,
  course: FileText
};

const TYPE_LABELS = {
  link: 'Link',
  youtube: 'Video',
  pdf: 'PDF',
  document: 'Document',
  course: 'Course'
};

const TYPE_COLORS = {
  link: '#3b82f6',
  youtube: '#ef4444',
  pdf: '#f59e0b',
  document: '#10b981',
  course: '#8b5cf6'
};

function MaterialCard({ material, onFavoriteChange }) {
  const {user, addMaterialToFavorites } = useUserContext();
  const [isFavorited, setIsFavorited] = useState(material.is_favorited || false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  
  const IconComponent = TYPE_ICONS[material.type] || FileText;
  const typeColor = TYPE_COLORS[material.type] || '#6b7280';
  
  const handleClick = (e) => {
    // Don't open link if clicking favorite button
    if (e.target.closest(`.${styles.favoriteButton}`)) return;
    
    if (material.url) {
      window.open(material.url, '_blank', 'noopener,noreferrer');
    } else if (material.file_url) {
      window.open(material.file_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      console.log('User must be logged in to favorite');
      return;
    }
    
    if (favoriteLoading) return;
    
    setFavoriteLoading(true);
    
    try {
      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_favorited_materials')
          .delete()
          .eq('user_id', user.id)
          .eq('material_id', material.id);

        const result = await addMaterialToFavorites(material); 
        if (!result){
          console.log("I honestly don't know what I'm doing anymore.")
        }
        
        if (error) throw error;
        setIsFavorited(false);
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('user_favorited_materials')
          .insert({
            user_id: user.id,
            material_id: material.id,
            favorited_at: new Date().toISOString()
          });
        
        if (error) throw error;
        setIsFavorited(true);
      }
      
      if (onFavoriteChange) {
        onFavoriteChange(material.id, !isFavorited);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getYoutubeThumbnail = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (match && match[1]) {
      return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
    }
    return null;
  };

  // Determine which thumbnail to show
  const getThumbnail = () => {
    // For YouTube, always try to get the auto-thumbnail
    if (material.type === 'youtube') {
      return getYoutubeThumbnail(material.url);
    }
    
    // For other types, use the uploaded thumbnail if available
    if (material.thumbnail_url) {
      return material.thumbnail_url;
    }
    
    return null;
  };

  const thumbnail = getThumbnail();

  return (
    <div className={styles.card} onClick={handleClick}>
      {/* Thumbnail section */}
      {thumbnail ? (
        <div className={styles.thumbnail}>
          <img src={thumbnail} alt={material.title} />
          {material.type === 'youtube' && (
            <div className={styles.playButton}>
              <Youtube size={24} />
            </div>
          )}
          {material.type === 'pdf' && (
            <div className={styles.typeOverlay}>
              <FileText size={20} />
              <span>PDF</span>
            </div>
          )}
        </div>
      ) : (
        // Placeholder thumbnail for materials without images
        <div className={styles.placeholderThumbnail} style={{ backgroundColor: `${typeColor}15` }}>
          <IconComponent size={40} style={{ color: typeColor }} />
          <span style={{ color: typeColor }}>{TYPE_LABELS[material.type]}</span>
        </div>
      )}
      
      {/* Card content */}
      <div className={styles.content}>
        {/* Type badge */}
        <div className={styles.header}>
          <div 
            className={styles.typeBadge}
            style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
          >
            <IconComponent size={14} />
            <span>{TYPE_LABELS[material.type]}</span>
          </div>
          <ExternalLink size={16} className={styles.externalIcon} />
        </div>

        {/* Title */}
        <h3 className={styles.title}>{material.title}</h3>

        {/* Description */}
        {material.description && (
          <p className={styles.description}>{material.description}</p>
        )}

        {/* Tags */}
        <div className={styles.tags}>
          {material.subjects && material.subjects.slice(0, 3).map((subject, index) => (
            <span key={index} className={styles.subjectTag}>
              {subject}
            </span>
          ))}
          {material.subjects && material.subjects.length > 3 && (
            <span className={styles.moreTag}>+{material.subjects.length - 3}</span>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            <div className={styles.difficulties}>
              {material.difficulties && material.difficulties.slice(0, 2).map((difficulty, index) => (
                <span key={index} className={styles.difficultyTag}>
                  {difficulty}
                </span>
              ))}
            </div>
            <div className={styles.date}>
              <Clock size={12} />
              <span>{formatDate(material.submitted_at)}</span>
            </div>
          </div>
          
          {/* Favorite Button */}
          <button
            className={`${styles.favoriteButton} ${isFavorited ? styles.favorited : ''}`}
            onClick={handleFavoriteClick}
            disabled={favoriteLoading}
            title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Bookmark 
              size={18} 
              fill={isFavorited ? 'currentColor' : 'none'}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

export default MaterialCard;