import * as React from "react";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    fill="none"
    className={className}
    aria-label="Talk logo"
    {...props}
  >
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={`hsl(var(--primary))`} />
        <stop offset="100%" stopColor={`hsl(var(--accent))`} />
      </linearGradient>
    </defs>
    <path d="M12 12h40a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H28l-10 8v-8h-6a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4Z" fill="url(#g)"/>
    <path d="M26 24c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4Zm10 0c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4-4-1.79-4-4Z" fill="hsl(var(--primary-foreground))"/>
    <path d="M22 24c0 5.52 4.48 10 10 10s10-4.48 10-10" stroke="hsl(var(--primary-foreground))" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

export default Logo;
