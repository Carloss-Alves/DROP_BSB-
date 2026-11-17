import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Hero } from '@/components/home/Hero';
import { BrandShowcase } from '@/components/home/BrandShowcase';
import { FeaturedRow } from '@/components/home/FeaturedRow';
import { CouponsSection } from '@/components/home/CouponsSection';
import { InstagramGrid } from '@/components/home/InstagramGrid';
import { Button } from '@/components/ui/Button';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { AlertTriangle } from 'lucide-react';
import { fetchBanners, fetchBrands, fetchProducts, fetchInstagramPosts } from '@/services/catalog';
import type { Banner, Brand, Product, InstagramPost } from '@/types';

export function HomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [instagramPosts, setInstagramPosts] = useState<InstagramPost[]>([]);

  useEffect(() => {
    Promise.all([fetchBanners(), fetchBrands(), fetchProducts(), fetchInstagramPosts()])
      .then(([banners, brandList, allProducts, posts]) => {
        setBanner(banners[0] ?? null);
        setBrands(brandList);
        setProducts(allProducts);
        setInstagramPosts(posts);
      })
      .catch(err => {
        console.error('Falha ao carregar a Home:', err);
        setError('Não foi possível carregar a loja agora. Verifique sua conexão e tente novamente em instantes.');
      })
      .finally(() => setLoading(false));
  }, []);

  // NOVIDADES: produtos mais recentes por data de cadastro (created_at DESC).
  const newest = [...products]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  // DROP: produtos marcados como "Em destaque" no Admin (is_featured) — sem
  // nenhuma lógica temporal. "DROP" aqui é só o nome da seção.
  const dropProducts = products.filter(p => p.is_featured);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24">
        <ProductGridSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <EmptyState icon={AlertTriangle} title="Algo deu errado" description={error} />
      </div>
    );
  }

  return (
    <div>
      <Hero banner={banner} />
      <FeaturedRow eyebrow="Acabou de chegar" title="Novidades" products={newest} seeAllHref="/produtos" />
      <BrandShowcase brands={brands} />
      <FeaturedRow eyebrow="Produtos em destaque" title="Drop" products={dropProducts} seeAllHref="/produtos" />
      {dropProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 flex justify-center">
          <Link to="/produtos">
            <Button variant="primary">Ver todos os produtos</Button>
          </Link>
        </div>
      )}
      <CouponsSection />
      <InstagramGrid posts={instagramPosts} />
    </div>
  );
}
