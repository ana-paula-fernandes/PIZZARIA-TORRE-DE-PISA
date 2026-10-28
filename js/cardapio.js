gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({ lerp:0.1, smoothWheel:true, duration:1.1 });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time)=>{ lenis.raf(time*1000); });
gsap.ticker.lagSmoothing(0);

document.querySelector('.nav-toggle').addEventListener('click', ()=>{
  document.querySelector('.main-nav').classList.toggle('open');
});

/* ======================================================
   IMAGENS LOCAIS DISPONÍVEIS -> usadas quando o nome do
   item da planilha bate com um destes pratos fotografados.
   Itens sem foto correspondente mostram um ícone.
====================================================== */
const IMG_MAP_PIZZA = {
  'chocolate branco':'imgs/pizza-chocolate-brancoepreto.jpg',
  'frango com catupiry':'imgs/pizza-frango-catupiry.jpg',
  'carne seca com catupiry':'imgs/pizza-carneseca-catupiry.jpg',
  'camarao com catupiry':'imgs/pizza-camarao-catupiry.jpg',
  'bacon com ovos':'imgs/pizza-bacon-ovos.jpg',
  'quatro queijos':'imgs/pizza-quatro-queijos.jpg',
  'nutella com morango':'imgs/pizza-nutella-morango.jpg',
  'banana nevada':'imgs/pizza-banana-nevada.jpg',
  'mucarela':'imgs/pizza-mussarela.jpg', 'mussarela':'imgs/pizza-mussarela.jpg',
  'calabresa':'imgs/pizza-calabresa.jpg',
  'marguerita':'imgs/pizza-marguerita.jpg', 'margherita':'imgs/pizza-marguerita.jpg',
  'portuguesa':'imgs/pizza-portuguesa.jpg',
  'napolitana':'imgs/pizza-napolitana.jpg',
  'atum':'imgs/pizza-atum.jpg',
  'pepperoni':'imgs/pizza-pepperoni.jpg',
  'catupperoni':'imgs/pizza-catupperoni.jpg',
  'salame':'imgs/pizza-salame.jpg',
  'alho':'imgs/pizza-alho.jpg',
  'beijinho':'imgs/pizza-beijinho.jpg',
  'brigadeiro':'imgs/pizza-brigadeiro.jpg',
  'chocolate':'imgs/pizza-chocolate.jpg'
};
const IMG_MAP_PASTEL = {
  'frango com queijo':'imgs/pastel-frangoqueijo.jpg',
  'frango com catupiry':'imgs/pastel-frango-catupiry.jpg',
  'carne com queijo':'imgs/pastel-carnequeijo.jpg',
  'camarao':'imgs/pastel-camarao.jpg',
  'carne':'imgs/pastel-carne.jpg',
  'frango':'imgs/pastel-frango.jpg',
  'pizza':'imgs/pastel-pizza.jpg'
};
const IMG_MAP_MASSA = {
  'canelone de ricota com espinafre':'imgs/canelone-ricota-espinafre.jpg',
  'ravioli de frango':'imgs/ravioli-frango.jpg',
  'ravioli de quatro queijos':'imgs/ravioli-quatro-queijos.jpg',
  'raviolo de quatro queijos':'imgs/ravioli-quatro-queijos.jpg',
  'rondelli de presunto com queijo':'imgs/rondelli-presunto-queijo.jpg',
  'fettuccine':'imgs/macarrao-fettuccine.jpg',
  'espaguete':'imgs/macarrao-espaguete.jpg',
  'talharim':'imgs/macarrao-talharim.jpg',
  'lasanha':'imgs/lasanha.jpg',
  'nhoque':'imgs/nhoque.jpg'
};
const MOLHO_IMG_MAP = {
  'sugo':'imgs/macarrao-sugo.jpg', 'ao sugo':'imgs/macarrao-sugo.jpg',
  'branco':'imgs/macarrao-branco.jpg',
  'bolonhesa':'imgs/macarrao-bolonhesa.jpg', 'a bolonhesa':'imgs/macarrao-bolonhesa.jpg',
  '4 queijos':'imgs/macarrao-4queijos.jpg', 'quatro queijos':'imgs/macarrao-4queijos.jpg',
  'de camarao':'imgs/molho-camarao.jpg', 'camarao':'imgs/molho-camarao.jpg'
};
/* Fotos da vitrine de molhos, achadas pelo nome vindo da planilha (sem acento/maiúsculas) */
const MOLHO_SHOWCASE_IMG = {
  'ao sugo':'imgs/molho-aosugo.jpg', 'sugo':'imgs/molho-aosugo.jpg',
  'branco':'imgs/molho-branco.jpg',
  'a bolonhesa':'imgs/molho-bolonhesa.jpg', 'bolonhesa':'imgs/molho-bolonhesa.jpg',
  'quatro queijos':'imgs/molho-quatro-queijos.jpg', '4 queijos':'imgs/molho-quatro-queijos.jpg',
  'de camarao':'imgs/molho-camarao.jpg', 'camarao':'imgs/molho-camarao.jpg'
};
/* Usada só se a planilha não trouxer a lista de molhos */
const MOLHOS_PADRAO = ['Molho ao Sugo','Molho Quatro Queijos','Molho Branco','Molho de Camarão','Molho à Bolonhesa'];
const CAT_ICON = { pizza:'fa-pizza-slice', pastel:'fa-drumstick-bite', massa:'fa-bowl-food' };

