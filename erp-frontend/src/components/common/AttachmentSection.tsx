import React, { useState, useCallback, useRef, useEffect } from "react";
import {
    Upload,
    FileText,
    Image as ImageIcon,
    Trash2,
    Download,
    Eye,
    Loader2,
    Paperclip,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Attachment {
    id: string;
    file_name: string;
    file_path: string;
    file_type: string;
    uploaded_at: string;
    uploader?: { name: string; username: string } | null;
}

interface AttachmentSectionProps {
    /** The FK field name, e.g. "purchase_order_id" */
    entityType: "purchase_order_id" | "grn_id" | "sales_invoice_id" | "ap_invoice_id" | "journal_entry_id";
    /** The entity ID value */
    entityId: string;
    /** Whether user can upload/delete */
    readOnly?: boolean;
}

const AttachmentSection: React.FC<AttachmentSectionProps> = ({
    entityType,
    entityId,
    readOnly = false,
}) => {
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchAttachments = useCallback(async () => {
        try {
            setLoading(true);
            const resp = await fetch(`/api/attachments?${entityType}=${entityId}`);
            const data = await resp.json();
            if (data.success) setAttachments(data.data);
        } catch {
            toast.error("Failed to load attachments");
        } finally {
            setLoading(false);
        }
    }, [entityType, entityId]);

    useEffect(() => {
        if (entityId) fetchAttachments();
    }, [entityId, fetchAttachments]);

    const uploadFile = async (file: File) => {
        // Validate
        const allowed = [
            "image/jpeg", "image/png", "image/webp",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ];
        if (!allowed.includes(file.type)) {
            toast.error(`Unsupported file type: ${file.type}`);
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File must be less than 10 MB.");
            return;
        }

        setUploading(true);
        try {
            // 1. Upload the file
            const formData = new FormData();
            formData.append("file", file);
            const uploadResp = await fetch("/api/upload", { method: "POST", body: formData });
            const uploadData = await uploadResp.json();
            if (!uploadData.success) throw new Error(uploadData.error);

            // 2. Create attachment record
            const attachResp = await fetch("/api/attachments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    file_name: uploadData.data.file_name,
                    file_path: uploadData.data.file_path,
                    file_type: uploadData.data.file_type,
                    [entityType]: entityId,
                }),
            });
            const attachData = await attachResp.json();
            if (!attachData.success) throw new Error(attachData.error);

            toast.success(`"${file.name}" attached successfully`);
            fetchAttachments();
        } catch (err: any) {
            toast.error(err.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string, fileName: string) => {
        if (!confirm(`Delete attachment "${fileName}"?`)) return;
        try {
            const resp = await fetch(`/api/attachments/${id}`, { method: "DELETE" });
            const data = await resp.json();
            if (data.success) {
                toast.success("Attachment deleted");
                fetchAttachments();
            }
        } catch {
            toast.error("Failed to delete");
        }
    };

    // Drag and drop handlers
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (readOnly) return;
        const files = Array.from(e.dataTransfer.files);
        files.forEach(uploadFile);
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        files.forEach(uploadFile);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith("image/")) return <ImageIcon className="w-5 h-5 text-blue-500" />;
        return <FileText className="w-5 h-5 text-red-500" />;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-PK", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Paperclip className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                    Attachments & Documents
                </h3>
                <span className="text-xs text-slate-400 ml-auto">{attachments.length} file(s)</span>
            </div>

            {/* Drag and Drop Zone */}
            {!readOnly && (
                <div
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
            ${dragActive
                            ? "border-indigo-500 bg-indigo-50/50 scale-[1.01]"
                            : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                        }`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf,.doc,.docx,.xls,.xlsx"
                        multiple
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                            <p className="text-sm text-indigo-600 font-medium">Uploading...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
                                <Upload className="w-6 h-6 text-indigo-500" />
                            </div>
                            <p className="text-sm font-medium text-slate-600">
                                Drag & drop files here, or <span className="text-indigo-600 underline">browse</span>
                            </p>
                            <p className="text-xs text-slate-400">
                                PDF, JPEG, PNG, Excel, Word • Max 10 MB each
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Attachment List */}
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                </div>
            ) : attachments.length === 0 ? (
                <div className="text-center py-6 text-slate-300">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm text-slate-400">No attachments yet</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {attachments.map((att) => (
                        <div
                            key={att.id}
                            className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white hover:shadow-sm transition-shadow group"
                        >
                            {getFileIcon(att.file_type)}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">{att.file_name}</p>
                                <p className="text-xs text-slate-400">
                                    {formatDate(att.uploaded_at)}
                                    {att.uploader && ` • ${att.uploader.name}`}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={() => window.open(att.file_path, "_blank")}
                                    title={att.file_type.startsWith("image/") ? "View Image" : "Download"}
                                >
                                    {att.file_type.startsWith("image/") ? (
                                        <Eye className="w-4 h-4 text-slate-500" />
                                    ) : (
                                        <Download className="w-4 h-4 text-slate-500" />
                                    )}
                                </Button>
                                {!readOnly && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-8 w-8 p-0 hover:bg-red-50"
                                        onClick={() => handleDelete(att.id, att.file_name)}
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4 text-red-400" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AttachmentSection;
