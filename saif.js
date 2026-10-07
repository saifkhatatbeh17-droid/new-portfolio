(() => {
    'use strict';
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    const root = document.documentElement;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    let lenis = null;

    const boot = () => {
        const loader = $('#loader');

        /* ───── Menu ───── */
        const btn = $('#menu-btn'), menu = $('#menu');
        const setMenu = on => {
            root.classList.toggle('is-menu', on);
            btn.setAttribute('aria-expanded', String(on));
            menu.inert = !on;
            if (lenis) on ? lenis.stop() : lenis.start();
            if (on && window.gsap) gsap.fromTo('.menu-list li', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.06, ease: 'expo.out', delay: 0.1 });
        };
        if (btn && menu) {
            btn.addEventListener('click', () => setMenu(!root.classList.contains('is-menu')));
            $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
            addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
        }

        /* ───── Active link spy ───── */
        const navLinks = $$('.nav-link');
        const sections = navLinks.map(l => document.getElementById(l.getAttribute('href').slice(1))).filter(Boolean);
        if ('IntersectionObserver' in window) {
            const spy = new IntersectionObserver(es => es.forEach(e => {
                if (!e.isIntersecting) return;
                navLinks.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id));
            }), { rootMargin: '-50% 0px -50% 0px' });
            sections.forEach(s => spy.observe(s));
        }

        /* ───── Tabs ───── */
        $$('[data-tabs]').forEach(group => {
            const tabs = $$('[role="tab"]', group), ind = $('.tab-indicator', group);
            const panels = tabs.map(t => document.getElementById(t.getAttribute('aria-controls')));
            const place = i => { if (ind && tabs[i].offsetWidth) { ind.style.left = tabs[i].offsetLeft + 'px'; ind.style.width = tabs[i].offsetWidth + 'px'; } };
            const current = () => Math.max(0, tabs.findIndex(t => t.getAttribute('aria-selected') === 'true'));
            const select = (i, focus) => {
                tabs.forEach((t, j) => {
                    t.setAttribute('aria-selected', String(i === j));
                    t.tabIndex = i === j ? 0 : -1;
                    if (panels[j]) panels[j].hidden = i !== j;
                });
                place(i);
                if (focus) tabs[i].focus();
                if (window.gsap && !reduce) {
                    gsap.fromTo(panels[i], { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out', clearProps: 'all' });
                    if (window.ScrollTrigger) ScrollTrigger.refresh();
                }
            };
            tabs.forEach((t, i) => {
                t.addEventListener('click', () => select(i));
                t.addEventListener('keydown', e => {
                    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
                    if (d) { e.preventDefault(); select((i + d + tabs.length) % tabs.length, true); }
                });
            });
            place(current());
            addEventListener('resize', () => place(current()));
            if (document.fonts) document.fonts.ready.then(() => place(current()));
        });

        /* ───── Demos ───── */
        const feedback = $('[data-demo="feedback"]');
        if (feedback) {
            const form = $('form', feedback), status = $('[data-status]', feedback);
            if (form && status) {
                form.addEventListener('submit', e => {
                    e.preventDefault();
                    if (!form.querySelector('input[name="rating"]:checked')) { status.textContent = 'Please choose a rating.'; status.className = 'status is-error'; return; }
                    status.textContent = 'Feedback received! (Demo updated)'; status.className = 'status is-ok'; form.reset();
                });
                form.addEventListener('change', () => { status.textContent = ''; });
            }
        }
        const tasks = $('[data-demo="tasks"]');
        if (tasks) {
            const note = $('[data-note]', tasks), say = t => { if (note) { note.textContent = t; note.className = 'status is-ok'; } };
            tasks.addEventListener('click', e => {
                const b = e.target.closest('.task-btn'); if (!b) return;
                const task = b.closest('.task'), title = $('span', task).textContent;
                if (b.dataset.action === 'delete') { task.remove(); say(`Deleted "${title}".`); } else say(`Moved "${title}" (Demo).`);
            });
            const form = $('.task-form', tasks);
            if (form) form.addEventListener('submit', e => {
                e.preventDefault();
                const input = $('input', form); if (!input.value.trim()) return;
                say(`Added "${input.value}" (Demo).`); input.value = '';
            });
        }

        /* ───── Motion layer ───── */
        if (!window.gsap || !window.ScrollTrigger || reduce) { if (loader) loader.remove(); return; }
        gsap.registerPlugin(ScrollTrigger);

        /* Lenis synced with ScrollTrigger */
        if (window.Lenis) {
            lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 });
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add(t => lenis.raf(t * 1000));
            gsap.ticker.lagSmoothing(0);
            lenis.stop();
            $$('.panel-glass').forEach(p => p.setAttribute('data-lenis-prevent', ''));
            $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
                const id = a.getAttribute('href'), t = id.length > 1 && $(id);
                if (!t) return;
                e.preventDefault();
                lenis.scrollTo(t, { duration: 1.6, offset: id === '#hero' ? 0 : -20 });
            }));
            let hidden = false;
            lenis.on('scroll', ({ direction, scroll }) => {
                const h = direction === 1 && scroll > 240 && !root.classList.contains('is-menu');
                if (h !== hidden) { hidden = h; gsap.to('.nav', { yPercent: h ? -160 : 0, duration: 0.6, ease: 'power3.out', overwrite: 'auto' }); }
            });
        }

        /* Text splitting (no plugins) */
        const split = (el, chars) => {
            const txt = el.textContent.replace(/\s+/g, ' ').trim();
            el.setAttribute('aria-label', txt);
            el.innerHTML = txt.split(' ').map(w => '<span class="w" aria-hidden="true">' +
                (chars ? [...w].map(c => `<span class="ch">${c}</span>`).join('') : `<span class="wi">${w}</span>`) + '</span>').join(' ');
            return $$(chars ? '.ch' : '.wi', el);
        };
        const heroChars = split($('.hero-title:not(.hero-title--stroke)'), true);

        /* Cursor */
        if (fine) {
            const cur = $('.cursor'), dot = $('.cursor-dot'), ring = $('.cursor-ring');
            const label = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'cursor-label' }));
            gsap.set(label, { xPercent: -50, yPercent: -50 });
            gsap.set(cur, { autoAlpha: 0 });
            const q = {
                dx: gsap.quickTo(dot, 'x', { duration: 0.1 }), dy: gsap.quickTo(dot, 'y', { duration: 0.1 }),
                rx: gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' }), ry: gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' }),
                lx: gsap.quickTo(label, 'x', { duration: 0.4, ease: 'power3' }), ly: gsap.quickTo(label, 'y', { duration: 0.4, ease: 'power3' })
            };
            let snap = null, over = null, shown = false;
            addEventListener('mousemove', e => {
                if (!shown) { shown = true; gsap.to(cur, { autoAlpha: 1, duration: 0.4 }); }
                let x = e.clientX, y = e.clientY;
                q.dx(x); q.dy(y); q.lx(x); q.ly(y);
                if (snap) { const r = snap.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; x = cx + (x - cx) * 0.3; y = cy + (y - cy) * 0.3; }
                q.rx(x); q.ry(y);
            });
            root.addEventListener('mouseleave', () => { shown = false; gsap.to(cur, { autoAlpha: 0, duration: 0.3 }); gsap.to(label, { autoAlpha: 0, duration: 0.2 }); });
            document.addEventListener('mouseover', e => {
                const t = e.target.closest('a, button, label, input, textarea, [data-cursor], [data-magnetic]');
                if (t === over) return;
                over = t;
                const txt = t && t.dataset.cursor;
                snap = t && t.matches('[data-magnetic]') ? t : null;
                label.textContent = txt || '';
                ring.classList.toggle('is-hover', !!t && !txt);
                gsap.to(ring, { scale: t ? (txt ? 0 : 1.9) : 1, duration: 0.4, ease: 'power3.out' });
                gsap.to(dot, { scale: t ? 0 : 1, duration: 0.3 });
                gsap.to(label, { autoAlpha: txt ? 1 : 0, scale: txt ? 1 : 0.6, duration: 0.3, ease: 'power3.out' });
            });
        }

        /* Magnetic buttons */
        $$('[data-magnetic]').forEach(el => {
            el.addEventListener('mousemove', e => {
                const r = el.getBoundingClientRect();
                gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.35, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
            });
            el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' }));
        });

        /* Chips: float, scramble, magnetic pull and 3D tilt */
        const GL = '!<>-_/[]{}=+*^?#';
        $$('.chip').forEach(c => {
            const txt = c.textContent;
            c.innerHTML = `<span class="chip-in" style="--d:${(Math.random() * 6).toFixed(1)}">${txt}</span>`;
            const inner = c.firstChild, o = { p: 0 };
            c.addEventListener('mouseenter', () => {
                o.p = 0; gsap.to(o, {
                    p: 1, duration: 0.5, ease: 'none', overwrite: true,
                    onUpdate: () => { const n = Math.floor(o.p * txt.length); inner.textContent = txt.slice(0, n) + [...txt.slice(n)].map(ch => ch === ' ' ? ' ' : GL[(Math.random() * GL.length) | 0]).join(''); },
                    onComplete: () => { inner.textContent = txt; }
                });
            });
        });
        $$('.hero-chips, .deck').forEach(box => {
            const cs = $$('.chip', box); let busy = false;
            box.addEventListener('mousemove', e => {
                if (busy) return; busy = true;
                requestAnimationFrame(() => {
                    busy = false;
                    cs.forEach(c => {
                        const r = c.getBoundingClientRect();
                        const dx = e.clientX - (r.left + r.width / 2 - gsap.getProperty(c, 'x')), dy = e.clientY - (r.top + r.height / 2 - gsap.getProperty(c, 'y'));
                        const f = Math.max(0, 1 - Math.hypot(dx, dy) / 150);
                        gsap.to(c, { x: dx * f * 0.35, y: dy * f * 0.35, rotationY: dx * f * 0.12, rotationX: -dy * f * 0.12, transformPerspective: 500, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
                    });
                });
            });
            box.addEventListener('mouseleave', () => gsap.to(cs, { x: 0, y: 0, rotationX: 0, rotationY: 0, duration: 1.2, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' }));
        });

        /* Card tilt */
        $$('.dcard, .exp-card').forEach(c => {
            c.addEventListener('mousemove', e => {
                const r = c.getBoundingClientRect();
                gsap.to(c, { rotationY: ((e.clientX - r.left) / r.width - 0.5) * 8, rotationX: -((e.clientY - r.top) / r.height - 0.5) * 8, transformPerspective: 900, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
            });
            c.addEventListener('mouseleave', () => gsap.to(c, { rotationX: 0, rotationY: 0, duration: 0.9, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' }));
        });

        /* Hero: mouse depth and portrait tilt */
        const hero = $('.hero');
        const depthEls = $$('[data-depth]', hero).map(el => ({ d: parseFloat(el.dataset.depth) || 0, x: gsap.quickTo(el, 'x', { duration: 0.9, ease: 'power3' }), y: gsap.quickTo(el, 'y', { duration: 0.9, ease: 'power3' }) }));
        hero.addEventListener('mousemove', e => {
            const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
            depthEls.forEach(o => { o.x(-nx * o.d * 140); o.y(-ny * o.d * 100); });
            gsap.to('.hero-visual', { rotationY: nx * 12, rotationX: -ny * 12, transformPerspective: 1000, duration: 0.9, ease: 'power3.out', overwrite: 'auto' });
        });
        hero.addEventListener('mouseleave', () => {
            depthEls.forEach(o => { o.x(0); o.y(0); });
            gsap.to('.hero-visual', { rotationX: 0, rotationY: 0, duration: 1.2, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' });
        });
        const heroScrub = { trigger: hero, start: 'top top', end: 'bottom top', scrub: 1 };
        gsap.to('.hero-orb--1', { yPercent: 30, xPercent: -15, ease: 'none', scrollTrigger: heroScrub });
        gsap.to('.hero-orb--2', { yPercent: -40, xPercent: 15, ease: 'none', scrollTrigger: heroScrub });
        gsap.to('.hero-wrap', { yPercent: 14, autoAlpha: 0.15, ease: 'none', scrollTrigger: heroScrub });

        /* Reveals */
        $$('.section-label').forEach(l => gsap.timeline({ scrollTrigger: { trigger: l, start: 'top 90%' } })
            .from($('.label-line', l), { scaleX: 0, transformOrigin: 'left', duration: 1, ease: 'expo.out' })
            .from($('.label-text', l), { autoAlpha: 0, x: -16, duration: 0.9, ease: 'power3.out' }, 0.15));
        const words = split($('[data-words]'), false);
        gsap.from(words, { yPercent: 115, duration: 1.1, stagger: 0.035, ease: 'expo.out', scrollTrigger: { trigger: '.about-hero', start: 'top 80%' } });
        $$('[data-scroll], [data-reveal]').forEach(el => {
            if (el.closest('.hero') || el.matches('.section-label') || el.querySelector('[data-words]')) return;
            gsap.fromTo(el, { y: 40, autoAlpha: 0, filter: 'blur(8px)' }, { y: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out', clearProps: 'filter', scrollTrigger: { trigger: el, start: 'top 88%' } });
        });
        gsap.fromTo('.contact-title', { scale: 0.85 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'top 30%', scrub: true } });
        const contact = $('.contact');
        contact.addEventListener('mousemove', e => {
            const r = contact.getBoundingClientRect();
            contact.style.setProperty('--mx', e.clientX - r.left + 'px');
            contact.style.setProperty('--my', e.clientY - r.top + 'px');
        });
        gsap.to('#progress', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

        /* Pinned horizontal projects (desktop) removed by request */
        const work = $('.work');


        /* Marquee and card skew driven by scroll velocity */
        const rows = $$('.marquee-row').map(row => {
            const track = $('.marquee-track', row), g = $('.marquee-group', track);
            const clone = g.cloneNode(true); clone.setAttribute('aria-hidden', 'true'); track.appendChild(clone);
            const o = { track, g, dir: row.dataset.dir === 'right' ? 1 : -1, x: 0, w: 1 };
            const measure = () => { o.w = g.offsetWidth || 1; };
            measure(); addEventListener('resize', measure);
            if (document.fonts) document.fonts.ready.then(measure);
            return o;
        });
        const panels = $$('.panel');
        gsap.ticker.add(() => {
            const v = lenis ? lenis.velocity : 0;
            rows.forEach(o => {
                o.x = gsap.utils.wrap(-o.w, 0, o.x + o.dir * (0.6 + Math.abs(v) * 0.12));
                gsap.set(o.track, { x: o.x, skewX: gsap.utils.clamp(-8, 8, -v * 0.1) });
            });
            if (work.classList.contains('is-h')) gsap.set(panels, { skewX: gsap.utils.clamp(-6, 6, -v * 0.08) });
        });

        /* Entrance: loader, then hero */
        const strokeTitle = $('.hero-title--stroke');
        const items = ['.hero-sub', '.hero-chips', '.hero-actions', '.hero-meta'];
        gsap.set('.hero-tag', { autoAlpha: 0, yPercent: 60 });
        gsap.set(heroChars, { yPercent: 115 });
        gsap.set(strokeTitle, { autoAlpha: 0, yPercent: 30, clipPath: 'inset(0 0 100% 0)' });
        gsap.set(items, { autoAlpha: 0, yPercent: 25 });
        gsap.set('.hero-visual', { autoAlpha: 0, yPercent: 8, scale: 0.92 });
        gsap.set(['.nav', '.scroll-hint'], { autoAlpha: 0 });

        const intro = () => gsap.timeline({ defaults: { ease: 'expo.out' } })
            .to('.hero-tag', { autoAlpha: 1, yPercent: 0, duration: 1 }, 0)
            .to(heroChars, { yPercent: 0, duration: 1.4, stagger: 0.035 }, 0.1)
            .to(strokeTitle, { autoAlpha: 1, yPercent: 0, clipPath: 'inset(0 0 0% 0)', duration: 1.4 }, 0.35)
            .to(items, { autoAlpha: 1, yPercent: 0, duration: 1.1, stagger: 0.1 }, 0.6)
            .to('.hero-visual', { autoAlpha: 1, yPercent: 0, scale: 1, duration: 1.6 }, 0.3)
            .to('.nav', { autoAlpha: 1, duration: 1 }, 0.8)
            .to('.scroll-hint', { autoAlpha: 1, duration: 1 }, 1.4);

        if (loader) {
            const cnt = $('#loader-count'), fill = $('.loader-fill'), o = { v: 0 };
            gsap.timeline({ onComplete: () => { loader.remove(); if (lenis) lenis.start(); ScrollTrigger.refresh(); } })
                .from('.loader-name', { autoAlpha: 0, yPercent: 40, duration: 0.8, ease: 'power3.out' }, 0)
                .to(o, { v: 100, duration: 1.8, ease: 'power2.inOut', onUpdate: () => { cnt.textContent = Math.round(o.v); fill.style.transform = `scaleX(${o.v / 100})`; } }, 0)
                .to('.loader-inner', { autoAlpha: 0, y: -20, duration: 0.5, ease: 'power2.in' }, '>0.1')
                .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '>-0.1')
                .call(intro, null, '-=0.6');
        } else { intro(); if (lenis) lenis.start(); }

        if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
        addEventListener('load', () => ScrollTrigger.refresh());
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();