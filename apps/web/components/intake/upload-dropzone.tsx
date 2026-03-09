'use client';

import { useRef, useState, type DragEvent } from 'react';
import { Button } from '../ui/button';

export function UploadDropzone({
  onFilesSelected,
}: {
  onFilesSelected: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const files = Array.from(event.dataTransfer.files ?? []);
    if (files.length) onFilesSelected(files);
  };

  return (
    <div
      className="upload-dropzone"
      data-active={dragActive ? 'true' : undefined}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        event.preventDefault();
        setDragActive(false);
      }}
      onDrop={handleDrop}
    >
      <div className="stack-2">
        <p className="upload-dropzone-title">Drop intake files here</p>
        <p className="form-field-hint">Accepts documents and photos up to 50MB each. Files are staged into the draft until reviewed.</p>
        <div>
          <Button type="button" tone="secondary" size="sm" onClick={() => inputRef.current?.click()}>
            Browse Files
          </Button>
        </div>
      </div>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        multiple
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length) onFilesSelected(files);
          event.currentTarget.value = '';
        }}
      />
    </div>
  );
}
