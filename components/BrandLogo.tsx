import Image from "next/image";

export function BrandLogo({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <span className={`brand-logo${compact ? " brand-logo--compact" : ""}${inverse ? " brand-logo--inverse" : ""}`}>
      <Image src="/brand/ganesh-logo.png" alt="Ganesh Garments" width={1946} height={808} priority />
    </span>
  );
}
