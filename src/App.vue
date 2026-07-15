<template>
  <div class="app-container">
    <!-- 상단 네비게이션 바 -->
    <header class="navbar">
      <div class="logo">🎈 {{ t('logo') }}</div>
      <div class="nav-controls">
        <nav class="nav-links">
          <a href="#home" :class="{ active: currentTab === 'home' }" @click="currentTab = 'home'">{{ t('navHome') }}</a>
          <a href="#board" :class="{ active: currentTab === 'board' }" @click="currentTab = 'board'">{{ t('navBoard') }}</a>
        </nav>
        
        <div class="lang-switcher">
          <button :class="{ active: locale === 'ko' }" @click="locale = 'ko'">한국어</button>
          <button :class="{ active: locale === 'en' }" @click="locale = 'en'">English</button>
          <button :class="{ active: locale === 'zh' }" @click="locale = 'zh'">中文</button>
        </div>
      </div>
    </header>

    <!-- ==================== [탭 1: 홈 (구별 관광지/경로 및 지도)] ==================== -->
    <div v-if="currentTab === 'home'">
      <section class="hero">
        <!-- 3번 요구사항: 귀여운 폰트가 확실하게 강제 적용되는 타이틀 -->
        <h1 class="hero-main-title">{{ t('heroTitle') }}</h1>
        <p>{{ t('heroSub') }}</p>
        <div class="search-box">
          <select v-model="selectedDistrict" @change="handleDistrictChange">
            <option value="">{{ t('selectDistrict') }}</option>
            <option v-for="dist in districts" :key="dist" :value="dist">{{ t(dist) }}</option>
          </select>
        </div>
      </section>

      <main class="main-content">
        <!-- 좌측: 귀여운 미니멀 지도 영역 -->
        <div class="map-section">
          <div class="map-wrapper">
            <div id="map" class="seoul-map"></div>
            <div v-if="!selectedDistrict" class="map-overlay-tips">
              <p>🗺️ 구를 선택하시면 상큼한 지도가 나타나요!</p>
            </div>
          </div>
          
          <div v-if="selectedDistrict && currentTmi" class="tmi-box">
            <h4>✨ {{ t(selectedDistrict) }} 꿀팁 TMI</h4>
            <p><strong>📍 {{ t('tmiPlace') }}:</strong> {{ currentTmi.placeName }}</p>
            <p class="tmi-text">{{ currentTmi.tmi }}</p>
          </div>
        </div>

        <!-- 우측: 관광명소 / 여행경로 데이터 리스트 -->
        <div class="list-section">
          <div class="category-tabs">
            <button v-for="cat in categories" :key="cat" :class="{ active: selectedCategory === cat }" @click="selectedCategory = cat">
              {{ t(cat) }}
            </button>
          </div>

          <h2 class="section-title">
            <span>{{ selectedDistrict ? t(selectedDistrict) : t('allSeoul') }}</span> 
            <span class="category-sub-tag">{{ t(selectedCategory) }} ({{ filteredPlaces.length }})</span>
          </h2>
          
          <div v-if="filteredPlaces.length === 0" class="no-data">
            🐰 {{ t('noPlaces') }}
          </div>

          <div v-else class="card-grid">
            <div v-for="(place, index) in filteredPlaces" :key="index" class="card" @click="clickPlace(place)">
              <span class="badge" :class="place.source">{{ t(place.source) }}</span>
              <h3>{{ place.title || place.courseName || '이름 없는 장소' }}</h3>
              <p class="addr" v-if="place.addr1 || place.district">📍 {{ place.addr1 || place.district }}</p>
              <p class="click-tip">클릭시 지도로 이동 🔍</p>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- ==================== [탭 2: 여행 커뮤니티] ==================== -->
    <div v-if="currentTab === 'board'" class="board-container">
      <section class="board-header">
        <h1>{{ t('boardTitle') }}</h1>
        <p>{{ t('boardSub') }}</p>
      </section>

      <div class="board-content">
        <!-- 좌측: 글작성 폼 -->
        <div class="form-section modern-card">
          <h2>{{ isEditing ? t('editPost') : t('writePost') }}</h2>
          <div class="input-container-box">
            <div class="input-row-twin">
              <input v-model="boardForm.title" type="text" :placeholder="t('phTitle')" class="custom-input title-input" />
              <input v-model="boardForm.password" type="password" :placeholder="t('phPw')" class="custom-input pw-input" />
            </div>
            <div class="tag-helper-text">💡 본문에 #을 쓰면 태그가 자동 생성됩니다!</div>
            <textarea v-model="boardForm.content" :placeholder="t('phContent')" rows="6" class="custom-textarea"></textarea>
          </div>
          <div class="form-buttons">
            <button @click="savePost" class="btn-submit">{{ isEditing ? t('btnEditComplete') : t('btnRegister') }}</button>
            <button v-if="isEditing" @click="resetForm" class="btn-cancel">{{ t('btnCancel') }}</button>
          </div>
        </div>

        <!-- 우측: 피드 리스트 -->
        <div class="feed-section">
          <h2>✨ {{ t('postCount') }} <span class="count-badge">{{ posts.length }}</span></h2>
          <div v-if="posts.length === 0" class="no-feed-data">📸 {{ t('noPosts') }}</div>
          <div v-else class="feed-list">
            <div v-for="post in posts" :key="post.id" class="feed-card" @click="selectedPost = selectedPost?.id === post.id ? null : post">
              <div class="feed-header-info">
                <div class="user-avatar">🧸</div>
                <div class="meta-data">
                  <h3>{{ post.title }}</h3>
                  <div class="sub-info">
                    <span class="anonymous-name">익명 여행러</span>
                    <span class="dot">·</span>
                    <span class="date-text">{{ post.date }}</span>
                  </div>
                </div>
              </div>
              <div v-if="selectedPost?.id === post.id" class="feed-body">
                <p class="feed-text">{{ post.content }}</p>
                <div class="feed-actions">
                  <button @click.stop="startEdit(post)" class="action-btn edit-action">✏️ 고치기</button>
                  <button @click.stop="deletePost(post)" class="action-btn delete-action">🗑️ 지우기</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 챗봇 플로팅 UI -->
    <div class="chatbot-wrapper">
      <button class="chatbot-toggle-btn" @click="isChatOpen = !isChatOpen">
        <span v-if="!isChatOpen">💬 봇이랑 대화</span>
        <span v-else>❌ 닫기</span>
      </button>

      <div v-if="isChatOpen" class="chatbot-window">
        <div class="chatbot-header">
          <h3>🤖 가이드 봇</h3>
          <p>서울 여행코스를 물어보세요!</p>
        </div>
        
        <div class="chatbot-messages" ref="messageBox">
          <div v-for="(msg, idx) in chatMessages" :key="idx" :class="['message-bubble', msg.role]">
            <strong>{{ msg.role === 'user' ? '나' : 'AI' }}:</strong>
            <p>{{ msg.content }}</p>
          </div>
          <div v-if="isChatLoading" class="message-bubble assistant loading">
            ⏳ 열심히 생각 중...
          </div>
        </div>

        <div class="chatbot-input">
          <input v-model="userInput" @keyup.enter="askChatbot" type="text" :placeholder="t('botPh')" :disabled="isChatLoading" />
          <button @click="askChatbot" :disabled="isChatLoading">보내기</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import tourData from './assets/seoul_tour.json';
