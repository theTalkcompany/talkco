import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const FALLBACK_EMOJIS = ["🌱","🌸","🌻","🌼","🌿","🍀","🌷","🌹","🌺","🌳","🦋","🐝","🐞","🐢","🦊","🦉","⭐","🌙","🌈","✨"];
const FALLBACK_COLORS = ["#FCA5A5","#FDBA74","#FCD34D","#86EFAC","#67E8F9","#93C5FD","#C4B5FD","#F0ABFC","#FB7185","#FB923C","#FACC15","#4ADE80","#22D3EE","#60A5FA","#A78BFA","#E879F9"];

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export const ringColorFor = (userId: string) => FALLBACK_COLORS[hash(userId) % FALLBACK_COLORS.length];

interface Props {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  ring?: boolean;
  className?: string;
}

const sizes = { sm: "h-7 w-7 text-xs", md: "h-9 w-9 text-sm", lg: "h-12 w-12 text-base" };

const MemberAvatar = ({ userId, name, avatarUrl, size = "md", ring = true, className }: Props) => {
  const color = ringColorFor(userId);
  const emoji = FALLBACK_EMOJIS[hash(userId + ":e") % FALLBACK_EMOJIS.length];
  return (
    <Avatar
      className={cn(sizes[size], ring && "ring-2 ring-offset-1 ring-offset-background", className)}
      style={ring ? { boxShadow: `0 0 0 2px ${color}` } : undefined}
    >
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
      <AvatarFallback style={{ backgroundColor: color }} className="text-foreground/80">
        <span aria-hidden>{emoji}</span>
      </AvatarFallback>
    </Avatar>
  );
};

export default MemberAvatar;
