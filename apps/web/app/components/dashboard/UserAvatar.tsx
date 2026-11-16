import { initials } from "../../lib/format";
import { cn } from "../../lib/utils";

export function UserAvatar({
  name,
  email,
  avatar,
  className,
}: {
  name?: string | null;
  email?: string | null;
  avatar?: string | null;
  className?: string;
}) {
  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatar}
        alt=""
        className={cn("size-10 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex size-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-bold text-primary",
        className,
      )}
    >
      {initials(name, email)}
    </div>
  );
}
