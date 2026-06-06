const STORAGE_KEY = 'borrows_list_v1';

// DOM
const btnAdd = document.getElementById('btnAdd');
const modal = document.getElementById('modal');
const modalClose = document.getElementById('modalClose');
const btnCancel = document.getElementById('btnCancel');
const borrowForm = document.getElementById('borrowForm');
const modalTitle = document.getElementById('modalTitle');
const editingIndexInput = document.getElementById('editingIndex');

const tableBody = document.querySelector('#borrowTable tbody');
const statTotal = document.getElementById('statTotal');
const statBorrowing = document.getElementById('statBorrowing');
const statReturned = document.getElementById('statReturned');

// Các trường trong form
const fld = {
  borrowId: document.getElementById('borrowId'),
  borrowerName: document.getElementById('borrowerName'),
  bookId: document.getElementById('bookId'),
  category: document.getElementById('category'),
  borrowDate: document.getElementById('borrowDate'),
  dueDate: document.getElementById('dueDate'),
  phone: document.getElementById('phone'),
  email: document.getElementById('email'),
  status: document.getElementById('status'),
  note: document.getElementById('note'),
};

const err = {
  borrowId: document.getElementById('errBorrowId'),
  borrowerName: document.getElementById('errBorrowerName'),
  bookId: document.getElementById('errBookId'),
  category: document.getElementById('errCategory'),
  borrowDate: document.getElementById('errBorrowDate'),
  dueDate: document.getElementById('errDueDate'),
  phone: document.getElementById('errPhone'),
  email: document.getElementById('errEmail'),
  status: document.getElementById('errStatus'),
  note: document.getElementById('errNote'),
};

function loadData(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }catch(e){
    console.error('Tải dữ liệu thất bại', e);
    return [];
  }
}

function saveData(list){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function openModal(editIndex = -1){
  resetErrors();
  borrowForm.reset();
  editingIndexInput.value = editIndex;
  if(editIndex >=0){
    modalTitle.textContent = 'Sửa phiếu mượn';
    const list = loadData();
    const item = list[editIndex];
    if(item){
      fld.borrowId.value = item.borrowId;
      fld.borrowerName.value = item.borrowerName;
      fld.bookId.value = item.bookId;
      fld.category.value = item.category;
      fld.borrowDate.value = item.borrowDate;
      fld.dueDate.value = item.dueDate;
      fld.phone.value = item.phone;
      fld.email.value = item.email;
      fld.status.value = item.status;
      fld.note.value = item.note || '';
      fld.borrowId.disabled = true;
    }
  }else{
    modalTitle.textContent = 'Thêm phiếu mượn';
    fld.borrowId.disabled = false;
  }
  modal.classList.remove('hidden');
}

function closeModal(){
  modal.classList.add('hidden');
}

function resetErrors(){
  Object.values(err).forEach(e=> e.textContent='');
}

function renderTable(){
  const list = loadData();
  tableBody.innerHTML = '';
  list.forEach((it, idx)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(it.borrowId)}</td>
      <td>${escapeHtml(it.borrowerName)}</td>
      <td>${escapeHtml(it.bookId)}</td>
      <td>${escapeHtml(it.category)}</td>
      <td>${escapeHtml(it.borrowDate)}</td>
      <td>${escapeHtml(it.dueDate)}</td>
      <td>${escapeHtml(it.phone)}</td>
      <td>${escapeHtml(it.email)}</td>
      <td>${escapeHtml(it.status)}</td>
      <td>${escapeHtml(it.note || '')}</td>
      <td class="actions">
        <button class="btn" data-action="edit" data-index="${idx}">Sửa</button>
        <button class="btn" data-action="delete" data-index="${idx}">Xóa</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
  updateStats();
}

function updateStats(){
  const list = loadData();
  statTotal.textContent = list.length;
  statBorrowing.textContent = list.filter(x=> x.status === 'Đang mượn').length;
  statReturned.textContent = list.filter(x=> x.status === 'Đã trả').length;
}

function escapeHtml(str){
  if(!str) return '';
  return String(str).replace(/[&<>"']/g, s=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"
  })[s]);
}

