document.querySelectorAll('.print-button').forEach(button=>button.addEventListener('click',()=>window.print()));
const links=[...document.querySelectorAll('.sidebar nav a')];
if('IntersectionObserver' in window){
 const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){links.forEach(link=>{const active=link.hash==='#'+entry.target.id;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}},{rootMargin:'-15% 0px -65% 0px',threshold:0});
 document.querySelectorAll('.resume-section').forEach(section=>observer.observe(section));
}