import courseData from './assets/seoul_course.json'; 
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const locale = ref('ko'); 

const messages = {
  ko: {
    logo: '서울구경 몽글투어', navHome: '🌸 구별 소풍 지도', navBoard: '💌 여행 피드',
    heroTitle: '어느 구로 소풍을 떠나볼까요?', heroSub: '원하는 구를 선택해서 소풍 경로와 가볼만한 곳을 확인하세요!',
    selectDistrict: '✨ 구를 선택해 주세요', allSeoul: '서울 전체 지역', noPlaces: '아래에서 구를 선택하시면 상큼한 정보가 가득 나타나요!',
    관광명소: '🍦 가볼만한 곳', 여행경로: '🚲 추천 한바퀴 코스', tmiPlace: '대표 장소',
    boardTitle: '💌 실시간 여행 피드', boardSub: '서울의 예쁜 카페, 소풍 명소 후기를 자유롭게 남겨주세요.',
    writePost: '✍️ 몽글한 추억 남기기', editPost: '📝 이야기 고치기', postCount: '여행자들의 이야기', noPosts: '첫 번째 감성 명소 후기를 남겨보세요!',
    phTitle: '예쁜 제목', phPw: '비밀번호', phContent: '공유하고 싶은 이야기를 적어주세요!',
    btnRegister: '피드 올리기', btnEditComplete: '수정 완료', btnCancel: '돌아가기', botPh: '코스를 물어보세요!',
    '종로구': '종로구', '중구': '중구', '용산구': '용산구', '성동구': '성동구', '마포구': '마포구', '강남구': '강남구', '영등포구': '영등포구', '동작구': '동작구'
  },
  en: {
    logo: 'Seoul Tour', navHome: 'Map', navBoard: 'Feed',
    heroTitle: 'Where to go?', heroSub: 'Select a district to explore.',
    selectDistrict: 'Select District', allSeoul: 'All Seoul', noPlaces: 'Select a district first!',
    관광명소: 'Attractions', 여행경로: 'Courses', tmiPlace: 'Main Place',
    boardTitle: 'Travel Feed', boardSub: 'Share your stories.',
    writePost: 'Write Post', editPost: 'Edit Post', postCount: 'Feeds', noPosts: 'No posts yet.',
    phTitle: 'Title', phPw: 'Password', phContent: 'Content',
    btnRegister: 'Submit', btnEditComplete: 'Save', btnCancel: 'Cancel', botPh: 'Ask anything!',
    '종로구': 'Jongno', '중구': 'Jung', '용산구': 'Yongsan', '성동구': 'Seongdong', '마포구': 'Mapo', '강남구': 'Gangnam', '영등포구': 'Yeongdeungpo', '동작구': 'Dongjak'
  },
  zh: {
    logo: '首尔观光 梦幻之旅', navHome: '地区地图', navBoard: '旅行动态',
    heroTitle: '今天去哪个区散步呢？', heroSub: '选择您想去的区 查看路线和景点！',
    selectDistrict: '请选择区', allSeoul: '首尔全区', noPlaces: '请先选择一个区！',
    관광명소: '旅游景点', 여행경로: '推荐路线', tmiPlace: '代表性景点',
    boardTitle: '💌 实时旅行动态', boardSub: '自由分享首尔漂亮咖啡厅、野餐胜地的心得吧。',
    writePost: '✍️ 留下美好的回忆', editPost: '📝 修改动态', postCount: '游客们的分享', noPosts: '留下第一个感性景点的评价吧！',
    phTitle: '漂亮的标题', phPw: '密码', phContent: '请写下你想分享的故事！',
    btnRegister: '发布动态', btnEditComplete: '修改完成', btnCancel: '返回', botPh: '请询问路线！',
    '종로구': '钟路区', '중구': '中区', '용산구': '龙山区', '성동구': '城东区', '마포구': '麻浦区', '강남구': '江南区', '영등포구': '永登浦区', '동작구': '铜雀区'
  }
};

