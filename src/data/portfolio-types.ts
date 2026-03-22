export interface PortfolioImage {
    src: string;
    alt: string;
    orientation?: 'vertical' | 'horizontal';
    author?: string;
    editorial?: string;
}

export interface PortfolioSection {
    title: string;
    images: PortfolioImage[];
}
