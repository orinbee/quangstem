const firebaseConfig = {
  apiKey: "AIzaSyCxMqYvibF01ky9faJIFb_msg-MaVvYDcI",
  authDomain: "mindxlogin.firebaseapp.com",
  databaseURL: "https://mindxlogin-default-rtdb.firebaseio.com",
  projectId: "mindxlogin",
  storageBucket: "mindxlogin.firebasestorage.app",
  messagingSenderId: "221345458489",
  appId: "1:221345458489:web:c70f1ef85a3cf2ad6260e8"
};

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// --- Lấy các đối tượng DOM ---
const userProductListDiv = document.getElementById('userProductList');
const searchInput = document.getElementById('searchInput');
const tagFiltersDiv = document.getElementById('tagFilters');
const sortOptions = document.getElementById('sortOptions');
const paginationContainer = document.getElementById('paginationContainer');
const modal = document.getElementById('registrationModal');
const closeModalBtn = document.querySelector('.close-btn');
const registrationForm = document.getElementById('registrationForm');
const modalProductId = document.getElementById('modalProductId');
const modalProductName = document.getElementById('modalProductName');

// --- Cài đặt & Biến trạng thái ---
const ITEMS_PER_PAGE = 6;
let allProducts = [];
let rawProductsData = {};
let allTags = new Set();
let currentState = {
    searchTerm: '',
    activeTag: 'all',
    sortOption: 'default',
    currentPage: 1,
};

// --- Các hàm render (không thay đổi) ---
function renderTagFilters() {
    let filtersHTML = `<button class="tag-filter-btn active" data-tag="all">Tất cả</button>`;
    allTags.forEach(tag => {
        filtersHTML += `<button class="tag-filter-btn" data-tag="${tag}">${tag}</button>`;
    });
    tagFiltersDiv.innerHTML = filtersHTML;
}

