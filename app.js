// Basit kullanıcı ve oturum yönetimi (localStorage ile)

const ADMIN_USER = {
    username: "admin",
    password: "admin123",
    isAdmin: true
};
// Admin hesabı bilgileri: kullanıcı adı: admin, şifre: admin123

// Kullanıcıları ve gönderileri localStorage'da tut
function getUsers() {
    let users = JSON.parse(localStorage.getItem("users") || "[]");
    // Admin yoksa ekle
    if (!users.find(u => u.username === ADMIN_USER.username)) {
        users.push(ADMIN_USER);
        localStorage.setItem("users", JSON.stringify(users));
    }
    return users;
}
function setUsers(users) {
    localStorage.setItem("users", JSON.stringify(users));
}
function getPosts() {
    return JSON.parse(localStorage.getItem("posts") || "[]");
}
function setPosts(posts) {
    localStorage.setItem("posts", JSON.stringify(posts));
}
function getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser") || "null");
}
function setCurrentUser(user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
}

// Modal işlemleri
const authModal = document.getElementById("auth-modal");
const adminModal = document.getElementById("admin-modal");
document.getElementById("login-btn").onclick = () => { authModal.style.display = "flex"; };
document.getElementById("close-modal").onclick = () => { authModal.style.display = "none"; };
document.getElementById("close-admin-modal").onclick = () => { adminModal.style.display = "none"; };
window.onclick = function(event) {
    if (event.target === authModal) authModal.style.display = "none";
    if (event.target === adminModal) adminModal.style.display = "none";
};

// Kayıt ol
document.getElementById("register-btn").onclick = function() {
    const username = document.getElementById("auth-username").value.trim();
    const password = document.getElementById("auth-password").value;
    const errorDiv = document.getElementById("auth-error");
    if (!username || !password) {
        errorDiv.textContent = "Kullanıcı adı ve şifre gerekli.";
        return;
    }
    let users = getUsers();
    if (users.find(u => u.username === username)) {
        errorDiv.textContent = "Bu kullanıcı adı zaten alınmış.";
        return;
    }
    users.push({ username, password, isAdmin: false, banned: false });
    setUsers(users);
    setCurrentUser({ username, isAdmin: false });
    errorDiv.textContent = "";
    authModal.style.display = "none";
    updateUI();
};

// Giriş yap
document.getElementById("signin-btn").onclick = function() {
    const username = document.getElementById("auth-username").value.trim();
    const password = document.getElementById("auth-password").value;
    const errorDiv = document.getElementById("auth-error");
    let users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        errorDiv.textContent = "Kullanıcı adı veya şifre hatalı.";
        return;
    }
    if (user.banned) {
        errorDiv.textContent = "Bu kullanıcı yasaklanmış.";
        return;
    }
    setCurrentUser({ username: user.username, isAdmin: !!user.isAdmin });
    errorDiv.textContent = "";
    authModal.style.display = "none";
    updateUI();
};

// Çıkış yap
document.getElementById("logout-btn").onclick = function() {
    localStorage.removeItem("currentUser");
    updateUI();
};

// Tweet yazma ve paylaşma
document.getElementById("tweet-textarea").oninput = function() {
    document.getElementById("share-btn").disabled = !this.value.trim();
};
document.getElementById("share-btn").onclick = function() {
    const textarea = document.getElementById("tweet-textarea");
    const text = textarea.value.trim();
    if (!text) return;
    const user = getCurrentUser();
    let posts = getPosts();
    posts.unshift({
        id: Date.now(),
        username: user.username,
        text,
        time: new Date().toLocaleString()
    });
    setPosts(posts);
    textarea.value = "";
    this.disabled = true;
    renderPosts();
};

// UI güncelle
function updateUI() {
    const user = getCurrentUser();
    const tweetBtn = document.getElementById("tweet-btn");
    const shareBtn = document.getElementById("share-btn");
    const textarea = document.getElementById("tweet-textarea");
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const adminPanelLink = document.getElementById("admin-panel-link");
    if (user) {
        tweetBtn.disabled = false;
        shareBtn.disabled = false;
        textarea.disabled = false;
        loginBtn.style.display = "none";
        logoutBtn.style.display = "inline-block";
        if (user.isAdmin) {
            adminPanelLink.style.display = "block";
        } else {
            adminPanelLink.style.display = "none";
        }
    } else {
        tweetBtn.disabled = true;
        shareBtn.disabled = true;
        textarea.disabled = true;
        loginBtn.style.display = "inline-block";
        logoutBtn.style.display = "none";
        adminPanelLink.style.display = "none";
    }
    renderPosts();
}
updateUI();

// Gönderileri göster
function renderPosts() {
    const feed = document.getElementById("feed");
    let posts = getPosts();
    // Tweet box'ı koru
    const tweetBox = feed.querySelector(".tweet-box");
    feed.innerHTML = "";
    feed.appendChild(tweetBox);
    posts.forEach(post => {
        const div = document.createElement("div");
        div.className = "tweet";
        div.innerHTML = `
            <img src="https://randomuser.me/api/portraits/lego/${(post.username.charCodeAt(0)%10)+1}.jpg" class="avatar" alt="Profil">
            <div class="tweet-content">
                <div class="tweet-header">
                    <span class="username">${post.username}</span>
                    <span class="time" style="margin-left:8px;">${post.time}</span>
                    ${getCurrentUser() && getCurrentUser().isAdmin ? `<button onclick="deletePost(${post.id})" style="margin-left:10px;background:#e0245e;color:#fff;border:none;border-radius:6px;padding:2px 8px;cursor:pointer;">Sil</button>` : ""}
                </div>
                <div class="tweet-text">${post.text}</div>
            </div>
        `;
        feed.appendChild(div);
    });
}

// Admin panelini göster
window.showAdminPanel = function() {
    if (!getCurrentUser() || !getCurrentUser().isAdmin) return;
    adminModal.style.display = "flex";
    renderAdminPanel();
};

// Admin paneli içeriği
function renderAdminPanel() {
    // Kullanıcılar
    const userList = document.getElementById("user-list");
    userList.innerHTML = "";
    getUsers().forEach(u => {
        if (u.username === ADMIN_USER.username) return; // admin'i yasaklama
        const li = document.createElement("li");
        li.textContent = u.username + (u.banned ? " (Yasaklı)" : "");
        if (!u.banned) {
            const banBtn = document.createElement("button");
            banBtn.textContent = "Yasakla";
            banBtn.onclick = () => { banUser(u.username); };
            li.appendChild(banBtn);
        }
        userList.appendChild(li);
    });
    // Gönderiler
    const postList = document.getElementById("post-list");
    postList.innerHTML = "";
    getPosts().forEach(p => {
        const li = document.createElement("li");
        li.textContent = `${p.username}: ${p.text}`;
        const delBtn = document.createElement("button");
        delBtn.textContent = "Sil";
        delBtn.onclick = () => { deletePost(p.id); renderAdminPanel(); };
        li.appendChild(delBtn);
        postList.appendChild(li);
    });
}

// Kullanıcıyı yasakla
function banUser(username) {
    let users = getUsers();
    users = users.map(u => u.username === username ? { ...u, banned: true } : u);
    setUsers(users);
    renderAdminPanel();
}

// Gönderi sil
window.deletePost = function(id) {
    let posts = getPosts();
    posts = posts.filter(p => p.id !== id);
    setPosts(posts);
    renderPosts();
    if (adminModal.style.display === "flex") renderAdminPanel();
};