const t = (key) => messages[locale.value]?.[key] || key;

const currentTab = ref('home');
const selectedDistrict = ref('');
const selectedCategory = ref('관광명소');
const categories = ['관광명소', '여행경로']; 
const districts = ['종로구', '중구', '용산구', '성동구', '마포구', '강남구', '영등포구', '동작구'];

const allLocations = ref([]);
let map = null;
let currentMarker = null;

const districtTmiData = {
  '종로구': { lat: 37.5796, lng: 126.9770, placeName: '경복궁', tmi: '고풍스러운 한복을 입고 입장하면 입장료가 면제돼요!' },
  '중구': { lat: 37.5512, lng: 126.9882, placeName: 'N서울타워', tmi: '타워 불빛이 파란색이면 서울 공기가 아주 맑다는 뜻이에요!' },
  '용산구': { lat: 37.5240, lng: 126.9804, placeName: '국립중앙박물관', tmi: '야외 거울못에 비치는 풍경은 인생샷 명소랍니다.' },
  '성동구': { lat: 37.5443, lng: 127.0374, placeName: '서울숲', tmi: '귀여운 꽃사슴들에게 먹이를 주는 힐링존이 숨어있어요.' },
  '마포구': { lat: 37.5558, lng: 126.9240, placeName: '홍대 걷고싶은거리', tmi: '버스킹 공연과 아기자기한 소품샵들이 가득해요.' },
  '강남구': { lat: 37.5113, lng: 127.0596, placeName: '별마당 도서관', tmi: '거대한 서가는 어떻게 찍어도 감성 가득하게 나와요.' },
  '영등포구': { lat: 37.5284, lng: 126.9331, placeName: '여의도 한강공원', tmi: '시원한 강바람을 맞으며 돗자리 피크닉을 즐기기 좋아요.' },
  '동작구': { lat: 37.5144, lng: 126.9408, placeName: '노량진 수산시장', tmi: '활기찬 에너지와 싱싱한 해산물을 맛볼 수 있는 곳입니다.' }
};

