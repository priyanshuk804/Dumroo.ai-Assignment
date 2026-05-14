import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadPDF } from '../services/api';

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  const validateAndSetFile = (selectedFile) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setStatus('idle');
      setErrorMessage('');
      setSuccessMessage('');
    } else {
      setFile(null);
      setStatus('error');
      setErrorMessage('Please select a valid PDF file.');
      setSuccessMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    try {
      const response = await uploadPDF(file);
      setStatus('success');
      setSuccessMessage(response.message || 'Upload and processing complete!');
      setTimeout(() => {
        onUploadSuccess({ name: file.name, chunks: response.chunksProcessed });
        onClose();
        // Reset state
        setFile(null);
        setStatus('idle');
        setSuccessMessage('');
      }, 2000); // Increased timeout slightly to give user time to read the message
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.message);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex justify-between items-center p-4 border-b border-border">
            <h2 className="text-xl font-semibold text-text">Upload Document</h2>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text transition-colors p-1 rounded-md hover:bg-white/5"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            <div
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/10'
                  : file
                  ? 'border-green-500/50 bg-green-500/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="application/pdf"
                onChange={handleFileChange}
              />
              
              {file ? (
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-4">
                    <FileText size={32} />
                  </div>
                  <p className="font-medium text-text truncate max-w-full px-4">{file.name}</p>
                  <p className="text-sm text-text-muted mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-white/5 text-text-muted rounded-full flex items-center justify-center mb-4">
                    <Upload size={32} />
                  </div>
                  <p className="font-medium text-text mb-1">Click or drag PDF here</p>
                  <p className="text-sm text-text-muted">Supports Hindi and Sanskrit texts</p>
                </div>
              )}
            </div>

            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start text-red-400"
              >
                <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{errorMessage}</p>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center text-green-400"
              >
                <CheckCircle size={18} className="mr-2 flex-shrink-0" />
                <p className="text-sm">{successMessage}</p>
              </motion.div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors"
                disabled={status === 'uploading'}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || status === 'uploading' || status === 'success'}
                className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:bg-primary/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg flex items-center transition-colors shadow-lg shadow-primary/20"
              >
                {status === 'uploading' ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Upload Document'
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UploadModal;
