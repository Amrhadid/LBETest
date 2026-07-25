import { AssetImage } from "@/components/AssetImage";
import { cn } from "@/lib/utils";

/** Official certificate artwork in an undistorted A4 portrait presentation. */
export function Certificate({ className }: { className?: string }) {
  return (
    <figure className={cn("relative mx-auto w-full max-w-[390px] [perspective:1200px]", className)}>
      <div
        aria-hidden
        className="absolute inset-0 translate-x-4 translate-y-5 rotate-[3.5deg] border border-gold/20 bg-white shadow-card"
      />
      <div
        aria-hidden
        className="absolute -inset-5 -z-10 bg-[radial-gradient(circle,rgb(198_138_30_/_0.16),transparent_67%)] blur-xl"
      />
      <div className="corner-frame relative aspect-[210/297] w-full overflow-hidden border border-gold/35 bg-white p-1.5 shadow-paper transition-transform duration-500 sm:p-2 lg:[transform:rotateY(-3deg)_rotateZ(-0.7deg)] lg:hover:[transform:rotateY(0)_rotateZ(0)]">
        <AssetImage
          src="/Certificate.png"
          alt="Official Locrativ Certificate of Achievement sample"
          width={1055}
          height={1491}
          loading="eager"
          fetchPriority="high"
          className="h-full w-full object-contain"
        />
      </div>
      <div aria-hidden className="gold-foil absolute -bottom-5 -right-3 z-20 flex size-20 items-center justify-center rounded-full border-4 border-white/70 shadow-gold sm:-right-8">
        <span className="flex size-[62px] items-center justify-center rounded-full border border-white/55 font-serif text-[0.62rem] font-bold uppercase tracking-[0.12em] text-white">Official</span>
      </div>
      <figcaption className="sr-only">
        Sample of the official portrait-format Locrativ certificate.
      </figcaption>
    </figure>
  );
}
