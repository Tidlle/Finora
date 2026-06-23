import logoHorizontal from "@/assets/Logo_horizontal_finora.png";

const heightMap = {
  sm: "h-7",
  md: "h-8",
  lg: "h-10",
};

export function FinoraLogo({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  return (
    <img
      src={logoHorizontal}
      alt="Finora"
      className={`${heightMap[size]} w-auto object-contain ${className}`}
    />
  );
}
