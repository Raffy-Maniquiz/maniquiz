//1. Target Element Selection (HTML -> JS)
const yearSpan = document.getElementById('year');
const themeBtn = document.getElementById('theme-btn');
const contactBtn = document.getElementById('contact-btn');
const contactDialog = document.getElementById('contact-dialog');
const contactClose = contactDialog?.querySelector('.contact-dialog-close');
const contactCopyStatus = contactDialog?.querySelector('#contact-copy-status');
let neonCursor = null;

//2. Dynamic Content Injection (JS -> HTML)
if (yearSpan){
    yearSpan.textContent = new Date().getFullYear();
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
        neonCursor.style.left = `${event.clientX}px`;
        neonCursor.style.top = `${event.clientY}px`;
        neonCursor.classList.add('is-visible');
    });

    document.addEventListener('pointerleave', () => {
        neonCursor.classList.remove('is-visible');
    });
}