function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    paginationContainer.innerHTML = '';
    if (totalPages <= 1) return;
    paginationContainer.innerHTML += `<button class="page-btn" data-page="prev" ${currentState.currentPage === 1 ? 'disabled' : ''}>&laquo;</button>`;
    for (let i = 1; i <= totalPages; i++) {
        paginationContainer.innerHTML += `<button class="page-btn ${i === currentState.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    paginationContainer.innerHTML += `<button class="page-btn" data-page="next" ${currentState.currentPage === totalPages ? 'disabled' : ''}>&raquo;</button>`;
}

function renderProducts(productsToDisplay) {
    userProductListDiv.innerHTML = '';
    if (productsToDisplay.length > 0) {
        productsToDisplay.forEach(product => {
            const isRegistered = product.isRegistered;
            const statusText = isRegistered ? 'Đã có người đăng ký' : 'Đang mở đăng ký';
            const statusClass = isRegistered ? 'closed' : 'public';
            const buttonDisabled = isRegistered ? 'disabled' : '';
            const buttonText = isRegistered ? 'Đã Đăng Ký' : 'Đăng Ký';

            // === THAY ĐỔI BẮT ĐẦU TỪ ĐÂY ===
            const productCard = `
                <div class="user-product-card">
                    <a href="detail.html?id=${product.key}" class="product-link">
                        <div class="image-container">
                            <img src="${product.imageUrl}" alt="${product.title}">
                            <div class="product-status ${statusClass}">${statusText}</div>
                            <div class="registration-count">${product.registrationCount || 0} lượt đăng ký</div>
                        </div>
                        <div class="card-content">
                            <h3>${product.title}</h3>
                        </div>
                    </a>
                    <div class="card-content-bottom">
                         <div class="tags">
                            ${Array.isArray(product.fields) ? product.fields.map(field => `<span>${field}</span>`).join('') : ''}
                        </div>
                        <p>${product.description}</p>
                        <button class="register-btn" data-key="${product.key}" data-title="${product.title}" ${buttonDisabled}>
                            ${buttonText}
                        </button>
                    </div>
                </div>`;
            // === KẾT THÚC THAY ĐỔI ===
            userProductListDiv.innerHTML += productCard;
        });
    } else {
        userProductListDiv.innerHTML = '<p>Không tìm thấy sản phẩm nào phù hợp.</p>';
    }
}


function updateDisplay() {
    let processedProducts = [...allProducts];
    if (currentState.activeTag !== 'all') {
        processedProducts = processedProducts.filter(p => Array.isArray(p.fields) && p.fields.includes(currentState.activeTag));
    }
    if (currentState.searchTerm) {
        processedProducts = processedProducts.filter(p => p.title.toLowerCase().includes(currentState.searchTerm));
    }
    switch (currentState.sortOption) {
        case 'name-asc':
            processedProducts.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'name-desc':
            processedProducts.sort((a, b) => b.title.localeCompare(a.title));
            break;
        case 'registrations-desc':
            processedProducts.sort((a, b) => (b.registrationCount || 0) - (a.registrationCount || 0));
            break;
    }
    const totalItemsAfterFilter = processedProducts.length;
    const start = (currentState.currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const paginatedProducts = processedProducts.slice(start, end);
    renderProducts(paginatedProducts);
    renderPagination(totalItemsAfterFilter);
}


function processDataAndUpdateUI(registrationsData) {
    const registrationCounts = {};
    const confirmedProductIds = new Set();
    
    if (registrationsData) {
        Object.values(registrationsData).forEach(reg => {
            if(reg.productId) {
                registrationCounts[reg.productId] = (registrationCounts[reg.productId] || 0) + 1;
                if (reg.status === 'Tiếp nhận' || reg.status === 'Đã xong') {
                    confirmedProductIds.add(reg.productId);
                }
            }
        });
    }

    allProducts = [];
    if (rawProductsData) {
        Object.keys(rawProductsData).forEach(key => {
            const product = rawProductsData[key];
            if (product && product.status === 'public') {
                product.key = key;
                product.registrationCount = registrationCounts[key] || 0;
                product.isRegistered = confirmedProductIds.has(key);
                allProducts.push(product);
            }
        });
    }

    updateDisplay();
}

/**
 * === SỬA LỖI TẠI ĐÂY ===
 * 1. Đổi tên hàm từ initializeApp thành startApp để tránh xung đột.
 * 2. Thêm kiểm tra dữ liệu `product.fields` có phải là một mảng không.
 */
function startApp() {
    const productsRef = database.ref('products');
    const registrationsRef = database.ref('registrations');

    productsRef.once('value').then(snapshot => {
        rawProductsData = snapshot.val() || {};

        // Thu thập các tag và render bộ lọc
        Object.values(rawProductsData).forEach(product => {
            // Kiểm tra kỹ `fields` có phải là một mảng hay không
            if (product && Array.isArray(product.fields)) {
                product.fields.forEach(field => allTags.add(field));
            }
        });
        renderTagFilters();

        // Lắng nghe các thay đổi trên 'registrations'
        registrationsRef.on('value', (registrationsSnapshot) => {
            const registrationsData = registrationsSnapshot.val() || {};
            processDataAndUpdateUI(registrationsData);
        }, (error) => {
            console.error("Lỗi khi lắng nghe dữ liệu đăng ký:", error);
        });

    }).catch(error => {
        console.error("Lỗi khi tải dữ liệu sản phẩm:", error);
        userProductListDiv.innerHTML = "<p>Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.</p>";
    });
}

// --- Gắn các Event Listeners (Không thay đổi) ---
tagFiltersDiv.addEventListener('click', (e) => {
    if (e.target.classList.contains('tag-filter-btn')) {
        document.querySelector('.tag-filter-btn.active').classList.remove('active');
        e.target.classList.add('active');
        currentState.activeTag = e.target.dataset.tag;
        currentState.currentPage = 1;
        updateDisplay();
    }
});

searchInput.addEventListener('input', (e) => {
    currentState.searchTerm = e.target.value.toLowerCase().trim();
    currentState.currentPage = 1;
    updateDisplay();
});

sortOptions.addEventListener('change', (e) => {
    currentState.sortOption = e.target.value;
    currentState.currentPage = 1;
    updateDisplay();
});

paginationContainer.addEventListener('click', (e) => {
    const target = e.target.closest('.page-btn');
    if (target && !target.disabled) {
        const page = target.dataset.page;
        if (page === 'prev') {
            currentState.currentPage--;
        } else if (page === 'next') {
            currentState.currentPage++;
        } else {
            currentState.currentPage = parseInt(page);
        }
        updateDisplay();
    }
});

userProductListDiv.addEventListener('click', (e) => {
    if (e.target.classList.contains('register-btn') && !e.target.disabled) {
        const key = e.target.dataset.key;
        const title = e.target.dataset.title;
        modalProductId.value = key;
        modalProductName.innerText = title;
        modal.classList.remove('hidden');
    }
});

closeModalBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    registrationForm.reset();
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.add('hidden');
        registrationForm.reset();
    }
});

registrationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const registrationData = {
        productId: modalProductId.value,
        productName: modalProductName.innerText,
        type: document.getElementById('regType').value,
        name: document.getElementById('regName').value,
        phone: document.getElementById('regPhone').value,
        notes: document.getElementById('regNotes').value,
        timestamp: new Date().toISOString(),
        status: 'Mới'
    };

    database.ref('registrations').push(registrationData)
        .then(() => {
            alert('Đăng ký thành công! Ban tổ chức sẽ liên hệ với bạn sớm.');
            modal.classList.add('hidden');
            registrationForm.reset();
        })
        .catch(error => {
            console.error("Lỗi khi gửi đăng ký:", error);
            alert("Đã có lỗi xảy ra, vui lòng thử lại.");
        });
});

// --- Khởi chạy ứng dụng ---
// === THAY ĐỔI CUỐI CÙNG: Gọi đúng tên hàm mới ===
startApp();