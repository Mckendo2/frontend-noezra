import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, PackageSearch, Target, Rocket, Handshake, Zap, ArrowRight } from 'lucide-react'
import './LandingPage.css'
import logoSrc from '@/assets/logo-sinfondo.png'

const WA_NUMBER = '59163123852'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'
const BACKEND_BASE = API_BASE.replace('/api/v1', '')

interface Product {
  id: number
  name: string
  description?: string
  image_url?: string
  category_id: number
  category_name?: string
}

interface Category {
  id: number
  name: string
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`${API_BASE}/public/products`),
          fetch(`${API_BASE}/public/categories`)
        ])
        
        if (!prodRes.ok || !catRes.ok) throw new Error('Error fetching data')

        const prodData = await prodRes.json()
        const catData = await catRes.json()

        setProducts(prodData.data || [])
        setCategories(catData.data || [])
      } catch (err) {
        console.error(err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchData()

    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const filteredProducts = products.filter(p => {
    const matchesCat = activeCategory === 'all' || String(p.category_id) === activeCategory
    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCat && matchesSearch
  })

  const scrollTo = (id: string) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="landing-page">
      {/* ── NAVBAR ── */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <a href="#home" onClick={(e) => { e.preventDefault(); scrollTo('home') }} className="nav-logo">
            <img src={logoSrc} alt="Noezra" className="nav-logo-img" />
          </a>
          <ul className="nav-links">
            <li><a href="#catalogo" onClick={(e) => { e.preventDefault(); scrollTo('catalogo') }} className="nav-link">Catálogo</a></li>
            <li><a href="#nosotros" onClick={(e) => { e.preventDefault(); scrollTo('nosotros') }} className="nav-link">Nosotros</a></li>
            <li><a href="#contacto" onClick={(e) => { e.preventDefault(); scrollTo('contacto') }} className="nav-link">Contacto</a></li>
          </ul>
          <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer" className="btn-nav-wa">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.533 5.854L.057 23.25a.75.75 0 0 0 .932.932l5.396-1.476A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.85 0-3.579-.5-5.07-1.37l-.363-.214-3.752 1.025 1.025-3.752-.214-.363A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
            WhatsApp
          </a>
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú">
            <span></span><span></span><span></span>
          </button>
        </div>
        <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
          <a href="#catalogo" onClick={(e) => { e.preventDefault(); scrollTo('catalogo') }} className="mobile-link">Catálogo</a>
          <a href="#nosotros" onClick={(e) => { e.preventDefault(); scrollTo('nosotros') }} className="mobile-link">Nosotros</a>
          <a href="#contacto" onClick={(e) => { e.preventDefault(); scrollTo('contacto') }} className="mobile-link">Contacto</a>
          <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer" className="mobile-link mobile-wa">WhatsApp</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero" id="home">
        <div className="hero-bg"></div>
        <div className="hero-content">
          <img src={logoSrc} alt="Importaciones Noezra" className="hero-logo" />
          <h1 className="hero-title">Importaciones <span>Noezra</span></h1>
          <p className="hero-sub">Tu proveedor de confianza. Calidad y variedad en cada producto.</p>
          <div className="hero-actions">
            <a href="#catalogo" onClick={(e) => { e.preventDefault(); scrollTo('catalogo') }} className="btn-primary">Ver Catálogo</a>
            <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer" className="btn-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.533 5.854L.057 23.25a.75.75 0 0 0 .932.932l5.396-1.476A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.85 0-3.579-.5-5.07-1.37l-.363-.214-3.752 1.025 1.025-3.752-.214-.363A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              Consultar
            </a>
          </div>
        </div>
        <div className="hero-wave">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100" preserveAspectRatio="none">
            <path d="M0,60 C360,100 1080,0 1440,60 L1440,100 L0,100 Z" fill="#f8fafc"/>
          </svg>
        </div>
      </section>

      {/* ── CATÁLOGO ── */}
      <section className="catalogo" id="catalogo">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">Productos</span>
            <h2 className="section-title">Nuestro Catálogo</h2>
            <p className="section-desc">Explora nuestra variedad de productos. Contáctanos para consultar precios y disponibilidad.</p>
          </div>

          <div className="search-bar">
            <div className="search-input-wrap">
              <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input 
                type="text" 
                placeholder="Buscar producto..." 
                className="search-input" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery('')}>✕</button>
              )}
            </div>
          </div>

          <div className="category-filters">
            <button 
              className={`filter-btn ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                className={`filter-btn ${activeCategory === String(cat.id) ? 'active' : ''}`}
                onClick={() => setActiveCategory(String(cat.id))}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {error ? (
            <div className="no-results">
              <div className="no-results-icon"><AlertTriangle size={48} className="text-amber-500 mx-auto mb-2" /></div>
              <p>No se pudo cargar el catálogo</p>
              <span>Verifica la conexión con el servidor</span>
            </div>
          ) : (
            <div className="products-grid">
              {loading ? (
                Array(8).fill(0).map((_, i) => <div key={i} className="skeleton-card"></div>)
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map(p => {
                  const waMsg = encodeURIComponent(`Hola! Me interesa el producto: *${p.name}*. ¿Está disponible?`)
                  const waUrl = `https://wa.me/${WA_NUMBER}?text=${waMsg}`
                  const imgUrl = p.image_url ? (p.image_url.startsWith('http') ? p.image_url : `${BACKEND_BASE}${p.image_url}`) : null

                  return (
                    <div key={p.id} className="product-card">
                      <div className="product-img-wrap">
                        {imgUrl ? (
                          <img 
                            className="product-img" 
                            src={imgUrl} 
                            alt={p.name} 
                          />
                        ) : null}
                        <div className={`product-no-img ${imgUrl ? 'hidden absolute inset-0 bg-slate-50 flex items-center justify-center' : ''}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="m8 21 4-4 4 4"/><path d="M2 13l4-4 4 4 4-6 4 4"/></svg>
                          <span>Sin imagen</span>
                        </div>
                        {p.category_name && (
                          <span className="product-cat-badge">{p.category_name}</span>
                        )}
                      </div>
                      <div className="product-body">
                        <p className="product-name">{p.name}</p>
                        {p.description && (
                          <p className="text-[0.8rem] text-slate-500 mb-2 leading-snug line-clamp-2">
                            {p.description}
                          </p>
                        )}
                        <a href={waUrl} target="_blank" rel="noreferrer" className="product-consult">
                          Consultar <ArrowRight size={14} />
                        </a>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="no-results">
                  <div className="no-results-icon"><PackageSearch size={48} className="text-slate-400 mx-auto mb-2" /></div>
                  <p>No se encontraron productos</p>
                  <span>Intenta con otra búsqueda o categoría</span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── NOSOTROS ── */}
      <section className="nosotros" id="nosotros">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">Empresa</span>
            <h2 className="section-title">¿Quiénes Somos?</h2>
          </div>
          <div className="nosotros-grid">
            <div className="nosotros-text">
              <p>En <strong>Importaciones Noezra</strong> somos importadores directos especializados en artículos para el hogar, tecnología y mercadería en general. Nuestro compromiso es ofrecer a emprendedores y familias productos innovadores, garantizando la mejor relación calidad-precio y brindando un soporte continuo para todos nuestros clientes a nivel nacional.</p>
            </div>
            <div className="valores-grid">
              <div className="valor-card">
                <div className="valor-icon"><Target size={32} className="mx-auto text-blue-600 mb-3" /></div>
                <h3>Calidad</h3>
                <p>Productos rigurosamente seleccionados y probados</p>
              </div>
              <div className="valor-card">
                <div className="valor-icon"><Rocket size={32} className="mx-auto text-blue-600 mb-3" /></div>
                <h3>Variedad</h3>
                <p>Amplio catálogo que se renueva constantemente</p>
              </div>
              <div className="valor-card">
                <div className="valor-icon"><Handshake size={32} className="mx-auto text-blue-600 mb-3" /></div>
                <h3>Confianza</h3>
                <p>Transparencia y atención humana personalizada</p>
              </div>
              <div className="valor-card">
                <div className="valor-icon"><Zap size={32} className="mx-auto text-blue-600 mb-3" /></div>
                <h3>Eficiencia</h3>
                <p>Stock actualizado y gestión rápida de pedidos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACTO ── */}
      <section className="contacto" id="contacto">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag" style={{ '--tag-color': '#25d366', '--tag-bg': '#dcfce7' } as any}>Contacto</span>
            <h2 className="section-title">¿Te interesa algún producto?</h2>
            <p className="section-desc">Escríbenos directamente por WhatsApp y te respondemos al instante.</p>
          </div>
          <div className="contact-card">
            <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer" className="wa-big-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.533 5.854L.057 23.25a.75.75 0 0 0 .932.932l5.396-1.476A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.85 0-3.579-.5-5.07-1.37l-.363-.214-3.752 1.025 1.025-3.752-.214-.363A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
              <div>
                <span className="wa-label">Escríbenos por WhatsApp</span>
                <span className="wa-number">+591 63123852</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-container">
          <img src={logoSrc} alt="Noezra" className="footer-logo" />
          <p className="footer-text">© {new Date().getFullYear()} Importaciones Noezra. Todos los derechos reservados.</p>
          <button 
            onClick={() => navigate('/login')} 
            className="text-xs text-white/30 hover:text-white/60 transition-colors mt-2 bg-transparent border-none cursor-pointer"
          >
            Acceso al Sistema
          </button>
        </div>
      </footer>

      {/* WhatsApp flotante */}
      <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noreferrer" className="wa-float" title="Contáctanos por WhatsApp">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.533 5.854L.057 23.25a.75.75 0 0 0 .932.932l5.396-1.476A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.85 0-3.579-.5-5.07-1.37l-.363-.214-3.752 1.025 1.025-3.752-.214-.363A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
      </a>
    </div>
  )
}
