import React, { useState, useRef } from 'react';
import { authFetch } from '../auth';

interface FileUploadProps {
  onUploadSuccess: (url: string) => void;
  accept?: string;
  label?: string;
  currentFileUrl?: string;
}

export default function FileUpload({ 
  onUploadSuccess, 
  accept = "image/*", 
  label = "Upload File",
  currentFileUrl 
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentFileUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const objectUrl = URL.createObjectURL(selectedFile);
        setPreview(objectUrl);
        // Cleanup later
        return () => URL.revokeObjectURL(objectUrl);
      } else {
        setPreview(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await authFetch('http://localhost:8000/api/upload/', {
        method: 'POST',
        body: formData,
     
      });
      const data = await response.json();
      onUploadSuccess(data.url);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload space-y-2">
      <div className="flex gap-2 items-center flex-wrap">
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          ref={fileInputRef}
          className="text-sm border rounded p-1"
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || uploading}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : label}
        </button>
      </div>
      {preview && (
        <div className="mt-2">
          <p className="text-xs text-gray-500">Current file:</p>
          {preview.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
            <img src={preview} alt="Preview" className="max-w-xs max-h-32 rounded border" />
          ) : (
            <a href={preview} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm">
              View file
            </a>
          )}
        </div>
      )}
    </div>
  );
}