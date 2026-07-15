<template>
  <div class="app-container">
    <!-- 상단 네비게이션 바 -->
    <header class="navbar">
      <div class="logo">📍 {{ t('logo') }}</div>
      <div class="nav-right">
        <nav class="nav-links">
          <a href="#home" :class="{ active: currentTab === 'home' }" @click="currentTab = 'home'">{{ t('navHome') }}</a>
          <a href="#board" :class="{ active: currentTab === 'board' }" @click="currentTab = 'board'">{{ t('navBoard') }}</a>
        </nav>
        
        <!-- 다국어 지원 토글 버튼 -->
        <div class="lang-switcher">
          <button :class="{ active: locale === 'ko' }" @click="locale = 'ko'" title="한국어">
            🇰🇷 <span class="lang-text">KR</span>
          </button>
          <button :class="{ active: locale === 'en' }" @click="locale = 'en'" title="English">
            🇺🇸 <span class="lang-text">EN</span>
          </button>
          <button :class="{ active: locale === 'zh' }" @click="locale = 'zh'" title="中国语">
            🇨🇳 <span class="lang-text">CN</span>
          </button>
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
        <!-- 좌측: Leaflet.js 지도 영역 -->
        <div class="map-section">
          <div id="map" class="seoul-map"></div>
          <div v-if="selectedDistrict && currentTmi" class="tmi-box">
            <h4>💡 {{ t(selectedDistrict) }} {{ t('tmiTitle') }}</h4>
            <p><strong>{{ t('tmiPlace') }}:</strong> {{ getTmiPlaceName() }}</p>
            <p class="tmi-text">{{ getTmiDescription() }}</p>
          </div>
        </div>

        <!-- 우측: 관광명소 / 여행경로 데이터 리스트 -->
        <div class="list-section">
          <div class="category-tabs">
            <button v-for="cat in categories" :key="cat" :class="{ active: selectedCategory === cat }" @click="selectedCategory = cat">
              {{ t(cat) }}
            </button>
          </div>

          <h2>{{ selectedDistrict ? t(selectedDistrict) : t('allSeoul') }} - {{ t(selectedCategory) }} ({{ filteredPlaces.length }})</h2>
          
          <div v-if="filteredPlaces.length === 0" class="no-data">
            💡 {{ t('noPlaces') }}
          </div>

          <div v-else class="card-grid">
            <div v-for="(place, index) in filteredPlaces" :key="index" class="card">
              <span class="badge" :class="place.source">{{ t(place.source) }}</span>
              <h3>{{ getPlaceTitleFormatted(place.title) }}</h3>
              <p class="addr" v-if="place.addr1">📍 {{ place.addr1 }}</p>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- ==================== [탭 2: 여행 커뮤니티 (익명 게시판 SNS 카드형 UI)] ==================== -->
    <div v-if="currentTab === 'board'" class="board-container">
      <section class="board-header">
        <h1>{{ t('boardTitle') }}</h1>
        <p>{{ t('boardSub') }}</p>
      </section>

      <div class="board-content">
        <!-- 좌측: 트렌디한 글작성 폼 카드 -->
        <div class="form-section modern-card">
          <h2>{{ isEditing ? t('editPost') : t('writePost') }}</h2>
          <div class="input-group">
            <div class="input-row-twin">
              <input v-model="boardForm.title" type="text" :placeholder="t('phTitle')" class="custom-input title-input" />
              <input v-model="boardForm.password" type="password" :placeholder="t('phPw')" class="custom-input pw-input" />
            </div>
            <!-- 자치구 태그 자동 매칭을 위한 팁 요소 -->
            <div class="tag-helper-text">💡 본문에 #종로구 #강남구 처럼 구이름을 쓰면 태그가 자동 생성됩니다!</div>
            <textarea v-model="boardForm.content" :placeholder="t('phContent')" rows="8" class="custom-textarea"></textarea>
          </div>
          <div class="form-buttons">
            <button @click="savePost" class="btn-submit">{{ isEditing ? t('btnEditComplete') : t('btnRegister') }}</button>
            <button v-if="isEditing" @click="resetForm" class="btn-cancel">{{ t('btnCancel') }}</button>
          </div>
        </div>

        <!-- 우측: SNS 피드 스타일 카드형 피드 리스트 -->
        <div class="feed-section">
          <div class="feed-title-area">
            <h2>✨ {{ t('postCount') }} <span class="count-badge">{{ posts.length }}</span></h2>
          </div>
          
          <div v-if="posts.length === 0" class="no-feed-data">
            📸 <p>{{ t('noPosts') }}</p>
          </div>
          
          <div v-else class="feed-list">
            <div v-for="post in posts" :key="post.id" class="feed-card" :class="{ 'expanded': selectedPost?.id === post.id }">
              <!-- 피드 헤더 (작성자 익명 정보 및 날짜) -->
              <div class="feed-header-info" @click="selectPost(post)">
                <div class="user-avatar">👤</div>
                <div class="meta-data">
                  <h3>{{ post.title }}</h3>
                  <div class="sub-info">
                    <span class="anonymous-name">Anonymous Traveller</span>
                    <span class="dot">·</span>
                    <span class="date-text">{{ post.date }}</span>
                  </div>
                </div>
                <div class="expand-arrow">{{ selectedPost?.id === post.id ? '🔼' : '🔽' }}</div>
              </div>

              <!-- 피드 바디 (내용 및 감성 태그 자동 파싱) -->
              <div v-if="selectedPost?.id === post.id" class="feed-body">
                <p class="feed-text">{{ post.content }}</p>
                
                <!-- 해시태그 자동 매칭 렌더링 영역 -->
                <div class="feed-tags">
                  <span v-for="tag in extractTags(post.content)" :key="tag" class="hash-tag">
                    #{{ tag }}
                  </span>
                </div>

                <!-- 피드 액션 버튼 바 -->
                <div class="feed-actions">
                  <button @click="startEdit(post)" class="action-btn edit-action">
                    ✏️ {{ t('btnEdit') }}
                  </button>
                  <button @click="deletePost(post)" class="action-btn delete-action">
                    🗑️ {{ t('btnDelete') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== [ OpenAI 자연어 챗봇 플로팅 UI] ==================== -->
    <div class="chatbot-wrapper">
      <button class="chatbot-toggle-btn" @click="isChatOpen = !isChatOpen">
        <span v-if="!isChatOpen">💬 {{ t('botToggle') }}</span>
        <span v-else>❌ {{ t('botClose') }}</span>
      </button>

      <div v-if="isChatOpen" class="chatbot-window">
        <div class="chatbot-header">
          <h3>🤖 {{ t('botHeader') }}</h3>
          <p>{{ t('botSub') }}</p>
        </div>
        
        <div class="chatbot-messages" ref="messageBox">
          <div v-for="(msg, idx) in chatMessages" :key="idx" :class="['message-bubble', msg.role]">
            <strong>{{ msg.role === 'user' ? t('chatUser') : t('chatAi') }}:</strong>
            <p>{{ msg.content }}</p>
          </div>
          <div v-if="isChatLoading" class="message-bubble assistant loading">
            ⏳ {{ t('botLoading') }}
          </div>
        </div>

        <div class="chatbot-input">
          <input v-model="userInput" @keyup.enter="askChatbot" type="text" :placeholder="t('botPh')" :disabled="isChatLoading" />
          <button @click="askChatbot" :disabled="isChatLoading">{{ t('botSend') }}</button>
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

// --- 🌐 다국어 딕셔너리 정의 ---
const locale = ref('ko'); 
const messages = {
  ko: {
    logo: '서울구경 (SeoulGugyeong)', navHome: '구별 관광지 및 여행코스', navBoard: '커뮤니티',
    heroTitle: '어느 구로 떠나볼까요?', heroSub: '서울의 구별 맞춤 관광명소와 추천 여행 경로를 지도로 확인하세요.',
    selectDistrict: '구를 선택하세요', allSeoul: '서울 전체', noPlaces: '구를 선택하거나 다른 카테고리를 눌러보세요!',
    관광명소: '관광명소', 여행경로: '추천 여행경로',
    tmiTitle: '추천 스팟 TMI', tmiPlace: '대표 장소',
    boardTitle: '💬 여행 커뮤니티 피드', boardSub: '서울 여행 팁과 추천 경로 후기를 자유롭고 예쁘게 공유해보세요.',
    writePost: '✍️ 새 피드 작성하기', editPost: '📝 게시글 수정하기', postCount: '실시간 여행 피드', noPosts: '첫 번째 감성 명소 후기를 남겨보세요!',
    phTitle: '제목', phPw: '비밀번호', phContent: '서울 여행 가셨던 솔직한 후기나 나만의 스팟 정보를 자유롭게 남겨주세요... (구 이름앞에 #을 붙이면 태그가 됩니다!)',
    btnRegister: '피드 게시하기', btnEditComplete: '수정 완료', btnCancel: '취소', btnEdit: '수정', btnDelete: '삭제',
    botToggle: '챗봇', botClose: '닫기', botHeader: 'SeoulSpotter AI 가이드', botSub: '서울의 관광지 및 여행코스 정보를 물어보세요!',
    botLoading: '답변을 생각하고 있습니다...', botPh: '예: 종로구 관광명소 코스 짜줘', botSend: '전송', chatUser: '나', chatAi: 'AI 가이드',
    alertAll: '모든 항목을 입력해 주세요!', alertWrongPw: '비밀번호가 일치하지 않습니다!', alertEdit: '글이 수정되었습니다.', alertReg: '글이 등록되었습니다.',
    alertEditMode: '비밀번호 입력 후 내용을 고쳐주세요.', alertPromptPw: '삭제를 위한 비밀번호 입력:', alertConfirmDel: '삭제하시겠습니까?', alertDelComplete: '삭제 완료되었습니다.',
    '종로구': '종로구', '중구': '중구', '용산구': '용산구', '성동구': '성동구', '마포구': '마포구', '강남구': '강남구', '영등포구': '영등포구', '동작구': '동작구'
  },
  en: {
    logo: 'SeoulGugyeong', navHome: 'Attractions & Courses', navBoard: 'Community Feed',
    heroTitle: 'Where Shall We Travel in Seoul?', heroSub: 'Explore tourist attractions and customized travel routes on the map.',
    selectDistrict: 'Select a District', allSeoul: 'All of Seoul', noPlaces: 'Select a district or click another category!',
    관광명소: 'Attractions', 여행경로: 'Travel Routes',
    tmiTitle: 'Recommended Spot TMI', tmiPlace: 'Spot Name',
    boardTitle: '💬 Travel Community Feed', boardSub: 'Share your tips and review travel routes freely.',
    writePost: '✍️ Write New Feed', editPost: '📝 Edit Post', postCount: 'Live Travel Feeds', noPosts: 'Be the first to leave a travel review!',
    phTitle: 'Title', phPw: 'Password', phContent: 'Share your honest review of Seoul travel or your own spot information details...',
    btnRegister: 'Post Feed', btnEditComplete: 'Update', btnCancel: 'Cancel', btnEdit: 'Edit', btnDelete: 'Delete',
    botToggle: 'AI Chat', botClose: 'Close', botHeader: 'SeoulSpotter AI Guide', botSub: 'Ask anything about attractions or travel courses!',
    botLoading: 'Thinking of an answer...', botPh: 'e.g., Suggest a route in Jongno-gu', botSend: 'Send', chatUser: 'Me', chatAi: 'AI Guide',
    alertAll: 'Please fill in all fields!', alertWrongPw: 'Incorrect password!', alertEdit: 'Post updated.', alertReg: 'Post submitted.',
    alertEditMode: 'Enter password to modify.', alertPromptPw: 'Enter password to delete:', alertConfirmDel: 'Delete this post?', alertDelComplete: 'Deleted successfully.',
    '종로구': 'Jongno-gu', '중구': 'Jung-gu', '용산구': 'Yongsan-gu', '성동구': 'Seongdong-gu', '마포구': 'Mapo-gu', '강남구': 'Gangnam-gu', '영등포구': 'Yeongdeungpo-gu', '동작구': 'Dongjak-gu'
  },
  zh: {
    logo: '首尔区景 (SeoulGugyeong)', navHome: '景点与路线', navBoard: '社区圈子',
    heroTitle: '您想去首尔哪里游览？', heroSub: '在地图上查看首尔各行政区的定制旅游景点和推荐旅行路线。',
    selectDistrict: '请选择行政区', allSeoul: '首尔全境', noPlaces: '请选择一个区或点击其他分类查看！',
    관광명소: '旅游景点', 여행경로: '推荐旅行路线',
    tmiTitle: '推荐景点 趣闻', tmiPlace: '代表景点',
    boardTitle: '💬 旅游社区朋友圈', boardSub: '自由分享您的首尔旅游攻略和路线心得。',
    writePost: '✍️ 发布新动态', editPost: '📝 编辑帖子', postCount: '实时动态流', noPosts: '成为第一个留下旅行故事的主角吧！',
    phTitle: '标题', phPw: '密码', phContent: '请分享您在首尔旅行的真实感受或专属小众景点信息...',
    btnRegister: '立即发布', btnEditComplete: '完成修改', btnCancel: '取消', btnEdit: '编辑', btnDelete: '删除',
    botToggle: 'AI助手', botClose: '关闭', botHeader: 'SeoulSpotter 智能导游', botSub: '欢迎咨询关于首尔景点及旅游路线의 任何问题！',
    botLoading: '正在思考答案，请稍候...', botPh: '例如：帮我规划钟路区旅游路线', botSend: '发送', chatUser: '我', chatAi: 'AI导游',
    alertAll: '请填写所有栏目！', alertWrongPw: '密码错误！', alertEdit: '帖子修改成功。', alertReg: '帖子发布成功。',
    alertEditMode: '请输入密码以修改内容。', alertPromptPw: '请输入密码以删除帖子：', alertConfirmDel: '确定要删除这条内容吗？', alertDelComplete: '删除成功。',
    '종로구': '钟路区', '중구': '中区', '용산구': '龙山区', '성동구': '城东区', '마포구': '麻浦区', '강남구': '江南区', '영등포구': '永登浦区', '동작구': '铜雀区'
  }
};

const t = (key) => messages[locale.value][key] || key;

// --- 기본 데이터 및 상태 선언 ---
const currentTab = ref('home');
const selectedDistrict = ref('');
const selectedCategory = ref('관광명소');
const categories = ['관광명소', '여행경로']; 
const districts = ['종로구', '중구', '용산구', '성동구', '마포구', '강남구', '영등포구', '동작구'];

const allLocations = ref([]);
let map = null;
let currentMarker = null;

// 각 구별 상세 랜드마크 정보 (위경도 포함)
const districtTmiData = {
  '종로구': { lat: 37.5796, lng: 126.9770, placeName: '경복궁', placeNameEn: 'Gyeongbokgung Palace', placeNameZh: '景福宫', tmi: '광화문 현판의 글씨는 고증을 통해 검은색 바탕에 금박 글씨로 재탄생했습니다.', tmiEn: 'The Gwanghwamun signboard was restored to gold letters on a black background.', tmiZh: '光化门匾额已由白底黑字恢复为黑底金箔字。' },
  '중구': { lat: 37.5512, lng: 126.9882, placeName: 'N서울타워', placeNameEn: 'N Seoul Tower', placeNameZh: 'N首尔塔', tmi: '조명 색상은 서울의 미세먼지 농도입니다. 파란색은 공기가 맑다는 뜻입니다.', tmiEn: 'The tower lights show fine dust levels. Blue means the air is clean.', tmiZh: '照明颜色代表实时微尘浓度。蓝色说明空气非常清新！' },
  '용산구': { lat: 37.5240, lng: 126.9804, placeName: '국립중앙박물관', placeNameEn: 'National Museum of Korea', placeNameZh: '韩国国立中央博物馆', tmi: '세계에서 6번째로 큰 박물관이며 야외 거울못은 완벽한 포토존입니다.', tmiEn: 'Ranked 6th largest in the world. The outdoor Mirror Pond is a top photo zone.', tmiZh: '规模位居世界第六。室外镜池倒映出的建筑全景是极佳的打卡点。' },
  '성동구': { lat: 37.5443, lng: 127.0374, placeName: '서울숲', placeNameEn: 'Seoul Forest', placeNameZh: '首尔林', tmi: '과거 임금의 사냥터이자 서울 최초의 상수도 수원지였습니다.', tmiEn: 'Once a royal hunting ground and Seoul\'s first water purification plant.', tmiZh: '这里过去曾是国王的狩猎场以及首尔最早의 自来水水源地。' },
  '마포구': { lat: 37.5558, lng: 126.9240, placeName: '홍대 걷고싶은거리', placeNameEn: 'Hongdae Walkable Street', placeNameZh: '弘大想漫步的小街', tmi: '과거 당인리 발전소로 석탄을 실어 나르던 철길 자리를 꾸민 거리입니다.', tmiEn: 'Built over old railway tracks that carried coal to a power plant.', tmiZh: '由过去向唐人里发电厂运送煤炭의 铁路线改建而成의 浪漫街区。' },
  '강남구': { lat: 37.5113, lng: 127.0596, placeName: '별마당 도서관', placeNameEn: 'Starfield Library', placeNameZh: '星空图书馆', tmi: '높이 13m의 서가로 유명하며, 매년 중앙의 대형 트리가 바뀝니다.', tmiEn: 'Famous for 13-meter tall bookshelves and its changing giant art tree.', tmiZh: '因高达13米의 超大型书架而闻名，每年都会更换大艺术装置。' },
  '영등포구': { lat: 37.5284, lng: 126.9331, placeName: '여의도 한강공원', placeNameEn: 'Yeouido Hangang Park', placeNameZh: '汝矣岛汉江公园', tmi: '배달 음식을 시킬 때는 꼭 지정된 배달존(1~3호) 번호를 확인해야 합니다.', tmiEn: 'You must pick up delivery food at designated Delivery Zones (No. 1-3).', tmiZh: '在此叫外卖时，必须前往指定의 “外卖区（1-3号）”取餐。' },
  '동작구': { lat: 37.5144, lng: 126.9408, placeName: '노량진 수산시장', placeNameEn: 'Noryangjin Fisheries Market', placeNameZh: '鹭梁津水产市场', tmi: '새벽 1~3시 사이에 방문하면 생동감 넘치는 실시간 경매를 볼 수 있습니다.', tmiEn: 'Visit between 1:00 AM and 3:00 AM to witness live high-energy auctions.', tmiZh: '如果选择在凌晨1点至3点之间前往，可以亲眼目睹活力四射의 拍卖。' }
};

const currentTmi = computed(() => districtTmiData[selectedDistrict.value] || null);

// --- 익명 게시판 CRUD 상태 선언 ---
const posts = ref([]);
const selectedPost = ref(null);
const isEditing = ref(false);
const editingId = ref(null);
const boardForm = ref({ title: '', password: '', content: '' });

// --- 🤖 OpenAI 챗봇 관련 상태 선언 ---
const userInput = ref('');
const chatMessages = ref([]);
const isChatOpen = ref(false);
const isChatLoading = ref(false);
const messageBox = ref(null);

// --- 본문 내용 중 해시태그를 자동 추출하는 기능 헬퍼 함수 ---
const extractTags = (text) => {
  if (!text) return [];
  const matches = text.match(/#([가-힣a-zA-Z0-9_]+)/g);
  return matches ? matches.map(tag => tag.replace('#', '')) : ['서울여행', 'SeoulGugyeong'];
};

// --- 다국어 텍스트 파싱 헬퍼 함수들 ---
const getTmiPlaceName = () => {
  if (!currentTmi.value) return '';
  if (locale.value === 'en') return currentTmi.value.placeNameEn;
  if (locale.value === 'zh') return currentTmi.value.placeNameZh;
  return currentTmi.value.placeName;
};
const getTmiDescription = () => {
  if (!currentTmi.value) return '';
  if (locale.value === 'en') return currentTmi.value.tmiEn;
  if (locale.value === 'zh') return currentTmi.value.tmiZh;
  return currentTmi.value.tmi;
};
const getPlaceTitleFormatted = (title) => {
  if (locale.value === 'en') return `[Spot/Route] ${title}`;
  if (locale.value === 'zh') return `[首尔景点/路线] ${title}`;
  return title;
};

// --- watch 설정 ---
watch(locale, (newLng) => {
  let content = '안녕하세요! 서울 관광/경로 안내 가이드입니다. 무엇이든 물어보세요!';
  if (newLng === 'en') content = 'Hello! I am your Seoul tour guide. Feel free to ask about attractions or routes!';
  if (newLng === 'zh') content = '您好！我是首尔旅游智能导游。有什么关于景点或路线的问题都可以问我哦！';
  chatMessages.value = [{ role: 'assistant', content }];
  if (selectedDistrict.value) handleDistrictChange();
}, { immediate: true });

watch(currentTab, async (newTab) => {
  if (newTab === 'home') {
    await nextTick();
    initMap();
  }
});

onMounted(() => {
  const tours = (tourData.items || []).map(item => ({ ...item, source: '관광명소' }));
  const courses = (courseData.items || []).map(item => ({ ...item, source: '여행경로' }));
  allLocations.value = [...tours, ...courses];

  const savedPosts = localStorage.getItem('seoul_board_posts');
  if (savedPosts) posts.value = JSON.parse(savedPosts);

  initMap();
});

// --- Leaflet 지도 제어 로직 ---
const initMap = () => {
  if (map) { map.remove(); map = null; }
  const mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  map = L.map('map').setView([37.5665, 126.9780], 11);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

const handleDistrictChange = () => {
  if (!map) return;
  if (currentMarker) { map.removeLayer(currentMarker); currentMarker = null; }

  const tmiInfo = currentTmi.value;
  if (tmiInfo) {
    map.flyTo([tmiInfo.lat, tmiInfo.lng], 14, { duration: 1.5 });
    currentMarker = L.marker([tmiInfo.lat, tmiInfo.lng]).addTo(map);
    
    const name = getTmiPlaceName();
    const txt = getTmiDescription();

    const popupContent = `
      <div style="font-family: 'Malgun Gothic', sans-serif; padding: 5px; max-width: 200px;">
        <h4 style="margin: 0 0 5px 0; color: #00A3D2;">🌟 ${name}</h4>
        <p style="margin: 0; font-size: 11px; line-height: 1.4; color: #555;">${txt}</p>
      </div>
    `;
    currentMarker.bindPopup(popupContent).openPopup();
  } else {
    map.flyTo([37.5665, 126.9780], 11, { duration: 1.2 });
  }
};

// 필터링 시스템
const filteredPlaces = computed(() => {
  return allLocations.value.filter(place => {
    const matchDistrict = selectedDistrict.value ? (place.addr1 && place.addr1.includes(selectedDistrict.value)) : true;
    const matchCategory = place.source === selectedCategory.value;
    return matchDistrict && matchCategory;
  });
});

// 익명 게시판 CRUD 로직
const updateLocalStorage = () => localStorage.setItem('seoul_board_posts', JSON.stringify(posts.value));
const resetForm = () => { boardForm.value = { title: '', password: '', content: '' }; isEditing.value = false; editingId.value = null; };
const selectPost = (post) => { selectedPost.value = selectedPost.value?.id === post.id ? null : post; };
const savePost = () => {
  if (!boardForm.value.title || !boardForm.value.password || !boardForm.value.content) return alert(t('alertAll'));
  if (isEditing.value) {
    const index = posts.value.findIndex(p => p.id === editingId.value);
    if (posts.value[index].password !== boardForm.value.password) return alert(t('alertWrongPw'));
    posts.value[index].title = boardForm.value.title;
    posts.value[index].content = boardForm.value.content;
    alert(t('alertEdit'));
  } else {
    posts.value.unshift({ id: Date.now(), title: boardForm.value.title, password: boardForm.value.password, content: boardForm.value.content, date: new Date().toLocaleDateString() });
    alert(t('alertReg'));
  }
  updateLocalStorage(); resetForm(); selectedPost.value = null;
};
const startEdit = (post) => { isEditing.value = true; editingId.value = post.id; boardForm.value = { title: post.title, password: '', content: post.content }; alert(t('alertEditMode')); };
const deletePost = (post) => {
  const pw = prompt(t('alertPromptPw'));
  if (pw === post.password && confirm(t('alertConfirmDel'))) { 
    posts.value = posts.value.filter(p => p.id !== post.id); 
    updateLocalStorage(); selectedPost.value = null; alert(t('alertDelComplete')); 
  } else if (pw !== null && pw !== post.password) {
    alert(t('alertWrongPw'));
  }
};

// OpenAI 챗봇 연동
const askChatbot = async () => {
  if (!userInput.value.trim() || isChatLoading.value) return;
  const userQuery = userInput.value;
  chatMessages.value.push({ role: 'user', content: userQuery });
  userInput.value = '';
  isChatLoading.value = true;
  await nextTick(() => { messageBox.value.scrollTop = messageBox.value.scrollHeight; });

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey || apiKey.includes('실제')) {
    setTimeout(() => {
      chatMessages.value.push({ role: 'assistant', content: '⚠️ API Key connection required in Netlify Environment Variables.' });
      isChatLoading.value = false;
    }, 1000);
    return;
  }
  const contextData = allLocations.value.slice(0, 15).map(p => `[${p.source}] ${p.title} (${p.addr1 || 'Seoul'})`).join('\n');
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: `You are 'SeoulSpotter' AI Guide specializing in Attractions and Travel Routes. Answer in the language the user speaks. Interface language is ${locale.value}.\nContext data:\n${contextData}` },
          { role: 'user', content: userQuery }
        ]
      })
    });
    const data = await response.json();
    chatMessages.value.push({ role: 'assistant', content: data.choices[0].message.content });
  } catch {
    chatMessages.value.push({ role: 'assistant', content: '❌ System Error' });
  } finally {
    isChatLoading.value = false;
    await nextTick(() => { messageBox.value.scrollTop = messageBox.value.scrollHeight; });
  }
};
</script>