function slugify(str){
  return (str||'').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().trim().replace(/\s+/g,' ');
}
function normalize(str){ return slugify(str); }
function cleanMolhoName(raw){
  const s = (raw||'').replace(/^molho\s+/i, '').trim();
  if (!s) return raw;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function fmtPreco(v){
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d,.-]/g,'').replace(',','.'));
  return isNaN(n) ? '--' : n.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
}
function priceNumber(v){
  return typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d,.-]/g,'').replace(',','.'));
}

/* ======================================================
   PARSER DO CSV DO GOOGLE SHEETS
   Lê o cardápio em blocos: quando encontra o cabeçalho de
   uma categoria (ex. "PIZZAS SALGADAS"), a linha seguinte é
   tratada como o cabeçalho de tamanhos (ex. 30cm,35cm,45cm),
   e as linhas seguintes até a próxima categoria/linha vazia
   são os itens com seus preços em cada coluna de tamanho.
====================================================== */
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSrjdysxws4Mqxgpj3my-NCEW_RmUJmj1ZNE0kc9zGZ0MDbpLsHfEEmKR8t67-pi1M0qm18mdvdq1gq/pub?output=csv";

function parseCSVText(text){
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i=0; i<text.length; i++){
    const c = text[i], next = text[i+1];
    if (inQuotes){
      if (c === '"' && next === '"'){ field += '"'; i++; }
      else if (c === '"'){ inQuotes = false; }
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ','){ row.push(field); field=''; }
      else if (c === '\n'){ row.push(field); rows.push(row); row=[]; field=''; }
      else if (c === '\r'){ /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length){ row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => c && c.trim() !== ''));
}

const SECTION_MATCHERS = [
  { key:'pizzas_salgadas', test:/pizzas?\s+salgadas?/ },
  { key:'pizzas_doces',    test:/pizzas?\s+doces?/ },
  { key:'pasteis_trad',    test:/pasteis?\s+tradicionai?s?/ },
  { key:'pasteis_esp',     test:/pasteis?\s+especiais?/ },
  { key:'pasteis',         test:/^pasteis?$/ },
  { key:'massas_esp',      test:/massas?\s+especiais?/ },
  { key:'massas',          test:/massas?\s+italianas?/ },
  { key:'molhos',          test:/escolha\s+seu\s+molho/ }
];

function looksLikeSizeHeader(cells){
  const nonEmpty = cells.filter(c=>c && c.trim()!=='');
  if (!nonEmpty.length) return false;
  return nonEmpty.every(c => /\d+\s*cm/i.test(c));
}

