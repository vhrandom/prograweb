import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
    value: string[];
    onChange: (value: string[]) => void;
    maxImages?: number;
}

export function ImageUpload({ value, onChange, maxImages = 5 }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast({
                title: "Error",
                description: "Por favor sube un archivo de imagen válido",
                variant: "destructive",
            });
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`, // Asumiendo token en localStorage o cookie
                },
                body: formData,
            });

            if (!response.ok) throw new Error("Upload failed");

            const data = await response.json();
            onChange([...value, data.url]);

            toast({
                title: "Éxito",
                description: "Imagen subida correctamente",
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "No se pudo subir la imagen",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemove = (url: string) => {
        onChange(value.filter((current) => current !== url));
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {value.map((url) => (
                    <div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-apple-gray-5 dark:border-apple-dark-3 group">
                        <img
                            src={url}
                            alt="Product image"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => handleRemove(url)}
                                className="h-8 w-8"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}

                {value.length < maxImages && (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-apple-gray-4 dark:border-apple-dark-3 hover:border-apple-blue dark:hover:border-apple-blue-dark cursor-pointer flex flex-col items-center justify-center space-y-2 transition-colors bg-apple-gray-6/50 dark:bg-apple-dark-2/50"
                    >
                        {isUploading ? (
                            <div className="w-6 h-6 border-2 border-apple-blue border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Upload className="w-6 h-6 text-apple-gray-2" />
                                <span className="text-caption-1 text-apple-gray-2 font-medium">Subir imagen</span>
                            </>
                        )}
                    </div>
                )}
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                accept="image/*"
                className="hidden"
            />
        </div>
    );
}
