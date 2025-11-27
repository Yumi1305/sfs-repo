import React, { useState, useRef, useCallback } from 'react';
import styles from './UploadMaterialModal.module.css';
import { X, Upload, FileText, Link as LinkIcon, Youtube, File, CheckCircle, AlertCircle } from 'lucide-react';

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
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', null
  const [errors, setErrors] = useState({});
  
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);

  const resetForm = () => {
    setMaterialType('link');
    setTitle('');
    setUrl('');
    setDescription('');
    setSelectedSubjects([]);
    setSelectedDifficulties([]);
    setFile(null);
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
        status: 'pending', // All submissions start as pending for admin approval
        submitted_at: new Date().toISOString()
      };
      
      if (onSubmit) {
        await onSubmit(materialData);
      }
      
      setSubmitStatus('success');
      
      // Auto-close after success
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

        {/* Success/Error Status */}
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
          {/* Material Type Selection */}
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

          {/* Title Input */}
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

          {/* URL Input (for non-PDF types) */}
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

          {/* File Upload (for PDF type) */}
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

          {/* Subject Selection */}
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

          {/* Difficulty Selection */}
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