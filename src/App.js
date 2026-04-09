import { useState, useRef, useEffect, useCallback } from 'react';

const BRAND = {
  green: '#70b738',
  pink: '#ab0a62',
  darkGreen: '#4a7d20',
  lightGreen: '#e8f5d4',
  font: "'Inter', sans-serif",
};

const PRODUCTS = [
  { id: 1, name: 'Crimson Queen Japanese Maple', cat: 'Trees', price: '$89.00', desc: 'Stunning laceleaf Japanese maple with deep crimson foliage. Perfect for containers or garden beds.', emoji: '🍁' },
  { id: 2, name: 'Lavender Hidcote', cat: 'Perennials', price: '$14.95', desc: 'Classic English lavender with deep purple flowers and strong fragrance. Drought tolerant once established.', emoji: '💜' },
  { id: 3, name: 'Iceberg Rose', cat: 'Roses', price: '$24.95', desc: 'Australia\'s most popular rose. Pure white blooms all season, disease resistant and easy to grow.', emoji: '🌹' },
  { id: 4, name: 'Lilly Pilly Resilience', cat: 'Hedging', price: '$19.95', desc: 'Fast growing native hedge plant with glossy foliage and psyllid resistance. Great for privacy screens.', emoji: '🌿' },
  { id: 5, name: 'Buxus Sempervirens', cat: 'Hedging', price: '$16.95', desc: 'Classic English box hedge. Dense evergreen foliage, ideal for formal gardens and topiary.', emoji: '🌳' },
  { id: 6, name: 'Agapanthus Storm Cloud', cat: 'Perennials', price: '$18.95', desc: 'Deep violet-blue flowers on tall stems. Perfect for mass planting or as a border plant.', emoji: '💙' },
  { id: 7, name: 'Camellia Donation', cat: 'Shrubs', price: '$39.95', desc: 'Semi-double pink flowers in winter and spring. One of the most reliable and beautiful camellias.', emoji: '🌸' },
  { id: 8, name: 'Wisteria Sinensis', cat: 'Climbers', price: '$29.95', desc: 'Spectacular cascading purple flowers in spring. Vigorous climber for pergolas and fences.', emoji: '🪻' },
  { id: 9, name: 'Garlic Bulbs (10 pack)', cat: 'Edibles', price: '$12.95', desc: 'Premium Australian grown garlic bulbs. Plant now for a bumper summer harvest.', emoji: '🧄' },
  { id: 10, name: 'Blueberry Sunshine Blue', cat: 'Edibles', price: '$34.95', desc: 'Compact blueberry perfect for pots or small gardens. Self-fertile with masses of sweet berries.', emoji: '🫐' },
  { id: 11, name: 'Potting Mix Premium 30L', cat: 'Soils & Mulch', price: '$18.95', desc: 'Professional grade potting mix with controlled release fertiliser. Perfect for containers and raised beds.', emoji: '🪴' },
  { id: 12, name: 'Seasol Concentrate 1L', cat: 'Fertilisers', price: '$22.95', desc: 'Australia\'s favourite garden tonic. Improves soil health and plant resilience naturally.', emoji: '🌱' },
];

const CATEGORIES = ['All', ...new Set(PRODUCTS.map(p => p.cat))];

const BADGE_COLORS = { green: '#70b738', pink: '#ab0a62', amber: '#d68910', navy: '#1a3a5c' };

