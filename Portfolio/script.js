//1. Target Element Selection (HTML -> JS)
const yearSpan = document.getElementById('year');
const themeBtn = document.getElementById('theme-btn');
const contactBtn = document.getElementById('contact-btn');
const contactDialog = document.getElementById('contact-dialog');
const contactClose = contactDialog?.querySelector('.contact-dialog-close');
const contactCopyStatus = contactDialog?.querySelector('#contact-copy-status');
const entryScreen = document.getElementById('entry-screen');
const enterPortfolioBtn = document.getElementById('enter-portfolio');
let neonCursor = null;

if (entryScreen && enterPortfolioBtn){
    enterPortfolioBtn.addEventListener('click', () => {
        document.querySelectorAll('[data-entry-content]').forEach((content) => {
            content.removeAttribute('inert');
        });
        document.body.classList.remove('portfolio-locked');
        entryScreen.classList.add('is-opening');
        entryScreen.setAttribute('inert', '');
        document.querySelector('main')?.focus({ preventScroll: true });
        window.setTimeout(() => entryScreen.remove(), 750);
    });
}

//2. Dynamic Content Injection (JS -> HTML)
if (yearSpan){
    yearSpan.textContent = new Date().getFullYear();
}

const hero = document.getElementById('hero');
const heroSlides = [
    'imgs/Film1.jpeg',
    'imgs/A7V04425.jpeg',
    'imgs/A7V04427.jpg',
    'imgs/EYE PIC.jpg',
    'imgs/att.4qqIKYMfbFqcM9tLKlwl5XJaB9_JYvwOnNwz8xRXpis.jpg',
    'imgs/att.9pYOBWolh0l2EF1LwdBuXIztOVNiRcjYRvb1ig91vJM.jpg',
    'imgs/att.KtRheCBRgGa4N03RGFI01E7YhHQ9HujWjTWcZQ_M8mE.jpg'
];

if (hero){
    let activeSlide = 0;
    let preparedSlide = 1;
    let preparedImage = new Image();

    const prepareNextSlide = () => {
        preparedImage = new Image();
        preparedImage.src = heroSlides[preparedSlide];
    };

    const showNextSlide = () => {
        const nextImage = preparedImage;
        const nextSlide = preparedSlide;
        const startCrossfade = () => {
            hero.style.setProperty('--hero-image-next', `url("${heroSlides[nextSlide]}")`);
            hero.classList.add('is-crossfading');

            window.setTimeout(() => {
                hero.style.setProperty('--hero-image-current', `url("${heroSlides[nextSlide]}")`);
                hero.classList.remove('is-crossfading');
                activeSlide = nextSlide;
                preparedSlide = (activeSlide + 1) % heroSlides.length;
                prepareNextSlide();
                window.setTimeout(showNextSlide, 2500);
            }, 1400);
        };

        if (nextImage.complete && nextImage.naturalWidth > 0){
            startCrossfade();
        } else {
            nextImage.addEventListener('load', startCrossfade, { once: true });
        }
    };

    prepareNextSlide();
    window.setTimeout(showNextSlide, 2500);
}

//3. Event Handling and Class Toggling(JS -> HTML/CSS)
if (themeBtn){
    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        themeBtn.textContent = isDarkMode ? '☼' : '☾';
        themeBtn.setAttribute('aria-label', isDarkMode ? 'Switch to light mode' : 'Switch to dark mode');
    });
}

//4. Interactive Feedback 
if (contactBtn){
    contactBtn.addEventListener('click', () => {
        contactDialog?.showModal();
        if (contactDialog && neonCursor){
            contactDialog.append(neonCursor);
        }
    });
}

if (contactDialog && contactClose){
    contactClose.addEventListener('click', () => {
        contactDialog.close();
    });

    contactDialog.addEventListener('click', (event) => {
        if (event.target === contactDialog){
            contactDialog.close();
        }
    });

    contactDialog.addEventListener('close', () => {
        if (neonCursor){
            document.body.append(neonCursor);
        }
    });
}

if (contactDialog && contactCopyStatus){
    contactDialog.querySelectorAll('[data-copy-value]').forEach((copyButton) => {
        copyButton.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(copyButton.dataset.copyValue);
                contactCopyStatus.textContent = `${copyButton.dataset.copyLabel} copied to clipboard.`;
            } catch {
                contactCopyStatus.textContent = 'Clipboard access is unavailable in this browser.';
            }
        });
    });
}

const supportsNeonCursor = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (supportsNeonCursor && !prefersReducedMotion){
    neonCursor = document.createElement('div');
    neonCursor.className = 'neon-cursor';
    neonCursor.setAttribute('aria-hidden', 'true');
    document.body.append(neonCursor);
    document.body.classList.add('neon-cursor-enabled');

    document.addEventListener('pointermove', (event) => {
        neonCursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`;
        neonCursor.classList.add('is-visible');
    });

    document.addEventListener('pointerleave', () => {
        neonCursor.classList.remove('is-visible');
    });
}