function parseMenuFromRows(rows){
  const data = { pizzas_salgadas:{sizes:[],items:[]}, pizzas_doces:{sizes:[],items:[]},
                 pasteis:{tradicionais:[],especiais:[]}, massas:{items:[],molhos:[],molhosFull:[]} };
  let section = null, sizeHeaders = [], pastelBucket = 'tradicionais';

  rows.forEach(r=>{
    const first = (r[0]||'').trim();
    const normFirst = normalize(first);
    const matched = SECTION_MATCHERS.find(m => m.test.test(normFirst));

    if (matched){
      // subheaders that don't change the active top-level section
      if (matched.key === 'pasteis_esp'){ pastelBucket = 'especiais'; return; }
      if (matched.key === 'pasteis_trad'){ pastelBucket = 'tradicionais'; return; }
      if (matched.key === 'massas_esp'){ return; }

      section = matched.key;
      sizeHeaders = [];
      if (matched.key === 'pasteis') pastelBucket = 'tradicionais';

      // real sheets often put "PIZZAS SALGADAS,30cm,35cm,45cm" on ONE row
      if (matched.key === 'pizzas_salgadas' || matched.key === 'pizzas_doces'){
        const rest = r.slice(1);
        if (looksLikeSizeHeader(rest)){
          sizeHeaders = rest.filter(c=>c && c.trim()!=='').map(c=>c.trim());
          data[matched.key].sizes = sizeHeaders;
        }
      }
      return;
    }
    if (!section) return;

    if (section === 'pizzas_salgadas' || section === 'pizzas_doces'){
      if (!sizeHeaders.length){
        if (looksLikeSizeHeader(r.slice(1))){
          sizeHeaders = r.slice(1).filter(c=>c && c.trim()!=='').map(c=>c.trim());
          data[section].sizes = sizeHeaders;
        }
        return;
      }
      if (!first) return;
      const precos = {};
      sizeHeaders.forEach((sz, i)=>{ if (r[i+1] !== undefined && r[i+1] !== '') precos[sz] = priceNumber(r[i+1]); });
      if (Object.keys(precos).length) data[section].items.push({ nome:first, precos });
      return;
    }

    if (section === 'pasteis'){
      if (!first || r[1] === undefined || r[1] === '') return;
      data.pasteis[pastelBucket].push({ nome:first, preco:priceNumber(r[1]) });
      return;
    }

    if (section === 'massas'){
      if (!first || r[1] === undefined || r[1] === '') return;
      data.massas.items.push({ nome:first, preco:priceNumber(r[1]) });
      return;
    }

    if (section === 'molhos'){
      if (!first) return;
      data.massas.molhosFull.push(first);
      data.massas.molhos.push(cleanMolhoName(first));
      return;
    }
  });

  const hasContent = data.pizzas_salgadas.items.length || data.pizzas_doces.items.length ||
                      data.pasteis.tradicionais.length || data.pasteis.especiais.length ||
                      data.massas.items.length;
  return hasContent ? data : null;
}

/* ======================================================
   FALLBACK — usado se o fetch da planilha falhar
====================================================== */
const FALLBACK_DATA = {
  pizzas_salgadas: {
    sizes:['30cm','35cm','45cm'],
    items:[
      { nome:'Muçarela', precos:{'30cm':42,'35cm':52,'45cm':64} },
      { nome:'Calabresa', precos:{'30cm':46,'35cm':56,'45cm':68} },
      { nome:'Marguerita', precos:{'30cm':48,'35cm':58,'45cm':70} },
      { nome:'Frango com Catupiry', precos:{'30cm':48,'35cm':58,'45cm':70} },
      { nome:'Portuguesa', precos:{'30cm':50,'35cm':60,'45cm':72} },
      { nome:'Quatro Queijos', precos:{'30cm':50,'35cm':60,'45cm':72} }
    ]
  },
  pizzas_doces: {
    sizes:['25cm','30cm'],
    items:[
      { nome:'Chocolate', precos:{'25cm':40,'30cm':50} },
      { nome:'Chocolate com Morango', precos:{'25cm':44,'30cm':54} },
      { nome:'Banana com Canela', precos:{'25cm':40,'30cm':50} }
    ]
  },
  pasteis: {
    tradicionais:[
      { nome:'Carne', preco:14 }, { nome:'Frango', preco:14 }, { nome:'Queijo', preco:13 }
    ],
    especiais:[
      { nome:'Carne com Queijo', preco:17 }, { nome:'Camarão', preco:19 }, { nome:'Frango com Catupiry', preco:17 }
    ]
  },
  massas: {
    items:[ { nome:'Espaguete', preco:38 }, { nome:'Fettuccine', preco:42 }, { nome:'Nhoque', preco:40 } ],
    molhos:['Ao Sugo','Quatro Queijos','Branco','De Camarão','À Bolonhesa'],
    molhosFull:MOLHOS_PADRAO
  }
};

/* ======================================================
   RENDERIZAÇÃO
====================================================== */
function resolveImg(nome, imgMap){
  const slug = slugify(nome);
  for (const key in imgMap){ if (slug.includes(key)) return imgMap[key]; }
  return null;
}

