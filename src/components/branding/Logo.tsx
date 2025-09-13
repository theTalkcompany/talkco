import * as React from "react";

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className, ...props }) => (
  <img
    src="/lovable-uploads/Talk_logo_512X512.png"
    alt="Talk logo"
    className={className}
    {...props}
  />
);

export default Logo;
