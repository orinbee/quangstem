// File: ./asset/js/detail.js

const firebaseConfig = {
  apiKey: "AIzaSyCxMqYvibF01ky9faJIFb_msg-MaVvYDcI",
  authDomain: "mindxlogin.firebaseapp.com",
  databaseURL: "https://mindxlogin-default-rtdb.firebaseio.com",
  projectId: "mindxlogin",
  storageBucket: "mindxlogin.firebasestorage.app",
  messagingSenderId: "221345458489",
  appId: "1:221345458489:web:c70f1ef85a3cf2ad6260e8"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Lấy các đối tượng DOM
const loadingMessage = document.getElementById('loading-message');
const errorMessage = document.getElementById('error-message');
const productDetailContainer = document.getElementById('product-detail-container');
const productImageDiv = document.getElementById('product-image');
const productTitle = document.getElementById('product-title');
const productTags = document.getElementById('product-tags');
const productDescription = document.getElementById('product-description');

function loadProductDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if (!productId) {
        showError();
        return;
    }
    const productRef = database.ref('products/' + productId);
    productRef.once('value').then(snapshot => {
        const product = snapshot.val();
        if (product) {
            displayProduct(product);
        } else {
            showError();
        }
    }).catch(error => {
        console.error("Lỗi khi lấy dữ liệu sản phẩm:", error);
        showError();
    });
}

function displayProduct(product) {
    loadingMessage.style.display = 'none';
    productDetailContainer.style.display = 'flex';
    document.title = product.title;
    productTitle.textContent = product.title;
    productDescription.textContent = product.content || product.description;

    // Chèn ảnh vào div
    productImageDiv.innerHTML = `<img id="product-main-image" src="${product.imageUrl}" alt="${product.title}">`;
    
    if (Array.isArray(product.fields)) {
        productTags.innerHTML = product.fields.map(field => `<span>Lĩnh vực: ${field}</span>`).join('');
    }

    // === GỌI HÀM KÍCH HOẠT ZOOM SAU KHI ẢNH ĐƯỢC TẠO ===
    enableImageZoom("product-main-image", "zoomed-image-result");
}

function showError() {
    loadingMessage.style.display = 'none';
    errorMessage.style.display = 'block';
}


// === HÀM MỚI: XỬ LÝ LOGIC ZOOM ẢNH ===
function enableImageZoom(imgID, resultID) {
    const img = document.getElementById(imgID);
    const result = document.getElementById(resultID);
    let lens, ratioX, ratioY;

    // 1. Tạo ống kính
    lens = document.createElement("DIV");
    lens.setAttribute("class", "img-zoom-lens");
    img.parentElement.insertBefore(lens, img);

    // 2. Tính toán tỷ lệ phóng to
    // Tỷ lệ = kích thước khung kết quả / kích thước ống kính
    ratioX = result.offsetWidth / lens.offsetWidth;
    ratioY = result.offsetHeight / lens.offsetHeight;

    // 3. Thiết lập background cho khung kết quả
    result.style.backgroundImage = "url('" + img.src + "')";
    // Kích thước của ảnh background phải được phóng to theo đúng tỷ lệ
    result.style.backgroundSize = (img.width * ratioX) + "px " + (img.height * ratioY) + "px";

    // 4. Thêm sự kiện di chuyển chuột cho cả ảnh và ống kính
    lens.addEventListener("mousemove", moveLens);
    img.addEventListener("mousemove", moveLens);
    lens.addEventListener("mouseenter", () => { lens.style.visibility = 'visible'; });
    img.addEventListener("mouseenter", () => { lens.style.visibility = 'visible'; });
    lens.addEventListener("mouseleave", () => { lens.style.visibility = 'hidden'; });
    img.addEventListener("mouseleave", () => { lens.style.visibility = 'hidden'; });


    function moveLens(e) {
        e.preventDefault();
        
        // 5. Lấy vị trí con trỏ chuột
        const pos = getCursorPos(e);
        let x = pos.x;
        let y = pos.y;

        // 6. Ngăn ống kính di chuyển ra ngoài phạm vi ảnh
        if (x > img.width - (lens.offsetWidth / 2)) { x = img.width - (lens.offsetWidth / 2); }
        if (x < lens.offsetWidth / 2) { x = lens.offsetWidth / 2; }
        if (y > img.height - (lens.offsetHeight / 2)) { y = img.height - (lens.offsetHeight / 2); }
        if (y < lens.offsetHeight / 2) { y = lens.offsetHeight / 2; }
        
        // 7. Thiết lập vị trí cho ống kính
        lens.style.left = (x - lens.offsetWidth / 2) + "px";
        lens.style.top = (y - lens.offsetHeight / 2) + "px";

        // 8. Di chuyển ảnh background trong khung kết quả
        // Vị trí background di chuyển ngược hướng và nhân với tỷ lệ
        result.style.backgroundPosition = "-" + ((x - lens.offsetWidth / 2) * ratioX) + "px -" + ((y - lens.offsetHeight / 2) * ratioY) + "px";
    }

    function getCursorPos(e) {
        let a, x = 0, y = 0;
        e = e || window.event;
        // Lấy vị trí của ảnh trên trang
        a = img.getBoundingClientRect();
        // Tính toán vị trí con trỏ so với ảnh
        x = e.pageX - a.left - window.scrollX;
        y = e.pageY - a.top - window.scrollY;
        return {x : x, y : y};
    }
}


// --- Khởi chạy ---
loadProductDetails();