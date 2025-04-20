
let baseUrl = "", username = "", password = "", hls;
let allChannels = [], allVod = [], allSeries = [];

async function login() {
  baseUrl = document.getElementById("serverUrl").value.trim();
  username = document.getElementById("username").value.trim();
  password = document.getElementById("password").value.trim();
  const url = `${baseUrl}/player_api.php?username=${username}&password=${password}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.user_info && data.user_info.auth == 1) {
      document.getElementById("loginSection").style.display = "none";
      document.getElementById("appContent").style.display = "block";
      document.getElementById("userInfo").style.display = "flex";
      document.getElementById("welcomeText").textContent = `مرحباً ${data.user_info.username} | حتى: ${new Date(data.user_info.exp_date * 1000).toLocaleDateString()}`;
      document.getElementById("activeCons").textContent = ` | متصلين: ${data.user_info.active_cons}`;
      loadCategories();
      loadVodCategories();
      loadSeries();
      loadFavorites();
    } else {
      alert("بيانات غير صحيحة");
    }
  } catch {
    alert("فشل الاتصال بالخادم");
  }
}

function logout() {
  location.reload();
}

function showSection(section) {
  document.querySelectorAll(".container").forEach(c => c.style.display = "none");
  document.getElementById(section + "Section").style.display = "block";
}

async function loadCategories() {
  const res = await fetch(`${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_live_categories`);
  const cats = await res.json();
  const catList = document.getElementById("categoryList");
  catList.innerHTML = "";
  cats.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat.category_id;
    option.text = cat.category_name;
    catList.appendChild(option);
  });
  loadChannels();
}

async function loadChannels() {
  const catId = document.getElementById("categoryList").value;
  const res = await fetch(`${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_live_streams&category_id=${catId}`);
  allChannels = await res.json();
  updateSelect("channelList", allChannels);
  playChannel();
}

function playChannel() {
  const id = document.getElementById("channelList").value;
  const streamUrl = `${baseUrl}/live/${username}/${password}/${id}.m3u8`;
  const video = document.getElementById("videoPlayer");
  if (hls) hls.destroy();
  if (Hls.isSupported()) {
    hls = new Hls();
    hls.loadSource(streamUrl);
    hls.attachMedia(video);
    hls.on(Hls.Events.ERROR, function (event, data) {
      if (data.fatal) hls.startLoad();
    });
  } else {
    video.src = streamUrl;
    video.play();
  }
}

async function loadVodCategories() {
  const res = await fetch(`${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_vod_categories`);
  const cats = await res.json();
  const vodCatList = document.getElementById("vodCatList");
  vodCatList.innerHTML = "";
  cats.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat.category_id;
    option.text = cat.category_name;
    vodCatList.appendChild(option);
  });
  loadVod();
}

async function loadVod() {
  const catId = document.getElementById("vodCatList").value;
  const res = await fetch(`${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_vod_streams&category_id=${catId}`);
  allVod = await res.json();
  updateSelect("vodList", allVod);
  playVod();
}

function playVod() {
  const id = document.getElementById("vodList").value;
  const url = `${baseUrl}/movie/${username}/${password}/${id}.mp4`;
  const player = document.getElementById("vodPlayer");
  player.src = url;
  player.play();
}

async function loadSeries() {
  const res = await fetch(`${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_series`);
  allSeries = await res.json();
  updateSelect("seriesList", allSeries);
  loadEpisodes();
}

async function loadEpisodes() {
  const id = document.getElementById("seriesList").value;
  const res = await fetch(`${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_series_info&series_id=${id}`);
  const data = await res.json();
  const episodes = [];
  data.episodes.forEach(season => {
    season.episodes.forEach(ep => {
      episodes.push({ stream_id: ep.id, name: `${season.season_num} - ${ep.title}` });
    });
  });
  updateSelect("episodeList", episodes);
  playEpisode();
}

function playEpisode() {
  const id = document.getElementById("episodeList").value;
  const url = `${baseUrl}/series/${username}/${password}/${id}.mp4`;
  const player = document.getElementById("seriesPlayer");
  player.src = url;
  player.play();
}

function updateSelect(id, items) {
  const list = document.getElementById(id);
  list.innerHTML = "";
  items.forEach(i => {
    const option = document.createElement("option");
    option.value = i.stream_id || i.series_id || i.id;
    option.text = i.name;
    list.appendChild(option);
  });
}

function handleSearch() {
  const q = document.getElementById("searchInput").value.toLowerCase();
  if (document.getElementById("liveSection").style.display === "block")
    filterSelect("channelList", allChannels, q);
  else if (document.getElementById("vodSection").style.display === "block")
    filterSelect("vodList", allVod, q);
  else if (document.getElementById("seriesSection").style.display === "block")
    filterSelect("seriesList", allSeries, q);
}

function filterSelect(id, data, query) {
  const filtered = data.filter(item => item.name.toLowerCase().includes(query));
  updateSelect(id, filtered);
}

function addToFavorites(type) {
  const storageKey = "favorites";
  const list = JSON.parse(localStorage.getItem(storageKey) || "[]");
  let select, selected, label;
  if (type === "live") {
    select = document.getElementById("channelList");
    selected = allChannels.find(c => c.stream_id == select.value);
    label = "قناة";
  } else if (type === "vod") {
    select = document.getElementById("vodList");
    selected = allVod.find(c => c.stream_id == select.value);
    label = "فيلم";
  } else {
    select = document.getElementById("seriesList");
    selected = allSeries.find(c => c.series_id == select.value);
    label = "مسلسل";
  }
  if (selected) {
    list.push({ type, name: selected.name, id: selected.stream_id || selected.series_id });
    localStorage.setItem(storageKey, JSON.stringify(list));
    alert(`${label} تمت إضافته إلى المفضلة`);
    loadFavorites();
  }
}

function loadFavorites() {
  const list = JSON.parse(localStorage.getItem("favorites") || "[]");
  const container = document.getElementById("favoritesList");
  container.innerHTML = "";
  list.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.name} (${item.type})`;
    container.appendChild(li);
  });
}