function imgOrIconHTML(nome, iconClass, imgMap){
  const src = resolveImg(nome, imgMap);
  return src ? `<img src="${src}" alt="${nome}">` : `<i class="fa-solid ${iconClass}"></i>`;
}

function buildImgWrap(nome, iconClass, imgMap){
  return `<div class="img-wrap">${imgOrIconHTML(nome, iconClass, imgMap)}</div>`;
}

function starsHTML(){
  return `<div class="stars">${'<i class="fa-solid fa-star"></i>'.repeat(5)}</div>`;
}

/* ======================================================
   CARRINHO (em memória — não persiste ao recarregar a página)
====================================================== */
const cart = [];

function addToCart({ key, nome, detalhe, preco }){
  const existing = cart.find(i => i.key === key);
  if (existing) existing.qty += 1;
  else cart.push({ key, nome, detalhe, preco, qty:1 });
  renderCart();
  const toggle = document.getElementById('cartToggle');
  toggle.classList.remove('bump');
  void toggle.offsetWidth;   /* reinicia a animação */
  toggle.classList.add('bump');
}

/* feedback no próprio botão do card */
function flashAdded(btn){
  const original = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-check"></i> Adicionado';
  btn.classList.add('added');
  setTimeout(()=>{ btn.innerHTML = original; btn.classList.remove('added'); }, 1100);
}

function changeQty(key, delta){
  const item = cart.find(i => i.key === key);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart.splice(cart.indexOf(item), 1);
  renderCart();
}

function cartTotal(){
  return cart.reduce((sum, i) => sum + i.preco * i.qty, 0);
}

function renderCart(){
  const itemsEl = document.getElementById('cartItems');
  const countEl = document.getElementById('cartCount');
  const totalEl = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('cartCheckout');

  const totalQty = cart.reduce((s,i)=>s+i.qty, 0);
  countEl.textContent = totalQty;
  countEl.style.display = totalQty ? 'flex' : 'none';

  if (!cart.length){
    itemsEl.innerHTML = `<p class="cart-empty">Seu carrinho está vazio.</p>`;
  } else {
    itemsEl.innerHTML = cart.map(i => `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-nome">${i.nome}</div>
          ${i.detalhe ? `<div class="cart-item-detalhe">${i.detalhe}</div>` : ''}
          <div class="cart-item-preco">${fmtPreco(i.preco)} cada</div>
        </div>
        <div class="cart-item-qty">
          <button class="qty-btn" data-key="${i.key}" data-delta="-1">−</button>
          <span class="qty-value">${i.qty}</span>
          <button class="qty-btn" data-key="${i.key}" data-delta="1">+</button>
        </div>
      </div>
    `).join('');
    itemsEl.querySelectorAll('.qty-btn').forEach(btn=>{
      btn.addEventListener('click', ()=> changeQty(btn.dataset.key, Number(btn.dataset.delta)));
    });
  }

  totalEl.textContent = fmtPreco(cartTotal());
  if (cart.length){
    const linhas = cart.map(i => `${i.qty}x ${i.nome}${i.detalhe ? ' ('+i.detalhe+')' : ''} - ${fmtPreco(i.preco * i.qty)}`).join('\n');
    const msg = encodeURIComponent(`Olá! Gostaria de fazer o seguinte pedido:\n\n${linhas}\n\nTotal: ${fmtPreco(cartTotal())}`);
    checkoutBtn.href = `https://api.whatsapp.com/send?phone=5521966553698&text=${msg}`;
    checkoutBtn.classList.remove('disabled');
  } else {
    checkoutBtn.href = '#';
    checkoutBtn.classList.add('disabled');
  }
}

function openCart(){
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
}
function closeCart(){
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
}
document.getElementById('cartToggle').addEventListener('click', openCart);
document.getElementById('cartClose').addEventListener('click', closeCart);
document.getElementById('cartOverlay').addEventListener('click', closeCart);
renderCart();

