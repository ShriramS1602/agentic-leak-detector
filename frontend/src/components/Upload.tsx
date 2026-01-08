import React, { useState, useCallback } from 'react';
import { UploadCloud, FileType, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface UploadProps {
    onFileSelect: (file: File) => void;
    isLoading: boolean;
}

export function Upload({ onFileSelect, isLoading }: UploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            setSelectedFile(file);
            onFileSelect(file);
        }
    }, [onFileSelect]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            onFileSelect(file);
        }
    }, [onFileSelect]);

    return (
        <div className="w-full max-w-xl mx-auto p-8">
            <div
                className={cn(
                    "relative group rounded-3xl p-12 transition-all duration-300 ease-out border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden",
                    dragActive
                        ? "border-primary bg-primary/10 scale-[1.02]"
                        : "border-slate-700 hover:border-slate-500 bg-surface/50 hover:bg-surface"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleChange}
                    accept=".csv,.xlsx,.pdf"
                    disabled={isLoading}
                />

                <div className="z-0 flex flex-col items-center gap-4 transition-transform duration-300 group-hover:scale-105">
                    <div className={cn(
                        "p-5 rounded-full bg-slate-800 shadow-xl ring-1 ring-white/10 mb-2 transition-colors duration-300",
                        dragActive ? "bg-primary text-white" : "text-slate-400 group-hover:text-primary"
                    )}>
                        <UploadCloud className="w-10 h-10" />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-slate-200">
                            {isLoading ? "Analyzing..." : "Click to upload or drag & drop"}
                        </h3>
                        <p className="text-slate-400 text-sm max-w-xs mx-auto">
                            Support for CSV, Excel, or PDF bank statements
                        </p>
                    </div>
                </div>

                {/* Dynamic Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            {selectedFile && (
                <div className="mt-6 flex items-center justify-between p-4 bg-surface rounded-xl border border-slate-700/50 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-800 rounded-lg text-primary">
                            <FileType className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-medium text-slate-200 text-sm">{selectedFile.name}</p>
                            <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <CheckCircle className="w-5 h-5 text-success" />
                    )}
                </div>
            )}
        </div>
    );
}
