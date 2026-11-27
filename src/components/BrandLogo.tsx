interface BrandLogoProps {
  size?: 'sm' | 'md';
}

export function BrandLogo({ size = 'md' }: BrandLogoProps) {
  return (
    <span className="inline-flex items-center shrink-0 select-none">
      <img
        src="/assets/aistudio/ONECARE_Healthcare_Logo_aa9e3bb8.png"
        alt="ONECARE — Healthcare. All in One."
        className={
          size === 'sm'
            ? 'h-8 w-auto object-contain'
            : 'h-11 lg:h-13 w-auto object-contain'
        }
      />
    </span>
  );
}
