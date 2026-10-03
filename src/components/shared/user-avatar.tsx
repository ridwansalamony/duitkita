"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/lib/dummy/data";

export function UserAvatar({
  user,
  className,
  fallbackClassName,
}: {
  user?: Pick<User, "name" | "avatarUrl">;
  className?: string;
  fallbackClassName?: string;
}) {
  return (
    <Avatar className={className}>
      {user?.avatarUrl && (
        <AvatarImage
          src={user.avatarUrl}
          alt={`Foto ${user.name}`}
          className="object-cover"
        />
      )}
      <AvatarFallback className={fallbackClassName}>
        {user?.name.trim().charAt(0).toLocaleUpperCase("id-ID") || "?"}
      </AvatarFallback>
    </Avatar>
  );
}