const currentTmi = computed(() => districtTmiData[selectedDistrict.value] || null);

const posts = ref([]);
const selectedPost = ref(null);
const isEditing = ref(false);
const editingId = ref(null);
const boardForm = ref({ title: '', password: '', content: '' });

const userInput = ref('');
const chatMessages = ref([]);
const isChatOpen = ref(false);
const isChatLoading = ref(false);
const messageBox = ref(null);

watch(currentTab, async (newTab) => {
  if (newTab === 'home') {
    await nextTick();
    initMap();
  }
});

onMounted(() => {
  const extractItems = (data) => {
    if (!data) return [];
    if (data.items && Array.isArray(data.items)) return data.items;
    if (Array.isArray(data)) return data;
    return [];
  };

  const tours = extractItems(tourData).map(item => ({
    ...item,
    source: '관광명소',
    district: item.addr1 ? item.addr1.split(' ')[1] : ''
  }));

  const courses = extractItems(courseData).map(item => ({
    ...item,
    source: '여행경로',
    district: item.district || item.addr1 || item.courseName || ''
  }));

  allLocations.value = [...tours, ...courses];

  const savedPosts = localStorage.getItem('seoul_board_posts');
  if (savedPosts) posts.value = JSON.parse(savedPosts);

  initMap();
});

const initMap = () => {
  if (map) { map.remove(); map = null; }
  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  map = L.map('map', { zoomControl: false }).setView([37.5665, 126.9780], 11);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
};

const filteredPlaces = computed(() => {
  if (!selectedDistrict.value) return [];
  return allLocations.value.filter(place => {
    const targetText = `${place.addr1 || ''} ${place.district || ''} ${place.title || ''} ${place.courseName || ''}`;
    const matchDistrict = targetText.includes(selectedDistrict.value);
    const matchCategory = place.source === selectedCategory.value;
    return matchDistrict && matchCategory;
  });
});

const handleDistrictChange = () => {
  if (!map) return;
  if (currentMarker) { map.removeLayer(currentMarker); currentMarker = null; }

  const tmiInfo = currentTmi.value;
  if (tmiInfo) {
    map.flyTo([tmiInfo.lat, tmiInfo.lng], 13, { duration: 1.0 });
    createNewMarker(tmiInfo.lat, tmiInfo.lng, tmiInfo.placeName);
  } else {
    map.flyTo([37.5665, 126.9780], 11, { duration: 1.0 });
  }
};

const clickPlace = (place) => {
  if (!map) return;
  
  let lat = parseFloat(place.mapy || place.lat);
  let lng = parseFloat(place.mapx || place.lng);
  
  if (isNaN(lat) || isNaN(lng)) {
    const backup = districtTmiData[selectedDistrict.value];
    if (backup) {
      lat = backup.lat + (Math.random() - 0.5) * 0.01;
      lng = backup.lng + (Math.random() - 0.5) * 0.01;
    } else {
      lat = 37.5665; lng = 126.9780;
    }
  }

  map.flyTo([lat, lng], 14, { duration: 0.8 });
  createNewMarker(lat, lng, place.title || place.courseName);
};

