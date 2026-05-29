"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { profileSchema, type ProfileInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { COUNTRIES } from "@/lib/countries";
import { toast } from "@/components/ui/toaster";

interface ProfileUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  country: string;
  gender: string;
}

export function ProfileForm({ user }: { user: ProfileUser }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? "",
      country: user.country,
      gender: user.gender,
    },
  });

  async function onSubmit(data: ProfileInput) {
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error ?? "Failed to update profile");
      return;
    }
    toast.success("Profile updated successfully");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input label="Username" {...register("username")} error={errors.username?.message} />
        </div>
        <Input label="First Name" {...register("firstName")} error={errors.firstName?.message} />
        <Input label="Last Name" {...register("lastName")} error={errors.lastName?.message} />
        <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
        <Input label="Phone" type="tel" {...register("phone")} error={errors.phone?.message} />
        <Select label="Country" {...register("country")} error={errors.country?.message}>
          {COUNTRIES.map((c) => <option key={c.code} value={c.name}>{c.name}</option>)}
        </Select>
        <Select label="Gender" {...register("gender")}>
          <option value="">Select gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </Select>
      </div>

      <div className="mt-6 flex items-center gap-3 pt-4 border-t border-slate-100">
        <Button type="submit" loading={isSubmitting}>Save Changes</Button>
        <Link href="/dashboard/change-password" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
          Change password
        </Link>
      </div>
    </form>
  );
}
