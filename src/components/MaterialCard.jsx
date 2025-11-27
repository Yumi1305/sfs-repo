import React from 'react';
import styles from './MaterialCard.module.css';
import { Link as LinkIcon, Youtube, FileText, File, ExternalLink, Clock } from 'lucide-react';

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

function MaterialCard({ material }) {
  const IconComponent = TYPE_ICONS[material.type] || FileText;
  const typeColor = TYPE_COLORS[material.type] || '#6b7280';
  
  const handleClick = () => {
    if (material.url) {
      window.open(material.url, '_blank', 'noopener,noreferrer');
    } else if (material.file_url) {
      window.open(material.file_url, '_blank', 'noopener,noreferrer');
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

  const thumbnail = material.type === 'youtube' ? getYoutubeThumbnail(material.url) : null;

  return (
    <div className={styles.card} onClick={handleClick}>
      {/* Thumbnail for YouTube videos */}
      {thumbnail && (
        <div className={styles.thumbnail}>
          <img src={thumbnail} alt={material.title} />
          <div className={styles.playButton}>
            <Youtube size={24} />
          </div>
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
      </div>
    </div>
  );
}

export default MaterialCard;