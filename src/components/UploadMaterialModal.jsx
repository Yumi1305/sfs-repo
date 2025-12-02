import React, { useState, useRef, useCallback } from 'react';
import styles from './UploadMaterialModal.module.css';
import { X, Upload, FileText, Link as LinkIcon, Youtube, File, CheckCircle, AlertCircle, Image, Trash2 } from 'lucide-react';

const SUBJECTS = [
  'Math',
  'Science',
  'English',
  'History',
  'Computer Science',
  'Foreign Language',
  'Art',
  'Music',
  'Economics',
  'Psychology',
  'Biology',
  'Chemistry',
  'Physics',
  'SAT/ACT Prep',
  'AP Courses',
  'Other'
];

const DIFFICULTIES = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'AP/College Level',
  'All Levels'
];

const MATERIAL_TYPES = [
  { id: 'link', label: 'Link (Website/Article)', icon: LinkIcon },
  { id: 'youtube', label: 'YouTube Video', icon: Youtube },
  { id: 'pdf', label: 'PDF Document', icon: FileText },
  { id: 'document', label: 'Google Doc/Other Doc', icon: File },
  { id: 'course', label: 'Full Course (LMS)', icon: FileText }
];

function UploadMaterialModal({ isOpen, onClose, onSubmit }) {
  const [materialType, setMaterialType] = useState('link');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState([]);
  const [file, setFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [thumbnailDragActive, setThumbnailDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [errors, setErrors] = useState({});
  
  const fileInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  const modalRef = useRef(null);

  const resetForm = () => {
    setMaterialType('link');
    setTitle('');
    setUrl('');
    setDescription('');
    setSelectedSubjects([]);
    setSelectedDifficulties([]);
    setFile(null);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setErrors({});
    setSubmitStatus(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const toggleSubject = (subject) => {
    setSelectedSubjects(prev => 
      prev.includes(subject) 
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
    setErrors(prev => ({ ...prev, subjects: null }));
  };

  const toggleDifficulty = (difficulty) => {
    setSelectedDifficulties(prev => 
      prev.includes(difficulty) 
        ? prev.filter(d => d !== difficulty)
        : [...prev, difficulty]
    );
    setErrors(prev => ({ ...prev, difficulties: null }));
  };

  // PDF file handling
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setMaterialType('pdf');
        setErrors(prev => ({ ...prev, file: null }));
      } else {
        setErrors(prev => ({ ...prev, file: 'Please upload a PDF file' }));
      }
    }
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setErrors(prev => ({ ...prev, file: null }));
      } else {
        setErrors(prev => ({ ...prev, file: 'Please upload a PDF file' }));
      }
    }
  };

  // Thumbnail handling
  const handleThumbnailDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setThumbnailDragActive(true);
    } else if (e.type === 'dragleave') {
      setThumbnailDragActive(false);
    }
  }, []);

  const handleThumbnailDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setThumbnailDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleThumbnailFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleThumbnailChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleThumbnailFile(e.target.files[0]);
    }
  };

  const handleThumbnailFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, thumbnail: 'Please upload an image (JPG, PNG, GIF, or WebP)' }));
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, thumbnail: 'Image must be less than 5MB' }));
      return;
    }
    
    setThumbnailFile(file);
    setErrors(prev => ({ ...prev, thumbnail: null }));
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (materialType !== 'pdf' && !url.trim()) {
      newErrors.url = 'URL is required';
    }
    
    if (materialType === 'pdf' && !file) {
      newErrors.file = 'Please upload a PDF file';
    }
    
    if (materialType === 'youtube' && url && !isValidYoutubeUrl(url)) {
      newErrors.url = 'Please enter a valid YouTube URL';
    }
    
    if (selectedSubjects.length === 0) {
      newErrors.subjects = 'Please select at least one subject';
    }
    
    if (selectedDifficulties.length === 0) {
      newErrors.difficulties = 'Please select at least one difficulty level';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidYoutubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      const materialData = {
        type: materialType,
        title: title.trim(),
        url: materialType === 'pdf' ? null : url.trim(),
        description: description.trim(),
        subjects: selectedSubjects,
        difficulties: selectedDifficulties,
        file: file,
        thumbnailFile: thumbnailFile,
        status: 'pending',
        submitted_at: new Date().toISOString()
      };
      
      if (onSubmit) {
        await onSubmit(materialData);
      }
      
      setSubmitStatus('success');
      
      setTimeout(() => {
        handleClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting material:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showThumbnailUpload = materialType !== 'youtube';

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={styles.modal} ref={modalRef}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <Upload size={24} className={styles.headerIcon} />
            <div>
              <h2 className={styles.title}>Upload Study Material</h2>
              <p className={styles.subtitle}>Share resources with fellow students</p>
            </div>
          </div>
          <button className={styles.closeButton} onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        {/* Status Banners */}
        {submitStatus === 'success' && (
          <div className={styles.successBanner}>
            <CheckCircle size={20} />
            <span>Material submitted! It will appear after admin approval.</span>
          </div>
        )}
        
        {submitStatus === 'error' && (
          <div className={styles.errorBanner}>
            <AlertCircle size={20} />
            <span>Something went wrong. Please try again.</span>
          </div>
        )}

        {/* Content */}
        <div className={styles.content}>
          {/* Material Type */}
          <div className={styles.section}>
            <label className={styles.label}>Material Type</label>
            <div className={styles.typeGrid}>
              {MATERIAL_TYPES.map(type => {
                const IconComponent = type.icon;
                return (
                  <button
                    key={type.id}
                    className={`${styles.typeButton} ${materialType === type.id ? styles.typeButtonActive : ''}`}
                    onClick={() => setMaterialType(type.id)}
                    type="button"
                  >
                    <IconComponent size={18} />
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className={styles.section}>
            <label className={styles.label}>
              Title <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
              placeholder="Enter a descriptive title for this material"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setErrors(prev => ({ ...prev, title: null }));
              }}
            />
            {errors.title && <span className={styles.errorText}>{errors.title}</span>}
          </div>

          {/* URL (non-PDF) */}
          {materialType !== 'pdf' && (
            <div className={styles.section}>
              <label className={styles.label}>
                {materialType === 'youtube' ? 'YouTube URL' : 'Link/URL'} <span className={styles.required}>*</span>
              </label>
              <input
                type="url"
                className={`${styles.input} ${errors.url ? styles.inputError : ''}`}
                placeholder={
                  materialType === 'youtube' 
                    ? 'https://youtube.com/watch?v=...' 
                    : materialType === 'document'
                    ? 'https://docs.google.com/...'
                    : 'https://...'
                }
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setErrors(prev => ({ ...prev, url: null }));
                }}
              />
              {errors.url && <span className={styles.errorText}>{errors.url}</span>}
            </div>
          )}

          {/* PDF Upload */}
          {materialType === 'pdf' && (
            <div className={styles.section}>
              <label className={styles.label}>
                Upload PDF <span className={styles.required}>*</span>
              </label>
              <div
                className={`${styles.dropzone} ${dragActive ? styles.dropzoneActive : ''} ${errors.file ? styles.dropzoneError : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className={styles.fileInput}
                />
                {file ? (
                  <div className={styles.fileInfo}>
                    <FileText size={32} className={styles.fileIcon} />
                    <span className={styles.fileName}>{file.name}</span>
                    <span className={styles.fileSize}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ) : (
                  <div className={styles.dropzoneContent}>
                    <Upload size={32} className={styles.uploadIcon} />
                    <p>Drag and drop your PDF here, or click to browse</p>
                    <span className={styles.dropzoneHint}>Maximum file size: 10MB</span>
                  </div>
                )}
              </div>
              {errors.file && <span className={styles.errorText}>{errors.file}</span>}
            </div>
          )}

          {/* Thumbnail Upload (non-YouTube) */}
          {showThumbnailUpload && (
            <div className={styles.section}>
              <label className={styles.label}>
                Thumbnail Image <span className={styles.optional}>(optional)</span>
              </label>
              <p className={styles.hint}>
                Add a thumbnail to make your material stand out. Recommended: 640×360px
              </p>
              
              {thumbnailPreview ? (
                <div className={styles.thumbnailPreviewContainer}>
                  <img 
                    src={thumbnailPreview} 
                    alt="Thumbnail preview" 
                    className={styles.thumbnailPreview}
                  />
                  <button 
                    type="button"
                    className={styles.removeThumbnail}
                    onClick={removeThumbnail}
                  >
                    <Trash2 size={16} />
                    Remove
                  </button>
                </div>
              ) : (
                <div
                  className={`${styles.thumbnailDropzone} ${thumbnailDragActive ? styles.dropzoneActive : ''} ${errors.thumbnail ? styles.dropzoneError : ''}`}
                  onDragEnter={handleThumbnailDrag}
                  onDragLeave={handleThumbnailDrag}
                  onDragOver={handleThumbnailDrag}
                  onDrop={handleThumbnailDrop}
                  onClick={() => thumbnailInputRef.current?.click()}
                >
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleThumbnailChange}
                    className={styles.fileInput}
                  />
                  <div className={styles.dropzoneContent}>
                    <Image size={28} className={styles.uploadIcon} />
                    <p>Drop an image here, or click to browse</p>
                    <span className={styles.dropzoneHint}>JPG, PNG, GIF, or WebP (max 5MB)</span>
                  </div>
                </div>
              )}
              {errors.thumbnail && <span className={styles.errorText}>{errors.thumbnail}</span>}
            </div>
          )}

          {/* YouTube note */}
          {materialType === 'youtube' && (
            <div className={styles.infoNote}>
              <Youtube size={16} />
              <span>Thumbnail will be automatically fetched from YouTube</span>
            </div>
          )}

          {/* Description */}
          <div className={styles.section}>
            <label className={styles.label}>Description</label>
            <textarea
              className={styles.textarea}
              placeholder="Briefly describe what this material covers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Subjects */}
          <div className={styles.section}>
            <label className={styles.label}>
              Subject(s) <span className={styles.required}>*</span>
            </label>
            <div className={styles.tagGrid}>
              {SUBJECTS.map(subject => (
                <button
                  key={subject}
                  type="button"
                  className={`${styles.tag} ${selectedSubjects.includes(subject) ? styles.tagSelected : ''}`}
                  onClick={() => toggleSubject(subject)}
                >
                  {subject}
                </button>
              ))}
            </div>
            {errors.subjects && <span className={styles.errorText}>{errors.subjects}</span>}
          </div>

          {/* Difficulties */}
          <div className={styles.section}>
            <label className={styles.label}>
              Difficulty Level(s) <span className={styles.required}>*</span>
            </label>
            <div className={styles.tagGrid}>
              {DIFFICULTIES.map(difficulty => (
                <button
                  key={difficulty}
                  type="button"
                  className={`${styles.tag} ${selectedDifficulties.includes(difficulty) ? styles.tagSelected : ''}`}
                  onClick={() => toggleDifficulty(difficulty)}
                >
                  {difficulty}
                </button>
              ))}
            </div>
            {errors.difficulties && <span className={styles.errorText}>{errors.difficulties}</span>}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={handleClose}>
            Cancel
          </button>
          <button 
            className={styles.submitButton} 
            onClick={handleSubmit}
            disabled={isSubmitting || submitStatus === 'success'}
          >
            {isSubmitting ? (
              <>
                <span className={styles.spinner}></span>
                Uploading...
              </>
            ) : submitStatus === 'success' ? (
              <>
                <CheckCircle size={18} />
                Submitted!
              </>
            ) : (
              <>
                <Upload size={18} />
                Upload Material
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadMaterialModal;