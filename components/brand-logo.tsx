import Image from "next/image";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ className = "", priority = false }: BrandLogoProps) {
  return <span className={`brand-logo ${className}`.trim()}><Image src="/brand/urus-fidc-logo.png" alt="Urus FIDC" width={422} height={149} priority={priority}/></span>;
}