/* ======================================================
   PIZZA MEIO A MEIO (mesma categoria; vale o preço maior)
====================================================== */
const halfModal = document.createElement('div');
halfModal.className = 'half-modal';
halfModal.innerHTML = `
  <div class="half-backdrop"></div>
  <div class="half-box" role="dialog" aria-modal="true" aria-label="Pizza meio a meio">
    <button class="half-close" type="button" aria-label="Fechar"><i class="fa-solid fa-xmark"></i></button>
    <h3>Pizza Meio a Meio</h3>
    <p class="half-sub">Escolha dois sabores. Você paga o valor do sabor mais caro.</p>
    <label>Tamanho<div class="half-sizes"></div></label>
    <label>1ª metade<select class="half-a"></select></label>
    <label>2ª metade<select class="half-b"></select></label>
    <div class="half-resumo"></div>
    <div class="half-total"></div>
    <button class="add-btn half-add" type="button"><i class="fa-solid fa-cart-plus"></i> Adicionar ao Carrinho</button>
  </div>`;
document.body.appendChild(halfModal);
const halfState = { group:null, size:null };
const hSel = c => halfModal.querySelector(c);

function halfAvailableSizes(){
  return halfState.group.sizes.filter(sz => halfState.group.items.some(i => i.precos[sz] !== undefined));
}
function halfPrices(){
  const g = halfState.group, sz = halfState.size;
  const a = g.items.find(i => i.nome === hSel('.half-a').value);
  const b = g.items.find(i => i.nome === hSel('.half-b').value);
  return { a, b, pa: a && a.precos[sz], pb: b && b.precos[sz] };
}
function halfRefresh(){
  const { a, b, pa, pb } = halfPrices();
  const addBtn = hSel('.half-add');
  if (pa === undefined || pb === undefined){
    hSel('.half-resumo').textContent = 'Um dos sabores não está disponível neste tamanho.';
    hSel('.half-total').textContent = '';
    addBtn.disabled = true; return;
  }
  addBtn.disabled = false;
  const preco = Math.max(pa, pb);
  hSel('.half-resumo').textContent = a.nome === b.nome
    ? `${a.nome} inteira (${halfState.size})`
    : `½ ${a.nome} (${fmtPreco(pa)}) + ½ ${b.nome} (${fmtPreco(pb)})`;
  hSel('.half-total').textContent = fmtPreco(preco);
}
function halfRenderSizes(){
  const box = hSel('.half-sizes');
  box.innerHTML = halfAvailableSizes().map(sz => `<button type="button" class="size-btn${sz===halfState.size?' active':''}" data-size="${sz}">${sz}</button>`).join('');
  box.querySelectorAll('.size-btn').forEach(b => b.addEventListener('click', ()=>{
    halfState.size = b.dataset.size; halfRenderSizes(); halfRefresh();
  }));
}
function openHalfModal(group, nomeA, size){
  halfState.group = group;
  halfState.size = halfAvailableSizes().includes(size) ? size : halfAvailableSizes()[0];
  const opts = group.items.map(i => `<option value="${i.nome}">${i.nome}</option>`).join('');
  const selA = hSel('.half-a'), selB = hSel('.half-b');
  selA.innerHTML = opts; selB.innerHTML = opts;
  selA.value = nomeA;
  const other = group.items.find(i => i.nome !== nomeA);
  selB.value = other ? other.nome : nomeA;
  halfRenderSizes(); halfRefresh();
  halfModal.classList.add('open');
}
function closeHalfModal(){ halfModal.classList.remove('open'); }
hSel('.half-a').addEventListener('change', halfRefresh);
hSel('.half-b').addEventListener('change', halfRefresh);
hSel('.half-close').addEventListener('click', closeHalfModal);
hSel('.half-backdrop').addEventListener('click', closeHalfModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeHalfModal(); });
hSel('.half-add').addEventListener('click', ()=>{
  const { a, b, pa, pb } = halfPrices();
  if (!a || !b || pa === undefined || pb === undefined) return;
  const sz = halfState.size, preco = Math.max(pa, pb);
  if (a.nome === b.nome){
    addToCart({ key: a.nome+'|'+sz, nome: a.nome, detalhe: sz, preco: pa });
  } else {
    const [n1, n2] = [a.nome, b.nome].sort((x,y)=>x.localeCompare(y,'pt'));
    addToCart({ key: `meio|${n1}|${n2}|${sz}`, nome: `Pizza Meio a Meio: ½ ${n1} + ½ ${n2}`, detalhe: sz, preco });
  }
  closeHalfModal();
});

