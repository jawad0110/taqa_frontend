// Type definitions for ImageUploadWithCrop component

export interface Point {
  x: number;
  y: number;
}

export interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface ImageUploadWithCropProps {
  /** Callback function that is called when an image is selected and cropped */
  onImageSelected: (file: File, preview: string) => void;
  
  /** Aspect ratio for the crop area (width/height) */
  aspect?: number;
  
  /** Text to display on the upload button */
  buttonText?: string;
  
  /** Accepted file types */
  accept?: string;
  
  /** Unique identifier for the input element */
  id?: string;
  
  /** Allow multiple file selection */
  multiple?: boolean;
  
  /** Disable the upload button */
  disabled?: boolean;
  
  /** Show grid in the crop area */
  showGrid?: boolean;
  
  /** Maximum file size in MB */
  maxFileSizeMB?: number;
  
  /** Minimum image dimensions */
  minDimensions?: {
    width: number;
    height: number;
  };
}

export interface ImageUploadWithCropRef {
  /** Reset the component to its initial state */
  reset: () => void;
  
  /** Open the file selection dialog */
  openFileDialog: () => void;
}

export interface CroppedImageResult {
  /** The cropped image as a File object */
  file: File;
  
  /** Data URL of the cropped image */
  preview: string;
  
  /** Original file name */
  fileName: string;
  
  /** File size in bytes */
  fileSize: number;
  
  /** MIME type of the file */
  fileType: string;
}
