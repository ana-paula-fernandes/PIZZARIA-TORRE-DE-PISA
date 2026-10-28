gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

/* ---------- LENIS SMOOTH SCROLL ---------- */
const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, duration: 1.1 });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => {
	lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

/* ---------- MOBILE NAV ---------- */
const navToggle = document.querySelector(".nav-toggle");
const mainNav = document.querySelector(".main-nav");
navToggle.addEventListener("click", () => mainNav.classList.toggle("open"));

/* ---------- SMOOTH SCROLL LINKS (via Lenis) ---------- */
document.querySelectorAll("[data-scroll]").forEach((link) => {
	link.addEventListener("click", (e) => {
		e.preventDefault();
		mainNav.classList.remove("open");
		const target = link.getAttribute("data-scroll");
		lenis.scrollTo(target, {
			duration: 1.3,
			easing: (t) => 1 - Math.pow(1 - t, 3),
		});
	});
});

/* ---------- HERO ENTRANCE ---------- */
const heroTl = gsap.timeline({ delay: 0.3 });
heroTl
	.to(".hero-left h1", { x: 0, opacity: 1, duration: 0.9, ease: "power3.out" })
	.to(
		".hero-left p.destaque",
		{ x: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
		"-=.55"
	)
	.to(
		".hero-cta",
		{ x: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
		"-=.5"
	);

/* ---------- HEADER VISIBLE ONLY DURING HERO SCROLL ---------- */
const siteHeader = document.querySelector(".site-header");
ScrollTrigger.create({
	trigger: ".hero-scrub-container",
	start: "top top",
	end: "bottom top",
	onLeave: () => siteHeader.classList.add("is-hidden"),
	onEnterBack: () => siteHeader.classList.remove("is-hidden"),
});

/* ---------- HERO VIDEO SCRUB WITH INERTIA ---------- */
const heroVideo = document.getElementById("heroVideo");
let scrubTarget = 0;
let scrubCurrent = 0;
let videoReady = false;

heroVideo.addEventListener("loadedmetadata", () => {
	videoReady = true;
	heroVideo.currentTime = 0;
});

ScrollTrigger.create({
	trigger: ".hero-scrub-container",
	start: "top top",
	end: "bottom bottom",
	scrub: 1.5,
	onUpdate: (self) => {
		if (videoReady && heroVideo.duration) {
			scrubTarget = self.progress * heroVideo.duration;
		}
	},
});

gsap.ticker.add(() => {
	if (!videoReady) return;
	scrubCurrent += (scrubTarget - scrubCurrent) * 0.15;
	if (Math.abs(scrubCurrent - heroVideo.currentTime) > 0.015) {
		heroVideo.currentTime = scrubCurrent;
	}
});

/* ---------- FAVORITOS: DADOS ---------- */
const flavorsData = {
	macarrao: [
		{
			nome: "Ao sugo",
			ingredientes: "Molho de tomate, manjericão fresco, parmesão",
			descricao: "Clássico italiano, simples e cheio de sabor.",
			imagem: "imgs/macarrao-sugo.jpg",
		},
		{
			nome: "Quatro queijos",
			ingredientes: "Muçarela, provolone, gorgonzola, parmesão",
			descricao: "Cremoso e envolvente, para quem ama queijo.",
			imagem: "imgs/macarrao-4queijos.jpg",
		},
		{
			nome: "Branco",
			ingredientes: "Molho branco, manteiga, ervas finas",
			descricao: "Suave e aveludado, um clássico atemporal.",
			imagem: "imgs/macarrao-branco.jpg",
		},
		{
			nome: "À bolonhesa",
			ingredientes: "Molho de carne moída, tomate, ervas",
			descricao: "Encorpado e reconfortante, tradição italiana.",
			imagem: "imgs/macarrao-bolonhesa.jpg",
		},
	],
	pizza: [
		{
			nome: "Muçarela",
			ingredientes: "Molho de tomate, muçarela, orégano",
			descricao: "O clássico que nunca sai de moda.",
			imagem: "imgs/pizza-mussarela.jpg",
		},
		{
			nome: "Calabresa",
			ingredientes: "Molho de tomate, muçarela, calabresa fatiada, cebola",
			descricao: "Sabor marcante e irresistível.",
			imagem: "imgs/pizza-calabresa.jpg",
		},
		{
			nome: "Marguerita",
			ingredientes: "Molho de tomate, muçarela, muçarela de búfala, manjericão",
			descricao: "Simplicidade italiana em cada fatia.",
			imagem: "imgs/pizza-marguerita.jpg",
		},
		{
			nome: "Chocolate",
			ingredientes: "Chocolate ao leite",
			descricao: "Doce surpresa pra fechar a noite.",
			imagem: "imgs/pizza-chocolate.jpg",
		},
	],
	pastel: [
		{
			nome: "Frango com queijo",
			ingredientes: "Frango desfiado temperado, muçarela",
			descricao: "Crocante por fora, cremoso por dentro.",
			imagem: "imgs/pastel-frangoqueijo.jpg",
		},
		{
			nome: "Carne",
			ingredientes: "Carne moída temperada",
			descricao: "Simples, suculento e cheio de sabor.",
			imagem: "imgs/pastel-carne.jpg",
		},
		{
			nome: "Camarão",
			ingredientes: "Camarão ao molho",
			descricao: "Sofisticado e cheio de personalidade.",
			imagem: "imgs/pastel-camarao.jpg",
		},
		{
			nome: "Carne com queijo",
			ingredientes: "Carne moída temperada, muçarela",
			descricao: "Combinação clássica dos botecos italianos.",
			imagem: "imgs/pastel-carnequeijo.jpg",
		},
	],
};
/* Arco concêntrico ao prato (270px => raio 135). Ângulos por coluna. */
const PLATE_RADIUS = 135;
const ARC_RADIUS = PLATE_RADIUS + 11;
const arcAnglesByCol = {
	macarrao: [-80, -27, 27, 80],
	pizza: [-80, -27, 27, 80],
	pastel: [-80, -23, 23, 80] /* Carne e Camarão um pouco mais juntos */,
};

/* ---------- helper: texto curvado caractere a caractere ---------- */
function buildArcLabel(
	wrapEl,
	text,
	baseAngle,
	radius,
	index,
	groupsArr,
	onClick
) {
	const chars = text.split("");
	const n = chars.length;
	const step = Math.min(4.2, 46 / n);
	let angle = baseAngle - (step * (n - 1)) / 2;
	const group = [];
	chars.forEach((ch) => {
		const span = document.createElement("span");
		span.className = "arc-label-char";
		span.textContent = ch === " " ? "\u00A0" : ch;
		const rad = (angle * Math.PI) / 180;
		const x = Math.sin(rad) * radius;
		const y = -Math.cos(rad) * radius + PLATE_RADIUS;
		span.style.left = `calc(50% + ${x}px)`;
		span.style.top = `${y}px`;
		span.style.transform = `translate(-50%,-50%) rotate(${angle}deg)`;
		span.addEventListener("click", onClick);
		wrapEl.appendChild(span);
		group.push(span);
		angle += step;
	});
	groupsArr[index] = group;
}

/* ---------- FAVORITOS: INICIALIZACAO POR COLUNA (INDEPENDENTE) ---------- */
function initFavColumn(colEl) {
	const key = colEl.dataset.col;
	const data = flavorsData[key];
	let index = 0;
	let animating = false;

	const nomeEl = colEl.querySelector(".nome");
	const ingEl = colEl.querySelector(".ingredientes");
	const descEl = colEl.querySelector(".descricao");
	const imgEl = colEl.querySelector(".fav-plate-frame img");
	const arcWrap = colEl.querySelector(".fav-arc-wrap");
	const arrowLeft = colEl.querySelector(".fav-arrow.left");
	const arrowRight = colEl.querySelector(".fav-arrow.right");
	const groups = [];

	data.forEach((item, i) => {
		buildArcLabel(
			arcWrap,
			item.nome,
			arcAnglesByCol[key][i],
			ARC_RADIUS,
			i,
			groups,
			() => goTo(i)
		);
	});

	function setActive() {
		groups.forEach((g, i) => {
			g.forEach((span) => span.classList.toggle("active", i === index));
		});
	}

	function render() {
		const item = data[index];
		nomeEl.textContent = item.nome;
		ingEl.textContent = item.ingredientes;
		descEl.textContent = item.descricao;
		imgEl.src = item.imagem;
		imgEl.alt = item.nome;
		setActive();
	}

	function goTo(newIndex) {
		if (animating || newIndex === index) return;
		animating = true;
		index = newIndex;

		const tl = gsap.timeline({
			onComplete: () => {
				animating = false;
				gsap.set(imgEl, { rotation: 0 });
			},
		});
		tl.to(imgEl, { rotation: 180, duration: 0.35, ease: "power1.in" }, 0)
			.to(
				[nomeEl, ingEl, descEl],
				{ opacity: 0, y: -10, duration: 0.25, ease: "power1.in" },
				0
			)
			.call(render)
			.to(imgEl, { rotation: 360, duration: 0.35, ease: "power1.out" })
			.fromTo(
				[nomeEl, ingEl, descEl],
				{ opacity: 0, y: 10 },
				{ opacity: 1, y: 0, duration: 0.35, ease: "power1.out" },
				"<"
			);
	}

	function shift(dir) {
		goTo((index + dir + data.length) % data.length);
	}

	arrowLeft.addEventListener("click", () => shift(-1));
	arrowRight.addEventListener("click", () => shift(1));

	render();
}

document.querySelectorAll(".fav-col").forEach(initFavColumn);

/* ---------- CHEF: SCROLLTRIGGER REVEAL ---------- */
gsap.to(".chef-facts p", {
	opacity: 1,
	y: 0,
	duration: 0.8,
	stagger: 0.22,
	ease: "power2.out",
	scrollTrigger: { trigger: ".chef-section", start: "top 65%" },
});

/* ---------- CHEF: CHAPEU ENTRANDO DA DIREITA PARA ESQUERDA ---------- */
gsap.fromTo(
	".chapeu-chef-deco",
	{ x: 180, opacity: 0, rotate: 25 },
	{
		x: 0,
		opacity: 0.2,
		rotate: -10,
		duration: 1.1,
		ease: "power2.out",
		scrollTrigger: { trigger: ".chef-section", start: "top 75%" },
	}
);

/* ---------- AVALIACOES: CARDS REVEAL ---------- */
gsap.to(".review-card", {
	opacity: 1,
	y: 0,
	duration: 0.7,
	stagger: 0.15,
	ease: "power2.out",
	scrollTrigger: { trigger: ".cards-grid", start: "top 78%" },
});

/* ---------- FAVORITOS: TITULO DE BAIXO PARA CIMA ---------- */
gsap.to(".favoritos h2.section-title", {
	opacity: 1,
	y: 0,
	duration: 0.9,
	ease: "power3.out",
	scrollTrigger: { trigger: ".favoritos", start: "top 75%" },
});

/* ---------- FAVORITOS: TOMATES ENTRANDO PELAS LATERAIS ---------- */
gsap.fromTo(
	".tomato-deco.left",
	{ x: -80, opacity: 0 },
	{
		x: 0,
		opacity: 1,
		duration: 1.1,
		ease: "power2.out",
		scrollTrigger: { trigger: ".favoritos", start: "top 80%" },
	}
);
gsap.fromTo(
	".tomato-deco.right",
	{ x: 80, opacity: 0 },
	{
		x: 0,
		opacity: 1,
		duration: 1.1,
		ease: "power2.out",
		scrollTrigger: { trigger: ".favoritos", start: "top 80%" },
	}
);

/* ---------- FAVORITOS: ZOOM IN/OUT NA ILUSTRACAO ---------- */
gsap.to(".favoritos-deco-img", {
	scale: 1.06,
	duration: 2.6,
	ease: "sine.inOut",
	yoyo: true,
	repeat: -1,
	transformOrigin: "center center",
});

/* ---------- AVALIACOES: TITULO DA ESQUERDA PARA DIREITA ---------- */
gsap.to(".avaliacoes h2.section-title", {
	opacity: 1,
	x: 0,
	duration: 0.9,
	ease: "power3.out",
	scrollTrigger: { trigger: ".avaliacoes", start: "top 75%" },
});

/* ---------- TRANSICAO ENTRE SECOES: "SUBIDA" SUAVE SOBREPONDO A ANTERIOR ---------- */
gsap.utils
	.toArray(".chef-section, .avaliacoes, footer.localizacao")
	.forEach((sec) => {
		gsap.fromTo(
			sec,
			{ y: 70 },
			{
				y: 0,
				duration: 1,
				ease: "power2.out",
				scrollTrigger: { trigger: sec, start: "top 92%" },
			}
		);
	});
