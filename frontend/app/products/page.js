'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { productsApi } from '../../lib/api';
import ProductCard from '../../components/product/ProductCard';
import styles from './products.module.css';

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [inStock, setInStock] = useState(searchParams.get('in_stock') === 'true');
  const [ordering, setOrdering] = useState(searchParams.get('ordering') || '-created_at');
  const [page, setPage] = useState(Number(searchParams.get('page') || 1));

  const pageSize = 12;
  const totalPages = Math.ceil(count / pageSize);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        ordering,
        ...(search && { search }),
        ...(category && { category }),
        ...(minPrice && { min_price: minPrice }),
        ...(maxPrice && { max_price: maxPrice }),
        ...(inStock && { in_stock: true }),
      };
      const res = await productsApi.list(params);
      setProducts(res.data.results ?? res.data);
      setCount(res.data.count ?? (res.data.results ?? res.data).length);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, ordering, search, category, minPrice, maxPrice, inStock]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    productsApi.categories()
      .then((r) => setCategories(r.data.results ?? r.data))
      .catch(() => {});
  }, []);

  const clearFilters = () => {
    setSearch(''); setCategory(''); setMinPrice('');
    setMaxPrice(''); setInStock(false); setOrdering('-created_at'); setPage(1);
  };

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.breadcrumb}>
            <Link href="/">Home</Link>
            <span className={styles.breadcrumbSep}>›</span>
            <span className={styles.breadcrumbCurrent}>Products</span>
          </div>
          <h1 className={styles.pageTitle}>
            All <span>Products</span>
          </h1>
        </div>

        {/* Mobile Filter Toggle */}
        <button
          className={styles.mobileFilterToggle}
          onClick={() => setSidebarOpen((v) => !v)}
        >
          ⚙ {sidebarOpen ? 'Hide' : 'Show'} Filters
        </button>

        <div className={styles.layout}>
          {/* Sidebar */}
          <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
            <div className={styles.filterHeader}>
              <span className={styles.filterTitle}>Filters</span>
              <button className={styles.clearBtn} onClick={clearFilters}>Clear all</button>
            </div>

            {/* Search */}
            <div className={styles.filterGroup}>
              <div className={styles.filterGroupTitle}>Search</div>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search products…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>

            {/* Category */}
            {categories.length > 0 && (
              <div className={styles.filterGroup}>
                <div className={styles.filterGroupTitle}>Category</div>
                <div className={styles.categoryList}>
                  <div
                    className={`${styles.categoryOption} ${!category ? styles.categoryOptionActive : ''}`}
                    onClick={() => { setCategory(''); setPage(1); }}
                  >
                    <span className={styles.categoryOptionName}>All Categories</span>
                  </div>
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className={`${styles.categoryOption} ${category === cat.slug ? styles.categoryOptionActive : ''}`}
                      onClick={() => { setCategory(cat.slug); setPage(1); }}
                    >
                      <span className={styles.categoryOptionName}>{cat.name}</span>
                      <span className={styles.categoryOptionCount}>{cat.product_count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range */}
            <div className={styles.filterGroup}>
              <div className={styles.filterGroupTitle}>Price Range</div>
              <div className={styles.priceInputs}>
                <input
                  type="number"
                  className={styles.priceInput}
                  placeholder="Min $"
                  value={minPrice}
                  min={0}
                  onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                />
                <input
                  type="number"
                  className={styles.priceInput}
                  placeholder="Max $"
                  value={maxPrice}
                  min={0}
                  onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                />
              </div>
            </div>

            {/* Availability */}
            <div className={styles.filterGroup}>
              <div className={styles.filterGroupTitle}>Availability</div>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={inStock}
                  onChange={(e) => { setInStock(e.target.checked); setPage(1); }}
                />
                In Stock Only
              </label>
            </div>
          </aside>

          {/* Main */}
          <div className={styles.main}>
            <div className={styles.toolbar}>
              <span className={styles.resultsCount}>
                Showing <strong>{products.length}</strong> of <strong>{count}</strong> products
              </span>
              <div className={styles.sortWrapper}>
                <span className={styles.sortLabel}>Sort by:</span>
                <select
                  className={styles.sortSelect}
                  value={ordering}
                  onChange={(e) => { setOrdering(e.target.value); setPage(1); }}
                >
                  <option value="-created_at">Newest First</option>
                  <option value="created_at">Oldest First</option>
                  <option value="price">Price: Low to High</option>
                  <option value="-price">Price: High to Low</option>
                  <option value="name">Name A–Z</option>
                  <option value="-name">Name Z–A</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className={styles.productGrid}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    <div style={{ aspectRatio: '4/3', background: 'var(--bg-surface)', animation: 'shimmer 1.4s infinite', backgroundImage: 'linear-gradient(90deg, var(--bg-surface) 25%, var(--bg-card-hover) 50%, var(--bg-surface) 75%)', backgroundSize: '200% 100%' }} />
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[50, 90, 70, 40].map((w, j) => (
                        <div key={j} style={{ height: j === 3 ? '18px' : '14px', width: `${w}%`, borderRadius: '6px', background: 'var(--bg-surface)', animation: 'shimmer 1.4s infinite', backgroundImage: 'linear-gradient(90deg, var(--bg-surface) 25%, var(--bg-card-hover) 50%, var(--bg-surface) 75%)', backgroundSize: '200% 100%' }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className={styles.productGrid}>
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <div className={styles.productGrid}>
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>🔍</div>
                  <div className={styles.emptyTitle}>No products found</div>
                  <p>Try adjusting your search or filters.</p>
                  <button className="btn btn-secondary" onClick={clearFilters} style={{ marginTop: '16px' }}>
                    Clear Filters
                  </button>
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={`${styles.pageBtn} ${page === 1 ? styles.pageBtnDisabled : ''}`}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .map((p, idx, arr) => (
                    <>
                      {idx > 0 && arr[idx - 1] < p - 1 && (
                        <span key={`dots-${p}`} style={{ color: 'var(--text-muted)', padding: '0 4px' }}>…</span>
                      )}
                      <button
                        key={p}
                        className={`${styles.pageBtn} ${page === p ? styles.pageBtnActive : ''}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    </>
                  ))}
                <button
                  className={`${styles.pageBtn} ${page === totalPages ? styles.pageBtnDisabled : ''}`}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
