import React from 'react';
import styles from './MaterialCard.module.css';
import { Link as LinkIcon, Youtube, FileText, File, Bookmark } from 'lucide-react';
import { useUserContext } from '../hooks/useUserContext';

const TYPE_CONFIG = {
  link: { icon: LinkIcon, label: 'Link', color: '#3b82f6' },
  youtube: { icon: Youtube, label: 'Video', color: '#ef4444' },
  pdf: { icon: FileText, label: 'PDF', color: '#f59e0b' },
  document: { icon: File, label: 'Document', color: '#10b981' },
  course: { icon: FileText, label: 'Course', color: '#8b5cf6' }
};

function MaterialCard({ material }) {
  const { user, toggleMaterialFavorite, isMaterialFavorited } = useUserContext();
  const [isToggling, setIsToggling] = React.useState(false);
  
  const config = TYPE_CONFIG[material.type] || TYPE_CONFIG.link;
  const IconComponent = config.icon;
  const isFavorited = isMaterialFavorited(material.id);

  const handleClick = (e) => {
    if (e.target.closest(`.${styles.favoriteButton}`)) return;
    
    const url = material.url || material.file_url;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user || isToggling) {
      console.log("not logged in!");
      return;
    }
    
    setIsToggling(true);
    await toggleMaterialFavorite(material.id);
    setIsToggling(false);
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
    <div className={styles.card} onClick={handleClick}>
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
  );
}

export default MaterialCard;