const createNewMarker = (lat, lng, title) => {
  if (currentMarker) map.removeLayer(currentMarker);

  const cuteIcon = L.divIcon({
    className: 'cute-marker',
    html: `<div class="bounce-pin">📍</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30]
  });

  currentMarker = L.marker([lat, lng], { icon: cuteIcon }).addTo(map);
  currentMarker.bindPopup(`<div class="pop-bubble">🌸 <b>${title}</b></div>`, { closeButton: false }).openPopup();
};

const updateLocalStorage = () => localStorage.setItem('seoul_board_posts', JSON.stringify(posts.value));
const resetForm = () => { boardForm.value = { title: '', password: '', content: '' }; isEditing.value = false; editingId.value = null; };
const savePost = () => {
  if (!boardForm.value.title || !boardForm.value.password || !boardForm.value.content) return alert('빈칸을 채워주세요!');
  if (isEditing.value) {
    const index = posts.value.findIndex(p => p.id === editingId.value);
    if (posts.value[index].password !== boardForm.value.password) return alert('비밀번호 불일치!');
    posts.value[index].title = boardForm.value.title;
    posts.value[index].content = boardForm.value.content;
  } else {
    posts.value.unshift({ id: Date.now(), title: boardForm.value.title, password: boardForm.value.password, content: boardForm.value.content, date: new Date().toLocaleDateString() });
  }
  updateLocalStorage(); resetForm();
};
const startEdit = (post) => { isEditing.value = true; editingId.value = post.id; boardForm.value = { title: post.title, password: '', content: post.content }; };
const deletePost = (post) => {
  const pw = prompt('비밀번호를 입력하세요:');
  if (pw === post.password) { 
    posts.value = posts.value.filter(p => p.id !== post.id); updateLocalStorage(); 
  } else if (pw !== null) alert('비밀번호가 틀렸습니다!');
};

const askChatbot = async () => {
  if (!userInput.value.trim() || isChatLoading.value) return;
  chatMessages.value.push({ role: 'user', content: userInput.value });
  userInput.value = '';
  isChatLoading.value = true;
  await nextTick(() => { messageBox.value.scrollTop = messageBox.value.scrollHeight; });
  setTimeout(() => {
    chatMessages.value.push({ role: 'assistant', content: '🌸 서울의 예쁜 코스를 찾으시는군요! 현재 데이터를 기반으로 추천해 드릴게요.' });
    isChatLoading.value = false;
    nextTick(() => { messageBox.value.scrollTop = messageBox.value.scrollHeight; });
  }, 700);
};
</script>

<style scoped>
/* 폰트 대변혁 구역: 귀여운 온글잎 밑미체/쿠키런체 로드 및 영어/중국어용 Pretendard 동시 임포트 */
@import url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2102-2@1.0/CookieRun-Regular.woff');
@import url('https://cdn.jsdelivr.net/gh/projectnoonnu/2403-2@1.0/ownglyph_mitmi-Rg.woff');
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');

.app-container { 
  /* 한글은 귀여운 폰트 우선, 영문/중문은 Pretendard가 매끄럽게 우선 적용되도록 선언 조정 */
  font-family: 'ownglyph_mitmi-Rg', 'CookieRun-Regular', 'Pretendard', sans-serif !important;
  font-weight: 700 !important; 
  color: #4a5568; 
  background: #fdfbf7;
  min-height: 100vh;
  font-size: 18px; /* 손글씨 특성상 가독성을 위해 베이스 크기를 살짝 키웠습니다 */
}

/* 3번 해결: 메인 타이틀 폰트 확실하게 잡기 (쿠키런 폰트로 둥글고 두껍게 고정) */
.hero-main-title {
  font-family: 'CookieRun-Regular', 'Pretendard', sans-serif !important;
  font-weight: 900 !important;
  font-size: 36px !important;
  color: #2d3436;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

/* 모든 입력 폼에도 가독성이 보장된 둥근 폰트 강제 주입 */
.custom-input, .custom-textarea, select, button {
  font-family: 'CookieRun-Regular', 'ownglyph_mitmi-Rg', 'Pretendard', sans-serif !important;
}

/* 상단 네비게이션 바 */
.navbar { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 15px 30px; 
  background: white;
  border-bottom: 2px solid #f3eae1;
  flex-wrap: wrap; 
  gap: 15px;
}
.logo { font-size: 24px; font-weight: 900; color: #ff7675; font-family: 'CookieRun-Regular', sans-serif !important; }
.nav-controls { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.nav-links a { text-decoration: none; color: #a0aec0; font-weight: 900; margin-left: 15px; font-size: 17px; }
.nav-links a.active { color: #ff7675; border-bottom: 3px solid #ff7675; padding-bottom: 2px; }

.lang-switcher { display: flex; gap: 5px; background: #ede7e1; padding: 4px; border-radius: 20px; }
.lang-switcher button { background: transparent; border: none; padding: 5px 12px; border-radius: 15px; cursor: pointer; font-size: 14px; font-weight: 900; color: #666; }
.lang-switcher button.active { background: #ff7675; color: white; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }

/* 배너 코너 */
.hero { text-align: center; padding: 35px 20px; background: linear-gradient(135deg, #fff9f4 0%, #ffeaa7 100%); border-radius: 0 0 30px 30px; }
.hero p { color: #636e72; font-size: 16px; margin-bottom: 15px; font-weight: 700; }
.search-box select { padding: 10px 20px; font-size: 15px; border-radius: 20px; border: 2px solid #ff7675; outline: none; font-weight: 900; }

/* 메인 그리드 바디 */
.main-content { display: flex; padding: 25px 30px; gap: 25px; flex-wrap: wrap; }
.map-section { flex: 1; min-width: 320px; display: flex; flex-direction: column; gap: 15px; }
.map-wrapper { position: relative; border-radius: 20px; overflow: hidden; border: 4px solid white; box-shadow: 0 8px 20px rgba(0,0,0,0.05); }
.seoul-map { height: 380px; background: #eef2f5; }
.map-overlay-tips { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.8); display: flex; align-items: center; justify-content: center; font-weight: 900; color: #7f8c8d; z-index: 999; }

/* 마커 */
:deep(.cute-marker) { display: flex; align-items: center; justify-content: center; }
.bounce-pin { font-size: 36px; animation: bounce 0.5s infinite alternate; }
@keyframes bounce { 0% { transform: translateY(0); } 100% { transform: translateY(-6px); } }
:deep(.pop-bubble) { font-family: inherit; font-size: 14px; font-weight: 700; }

.tmi-box { background: white; border-radius: 15px; padding: 15px; border: 2px dashed #ffeaa7; }
.tmi-box h4 { margin: 0 0 5px 0; color: #e17055; font-size: 16px; font-weight: 900; }
.tmi-text { font-size: 14px; color: #636e72; margin: 5px 0 0 0; }

/* 리스트 스타일 */
.list-section { flex: 1.2; min-width: 350px; }
.category-tabs { display: flex; gap: 8px; margin-bottom: 15px; }
.category-tabs button { padding: 8px 16px; border: none; background: #e0d9d1; border-radius: 20px; cursor: pointer; font-weight: 900; font-size: 14px; }
.category-tabs button.active { background: #ff7675; color: white; }

.section-title { font-size: 20px; font-weight: 900; margin-bottom: 12px; }
.category-sub-tag { font-size: 12px; background: #ffeaa7; color: #d63031; padding: 2px 8px; border-radius: 10px; margin-left: 5px; }
.no-data { text-align: center; padding: 40px 0; font-weight: 900; color: #b2bec3; }

.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; max-height: 400px; overflow-y: auto; padding-right: 5px; }
.card { background: white; border-radius: 15px; padding: 14px; border: 1px solid #f3eae1; cursor: pointer; transition: transform 0.2s; position: relative; }
.card:hover { transform: translateY(-2px); border-color: #ff7675; }
.card h3 { font-size: 15px; margin: 6px 0 4px 0; font-weight: 900; color: #2d3436; }
.badge { display: inline-block; padding: 2px 6px; font-size: 11px; border-radius: 6px; color: white; font-weight: 900; }
.badge.관광명소 { background: #74b9ff; }
.badge.여행경로 { background: #a29bfe; }
.addr { font-size: 12px; color: #95a5a6; margin: 0; font-weight: 700; }
.click-tip { font-size: 11px; color: #ff7675; text-align: right; margin: 4px 0 0 0; font-weight: 900; opacity: 0; }
.card:hover .click-tip { opacity: 1; }

/* 입력창 너비 최적화 구역 */
.board-container { padding: 20px 30px; max-width: 1000px; margin: 0 auto; }
.board-header { text-align: center; margin-bottom: 25px; }
.board-header h1 { font-size: 26px; font-weight: 900; }
.board-content { display: flex; gap: 25px; flex-wrap: wrap; }

.form-section { flex: 1; min-width: 320px; }
.modern-card { background: white; border-radius: 20px; border: 1px solid #f3eae1; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
.form-section h2 { font-size: 18px; margin: 0 0 15px 0; font-weight: 900; }

.input-container-box { width: 100%; display: flex; flex-direction: column; gap: 10px; box-sizing: border-box; }
.input-row-twin { display: flex; gap: 10px; width: 100%; box-sizing: border-box; }

.custom-input { 
  padding: 10px 12px; 
  border: 1.5px solid #edf2f7; 
  border-radius: 10px; 
  font-size: 14px; 
  font-weight: 700;
  outline: none; 
  background: #fdfdfd; 
  box-sizing: border-box;
}
.title-input { flex: 2; width: 0; }
.pw-input { flex: 1; width: 0; }

.tag-helper-text { font-size: 12px; color: #a0aec0; font-weight: 700; }
.custom-textarea { 
  width: 100%; 
  padding: 12px; 
  border: 1.5px solid #edf2f7; 
  border-radius: 10px; 
  font-size: 14px; 
  font-weight: 700;
  outline: none; 
  background: #fdfdfd; 
  resize: none; 
  box-sizing: border-box;
}
.custom-input:focus, .custom-textarea:focus { border-color: #ff7675; background: white; }

.form-buttons { display: flex; gap: 6px; margin-top: 10px; }
.btn-submit { flex: 2; background: #ff7675; color: white; border: none; padding: 11px; border-radius: 10px; cursor: pointer; font-weight: 900; font-size: 15px; }
.btn-cancel { flex: 1; background: #eee; color: #555; border: none; padding: 11px; border-radius: 10px; cursor: pointer; font-weight: 900; }

/* 피드 */
.feed-section { flex: 1.2; min-width: 340px; }
.feed-section h2 { font-size: 18px; margin: 0 0 15px 0; font-weight: 900; }
.count-badge { background: #ffeaa7; color: #d63031; padding: 2px 6px; border-radius: 8px; font-size: 13px; font-weight: 900; }
.no-feed-data { padding: 40px; text-align: center; color: #b2bec3; background: white; border-radius: 20px; border: 1px solid #f3eae1; font-weight: 900; }

.feed-list { display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; }
.feed-card { background: white; border: 1px solid #f3eae1; border-radius: 15px; padding: 12px; cursor: pointer; }
.feed-header-info { display: flex; align-items: center; gap: 10px; }
.user-avatar { font-size: 20px; }
.meta-data h3 { margin: 0; font-size: 14px; font-weight: 900; color: #2d3436; }
.sub-info { font-size: 12px; color: #b2bec3; font-weight: 700; }
.feed-body { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #eee; font-size: 14px; font-weight: 700; }
.feed-actions { display: flex; gap: 5px; justify-content: flex-end; margin-top: 8px; }
.action-btn { border: none; padding: 4px 8px; border-radius: 5px; font-size: 12px; cursor: pointer; font-weight: 900; }
.edit-action { background: #eee; color: #666; }
.delete-action { background: #ffeaa7; color: #d63031; }

/* 챗봇 UI */
.chatbot-wrapper { position: fixed; bottom: 25px; right: 25px; z-index: 1000; }
.chatbot-toggle-btn { width: 70px; height: 70px; border-radius: 50%; background: #2d3436; color: white; border: none; font-weight: 900; cursor: pointer; box-shadow: 0 6px 15px rgba(0,0,0,0.15); font-size: 12px; }
.chatbot-window { width: 310px; height: 420px; background: white; border-radius: 20px; box-shadow: 0 8px 25px rgba(0,0,0,0.12); position: absolute; bottom: 85px; right: 0; display: flex; flex-direction: column; overflow: hidden; border: 2px solid #2d3436; }
.chatbot-header { background: #2d3436; color: white; padding: 12px 16px; }
.chatbot-header h3 { margin: 0; font-size: 15px; font-weight: 900; }
.chatbot-header p { margin: 2px 0 0 0; font-size: 12px; opacity: 0.7; }
.chatbot-messages { flex: 1; padding: 12px; overflow-y: auto; background: #faf8f5; display: flex; flex-direction: column; gap: 8px; }
.message-bubble { padding: 8px 12px; border-radius: 12px; max-width: 85%; font-size: 13px; line-height: 1.4; font-weight: 700; }
.message-bubble.user { background: #ffeaa7; align-self: flex-end; color: #2d3436; }
.message-bubble.assistant { background: white; align-self: flex-start; border: 1px solid #edf2f7; color: #2d3436; }
.chatbot-input { display: flex; border-top: 1px solid #edf2f7; padding: 8px; background: white; }
.chatbot-input input { flex: 1; padding: 8px; border: 1px solid #edf2f7; border-radius: 8px; outline: none; font-size: 13px; font-weight: 700; }
.chatbot-input button { background: #ff7675; color: white; border: none; padding: 0 12px; margin-left: 5px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 900; }

::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-thumb { background: #e0d9d1; border-radius: 5px; }
</style>
