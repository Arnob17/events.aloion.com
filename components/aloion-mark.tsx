export function AloionMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/aloion-logo.jpg" alt="" className={`${className} shrink-0 rounded-full object-cover`} />
  );
}
