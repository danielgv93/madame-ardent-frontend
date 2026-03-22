import type { PortfolioImage } from '../../data/portfolio-types';

interface Props {
  image: PortfolioImage;
}

export default function PortfolioCard({ image }: Props) {
  const isHorizontal = image.orientation === 'horizontal';
  const editorial = image.editorial ?? 'autopublicado';

  return (
    <div
      className={`shrink-0 snap-start group cursor-pointer ${isHorizontal ? 'w-[320px] md:w-[380px]' : 'w-[200px] md:w-[240px]'}`}
    >
      <div className="relative rounded-lg overflow-hidden transition-transform duration-500 ease-in-out shadow-[0_4px_24px_-4px_rgba(0,0,0,0.1)] group-hover:scale-[1.02]">
        <div className={`overflow-hidden ${isHorizontal ? 'aspect-[3/2]' : 'aspect-[2/3]'}`}>
          <img
            src={image.src}
            alt={image.alt}
            className="w-full h-full object-cover block"
            loading="lazy"
          />
        </div>
        <div className="absolute inset-0 bg-[rgba(214,32,19,0.85)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out flex flex-col justify-end p-5 text-white">
          <h3 className="font-simplify text-[1.15rem] mb-1 leading-[1.3]">{image.alt}</h3>
          {image.author && <p className="text-xs tracking-[0.05em] opacity-85">{image.author}</p>}
        </div>
      </div>
      <div className="mt-3">
        <p className="text-[0.625rem] tracking-[0.15em] uppercase text-primary mb-1">{editorial}</p>
        <h4 className="text-sm font-semibold text-[#1c1c19] leading-[1.3]">{image.alt}</h4>
      </div>
    </div>
  );
}