function renderSizedCard(item, sizes, iconClass, group){
  const firstSize = sizes.find(s => item.precos[s] !== undefined) || sizes[0];
  const card = document.createElement('div');
  card.className = 'prod-card';
  card.innerHTML = `
    ${buildImgWrap(item.nome, iconClass, IMG_MAP_PIZZA)}
    <div class="nome">${item.nome}</div>
    ${starsHTML()}
    <div class="size-selector">
      ${sizes.filter(s=>item.precos[s]!==undefined).map((s,i)=>`<button class="size-btn${i===0?' active':''}" data-size="${s}">${s}</button>`).join('')}
    </div>
    <div class="preco">${fmtPreco(item.precos[firstSize])}</div>
    <button class="add-btn"><i class="fa-solid fa-cart-plus"></i> Adicionar ao Carrinho</button>
    <button class="half-btn" type="button"><i class="fa-solid fa-circle-half-stroke"></i> Meio a meio</button>
  `;
  let currentSize = firstSize;
  const precoEl = card.querySelector('.preco');
  const addBtn = card.querySelector('.add-btn');
  card.querySelectorAll('.size-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      card.querySelectorAll('.size-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentSize = btn.dataset.size;
      precoEl.textContent = fmtPreco(item.precos[currentSize]);
    });
  });
  addBtn.addEventListener('click', ()=>{
    addToCart({ key: item.nome+'|'+currentSize, nome: item.nome, detalhe: currentSize, preco: item.precos[currentSize] });
    flashAdded(addBtn);
  });
  card.querySelector('.half-btn').addEventListener('click', ()=>{
    if (group) openHalfModal(group, item.nome, currentSize);
  });
  return card;
}

function renderSimpleCard(item, iconClass){
  const card = document.createElement('div');
  card.className = 'prod-card';
  card.innerHTML = `
    ${buildImgWrap(item.nome, iconClass, IMG_MAP_PASTEL)}
    <div class="nome">${item.nome}</div>
    ${starsHTML()}
    <div class="preco">${fmtPreco(item.preco)}</div>
    <button class="add-btn"><i class="fa-solid fa-cart-plus"></i> Adicionar ao Carrinho</button>
  `;
  const simpleBtn = card.querySelector('.add-btn');
  simpleBtn.addEventListener('click', ()=>{
    addToCart({ key: item.nome, nome: item.nome, detalhe: '', preco: item.preco });
    flashAdded(simpleBtn);
  });
  return card;
}

function renderMassaCard(item, molhos){
  const card = document.createElement('div');
  card.className = 'prod-card';
  const imgWrapId = 'mimg-' + Math.random().toString(36).slice(2,8);
  card.innerHTML = `
    <div class="img-wrap" id="${imgWrapId}">${imgOrIconHTML(item.nome, CAT_ICON.massa, IMG_MAP_MASSA)}</div>
    <div class="nome">${item.nome}</div>
    ${starsHTML()}
    <div class="molho-block">
      <div class="molho-label">Escolha seu molho</div>
      <div class="molho-selector">
        ${molhos.map(m=>`<button class="molho-btn" data-molho="${m}">${m}</button>`).join('')}
      </div>
    </div>
    <div class="preco">${fmtPreco(item.preco)}</div>
    <button class="add-btn"><i class="fa-solid fa-cart-plus"></i> Adicionar ao Carrinho</button>
  `;
  const imgWrap = card.querySelector('#'+imgWrapId);
  const addBtn = card.querySelector('.add-btn');
  let currentMolho = null;
  function applyMolho(nome){
    currentMolho = nome;
    const src = MOLHO_IMG_MAP[slugify(nome)];
    imgWrap.innerHTML = src ? `<img src="${src}" alt="${item.nome} ao molho ${nome}">` : `<i class="fa-solid fa-bowl-food"></i>`;
  }
  card.querySelectorAll('.molho-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      card.querySelectorAll('.molho-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      applyMolho(btn.dataset.molho);
    });
  });
  addBtn.addEventListener('click', ()=>{
    const detalhe = currentMolho ? 'molho ' + currentMolho : '';
    addToCart({ key: item.nome+'|'+(currentMolho||'sem-molho'), nome: item.nome, detalhe, preco: item.preco });
    flashAdded(addBtn);
  });
  return card;
}

