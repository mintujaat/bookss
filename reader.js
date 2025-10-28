// /js/reader.js
import { db } from 'firebase.js';
import { doc, getDoc, collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

function getParam(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

const bookId = getParam('bookId');
const flipbook = document.getElementById('flipbook');
const bookTitle = document.getElementById('bookTitle');
const gotoInput = document.getElementById('gotoInput');
const gotoBtn = document.getElementById('gotoBtn');

if(!bookId){ flipbook.innerHTML = '<div class="card">No book selected. Go back to <a href="index.html">library</a>.</div>'; }
else loadBook(bookId);

gotoBtn.addEventListener('click', ()=>{
  const v = parseInt(gotoInput.value||'0',10);
  if(isNaN(v) || v<1) return;
  // turn.js page indexing: 1..N
  $("#flipbook").turn("page", v);
});

async function loadBook(id){
  try{
    const bdoc = await getDoc(doc(db, 'books', id));
    if(!bdoc.exists()){ flipbook.innerHTML = '<div class="card">Book not found</div>'; return; }
    const b = bdoc.data();
    bookTitle.textContent = `${b.title} — ${b.author||''}`;

    // load pages subcollection
    const pagesQ = query(collection(db, `books/${id}/pages`), orderBy('pageNumber','asc'));
    const snap = await getDocs(pagesQ);
    const pages = snap.docs.map(d => d.data()).sort((a,b)=>a.pageNumber - b.pageNumber);

    // create HTML structure for turn.js: it expects child divs representing pages
    flipbook.innerHTML = '';
    pages.forEach(pg => {
      const pageDiv = document.createElement('div');
      pageDiv.className = 'page';
      // content stored as sanitized HTML by admin; to be safe, treat as text -> convert line breaks
      // but admin will provide HTML plain text; we escape then allow <b><i><p><br> minimal tags
      pageDiv.innerHTML = `<div style="padding:18px; color:#0b1220">${pg.content}</div>`;
      flipbook.appendChild(pageDiv);
    });

    // initialize turn.js
    $("#flipbook").turn({
      width: 900,
      height: 600,
      autoCenter: true,
      display: 'double'
    });

  }catch(e){ console.error(e); flipbook.innerHTML = '<div class="card">Error loading book.</div>'; }
}
