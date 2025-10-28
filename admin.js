// /js/admin.js
import { db, storage } from 'firebase.js';
import { collection, addDoc, serverTimestamp, doc, getDocs, query, orderBy, where, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";

const bookTitleInput = document.getElementById('bookTitleInput');
const bookAuthorInput = document.getElementById('bookAuthorInput');
const coverFile = document.getElementById('coverFile');
const createBookBtn = document.getElementById('createBookBtn');

const selectBook = document.getElementById('selectBook');
const pageNumber = document.getElementById('pageNumber');
const pageContent = document.getElementById('pageContent');
const addPageBtn = document.getElementById('addPageBtn');

const logoFile = document.getElementById('logoFile');
const uploadLogoBtn = document.getElementById('uploadLogoBtn');

const booksAdminList = document.getElementById('booksAdminList');
const adminLogo = document.getElementById('adminLogo');

async function loadBooks(){
  booksAdminList.innerHTML = '';
  selectBook.innerHTML = '<option value="">-- Select book --</option>';
  const q = query(collection(db, 'books'), orderBy('createdAt','desc'));
  const snap = await getDocs(q);
  snap.forEach(docSnap=>{
    const b = { id: docSnap.id, ...docSnap.data() };
    const row = document.createElement('div');
    row.className = 'book-item';
    row.innerHTML = `<img src="${b.coverUrl||'assets/default-cover.jpg'}" style="width:64px;height:80px;object-fit:cover;border-radius:6px">
      <div style="flex:1">
        <div style="font-weight:600">${b.title}</div>
        <div class="small">${b.author||''}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <button class="btn" data-id="${b.id}" data-action="edit">Edit</button>
        <button class="btn" data-id="${b.id}" data-action="delete">Delete</button>
        <button class="btn" data-id="${b.id}" data-action="toggleHot">${b.isHot? 'Unhot' : 'Hot'}</button>
      </div>`;
    booksAdminList.appendChild(row);

    const opt = document.createElement('option');
    opt.value = b.id; opt.textContent = b.title;
    selectBook.appendChild(opt);
  });

  // attach click handlers (delegation)
  booksAdminList.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', async (e)=>{
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      if(action==='delete'){
        if(!confirm('Delete book and its pages?')) return;
        await deleteDoc(doc(db, 'books', id));
        // note: pages subcollection won't be auto-deleted by this simple method; could implement cascade if needed
        alert('Book deleted (pages may remain in subcollection). Refreshing.');
        loadBooks();
      } else if(action==='toggleHot'){
        const bdoc = doc(db, 'books', id);
        const cur = (await (await fetch('')).catch(()=>null)); // noop to avoid warnings
        // fetch current doc to read isHot
        const dsnap = (await (await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js")).getDoc(bdoc)).data; // fallback - but simpler: just update to toggle using updateDoc after reading
        // simpler approach: read doc
        import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js").then(async fs=>{
          const curSnap = await fs.getDoc(bdoc);
          const curData = curSnap.data() || {};
          await updateDoc(bdoc, { isHot: !curData.isHot });
          loadBooks();
        });
      } else if(action==='edit'){
        // naive: set inputs to selected book for editing (quick edit)
        const docSnap = await (await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js")).getDoc(doc(db,'books',id));
        const b = docSnap.data();
        bookTitleInput.value = b.title || '';
        bookAuthorInput.value = b.author || '';
        // if cover change desired, upload new cover on save
        // we'll delete then recreate? Simpler: updateDoc
        const doUpdate = confirm('Update this book metadata now? OK to update title/author and optionally cover.');
        if(doUpdate){
          const updates = { title: bookTitleInput.value, author: bookAuthorInput.value };
          if(coverFile.files.length>0){
            const cf = coverFile.files[0];
            const r = ref(storage, `covers/${Date.now()}_${cf.name}`);
            await uploadBytes(r, cf);
            const url = await getDownloadURL(r);
            updates.coverUrl = url;
          }
          await updateDoc(doc(db,'books',id), updates);
          alert('Book updated'); loadBooks();
        }
      }
    });
  });
}

createBookBtn.addEventListener('click', async ()=>{
  const title = bookTitleInput.value.trim();
  const author = bookAuthorInput.value.trim();
  if(!title){ alert('Provide title'); return; }
  let coverUrl = '';
  if(coverFile.files.length>0){
    const cf = coverFile.files[0];
    const r = ref(storage, `covers/${Date.now()}_${cf.name}`);
    await uploadBytes(r, cf);
    coverUrl = await getDownloadURL(r);
  }
  const docRef = await addDoc(collection(db, 'books'), {
    title, author, coverUrl,
    isHot: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  alert('Book created: '+docRef.id);
  loadBooks();
  bookTitleInput.value = ''; bookAuthorInput.value='';
});

// add page
addPageBtn.addEventListener('click', async ()=>{
  const bId = selectBook.value;
  if(!bId) return alert('Select book first');
  const pnum = parseInt(pageNumber.value||'1',10);
  const content = pageContent.value || '';
  if(!content) return alert('Page content required');
  const pagesCol = collection(db, `books/${bId}/pages`);
  await addDoc(pagesCol, {
    pageNumber: pnum,
    content,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  alert('Page added'); pageContent.value='';
});

// upload logo
uploadLogoBtn.addEventListener('click', async ()=>{
  if(!logoFile.files.length) return alert('Select logo file');
  const f = logoFile.files[0];
  const r = ref(storage, `settings/logo_${Date.now()}_${f.name}`);
  await uploadBytes(r, f);
  const url = await getDownloadURL(r);
  // save to settings/ui doc
  await addDoc(collection(db,'settings'), {}); // placeholder to ensure collection exists - optional
  await (async ()=>{ // set the doc 'ui'
    const udoc = doc(db, 'settings', 'ui');
    try{ await updateDoc(udoc, { logoUrl: url }); }catch(e){
      // if doc not exists, set it
      await addDoc(collection(db,'settings'), { logoUrl: url });
    }
  })();
  adminLogo.src = url;
  alert('Logo uploaded. Note: index page reads settings/ui for logo.');
});

// initial load of logo and books
(async function initAdmin(){
  // load logo
  try{
    const udoc = doc(db,'settings','ui');
    const snap = await (await import("https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js")).getDoc(udoc);
    if(snap.exists()) adminLogo.src = snap.data().logoUrl || adminLogo.src;
  }catch(e){}
  loadBooks();
})();
