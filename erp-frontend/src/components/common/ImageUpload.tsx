import React, { useState, useRef } from "react";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
    currentUrl?: string | null;
    onUpload: (url: string) => void;
    size?: "sm" | "md" | "lg";
    initials?: string;
    className?: string;
}

const sizeMap = {
    sm: { container: "w-16 h-16", icon: "w-4 h-4", text: "text-sm" },
    md: { container: "w-24 h-24", icon: "w-6 h-6", text: "text-lg" },
    lg: { container: "w-32 h-32", icon: "w-8 h-8", text: "text-2xl" },
};

const ImageUpload: React.FC<ImageUploadProps> = ({
    currentUrl,
    onUpload,
    size = "md",
    initials = "?",
    className = "",
}) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentUrl || null);
    const inputRef = useRef<HTMLInputElement>(null);
    const s = sizeMap[size];

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowed.includes(file.type)) {
            toast.error("Please select a valid image (JPEG, PNG, WebP, or GIF).");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error("Image must be less than 10 MB.");
            return;
        }

        // Show preview immediately
        const localPreview = URL.createObjectURL(file);
        setPreview(localPreview);
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const resp = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });
            const data = await resp.json();
            if (data.success) {
                setPreview(data.data.file_path);
                onUpload(data.data.file_path);
                toast.success("Image uploaded successfully");
            } else {
                toast.error(data.error || "Upload failed");
                setPreview(currentUrl || null);
            }
        } catch {
            toast.error("Network error during upload");
            setPreview(currentUrl || null);
        } finally {
            setUploading(false);
        }
    };

    const clearImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(null);
        onUpload("");
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <div className={`relative group ${className}`}>
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileSelect}
            />

            <div
                onClick={() => !uploading && inputRef.current?.click()}
                className={`${s.container} rounded-full border-2 border-dashed border-slate-200 
          flex items-center justify-center cursor-pointer overflow-hidden
          transition-all duration-300 hover:border-indigo-400 hover:shadow-lg 
          group-hover:scale-105 bg-slate-50 relative`}
            >
                {uploading ? (
                    <Loader2 className={`${s.icon} text-indigo-500 animate-spin`} />
                ) : preview ? (
                    <img
                        src={preview}
                        alt="Uploaded"
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span className={`font-bold text-indigo-600 ${s.text}`}>
                        {initials}
                    </span>
                )}

                {/* Overlay on hover */}
                {!uploading && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                        <Camera className="w-5 h-5 text-white" />
                    </div>
                )}
            </div>

            {/* Clear button */}
            {preview && !uploading && (
                <button
                    onClick={clearImage}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center 
            opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600 z-10"
                >
                    <X className="w-3 h-3" />
                </button>
            )}
        </div>
    );
};

export default ImageUpload;
