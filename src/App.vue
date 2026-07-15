<template>
  <div class="app-container">
    <!-- 상단 네비게이션 바 (겹침 현상 완전 수정) -->
    <header class="navbar">
      <div class="logo">🎈 {{ t('logo') }}</div>
      <div class="nav-controls">
        <nav class="nav-links">
          <a href="#home" :class="{ active: currentTab === 'home' }" @click="currentTab = 'home'">{{ t('navHome') }}</a>
          <a href="#board" :class="{ active: currentTab === 'board' }" @click="currentTab = 'board'">{{ t('navBoard') }}</a>
        </nav>
        
        <!-- 다국어 지원 토글 버튼 -->
        <div class="lang-switcher">
          <button :class="{ active: locale === 'ko' }" @click="locale = 'ko'">🇰🇷 KR</button>
          <button :class="{ active: locale === 'en' }" @click="locale = 'en'">🇺🇸 EN</button>
        </div>
      </div>
    </header>

    <!-- ==================== [탭 1: 홈 (구별 관광지/경로 및 지도)] ==================== -->
    <div v-if="currentTab === 'home'">
      <section class="hero">
        <h1>{{ t('heroTitle') }}</h1>
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
            <p><strong>📍 추천 스팟:</strong> {{ currentTmi.placeName }}</p>
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
            🐰 {{ selectedDistrict ? '이 지역에는 해당하는 정보가 아직 없어요!' : t('noPlaces') }}
          </div>

          <div v-else class="card-grid">
            <!-- 1번 요구사항: 장소 카드를 누르면 clickPlace 함수가 실행되어 핀이 이동함 -->
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

    <!-- ==================== [탭 2: 여행 커뮤니티 (입력칸 너비 수정 완료)] ==================== -->
    <div v-if="currentTab === 'board'" class="board-container">
      <section class="board-header">
        <h1>{{ t('boardTitle') }}</h1>
        <p>{{ t('boardSub') }}</p>
      </section>

      <div class="board-content">
        <!-- 좌측: 글작성 폼 (너비 오버 현상 수정) -->
        <div class="form-section modern-card">
          <h2>{{ isEditing ? t('editPost') : t('writePost') }}</h2>
          <div class="input-container-box">
            <div class="input-row-twin">
              <input v-model="boardForm.title" type="text" :placeholder="t('phTitle')" class="custom-input title-input" />
              <input v-model="boardForm.password" type="password" :placeholder="t('phPw')" class="custom-input pw-input" />
            </div>
            <textarea v-model="boardForm.content" :placeholder="t('phContent')" rows="6" class="custom-textarea"></textarea>
          </div>
          <div class="form-buttons">
            <button @click="savePost" class="btn-submit">{{ isEditing ? t('btnEditComplete') : t('btnRegister') }}</button>
            <button v-if="isEditing" @click="resetForm" class="btn-cancel">{{ t('btnCancel') }}</button>
          </div>
        </div>

        <!-- 우측: 피드 리스트 -->
        <div class="feed-section">
          <h2>✨ 이야기 갯수 <span class="count-badge">{{ posts.length }}</span></h2>
          <div v-if="posts.length === 0" class="no-feed-data">📸 후기를 들려주세요!</div>
          <div v-else class="feed-list">
            <div v-for="post in posts" :key="post.id" class="feed-card" @click="selectedPost = selectedPost?.id === post.id ? null : post">
              <div class="feed-header-info">
                <div class="user-avatar">🧸</div>
                <div class="meta-data">
                  <h3>{{ post.title }}</h3>
                  <span class="date-text">{{ post.date }}</span>
                </div>
              </div>
              <div v-if="selectedPost?.id === post.id" class="feed-body">
                <p>{{ post.content }}</p>
                <div class="feed-actions">
                  <button @click.stop="startEdit(post)" class="action-btn edit-action">✏️ 수정</button>
                  <button @click.stop="deletePost(post)" class="action-btn delete-action">🗑️ 삭제</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import tourData from './assets/seoul_tour.json';
