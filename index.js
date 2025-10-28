// /js/index.js
import { db } from './firebase.js';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const booksGrid = document.getElementById('booksGrid');
const hotSection = document.getElementById('hotSection');
const siteLogo = document.getElementById('siteLogo');
const searchInput = document.getElementById('searchInput');

let allBooks = [];

// load logo from 'settings' doc (collection 'settings' doc id 'ui')
async function loadLogo(){
  try{
    const dref = doc(db, 'settings', 'ui');
    const snap = await getDoc(dref);
    if(snap.exists()){
      const data = snap.data();
      if(data.logoUrl) siteLogo.src = data.logoUrl;
      if(data.siteTitle) document.querySelector('.site-title').textContent = data.siteTitle;
    }
  }catch(e){ console.error('logo load', e); }
}

function renderGrid(filtered){
  booksGrid.innerHTML = '';
  filtered.forEach(b=>{
    const url = `reader.html?bookId=${b.id}`;
    const el = document.createElement('a');
    el.className = 'book-card';
    el.href = url;
    el.innerHTML = `
      <img class="book-cover" src="${b.coverUrl || 'assets/default-cover.jpg'}" alt="">
      <div class="book-meta">
        <div class="book-title">${escapeHtml(b.title)}</div>
        <div class="book-author">${escapeHtml(b.author || '')}</div>
      </div>
    `;
    booksGrid.appendChild(el);
  });
}

function renderHot(arr){
  hotSection.innerHTML = '';
  arr.forEach(b=>{
    const el = document.createElement('a');
    el.className = 'hot-card';
    el.href = `reader.html?bookId=${b.id}`;
    el.innerHTML = `<img src="${b.coverUrl||'assets/default-cover.jpg'}" style="width:100%;height:140px;object-fit:cover"/><div style="padding:10px"><strong>${escapeHtml(b.title)}</strong><div class="small">${escapeHtml(b.author||'')}</div></div>`;
    hotSection.appendChild(el);
  });
}

function escapeHtml(s){ if(!s) return ''; return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

// realtime listen to books collection
const q = query(collection(db, 'books'), orderBy('createdAt','desc'));
onSnapshot(q, snap=>{
  allBooks = snap.docs.map(d => ({ id:d.id, ...d.data() }));
  const hot = allBooks.filter(b=>b.isHot).slice(0,6);
  renderHot(hot);
  renderGrid(allBooks);
  applySearch();
});

// logo load
loadLogo();

// search
searchInput.addEventListener('input', applySearch);
function applySearch(){
  const qv = searchInput.value.trim().toLowerCase();
  if(!qv) return renderGrid(allBooks);
  const filtered = allBooks.filter(b => (b.title||'').toLowerCase().includes(qv) || (b.author||'').toLowerCase().includes(qv));
  renderGrid(filtered);
}
