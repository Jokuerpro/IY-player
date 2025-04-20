const proxy = "https://cors-anywhere.herokuapp.com/";

let username = '';
let password = '';
let server = '';
let fullServerUrl = '';

document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  username = document.getElementById("username").value.trim();
  password = document.getElementById("password").value.trim();
  server = document.getElementById("server").value.trim();

  if (!username || !password || !server) {
    alert("الرجاء تعبئة جميع الحقول.");
    return;
  }

  fullServerUrl = `${proxy}http://${server}/player_api.php?username=${username}&password=${password}`;
  loginXtream();
});

async function loginXtream() {
  try {
    const response = await fetch(fullServerUrl);
    const data = await response.json();

    if (data.user_info && data.user_info.auth === 1) {
      document.getElementById("loginPage").style.display = "none";
      document.getElementById("categoryPage").style.display = "block";
      loadCategories();
    } else {
      alert("بيانات الدخول غير صحيحة.");
    }
  } catch (err) {
    console.error(err);
    alert("حدث خطأ أثناء الاتصال بالسيرفر.");
  }
}

async function loadCategories() {
  try {
    const res = await fetch(`${fullServerUrl}&action=get_live_categories`);
    const categories = await res.json();
    const categoryList = document.getElementById("categoryList");
    categoryList.innerHTML = '';

    categories.forEach(cat => {
      const btn = document.createElement("button");
      btn.textContent = cat.category_name;
      btn.onclick = () => loadChannels(cat.category_id);
      categoryList.appendChild(btn);
    });
  } catch (err) {
    console.error(err);
    alert("تعذر تحميل الفئات.");
  }
}

async function loadChannels(categoryId) {
  try {
    const res = await fetch(`${fullServerUrl}&action=get_live_streams`);
    const channels = await res.json();
    const filtered = channels.filter(c => c.category_id === categoryId);
    const channelList = document.getElementById("channelList");
    channelList.innerHTML = '';
    document.getElementById("categoryPage").style.display = "none";
    document.getElementById("channelPage").style.display = "block";

    filtered.forEach(channel => {
      const btn = document.createElement("button");
      btn.textContent = channel.name;
      btn.onclick = () => playChannel(channel.stream_id, channel.stream_type);
      channelList.appendChild(btn);
    });
  } catch (err) {
    console.error(err);
    alert("تعذر تحميل القنوات.");
  }
}

function playChannel(streamId, streamType) {
  const streamUrl = `http://${server}/live/${username}/${password}/${streamId}.${streamType}`;
  const video = document.getElementById("videoPlayer");
  video.src = streamUrl;
  video.play();

  document.getElementById("channelPage").style.display = "none";
  document.getElementById("playerPage").style.display = "block";
}

function logout() {
  document.getElementById("loginPage").style.display = "block";
  document.getElementById("categoryPage").style.display = "none";
  document.getElementById("channelPage").style.display = "none";
  document.getElementById("playerPage").style.display = "none";
    }