import courseData from './assets/seoul_course.json'; // 2번 문제 해결을 위해 호출 확인
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const locale = ref('ko'); 
const messages = {
  ko: {
    logo: '서울구경 몽글투어', navHome: '🌸 구별 소풍 지도', navBoard: '💌 여행 피드',
    heroTitle: '어느 구로 소풍을 떠나볼까요?', heroSub: '원하는 구를 선택해서 소풍 경로와 가볼만한 곳을 확인하세요!',
    selectDistrict: '✨ 구를 선택해 주세요', allSeoul: '서울 전체 지역', noPlaces: '아래에서 구를 선택하시면 상큼한 정보가 가득 나타나요!',
    관광명소: '🍦 가볼만한 곳', 여행경로: '🚲 추천 한바퀴 코스',
    '종로구': '종로구', '중구': '중구', '용산구': '용산구', '성동구': '성동구', '마포구': '마포구', '강남구': '강남구', '영등포구': '영등포구', '동작구': '동작구'
  },
  en: {
    logo: 'Seoul Tour', navHome: 'Map', navBoard: 'Feed',
    heroTitle: 'Where to go?', heroSub: 'Select a district to explore.',
    selectDistrict: 'Select District', allSeoul: 'All Seoul', noPlaces: 'Select a district first!',
    관광명소: 'Attractions', 여행경로: 'Courses'
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

// 각 구별 기본 좌표 및 TMI 데이터 (데이터에 좌표가 없을 경우 백업 타겟)
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

// 게시판 데이터
const posts = ref([]);
const selectedPost = ref(null);
const isEditing = ref(false);
const editingId = ref(null);
const boardForm = ref({ title: '', password: '', content: '' });

watch(currentTab, async (newTab) => {
  if (newTab === 'home') {
    await nextTick();
    initMap();
  }
});

onMounted(() => {
  // 2번 문제 해결: tourData와 courseData의 구조가 달라도 안전하게 통합 매칭 유도
  const tours = (tourData.items || tourData || []).map(item => ({
    ...item,
    source: '관광명소',
    district: item.addr1 ? item.addr1.split(' ')[1] : '' // 주소에서 '구' 추출
  }));

  const courses = (courseData.items || courseData || []).map(item => ({
    ...item,
    source: '여행경로',
    // 코스 데이터 내부에 구 이름 필드가 있다면 매핑, 없으면 타이틀명 매칭 대비
    district: item.district || item.addr1 || item.courseName || ''
  }));

  allLocations.value = [...tours, ...courses];

  const savedPosts = localStorage.getItem('seoul_board_posts');
  if (savedPosts) posts.value = JSON.parse(savedPosts);

  initMap();
});

// 지도 초기화
const initMap = () => {
  if (map) { map.remove(); map = null; }
  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  map = L.map('map', { zoomControl: false }).setView([37.5665, 126.9780], 11);

  // 깔끔하고 모던한 스타일의 지도 타일
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB'
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);
};

// 2번 문제 해결: 필터링 조건 강화 (구 텍스트가 포함되어 있는지 유연하게 검사)
const filteredPlaces = computed(() => {
  if (!selectedDistrict.value) return [];
  return allLocations.value.filter(place => {
    const targetText = `${place.addr1 || ''} ${place.district || ''} ${place.title || ''} ${place.courseName || ''}`;
    const matchDistrict = targetText.includes(selectedDistrict.value);
    const matchCategory = place.source === selectedCategory.value;
    return matchDistrict && matchCategory;
  });
});

// 구 선택 상자 변경시 중심점 이동 및 기본 마커 생성
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

// 1번 요구사항: 장소를 선택하면 지도의 핀포인트가 부드럽게 움직임
const clickPlace = (place) => {
  if (!map) return;
  
  // 데이터 내부에 위도/경도가 있는지 검사하고 없으면 구 타겟 좌표로 대체
  let lat = parseFloat(place.mapy || place.lat);
  let lng = parseFloat(place.mapx || place.lng);
  
  if (isNaN(lat) || isNaN(lng)) {
    const backup = districtTmiData[selectedDistrict.value];
    if (backup) {
      lat = backup.lat + (Math.random() - 0.5) * 0.01; // 약간의 랜덤 변이를 주어 겹침 방지
      lng = backup.lng + (Math.random() - 0.5) * 0.01;
    } else {
      lat = 37.5665; lng = 126.9780;
    }
  }

  // 화면 이동 시키고 핀 새로 찍기
  map.flyTo([lat, lng], 14, { duration: 0.8 });
  createNewMarker(lat, lng, place.title || place.courseName);
};

// 귀여운 커스텀 핀포인트 아이콘 생성 함수
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

// 게시판 유틸리티
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
</script>

<style scoped>
/* 3번 해결: 동글동글하고 확실하게 가독성 좋은 웹폰트 최우선 순위 강제 로드 */
@import url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_20-04@2.1/Cafe24Dongdong.woff');
@import url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_two@1.0/NanumSquareRound.woff');

.app-container { 
  font-family: 'NanumSquareRound', 'Cafe24Dongdong', sans-serif !important;
  color: #4a5568; 
  background: #fdfbf7;
  min-height: 100vh;
}

/* 4번 해결: 우측 상단 네비 바 메뉴 및 언어 버튼 절대 안 겹치도록 레이아웃 재배치 */
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
.logo { font-size: 22px; font-weight: 800; color: #ff7675; }
.nav-controls { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.nav-links a { text-decoration: none; color: #a0aec0; font-weight: 700; margin-left: 15px; font-size: 15px; }
.nav-links a.active { color: #ff7675; border-bottom: 3px solid #ff7675; padding-bottom: 2px; }

.lang-switcher { display: flex; gap: 5px; background: #ede7e1; padding: 4px; border-radius: 20px; }
.lang-switcher button { background: transparent; border: none; padding: 4px 10px; border-radius: 15px; cursor: pointer; font-size: 12px; font-weight: 700; color: #666; }
.lang-switcher button.active { background: white; color: #ff7675; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }

/* 배너 코너 */
.hero { text-align: center; padding: 35px 20px; background: linear-gradient(135deg, #fff9f4 0%, #ffeaa7 100%); border-radius: 0 0 30px 30px; }
.hero h1 { font-size: 28px; color: #2d3436; margin-bottom: 8px; font-weight: 800; }
.hero p { color: #636e72; font-size: 14px; margin-bottom: 15px; }
.search-box select { padding: 10px 20px; font-size: 14px; border-radius: 20px; border: 2px solid #ff7675; outline: none; font-weight: 700; font-family: inherit; }

/* 메인 그리드 바디 */
.main-content { display: flex; padding: 25px 30px; gap: 25px; flex-wrap: wrap; }
.map-section { flex: 1; min-width: 320px; display: flex; flex-direction: column; gap: 15px; }
.map-wrapper { position: relative; border-radius: 20px; overflow: hidden; border: 4px solid white; box-shadow: 0 8px 20px rgba(0,0,0,0.05); }
.seoul-map { height: 380px; background: #eef2f5; }
.map-overlay-tips { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.8); display: flex; align-items: center; justify-content: center; font-weight: 700; color: #7f8c8d; z-index: 999; }

/* 1번 해결: 지도 마커 통통 튀는 애니메이션 구현 */
:deep(.cute-marker) { display: flex; align-items: center; justify-content: center; }
.bounce-pin { font-size: 32px; animation: bounce 0.5s infinite alternate; }
@keyframes bounce { 0% { transform: translateY(0); } 100% { transform: translateY(-6px); } }
:deep(.pop-bubble) { font-family: 'NanumSquareRound', sans-serif; font-size: 13px; }

.tmi-box { background: white; border-radius: 15px; padding: 15px; border: 2px dashed #ffeaa7; }
.tmi-box h4 { margin: 0 0 5px 0; color: #e17055; }
.tmi-text { font-size: 13px; color: #636e72; margin: 5px 0 0 0; }

/* 리스트 스타일 */
.list-section { flex: 1.2; min-width: 350px; }
.category-tabs { display: flex; gap: 8px; margin-bottom: 15px; }
.category-tabs button { padding: 8px 16px; border: none; background: #e0d9d1; border-radius: 20px; cursor: pointer; font-weight: 700; font-family: inherit; font-size: 13px; }
.category-tabs button.active { background: #ff7675; color: white; }

.section-title { font-size: 18px; font-weight: 800; margin-bottom: 12px; }
.category-sub-tag { font-size: 11px; background: #ffeaa7; color: #d63031; padding: 2px 8px; border-radius: 10px; margin-left: 5px; }
.no-data { text-align: center; padding: 5px 0; font-weight: 700; color: #b2bec3; margin-top: 30px; }

.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; max-height: 400px; overflow-y: auto; padding-right: 5px; }
.card { background: white; border-radius: 15px; padding: 14px; border: 1px solid #f3eae1; cursor: pointer; transition: transform 0.2s; position: relative; }
.card:hover { transform: translateY(-2px); border-color: #ff7675; }
.card h3 { font-size: 13.5px; margin: 6px 0 4px 0; font-weight: 800; }
.badge { display: inline-block; padding: 2px 6px; font-size: 10px; border-radius: 6px; color: white; font-weight: 700; }
.badge.관광명소 { background: #74b9ff; }
.badge.여행경로 { background: #a29bfe; }
.addr { font-size: 11px; color: #95a5a6; margin: 0; }
.click-tip { font-size: 10px; color: #ff7675; text-align: right; margin: 4px 0 0 0; font-weight: 700; opacity: 0; transition: opacity 0.2s; }
.card:hover .click-tip { opacity: 1; }

/* ==================== 5번 해결: 입력 박스 컨테이너 너비 전면 정상화 ==================== */
.board-container { padding: 20px 30px; max-width: 1000px; margin: 0 auto; }
.board-header { text-align: center; margin-bottom: 25px; }
.board-content { display: flex; gap: 25px; flex-wrap: wrap; }

.form-section { flex: 1; min-width: 320px; }
.modern-card { background: white; border-radius: 20px; border: 1px solid #f3eae1; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
.form-section h2 { font-size: 16px; margin: 0 0 15px 0; font-weight: 800; }

/* 가로 100% 범위를 절대 벗어나지 않도록 방지하는 정렬 래퍼 */
.input-container-box { width: 100%; display: flex; flex-direction: column; gap: 10px; box-sizing: border-box; }
.input-row-twin { display: flex; gap: 10px; width: 100%; box-sizing: border-box; }

.custom-input { 
  padding: 10px 12px; 
  border: 1.5px solid #edf2f7; 
  border-radius: 10px; 
  font-family: inherit; 
  font-size: 13px; 
  outline: none; 
  background: #fdfdfd; 
  box-sizing: border-box;
}
.title-input { flex: 2; width: 0; } /* 무한 증식 방지용 width 초기화 */
.pw-input { flex: 1; width: 0; }

.custom-textarea { 
  width: 100%; 
  padding: 12px; 
  border: 1.5px solid #edf2f7; 
  border-radius: 10px; 
  font-family: inherit; 
  font-size: 13px; 
  outline: none; 
  background: #fdfdfd; 
  resize: none; 
  box-sizing: border-box;
}
.custom-input:focus, .custom-textarea:focus { border-color: #ff7675; background: white; }

.form-buttons { display: flex; gap: 6px; margin-top: 10px; }
.btn-submit { flex: 2; background: #ff7675; color: white; border: none; padding: 11px; border-radius: 10px; cursor: pointer; font-weight: 700; font-family: inherit; }
.btn-cancel { flex: 1; background: #eee; color: #555; border: none; padding: 11px; border-radius: 10px; cursor: pointer; font-weight: 700; font-family: inherit; }

/* 피드 파트 */
.feed-section { flex: 1.2; min-width: 340px; }
.feed-section h2 { font-size: 16px; margin: 0 0 15px 0; font-weight: 800; }
.count-badge { background: #ffeaa7; color: #d63031; padding: 2px 6px; border-radius: 8px; font-size: 12px; }
.no-feed-data { padding: 40px; text-align: center; color: #b2bec3; background: white; border-radius: 20px; border: 1px solid #f3eae1; font-weight: 700; }

.feed-list { display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; }
.feed-card { background: white; border: 1px solid #f3eae1; border-radius: 15px; padding: 12px; cursor: pointer; }
.feed-header-info { display: flex; align-items: center; gap: 10px; }
.user-avatar { font-size: 20px; }
.meta-data h3 { margin: 0; font-size: 13px; font-weight: 800; }
.date-text { font-size: 10px; color: #b2bec3; }
.feed-body { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #eee; font-size: 12.5px; }
.feed-actions { display: flex; gap: 5px; justify-content: flex-end; margin-top: 8px; }
.action-btn { border: none; padding: 4px 8px; border-radius: 5px; font-size: 11px; cursor: pointer; font-family: inherit; font-weight: 700; }
.edit-action { background: #eee; color: #666; }
.delete-action { background: #ffeaa7; color: #d63031; }

::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-thumb { background: #e0d9d1; border-radius: 5px; }
</style>