function renderMolhoShowcase(nomes){
  const grid = document.createElement('div');
  grid.className = 'molho-showcase-grid';
  nomes.forEach(nome=>{
    const src = MOLHO_SHOWCASE_IMG[slugify(cleanMolhoName(nome))];
    const card = document.createElement('div');
    card.className = 'molho-card';
    card.innerHTML = `
      <div class="img-wrap">${src ? `<img src="${src}" alt="${nome}">` : `<i class="fa-solid fa-bowl-food"></i>`}</div>
      <div class="nome">${nome}</div>
    `;
    grid.appendChild(card);
  });
  return grid;
}

function sectionBlock(title, sub, centered){
  const sec = document.createElement('section');
  sec.className = 'menu-section';
  sec.innerHTML = `<h2 class="cat-title">${title}</h2>${sub ? `<p class="cat-sub">${sub}</p>` : ''}<div class="prod-grid${centered ? ' centered-grid' : ''}"></div>`;
  return sec;
}

function renderMenu(data){
  const root = document.getElementById('menu-root');
  root.innerHTML = '';

  if (data.pizzas_salgadas.items.length){
    const sec = sectionBlock('Pizzas Salgadas');
    const grid = sec.querySelector('.prod-grid');
    data.pizzas_salgadas.items.forEach(it => grid.appendChild(renderSizedCard(it, data.pizzas_salgadas.sizes, CAT_ICON.pizza, data.pizzas_salgadas)));
    root.appendChild(sec);
  }
  if (data.pizzas_doces.items.length){
    const sec = sectionBlock('Pizzas Doces');
    const grid = sec.querySelector('.prod-grid');
    data.pizzas_doces.items.forEach(it => grid.appendChild(renderSizedCard(it, data.pizzas_doces.sizes, CAT_ICON.pizza, data.pizzas_doces)));
    root.appendChild(sec);
  }
  if (data.pasteis.tradicionais.length){
    const sec = sectionBlock('Pastéis Tradicionais');
    const grid = sec.querySelector('.prod-grid');
    data.pasteis.tradicionais.forEach(it => grid.appendChild(renderSimpleCard(it, CAT_ICON.pastel)));
    root.appendChild(sec);
  }
  if (data.pasteis.especiais.length){
    const sec = sectionBlock('Pastéis Especiais', null, true);
    const grid = sec.querySelector('.prod-grid');
    data.pasteis.especiais.forEach(it => grid.appendChild(renderSimpleCard(it, CAT_ICON.pastel)));
    root.appendChild(sec);
  }
  if (data.massas.items.length){
    const molhosFull = (data.massas.molhosFull && data.massas.molhosFull.length) ? data.massas.molhosFull : MOLHOS_PADRAO;
    const molhos = data.massas.molhos.length ? data.massas.molhos : molhosFull.map(cleanMolhoName);
    const sec = sectionBlock('Massas Italianas', 'Escolha seu molho em cada prato');
    sec.querySelector('.prod-grid').before(renderMolhoShowcase(molhosFull));
    const grid = sec.querySelector('.prod-grid');
    data.massas.items.forEach(it => grid.appendChild(renderMassaCard(it, molhos)));
    root.appendChild(sec);
  }

  gsap.utils.toArray('.prod-card').forEach((card, i)=>{
    gsap.to(card, {
      opacity:1, y:0, duration:.6, ease:"power2.out",
      scrollTrigger:{ trigger:card, start:"top 90%" },
      delay:(i%3)*0.06
    });
  });

  gsap.utils.toArray('.molho-card').forEach((card, i)=>{
    gsap.to(card, {
      opacity:1, y:0, duration:.6, ease:"power2.out",
      scrollTrigger:{ trigger:card, start:"top 92%" },
      delay:(i%5)*0.07
    });
  });
}

/* ---------- BANNER DE 3 IMAGENS: SOBEM UMA APOS A OUTRA ---------- */
gsap.to('.banner-img-card', {
  opacity:1, y:0, duration:.8, ease:"power2.out", stagger:.18,
  scrollTrigger:{ trigger:'.cardapio-banner', start:"top 85%" }
});

/* ======================================================
   CARREGAMENTO: tenta a planilha real, cai no fallback
====================================================== */
fetch(CSV_URL + '&_=' + Date.now(), { cache:'no-store' })
  .then(res => { if (!res.ok) throw new Error('CSV indisponível'); return res.text(); })
  .then(text => {
    const rows = parseCSVText(text);
    const parsed = parseMenuFromRows(rows);
    renderMenu(parsed || FALLBACK_DATA);
  })
  .catch(() => { renderMenu(FALLBACK_DATA); });
