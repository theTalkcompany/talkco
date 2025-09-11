import * as React from "react";

interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className, ...props }) => (
  <img
    src="/lovable-uploads/08826e54-6a87-4ce3-b5bb-626bfd13e791.png"
    alt="Talk logo"
    className={className}
    {...props}
  />
);

export default Logo;