function validateForm(isEdit){
  resetErrors();
  let ok = true;
  const list = loadData();
  const now = new Date();
  // Mã phiểu mượn
  const id = fld.borrowId.value.trim();
  if(!id){ err.borrowId.textContent = 'Mã phiếu không được để trống'; ok=false; }
  else if(!/^PM-\d{4}$/.test(id)){ err.borrowId.textContent='Mã phải theo dạng PM-XXXX'; ok=false; }
  else if(!isEdit && list.some(x=> x.borrowId === id)){ err.borrowId.textContent='Mã đã tồn tại'; ok=false; }

  // Họ tên người mượn
  const name = fld.borrowerName.value.trim();
  if(!name){ err.borrowerName.textContent='Họ tên không được để trống'; ok=false; }
  else if(name.length <2 || name.length>40){ err.borrowerName.textContent='Họ tên từ 2 đến 40 ký tự'; ok=false; }
  else if(!/^[A-Za-zÀ-ỹ\s]+$/.test(name)){ err.borrowerName.textContent='Chỉ chứa chữ cái và khoảng trắng'; ok=false; }

  // Mã sách
  const bookId = fld.bookId.value.trim();
  if(!bookId){ err.bookId.textContent='Mã sách không được để trống'; ok=false; }
  else if(!/^BK\d{5}$/.test(bookId)){ err.bookId.textContent='Mã sách phải là BK + 5 chữ số'; ok=false; }

  // Thể loại
  if(!fld.category.value){ err.category.textContent='Chọn thể loại'; ok=false; }

  // Ngày mượn
  const bdate = fld.borrowDate.value;
  if(!bdate){ err.borrowDate.textContent='Chọn ngày mượn'; ok=false; }
  else{
    const bd = new Date(bdate + 'T00:00:00');
    if(bd > stripTime(now)){ err.borrowDate.textContent='Ngày mượn không được lớn hơn ngày hiện tại'; ok=false; }
  }

  // Ngày trả
  const ddate = fld.dueDate.value;
  if(!ddate){ err.dueDate.textContent='Chọn hạn trả'; ok=false; }
  else if(bdate){
    const bd = new Date(bdate + 'T00:00:00');
    const dd = new Date(ddate + 'T00:00:00');
    if(dd < bd){ err.dueDate.textContent='Hạn trả phải lớn hơn hoặc bằng ngày mượn'; ok=false; }
    const diffDays = (dd - bd)/(1000*60*60*24);
    if(diffDays > 30){ err.dueDate.textContent='Hạn trả không được quá 30 ngày kể từ ngày mượn'; ok=false; }
  }

  // Số điện thoại
  const phone = fld.phone.value.trim();
  if(!phone){ err.phone.textContent='Số điện thoại không được để trống'; ok=false; }
  else if(!/^(03|05|07|08|09)\d{8}$/.test(phone)){ err.phone.textContent='Số điện thoại không hợp lệ (10 chữ số, bắt đầu 03,05,07,08,09)'; ok=false; }

  // Email
  const email = fld.email.value.trim();
  if(!email){ err.email.textContent='Email không được để trống'; ok=false; }
  else if(!/^[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(email)){ err.email.textContent='Email không hợp lệ'; ok=false; }
  else if(!email.endsWith('@library.vn')){ err.email.textContent='Email phải kết thúc bằng @library.vn'; ok=false; }

  // Trạng thái
  if(!fld.status.value){ err.status.textContent='Chọn trạng thái'; ok=false; }

  // Ghi chú
  const note = fld.note.value;
  if(note && note.length > 120){ err.note.textContent='Ghi chú tối đa 120 ký tự'; ok=false; }
  const forbidden = /<\s*(script|iframe|img)\b/i;
  if(forbidden.test(note)){ err.note.textContent='Ghi chú không được chứa thẻ HTML'; ok=false; }

  return ok;
}

function stripTime(d){ return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

// Xác nhận 
borrowForm.addEventListener('submit', function(e){
  e.preventDefault();
  const editingIndex = Number(editingIndexInput.value);
  const isEdit = editingIndex >= 0;
  if(!validateForm(isEdit)) return;

  const item = {
    borrowId: fld.borrowId.value.trim(),
    borrowerName: fld.borrowerName.value.trim(),
    bookId: fld.bookId.value.trim(),
    category: fld.category.value,
    borrowDate: fld.borrowDate.value,
    dueDate: fld.dueDate.value,
    phone: fld.phone.value.trim(),
    email: fld.email.value.trim(),
    status: fld.status.value,
    note: fld.note.value.trim()
  };

  const list = loadData();
  if(isEdit){
    list[editingIndex] = item;
  }else{
    list.push(item);
  }
  saveData(list);
  closeModal();
  renderTable();
});

tableBody.addEventListener('click', function(e){
  const btn = e.target.closest('button');
  if(!btn) return;
  const action = btn.dataset.action;
  const idx = Number(btn.dataset.index);
  if(action === 'edit'){
    openModal(idx);
  }else if(action === 'delete'){
    if(confirm('Bạn có chắc muốn xóa phiếu mượn này không?')){
      const list = loadData();
      list.splice(idx,1);
      saveData(list);
      renderTable();
    }
  }
});

btnAdd.addEventListener('click', ()=> openModal(-1));
modalClose.addEventListener('click', closeModal);
btnCancel.addEventListener('click', closeModal);

modal.addEventListener('click', function(e){ if(e.target === modal) closeModal(); });

renderTable();
