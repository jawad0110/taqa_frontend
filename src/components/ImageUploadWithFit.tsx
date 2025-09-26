'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button, Modal, message } from 'antd';
import { RcFile } from 'antd/es/upload';
import { UploadOutlined, ExpandAltOutlined } from '@ant-design/icons';

// Target aspect ratio (width / height)
const TARGET_ASPECT = 1 / 0.9;
const BACKGROUND_COLOR = '#FFFFFF';

// Utility function to create an image element
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface ImageUploadWithFitProps {
  onImageSelected: (file: File) => Promise<boolean>;
  aspect?: number;
  buttonText?: React.ReactNode;
  accept?: string;
  id?: string;
  multiple?: boolean;
  disabled?: boolean;
  maxFileSizeMB?: number;
  className?: string;
  frameWidth?: number;
  frameHeight?: number;
}

// Default props
const defaultProps: Partial<ImageUploadWithFitProps> = {
  aspect: TARGET_ASPECT,
  buttonText: 'Upload Image',
  accept: 'image/*',
  multiple: false,
  disabled: false,
  maxFileSizeMB: 5,
  className: '',
  frameWidth: 400,
  frameHeight: 360,
};

const ImageUploadWithFit: React.FC<ImageUploadWithFitProps> = ({
  onImageSelected,
  aspect = TARGET_ASPECT,
  buttonText = defaultProps.buttonText as React.ReactNode,
  accept = defaultProps.accept as string,
  id = 'image-upload',
  multiple = defaultProps.multiple as boolean,
  disabled = defaultProps.disabled as boolean,
  maxFileSizeMB = defaultProps.maxFileSizeMB as number,
  className = defaultProps.className as string,
  frameWidth = 400,
  frameHeight = 360,
}) => {
  // Server-side rendering check at the very beginning
  if (typeof window === 'undefined') {
    return null;
  }

  // State management
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Image state
  const [imageSize, setImageSize] = useState<Size>({ width: 0, height: 0 });
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const dragStartPos = useRef<Position>({ x: 0, y: 0 });
  const dragStartSize = useRef<Size>({ width: 0, height: 0 });
  const dragStartImagePos = useRef<Position>({ x: 0, y: 0 });

  // Validate file before upload
  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }
    return true;
  };

  // Handle image upload
  const handleImageUpload = (file: File) => {
    if (!beforeUpload(file as RcFile)) return false;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        const img = new Image();
        img.onload = () => {
          setImageSrc(result);
          setCurrentFile(file);

          // Always use the target aspect ratio (1:0.9)
          const targetAspect = TARGET_ASPECT;
          const imageAspect = img.width / img.height;

          let initialWidth, initialHeight;

          // Calculate dimensions to fill the frame while maintaining 1:0.9 aspect
          if (imageAspect > targetAspect) {
            // Image is wider than target aspect
            initialHeight = frameHeight;
            initialWidth = frameHeight * imageAspect;
          } else {
            // Image is taller than target aspect
            initialWidth = frameWidth;
            initialHeight = frameWidth / imageAspect;
          }

          // Ensure the image covers the entire frame
          if (initialWidth < frameWidth || initialHeight < frameHeight) {
            const scale = Math.max(frameWidth / initialWidth, frameHeight / initialHeight);
            initialWidth *= scale;
            initialHeight *= scale;
          }

          setImageSize({
            width: initialWidth,
            height: initialHeight,
          });

          // Center the image initially
          setPosition({
            x: (frameWidth - initialWidth) / 2,
            y: (frameHeight - initialHeight) / 2,
          });

          setScale(1);
          setPreviewVisible(true);
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
    return false;
  };

  // Handle file input change
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  // Handle button click to trigger file input
  const handleButtonClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  // Handle mouse down for dragging and resizing
  const handleMouseDown = useCallback((e: React.MouseEvent, handle?: string) => {
    e.stopPropagation();

    if (handle) {
      setActiveHandle(handle);
    } else {
      setIsDragging(true);
    }

    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragStartSize.current = { ...imageSize };
    dragStartImagePos.current = { ...position };

    document.addEventListener('mousemove', handleMouseMove as any);
    document.addEventListener('mouseup', handleMouseUp);
  }, [imageSize, position]);

  // Handle mouse move for dragging and resizing
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!imageRef.current || !containerRef.current) return;

    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;

    if (isDragging) {
      // Handle image dragging
      const newX = dragStartImagePos.current.x + dx;
      const newY = dragStartImagePos.current.y + dy;

      // Calculate boundaries to keep image within frame
      // For dragging, ensure part of the image stays within the frame
      const minX = Math.min(0, frameWidth - imageSize.width); // Left boundary (can be negative if image is wider than frame)
      const maxX = 0; // Right boundary (can't move image beyond right edge of frame)
      const minY = Math.min(0, frameHeight - imageSize.height); // Top boundary (can be negative if image is taller than frame)
      const maxY = 0; // Bottom boundary (can't move image beyond bottom edge of frame)

      setPosition({
        x: Math.max(minX, Math.min(maxX, newX)),
        y: Math.max(minY, Math.min(maxY, newY)),
      });
    } else if (activeHandle) {
      // Handle resizing from corners
      let newWidth = dragStartSize.current.width;
      let newHeight = dragStartSize.current.height;
      let newX = dragStartImagePos.current.x;
      let newY = dragStartImagePos.current.y;

      // Use the proper aspect ratio for resizing
      const aspectRatio = TARGET_ASPECT;

      switch (activeHandle) {
        case 'top-left':
          newWidth = Math.max(frameWidth * 0.5, dragStartSize.current.width - dx);
          newHeight = newWidth / aspectRatio;
          newX = dragStartImagePos.current.x + (dragStartSize.current.width - newWidth);
          newY = dragStartImagePos.current.y + (dragStartSize.current.height - newHeight);
          break;
        case 'top-right':
          newWidth = Math.max(frameWidth * 0.5, dragStartSize.current.width + dx);
          newHeight = newWidth / aspectRatio;
          newY = dragStartImagePos.current.y + (dragStartSize.current.height - newHeight);
          break;
        case 'bottom-left':
          newWidth = Math.max(frameWidth * 0.5, dragStartSize.current.width - dx);
          newHeight = newWidth / aspectRatio;
          newX = dragStartImagePos.current.x + (dragStartSize.current.width - newWidth);
          break;
        case 'bottom-right':
          newWidth = Math.max(frameWidth * 0.5, dragStartSize.current.width + dx);
          newHeight = newWidth / aspectRatio;
          break;
      }

      // Ensure the image can't be resized to be smaller than the frame
      if (newWidth < frameWidth && newHeight < frameHeight) {
        const scale = Math.max(frameWidth / newWidth, frameHeight / newHeight);
        newWidth *= scale;
        newHeight *= scale;
      }

      // Update position with correct boundary logic
      // When resizing, ensure part of the image stays within the frame
      // For x position: if image is wider than frame, allow negative values but don't let right edge go beyond frame
      // For y position: if image is taller than frame, allow negative values but don't let bottom edge go beyond frame
      const minX = Math.min(0, frameWidth - newWidth);
      const maxX = 0;
      const minY = Math.min(0, frameHeight - newHeight);
      const maxY = 0;

      setPosition({
        x: Math.max(minX, Math.min(maxX, newX)),
        y: Math.max(minY, Math.min(maxY, newY)),
      });

      setImageSize({
        width: newWidth,
        height: newHeight,
      });
    }
  }, [isDragging, activeHandle, imageSize, frameWidth, frameHeight]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setActiveHandle(null);
    document.removeEventListener('mousemove', handleMouseMove as any);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // Process and crop the image
  const processImage = useCallback(async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!imageSrc || !imageRef.current) {
        reject(new Error('No image source available'));
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Set canvas size to frame size
      canvas.width = frameWidth;
      canvas.height = frameHeight;

      // Fill background with white
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the image at the current position and scale
      const img = new Image();
      img.onload = () => {
        try {
          // Calculate source rectangle (entire image)
          const sx = 0;
          const sy = 0;
          const sWidth = img.width;
          const sHeight = img.height;

          // Calculate destination rectangle (positioned and scaled)
          const dx = position.x;
          const dy = position.y;
          const dWidth = imageSize.width;
          const dHeight = imageSize.height;

          // Draw the image
          ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

          // Convert canvas to blob with maximum quality
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to process image'));
            }
          }, 'image/jpeg', 1.0);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageSrc;
    });
  }, [imageSrc, position, imageSize, frameWidth, frameHeight]);

  // Handle save button click
  const handleSave = useCallback(async () => {
    if (!imageSrc || !currentFile) return;

    try {
      setIsLoading(true);

      // Process the image
      const blob = await processImage();

      // Create a new file with the processed image
      const processedFile = new File(
        [blob],
        currentFile.name.replace(/\.[^/.]+$/, '') + '.jpg',
        { type: 'image/jpeg' }
      );

      // Call the parent component's callback with the processed file
      const success = await onImageSelected(processedFile);

      if (success) {
        message.success('Image processed and uploaded successfully');
        handleClose();
      }
    } catch (error) {
      console.error('Error processing image:', error);
      message.error('Failed to process and upload image');
    } finally {
      setIsLoading(false);
    }
  }, [imageSrc, currentFile, onImageSelected, processImage]);

  // Handle close
  const handleClose = () => {
    setImageSrc(null);
    setPreviewVisible(false);
    setCurrentFile(null);
    setPosition({ x: 0, y: 0 });
    setImageSize({ width: 0, height: 0 });
    setScale(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add resize handles component
  const renderResizeHandles = () => {
    if (!imageSrc) return null;

    const style = {
      width: '12px',
      height: '12px',
      backgroundColor: '#1890ff',
      border: '2px solid white',
      borderRadius: '50%',
      position: 'absolute' as const,
      cursor: 'pointer',
      zIndex: 10,
    };

    const halfHandle = 6; // Half of handle size

    return (
      <>
        {/* Top Left */}
        <div
          style={{
            ...style,
            left: `${position.x - halfHandle}px`,
            top: `${position.y - halfHandle}px`,
            cursor: 'nwse-resize',
          }}
          onMouseDown={(e) => handleMouseDown(e, 'top-left')}
        />

        {/* Top Right */}
        <div
          style={{
            ...style,
            left: `${position.x + imageSize.width - halfHandle}px`,
            top: `${position.y - halfHandle}px`,
            cursor: 'nesw-resize',
          }}
          onMouseDown={(e) => handleMouseDown(e, 'top-right')}
        />

        {/* Bottom Left */}
        <div
          style={{
            ...style,
            left: `${position.x - halfHandle}px`,
            top: `${position.y + imageSize.height - halfHandle}px`,
            cursor: 'nesw-resize',
          }}
          onMouseDown={(e) => handleMouseDown(e, 'bottom-left')}
        />

        {/* Bottom Right */}
        <div
          style={{
            ...style,
            left: `${position.x + imageSize.width - halfHandle}px`,
            top: `${position.y + imageSize.height - halfHandle}px`,
            cursor: 'nwse-resize',
          }}
          onMouseDown={(e) => handleMouseDown(e, 'bottom-right')}
        />
      </>
    );
  };

  return (
    <div className={`image-upload-container ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        onChange={onFileChange}
        accept={accept}
        style={{ display: 'none' }}
        disabled={disabled}
        id={id}
        multiple={multiple}
      />
      <Button
        icon={<UploadOutlined />}
        onClick={handleButtonClick}
        disabled={disabled}
        className="upload-button"
      >
        {buttonText}
      </Button>

      <Modal
        open={previewVisible}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExpandAltOutlined />
            <span>Adjust Image Position and Size ({aspect === TARGET_ASPECT ? '1:0.9' : `${aspect}:1`})</span>
          </div>
        }
        onCancel={handleClose}
        footer={[
          <Button key="cancel" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={isLoading}
            onClick={handleSave}
          >
            {isLoading ? 'Processing...' : 'Save'}
          </Button>,
        ]}
        width={frameWidth + 48}
        destroyOnClose
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            padding: '16px 0',
          }}
        >
          <div
            className="image-preview-container"
            style={{
              position: 'relative',
              width: `${frameWidth}px`,
              height: `${frameHeight}px`,
              backgroundColor: '#f0f2f5',
              overflow: 'hidden',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              border: '1px solid #d9d9d9',
            }}
          >
            {imageSrc && (
              <div
                ref={containerRef}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  cursor: isDragging ? 'grabbing' : 'grab',
                }}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Image container */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    width: `${imageSize.width}px`,
                    height: `${imageSize.height}px`,
                    willChange: 'transform',
                  }}
                >
                  <img
                    ref={imageRef}
                    src={imageSrc}
                    alt="Preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      display: 'block',
                    }}
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                  />
                </div>

                {/* Frame outline */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    border: '2px dashed rgba(24, 144, 255, 0.8)',
                    pointerEvents: 'none',
                    zIndex: 2,
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.8)',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: '#1890ff',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {Math.round(frameWidth)}×{Math.round(frameHeight)} (
                    {aspect === TARGET_ASPECT ? '1:0.9' : `${aspect}:1`})
                  </div>
                </div>

                {/* Resize handles */}
                {renderResizeHandles()}
              </div>
            )}
          </div>

          <div
            style={{
              color: '#666',
              fontSize: '12px',
              textAlign: 'center',
              maxWidth: '100%',
              padding: '0 16px',
            }}
          >
            <p>Drag the image to position it • Drag the corners to resize</p>
            <p>The white area will be the final image</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

ImageUploadWithFit.displayName = 'ImageUploadWithFit';

export default ImageUploadWithFit;