export default function App() {
  const [step, setStep] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [postType, setPostType] = useState('product');
  const [captions, setCaptions] = useState([]);
  const [selectedCaption, setSelectedCaption] = useState('');
  const [editedCaption, setEditedCaption] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [canvasSize, setCanvasSize] = useState({ w: 1080, h: 1080, label: 'Feed 1:1' });
  const [barStyle, setBarStyle] = useState('bottom');
  const [overlayText, setOverlayText] = useState('');
  const [overlayStyle, setOverlayStyle] = useState('banner');
  const [overlayPos, setOverlayPos] = useState('top');
  const [overlayBg, setOverlayBg] = useState('#70b738');
  const [overlayFg, setOverlayFg] = useState('#ffffff');
  const [selectedBadge, setSelectedBadge] = useState('');
  const [badgeColor, setBadgeColor] = useState('green');
  const [logoPos, setLogoPos] = useState('tr');
  const [logoSize, setLogoSize] = useState(20);
  const [productImg, setProductImg] = useState(null);
  const [logoImg, setLogoImg] = useState(null);
  const canvasRef = useRef(null);

  const sizes = [
    { w: 1080, h: 1080, label: 'Feed 1:1' },
    { w: 1080, h: 1350, label: 'Portrait 4:5' },
    { w: 1080, h: 1920, label: 'Story 9:16' },
  ];

  const postTypes = [
    { id: 'product', label: 'Product feature' },
    { id: 'sale', label: 'Sale / promo' },
    { id: 'new', label: 'New arrival' },
    { id: 'seasonal', label: 'Seasonal' },
  ];

  const filteredProducts = PRODUCTS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.cat.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || p.cat === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const generateCaptions = async () => {
    if (!selectedProduct) return;
    setGenerating(true);
    setGenError('');
    setCaptions([]);
    setSelectedCaption('');
    setEditedCaption('');
    try {
      const res = await fetch('/api/generate-captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: selectedProduct.name,
          price: selectedProduct.price,
          description: selectedProduct.desc,
          postType,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCaptions(data.captions || []);
    } catch (e) {
      setGenError('Could not generate captions — ' + e.message);
    }
    setGenerating(false);
  };

  const drawCanvas = useCallback(() => {
    if (!canvasRef.current || !selectedProduct) return;
    const cv = canvasRef.current;
    const scale = Math.min(480 / canvasSize.w, 480 / canvasSize.h);
    cv.width = Math.round(canvasSize.w * scale);
    cv.height = Math.round(canvasSize.h * scale);
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;

    if (productImg) {
      const s = Math.max(W / productImg.width, H / productImg.height);
      ctx.drawImage(productImg, (W - productImg.width * s) / 2, (H - productImg.height * s) / 2, productImg.width * s, productImg.height * s);
    } else {
      ctx.fillStyle = '#e8f5d4';
      ctx.fillRect(0, 0, W, H);
      ctx.font = `${Math.round(Math.min(W, H) * 0.26)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(selectedProduct.emoji, W / 2, H * 0.44);
    }

    const bH = Math.round(H * 0.2);
    const pad = Math.round(W * 0.05);

    if (barStyle === 'bottom' || barStyle === 'top') {
      const y = barStyle === 'bottom' ? H - bH : 0;
      ctx.fillStyle = 'rgba(30,70,10,0.9)';
      ctx.fillRect(0, y, W, bH);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = `500 ${Math.round(W * 0.052)}px Inter, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(selectedProduct.name, pad, y + Math.round(bH * 0.1), W - pad * 2);
      ctx.font = `${Math.round(W * 0.042)}px Inter, sans-serif`;
      ctx.fillStyle = '#b8e87a';
      ctx.fillText(selectedProduct.price, pad, y + Math.round(bH * 0.45));
      ctx.font = `${Math.round(W * 0.028)}px Inter, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillText('Garden Express', pad, y + Math.round(bH * 0.72));
    } else if (barStyle === 'minimal') {
      const sH = Math.round(bH * 0.6);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, H - sH, W, sH);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = `500 ${Math.round(W * 0.05)}px Inter, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(selectedProduct.name, pad, H - sH + Math.round(sH * 0.1), W - pad * 2);
      ctx.font = `${Math.round(W * 0.028)}px Inter, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.fillText('Garden Express · ' + selectedProduct.price, pad, H - sH + Math.round(sH * 0.55));
    }

    if (overlayText.trim()) {
      const oFs = Math.round(W * 0.046);
      ctx.font = `500 ${oFs}px Inter, sans-serif`;
      const tw = ctx.measureText(overlayText).width;
      const oPad = Math.round(W * 0.04);
      let oy;
      if (overlayPos === 'top') oy = Math.round(H * 0.06);
      else if (overlayPos === 'mid') oy = Math.round(H * 0.5) - Math.round(oFs * 0.5);
      else oy = Math.round(H * 0.82);

      if (overlayStyle === 'banner') {
        ctx.fillStyle = overlayBg;
        ctx.fillRect(0, oy - oPad, W, oFs + oPad * 2);
        ctx.fillStyle = overlayFg;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(overlayText, W / 2, oy);
      } else if (overlayStyle === 'pill') {
        const ox = W / 2 - (tw / 2 + oPad * 1.2);
        ctx.fillStyle = overlayBg;
        ctx.beginPath();
        ctx.roundRect(ox, oy - oPad * 0.8, tw + oPad * 2.4, oFs + oPad * 1.6, oFs);
        ctx.fill();
        ctx.fillStyle = overlayFg;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(overlayText, W / 2, oy);
      } else {
        const r = Math.round(Math.min(W, H) * 0.12);
        const ox = W - r - Math.round(W * 0.06);
        const burstY = overlayPos === 'top' ? r + Math.round(H * 0.06) : H - r - Math.round(H * 0.06);
        ctx.fillStyle = overlayBg;
        ctx.beginPath();
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
          const ri = i % 2 === 0 ? r : r * 0.75;
          const x = ox + Math.cos(a) * ri, y = burstY + Math.sin(a) * ri;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        const words = overlayText.split(' ');
        ctx.fillStyle = overlayFg;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `500 ${Math.round(oFs * 0.72)}px Inter, sans-serif`;
        words.forEach((w, i) => ctx.fillText(w, ox, burstY + (i - (words.length - 1) / 2) * (oFs * 0.9)));
      }
    }

    if (selectedBadge) {
      const bc = BADGE_COLORS[badgeColor] || BADGE_COLORS.green;
      const br = Math.round(Math.min(W, H) * 0.11);
      const bx = W - br - Math.round(W * 0.04);
      const by = br + Math.round(H * 0.04);
      ctx.fillStyle = bc;
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 - Math.PI / 2;
        const ri = i % 2 === 0 ? br : br * 0.78;
        const x = bx + Math.cos(a) * ri, y = by + Math.sin(a) * ri;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const bWords = selectedBadge.toUpperCase().split(' ');
      const bFs = Math.round(br * 0.36);
      ctx.font = `500 ${bFs}px Inter, sans-serif`;
      bWords.forEach((w, i) => ctx.fillText(w, bx, by + (i - (bWords.length - 1) / 2) * (bFs * 1.1)));
    }

    if (logoImg) {
      const lw = Math.round(W * (logoSize / 100));
      const lh = Math.round(lw * (logoImg.height / logoImg.width));
      const lPad = Math.round(W * 0.03);
      let lx, ly;
      if (logoPos === 'tr') { lx = W - lw - lPad; ly = lPad; }
      else if (logoPos === 'tl') { lx = lPad; ly = lPad; }
      else if (logoPos === 'br') { lx = W - lw - lPad; ly = H - lh - lPad; }
      else { lx = lPad; ly = H - lh - lPad; }
      ctx.drawImage(logoImg, lx, ly, lw, lh);
    }
  }, [selectedProduct, canvasSize, barStyle, overlayText, overlayStyle, overlayPos, overlayBg, overlayFg, selectedBadge, badgeColor, logoImg, logoPos, logoSize, productImg]);

  useEffect(() => {
    if (step === 3) drawCanvas();
  }, [step, drawCanvas]);

  const handleFileUpload = (e, setter) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => { setter(img); };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const downloadImage = () => {
    if (!canvasRef.current || !selectedProduct) return;
    const cv = canvasRef.current;
    const full = document.createElement('canvas');
    full.width = canvasSize.w;
    full.height = canvasSize.h;
    full.getContext('2d').drawImage(cv, 0, 0, canvasSize.w, canvasSize.h);
    const dataUrl = full.toDataURL('image/png');
    try {
      const arr = dataUrl.split(','), mime = arr[0].match(/:(.*?);/)[1], b = atob(arr[1]);
      let n = b.length;
      const u = new Uint8Array(n);
      while (n--) u[n] = b.charCodeAt(n);
      const blob = new Blob([u], { type: mime });
      const bUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = bUrl;
      a.download = selectedProduct.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + `-${canvasSize.w}x${canvasSize.h}.png`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(bUrl); document.body.removeChild(a); }, 1000);
    } catch (e) {
      alert('Download failed — try right-clicking the preview and saving the image.');
    }
  };

  const s = {
    app: { fontFamily: BRAND.font, minHeight: '100vh', background: '#f7f9f5', color: '#1a1a1a' },
    header: { background: '#fff', borderBottom: '1px solid #e8e8e0', padding: '0 24px', display: 'flex', alignItems: 'center', height: 56, gap: 12 },
    headerDot: { width: 28, height: 28, borderRadius: '50%', background: BRAND.green, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 16, fontWeight: 600, color: '#1a1a1a' },
    headerSub: { fontSize: 13, color: '#888', marginLeft: 4 },
    main: { maxWidth: 1000, margin: '0 auto', padding: '24px 16px' },
    stepBar: { display: 'flex', marginBottom: 24, border: '1px solid #e0e8d8', borderRadius: 12, overflow: 'hidden', background: '#fff' },
    step: (active, done) => ({ flex: 1, padding: '11px 8px', textAlign: 'center', fontSize: 13, color: done ? BRAND.green : active ? '#1a1a1a' : '#999', background: active ? '#fff' : '#f7f9f5', fontWeight: active ? 500 : 400, borderRight: '1px solid #e0e8d8', cursor: 'pointer' }),
    card: { background: '#fff', border: '1px solid #e0e8d8', borderRadius: 14, padding: '20px 20px' },
    sectionLabel: { fontSize: 13, fontWeight: 500, color: '#666', marginBottom: 8, marginTop: 16, display: 'block' },
    input: { width: '100%', padding: '9px 12px', fontSize: 14, border: '1px solid #e0e8d8', borderRadius: 8, fontFamily: BRAND.font, color: '#1a1a1a', background: '#fff', outline: 'none' },
    pill: (active) => ({ padding: '6px 14px', border: `1px solid ${active ? BRAND.green : '#e0e8d8'}`, borderRadius: 20, fontSize: 13, cursor: 'pointer', background: active ? BRAND.green : '#fff', color: active ? '#fff' : '#666', fontFamily: BRAND.font }),
    btn: (variant) => ({
      padding: '10px 20px', border: `1px solid ${variant === 'primary' ? BRAND.green : variant === 'pink' ? BRAND.pink : '#ccc'}`,
      borderRadius: 8, background: variant === 'primary' ? BRAND.green : variant === 'pink' ? BRAND.pink : '#fff',
      color: variant === 'primary' || variant === 'pink' ? '#fff' : '#666',
      fontSize: 14, cursor: 'pointer', fontFamily: BRAND.font, fontWeight: 500
    }),
    productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 16 },
    productCard: (selected) => ({ border: `${selected ? 2 : 1}px solid ${selected ? BRAND.green : '#e0e8d8'}`, borderRadius: 12, padding: 12, cursor: 'pointer', background: '#fff' }),
    pImg: { width: '100%', aspectRatio: '1', borderRadius: 8, background: '#f0f5e8', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, overflow: 'hidden' },
    selBar: { background: '#f0f5e8', border: '1px solid #d4e8b8', borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, flexWrap: 'wrap' },
    tag: (color) => ({ fontSize: 11, padding: '3px 8px', borderRadius: 10, background: color === 'pink' ? '#fce8f3' : '#e8f5d4', color: color === 'pink' ? BRAND.pink : BRAND.darkGreen, fontWeight: 500 }),
    captionCard: (selected) => ({ border: `${selected ? 2 : 1}px solid ${selected ? BRAND.green : '#e0e8d8'}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8, cursor: 'pointer', fontSize: 14, lineHeight: 1.6, color: '#1a1a1a', background: '#fff' }),
    textarea: { width: '100%', minHeight: 90, padding: '10px 12px', fontSize: 14, border: '1px solid #e0e8d8', borderRadius: 8, fontFamily: BRAND.font, lineHeight: 1.6, resize: 'vertical', color: '#1a1a1a' },
    composer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' },
    controlSection: { border: '1px solid #e0e8d8', borderRadius: 12, padding: 14, background: '#fff', marginBottom: 10 },
    canvasWrap: { border: '1px solid #e0e8d8', borderRadius: 12, overflow: 'hidden', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, marginBottom: 12 },
    uploadLabel: { display: 'block', padding: '8px 14px', border: '1px dashed #ccc', borderRadius: 8, fontSize: 13, cursor: 'pointer', color: '#888', textAlign: 'center', width: '100%' },
    row2: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 },
    infoBox: { background: '#f0f7e8', border: '1px solid #c8e89c', borderRadius: 8, padding: '11px 14px', fontSize: 13, color: '#3a6010', lineHeight: 1.6, marginBottom: 16 },
    badgeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginTop: 6 },
    badgeOpt: (active) => ({ padding: '6px 4px', border: `${active ? 2 : 1}px solid ${active ? BRAND.green : '#e0e8d8'}`, borderRadius: 8, fontSize: 12, cursor: 'pointer', textAlign: 'center', background: active ? '#e8f5d4' : '#fff' }),
  };

  return (
    <div style={s.app}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

      <div style={s.header}>
        <div style={s.headerDot}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M12 2a9 9 0 0 1 9 9c0 4.97-9 13-9 13S3 15.97 3 11a9 9 0 0 1 9-9z"/><circle cx="12" cy="11" r="3"/></svg>
        </div>
        <span style={s.headerTitle}>Garden Express</span>
        <span style={s.headerSub}>Social & Newsletter Generator</span>
      </div>

      <div style={s.main}>
        <div style={s.stepBar}>
          {['Pick product', 'Write copy', 'Compose image'].map((label, i) => (
            <div key={i} style={{ ...s.step(step === i + 1, step > i + 1), borderRight: i < 2 ? '1px solid #e0e8d8' : 'none' }}>
              {step > i + 1 ? '✓ ' : ''}{label}
            </div>
          ))}
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div style={s.card}>
            <input style={s.input} placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '12px 0' }}>
              {CATEGORIES.map(cat => (
                <div key={cat} style={s.pill(selectedCategory === cat)} onClick={() => setSelectedCategory(cat)}>{cat}</div>
              ))}
            </div>
            <div style={s.productGrid}>
              {filteredProducts.map(p => (
                <div key={p.id} style={s.productCard(selectedProduct?.id === p.id)} onClick={() => setSelectedProduct(p)}>
                  <div style={s.pImg}>{p.emoji}</div>
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 3 }}>{p.cat}</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3, lineHeight: 1.3 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{p.price}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button style={s.btn('primary')} onClick={() => { if (!selectedProduct) { alert('Please select a product first.'); return; } setStep(2); }}>
                Next: write copy →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div style={s.card}>
            <div style={s.selBar}>
              <strong>{selectedProduct?.name}</strong>
              <span style={s.tag('green')}>{selectedProduct?.cat}</span>
              <span style={s.tag('pink')}>{selectedProduct?.price}</span>
            </div>

            <span style={{ ...s.sectionLabel, marginTop: 0 }}>Post type</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {postTypes.map(pt => (
                <div key={pt.id} style={s.pill(postType === pt.id)} onClick={() => setPostType(pt.id)}>{pt.label}</div>
              ))}
            </div>

            <div style={s.infoBox}>
              Click <strong>Generate captions</strong> — Claude will write 3 options using the Garden Express tone of voice.
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
              <button style={s.btn('primary')} onClick={generateCaptions} disabled={generating}>
                {generating ? 'Generating...' : captions.length ? 'Regenerate' : 'Generate captions'}
              </button>
              {genError && <span style={{ fontSize: 13, color: '#c0392b' }}>{genError}</span>}
            </div>

            {generating && (
              <div style={{ textAlign: 'center', padding: '24px', color: '#888', fontSize: 14 }}>
                Writing captions in the Garden Express voice...
              </div>
            )}

            {captions.length > 0 && (
              <>
                <span style={s.sectionLabel}>Choose a caption</span>
                {captions.map((c, i) => (
                  <div key={i} style={s.captionCard(selectedCaption === c)} onClick={() => { setSelectedCaption(c); setEditedCaption(c); }}>
                    {c}
                  </div>
                ))}
              </>
            )}

            {selectedCaption && (
              <>
                <span style={s.sectionLabel}>Edit caption</span>
                <textarea style={s.textarea} value={editedCaption} onChange={e => setEditedCaption(e.target.value)} />
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button style={s.btn('default')} onClick={() => setStep(1)}>Back</button>
                  <button style={s.btn('primary')} onClick={() => { if (!editedCaption.trim()) { alert('Please select or write a caption.'); return; } setStep(3); }}>
                    Next: compose image →
                  </button>
                </div>
              </>
            )}

            {!selectedCaption && (
              <div style={{ marginTop: 12 }}>
                <button style={s.btn('default')} onClick={() => setStep(1)}>Back</button>
              </div>
            )}
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div style={s.card}>
            <div style={s.selBar}>
              <strong>{selectedProduct?.name}</strong>
              <span style={s.tag('pink')}>{selectedProduct?.price}</span>
            </div>
            <div style={{ ...s.composer, gridTemplateColumns: window.innerWidth < 640 ? '1fr' : '1fr 1fr' }}>
              <div>
                <span style={{ ...s.sectionLabel, marginTop: 0 }}>Preview</span>
                <div style={s.canvasWrap}>
                  <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 4, maxWidth: '100%', maxHeight: 460 }} />
                </div>
                <div style={{ background: '#f7f9f5', border: '1px solid #e0e8d8', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 12 }}>
                  <strong>Caption:</strong> {editedCaption}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={s.btn('default')} onClick={() => setStep(2)}>Back</button>
                  <button style={s.btn('primary')} onClick={downloadImage}>Download image</button>
                </div>
              </div>

              <div>
                <div style={s.controlSection}>
                  <span style={{ ...s.sectionLabel, marginTop: 0 }}>Canvas size</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {sizes.map(sz => (
                      <div key={sz.label} style={s.pill(canvasSize.label === sz.label)} onClick={() => { setCanvasSize(sz); setTimeout(drawCanvas, 50); }}>{sz.label}</div>
                    ))}
                  </div>
                </div>

                <div style={s.controlSection}>
                  <span style={{ ...s.sectionLabel, marginTop: 0 }}>Product image</span>
                  <label style={s.uploadLabel} htmlFor="productImg">Upload product photo</label>
                  <input type="file" id="productImg" accept="image/*" style={{ display: 'none' }} onChange={e => { handleFileUpload(e, img => { setProductImg(img); setTimeout(drawCanvas, 50); }); }} />
                  {productImg && <div style={{ fontSize: 12, color: BRAND.green, marginTop: 6 }}>Image loaded ✓</div>}
                </div>

                <div style={s.controlSection}>
                  <span style={{ ...s.sectionLabel, marginTop: 0 }}>Logo</span>
                  <label style={s.uploadLabel} htmlFor="logoImg">Upload logo (PNG with transparency)</label>
                  <input type="file" id="logoImg" accept="image/*" style={{ display: 'none' }} onChange={e => { handleFileUpload(e, img => { setLogoImg(img); setTimeout(drawCanvas, 50); }); }} />
                  {logoImg && <div style={{ fontSize: 12, color: BRAND.green, marginTop: 6 }}>Logo loaded ✓</div>}
                  <div style={s.row2}>
                    <span style={{ fontSize: 12, color: '#666' }}>Position</span>
                    {[['tr', 'Top right'], ['tl', 'Top left'], ['br', 'Bot right'], ['bl', 'Bot left']].map(([pos, label]) => (
                      <div key={pos} style={{ ...s.pill(logoPos === pos), padding: '4px 8px', fontSize: 11 }} onClick={() => { setLogoPos(pos); setTimeout(drawCanvas, 50); }}>{label}</div>
                    ))}
                  </div>
                  <div style={{ ...s.row2, marginTop: 8 }}>
                    <span style={{ fontSize: 12, color: '#666' }}>Size</span>
                    <input type="range" min="10" max="40" value={logoSize} style={{ flex: 1, accentColor: BRAND.green }} onChange={e => { setLogoSize(+e.target.value); setTimeout(drawCanvas, 50); }} />
                    <span style={{ fontSize: 12, color: '#666', minWidth: 28 }}>{logoSize}%</span>
                  </div>
                </div>

                <div style={s.controlSection}>
                  <span style={{ ...s.sectionLabel, marginTop: 0 }}>Text overlay</span>
                  <input style={{ ...s.input, marginBottom: 8 }} type="text" placeholder="e.g. New Arrival, 20% Off, Spring Sale" value={overlayText} onChange={e => { setOverlayText(e.target.value); setTimeout(drawCanvas, 50); }} />
                  <div style={s.row2}>
                    <span style={{ fontSize: 12, color: '#666' }}>Style</span>
                    {[['banner', 'Banner'], ['pill', 'Pill'], ['burst', 'Burst']].map(([style, label]) => (
                      <div key={style} style={{ ...s.pill(overlayStyle === style), padding: '4px 8px', fontSize: 11 }} onClick={() => { setOverlayStyle(style); setTimeout(drawCanvas, 50); }}>{label}</div>
                    ))}
                  </div>
                  <div style={s.row2}>
                    <span style={{ fontSize: 12, color: '#666' }}>Position</span>
                    {[['top', 'Top'], ['mid', 'Middle'], ['bot', 'Bottom']].map(([pos, label]) => (
                      <div key={pos} style={{ ...s.pill(overlayPos === pos), padding: '4px 8px', fontSize: 11 }} onClick={() => { setOverlayPos(pos); setTimeout(drawCanvas, 50); }}>{label}</div>
                    ))}
                  </div>
                  <div style={{ ...s.row2, marginTop: 8 }}>
                    <span style={{ fontSize: 12, color: '#666' }}>Bg</span>
                    <input type="color" value={overlayBg} style={{ width: 32, height: 28, padding: 2, border: '1px solid #e0e8d8', borderRadius: 6, cursor: 'pointer' }} onChange={e => { setOverlayBg(e.target.value); setTimeout(drawCanvas, 50); }} />
                    <span style={{ fontSize: 12, color: '#666' }}>Text</span>
                    <input type="color" value={overlayFg} style={{ width: 32, height: 28, padding: 2, border: '1px solid #e0e8d8', borderRadius: 6, cursor: 'pointer' }} onChange={e => { setOverlayFg(e.target.value); setTimeout(drawCanvas, 50); }} />
                  </div>
                </div>

                <div style={s.controlSection}>
                  <span style={{ ...s.sectionLabel, marginTop: 0 }}>Badge sticker</span>
                  <div style={s.badgeGrid}>
                    {[['', 'None'], ['new', 'NEW'], ['sale', 'SALE'], ['hot', 'HOT'], ['limited', 'LIMITED'], ['back', 'BACK IN STOCK']].map(([val, label]) => (
                      <div key={val} style={s.badgeOpt(selectedBadge === val)} onClick={() => { setSelectedBadge(val); setTimeout(drawCanvas, 50); }}>{label}</div>
                    ))}
                  </div>
                  <div style={s.row2}>
                    <span style={{ fontSize: 12, color: '#666' }}>Colour</span>
                    {[['green', 'Green', BRAND.green], ['pink', 'Pink', BRAND.pink], ['amber', 'Amber', '#d68910'], ['navy', 'Navy', '#1a3a5c']].map(([col, label, hex]) => (
                      <div key={col} style={{ ...s.pill(badgeColor === col), padding: '4px 8px', fontSize: 11, background: badgeColor === col ? hex : '#fff', borderColor: badgeColor === col ? hex : '#e0e8d8' }} onClick={() => { setBadgeColor(col); setTimeout(drawCanvas, 50); }}>{label}</div>
                    ))}
                  </div>
                </div>

                <div style={s.controlSection}>
                  <span style={{ ...s.sectionLabel, marginTop: 0 }}>Name bar</span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {[['bottom', 'Bottom'], ['top', 'Top'], ['minimal', 'Minimal'], ['none', 'None']].map(([style, label]) => (
                      <div key={style} style={s.pill(barStyle === style)} onClick={() => { setBarStyle(style); setTimeout(drawCanvas, 50); }}>{label}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