<style scoped>
/* 테마 디자인 공통 스타일 */
.app-container { font-family: 'Malgun Gothic', sans-serif; color: #333; margin: 0; padding: 0; min-height: 100vh; background: #fafafa; }
.navbar { display: flex; justify-content: space-between; align-items: center; padding: 15px 40px; border-bottom: 1px solid #eee; background: white; }
.logo { font-size: 20px; font-weight: bold; color: #00A3D2; }
.nav-right { display: flex; align-items: center; gap: 30px; }
.nav-links a { margin-left: 20px; text-decoration: none; color: #666; font-weight: bold; cursor: pointer; }
.nav-links a.active { color: #00A3D2; border-bottom: 2px solid #00A3D2; padding-bottom: 4px; }

/* 다국어 KR/EN/CN 토글 아이콘 스타일 */
.lang-switcher { display: flex; gap: 5px; background: #f0f2f5; padding: 4px; border-radius: 20px; }
.lang-switcher button { background: transparent; border: none; padding: 4px 10px; border-radius: 15px; cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: bold; color: #777; transition: all 0.2s; }
.lang-switcher button.active { background: white; color: #00A3D2; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
.lang-text { font-size: 11px; }

.hero { text-align: center; padding: 15px 20px 35px 20px; background-color: #f0f8fa; }
.search-box select { padding: 10px 25px; font-size: 15px; border-radius: 25px; border: 2px solid #00A3D2; outline: none; background: white; }

/* 레이아웃 구성 */
.main-content { display: flex; padding: 30px; gap: 25px; }
.map-section { flex: 1.2; display: flex; flex-direction: column; gap: 15px; }
.seoul-map { height: 450px; min-height: 450px; border-radius: 12px; border: 1px solid #ddd; box-shadow: 0 4px 12px rgba(0,0,0,0.05); z-index: 1; }
.tmi-box { background: #fff; border-left: 5px solid #00A3D2; padding: 15px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.tmi-box h4 { margin: 0 0 8px 0; color: #00A3D2; font-size: 14px; }
.tmi-text { font-size: 12px; line-height: 1.5; color: #555; }

.list-section { flex: 1.3; }
.category-tabs { display: flex; gap: 8px; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
.category-tabs button { padding: 8px 14px; border: 1px solid #ddd; background: white; border-radius: 20px; cursor: pointer; font-weight: bold; font-size: 13px; }
.category-tabs button.active { background: #00A3D2; color: white; border-color: #00A3D2; }

/* 3열 그리드 */
.card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; max-height: 480px; overflow-y: auto; }
.card { background: #fff; border: 1px solid #e1e4e6; border-radius: 8px; padding: 12px; }
.card h3 { font-size: 13px; margin: 8px 0; line-height: 1.4; }
.badge { display: inline-block; padding: 3px 6px; font-size: 10px; border-radius: 4px; color: white; font-weight: bold; }
.badge.관광명소 { background-color: #3182ce; }
.badge.여행경로 { background-color: #9f7aea; }
.addr { font-size: 11px; color: #777; }

/* ==================== 📸 업그레이드된 커뮤니티 SNS 피드 디자인 ==================== */
.board-container { padding: 40px 20px; max-width: 1200px; margin: 0 auto; }
.board-header { text-align: center; margin-bottom: 40px; }
.board-header h1 { font-size: 28px; color: #222; margin-bottom: 10px; }
.board-header p { color: #666; font-size: 15px; }
.board-content { display: flex; gap: 35px; align-items: flex-start; }

/* 인스타그램 스타일 글작성 박스 */
.modern-card { background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.02); padding: 25px; transition: transform 0.2s; }
.form-section { flex: 1; min-width: 380px; }
.form-section h2 { font-size: 18px; margin-top: 0; margin-bottom: 20px; color: #1a202c; border-left: 4px solid #00A3D2; padding-left: 10px; }

.input-row-twin { display: flex; gap: 10px; margin-bottom: 12px; }
.custom-input { flex: 1; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc; transition: all 0.2s; }
.custom-input:focus { border-color: #00A3D2; background: #fff; box-shadow: 0 0 0 3px rgba(0, 163, 210, 0.1); }
.title-input { flex: 2; }
.pw-input { flex: 1; }

.tag-helper-text { font-size: 11px; color: #718096; margin-bottom: 8px; padding-left: 2px; }
.custom-textarea { width: 100%; padding: 14px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; outline: none; background: #f8fafc; resize: none; box-sizing: border-box; transition: all 0.2s; }
.custom-textarea:focus { border-color: #00A3D2; background: #fff; box-shadow: 0 0 0 3px rgba(0, 163, 210, 0.1); }

.form-buttons { display: flex; gap: 10px; margin-top: 15px; }
.btn-submit { flex: 2; background: #00A3D2; color: white; border: none; padding: 14px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 14px; transition: background 0.2s; }
.btn-submit:hover { background: #008cb5; }
.btn-cancel { flex: 1; background: #edf2f7; color: #4a5568; border: none; padding: 14px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 14px; }
.btn-cancel:hover { background: #e2e8f0; }

/* SNS 피드 리스트 영역 */
.feed-section { flex: 1.4; display: flex; flex-direction: column; gap: 20px; }
.feed-title-area h2 { font-size: 20px; display: flex; align-items: center; gap: 8px; margin: 0; color: #1a202c; }
.count-badge { background: #e0f2fe; color: #00A3D2; font-size: 14px; padding: 2px 10px; border-radius: 20px; font-weight: bold; }

.no-feed-data { text-align: center; padding: 60px 20px; color: #a0aec0; background: white; border-radius: 16px; border: 1px solid #e2e8f0; font-size: 15px; }
.no-feed-data p { margin: 10px 0 0 0; font-weight: 500; }

.feed-list { display: flex; flex-direction: column; gap: 16px; max-height: 600px; overflow-y: auto; padding-right: 5px; }

/* 개별 인스타형 피드 카드 디자인 */
.feed-card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; box-shadow: 0 4px 6px rgba(0,0,0,0.01); transition: all 0.25s ease; overflow: hidden; }
.feed-card:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0,0,0,0.03); border-color: #cbd5e1; }
.feed-card.expanded { border-left: 4px solid #00A3D2; }

.feed-header-info { padding: 18px; display: flex; align-items: center; gap: 14px; cursor: pointer; user-select: none; }
.user-avatar { width: 42px; height: 42px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.meta-data { flex: 1; }
.meta-data h3 { margin: 0 0 4px 0; font-size: 15px; color: #1a202c; font-weight: 600; }
.sub-info { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #718096; }
.anonymous-name { color: #4a5568; font-weight: 500; }
.date-text { color: #a0aec0; }
.expand-arrow { font-size: 12px; color: #a0aec0; }

/* 카드 확장 시 보여지는 바디 */
.feed-body { padding: 0 20px 20px 74px; border-top: 1px dashed #f1f5f9; pt: 15px; padding-top: 15px; }
.feed-text { font-size: 14px; line-height: 1.6; color: #2d3748; margin: 0 0 15px 0; white-space: pre-wrap; }

/* 감성 해시태그 디자인 */
.feed-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px; }
.hash-tag { background: #f0f9ff; color: #0284c7; font-size: 12px; padding: 3px 10px; border-radius: 6px; font-weight: 500; border: 1px solid #e0f2fe; }

/* 피드 액션 제어 버튼바 */
.feed-actions { display: flex; gap: 8px; justify-content: flex-end; border-top: 1px solid #f1f5f9; padding-top: 12px; }
.action-btn { border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.edit-action { background: #f1f5f9; color: #475569; }
.edit-action:hover { background: #e2e8f0; color: #1e293b; }
.delete-action { background: #fef2f2; color: #ef4444; }
.delete-action:hover { background: #fee2e2; color: #dc2626; }

/* 챗봇 플로팅 UI */
.chatbot-wrapper { position: fixed; bottom: 25px; right: 25px; z-index: 1000; }
.chatbot-toggle-btn { width: 75px; height: 75px; border-radius: 50%; background: #00A3D2; color: white; border: none; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(0,0,0,0.2); font-size: 13px; }
.chatbot-window { width: 340px; height: 460px; background: white; border-radius: 12px; box-shadow: 0 5px 20px rgba(0,0,0,0.15); position: absolute; bottom: 90px; right: 0; display: flex; flex-direction: column; overflow: hidden; border: 1px solid #eee; }
.chatbot-header { background: #00A3D2; color: white; padding: 12px; }
.chatbot-header h3 { margin: 0; font-size: 15px; }
.chatbot-header p { margin: 3px 0 0 0; font-size: 11px; opacity: 0.9; }
.chatbot-messages { flex: 1; padding: 15px; overflow-y: auto; background: #f7f9fa; display: flex; flex-direction: column; gap: 10px; }
.message-bubble { padding: 8px 12px; border-radius: 8px; max-width: 85%; font-size: 12px; line-height: 1.4; }
.message-bubble.user { background: #e0f2fe; align-self: flex-end; }
.message-bubble.assistant { background: white; align-self: flex-start; border: 1px solid #e2e8f0; }
.message-bubble.loading { color: #888; background: transparent; border: none; }
.chatbot-input { display: flex; border-top: 1px solid #eee; padding: 10px; background: white; }
.chatbot-input input { flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; outline: none; font-size: 12px; }
.chatbot-input button { background: #00A3D2; color: white; border: none; padding: 0 15px; margin-left: 5px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold; }
</style>