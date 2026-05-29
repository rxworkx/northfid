"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/toaster";

interface AvatarUploadProps {
  userId: string;
  currentImage: string;
  name: string;
}

export function AvatarUpload({ userId, currentImage, name }: AvatarUploadProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const avatarUrl = preview ?? (!currentImage
    ? `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=2a2a2a&textColor=ffffff`
    : `/uploads/users/${currentImage}`);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File must be under 2MB");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPEG, PNG and WebP are supported");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/user/avatar", { method: "POST", body: form });
      if (!res.ok) throw new Error();
      toast.success("Profile picture updated");
      router.refresh();
    } catch {
      toast.error("Upload failed. Please try again.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <img
          src={avatarUrl}
          alt={name}
          className="h-20 w-20 rounded-full object-cover border-2 border-slate-200"
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-black border-2 border-white flex items-center justify-center text-white hover:bg-neutral-800 transition-colors disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-900">{name}</p>
        <p className="text-xs text-slate-500 mt-0.5">JPEG, PNG or WebP · Max 2MB</p>
        <button
          onClick={() => fileRef.current?.click()}
          className="mt-2 text-xs font-medium text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors"
        >
          Change photo
        </button>
      </div>
    </div>
  );
}
