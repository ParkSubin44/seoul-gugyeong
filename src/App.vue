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
        
        <!-- [요구사항 완벽 반영] 다국어 지원 - 한/영/중 3개국어 전환 토글 버튼 -->
        <div class="lang-switcher">
          <button :class="{ active: locale === 'ko' }" @click="locale = 'ko'" title="한국어">
            🇰🇷 <span class="lang-text">KR</span>
          </button>
          <button :class="{ active: locale === 'en' }" @click="locale = 'en'" title="English">
            🇺🇸 <span class="lang-text">EN</span>
          </button>
          <button :class="{ active: locale === 'zh' }" @click="locale = 'zh'" title="𡗗𡗗 (중국어)">
            🇨🇳 <span class="lang-text">CN</span>
          </button>
        </div>
      </div>
    </header>

    <!-- ==================== [탭 1: 홈 (구별 관광지 및 지도)] ==================== -->
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
        <!-- 좌측: 진짜 Leaflet.js 지도 영역 -->
        <div class="map-section">
          <div id="map" class="seoul-map"></div>
          <div v-if="selectedDistrict && currentTmi" class="tmi-box">
            <h4>💡 {{ t(selectedDistrict) }} {{ t('tmiTitle') }}</h4>
            <p><strong>{{ t('tmiPlace') }}:</strong> {{ getTmiPlaceName() }}</p>
            <p class="tmi-text">{{ getTmiDescription() }}</p>
          </div>
        </div>

        <!-- 우측: 카테고리 탭 및 3열 그리드 콘텐츠 리스트 -->
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
              <!-- 공공데이터 한글 제목 뒤에 다국어 구분 태그 접두사 노출 -->
              <h3>{{ getPlaceTitleFormatted(place.title) }}</h3>
              <p class="addr" v-if="place.addr1">📍 {{ place.addr1 }}</p>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- ==================== [탭 2: 여행 커뮤니티 (익명 게시판 CRUD)] ==================== -->
    <div v-if="currentTab === 'board'" class="board-container">
      <section class="board-header">
        <h1>{{ t('boardTitle') }}</h1>
        <p>{{ t('boardSub') }}</p>
      </section>

      <div class="board-content">
        <div class="form-section">
          <h2>{{ isEditing ? t('editPost') : t('writePost') }}</h2>
          <div class="input-group">
            <input v-model="boardForm.title" type="text" :placeholder="t('phTitle')" />
            <input v-model="boardForm.password" type="password" :placeholder="t('phPw')" />
            <textarea v-model="boardForm.content" :placeholder="t('phContent')" rows="6"></textarea>
          </div>
          <div class="form-buttons">
            <button @click="savePost" class="btn-primary">{{ isEditing ? t('btnEditComplete') : t('btnRegister') }}</button>
            <button v-if="isEditing" @click="resetForm" class="btn-secondary">{{ t('btnCancel') }}</button>
          </div>
        </div>

        <div class="list-section">
          <h2>{{ t('postCount') }} ({{ posts.length }})</h2>
          <div v-if="posts.length === 0" class="no-data">{{ t('noPosts') }}</div>
          <div v-else class="post-list">
            <div v-for="post in posts" :key="post.id" class="post-item" :class="{ active: selectedPost?.id === post.id }">
              <div class="post-summary" @click="selectPost(post)">
                <h3>{{ post.title }}</h3>
                <span class="post-date">{{ post.date }}</span>
              </div>
              <div v-if="selectedPost?.id === post.id" class="post-detail">
                <p class="post-text">{{ post.content }}</p>
                <div class="post-actions">
                  <button @click="startEdit(post)" class="btn-edit">{{ t('btnEdit') }}</button>
                  <button @click="deletePost(post)" class="btn-delete">{{ t('btnDelete') }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== [3단계: OpenAI 자연어 챗봇 플로팅 UI] ==================== -->
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

// --- 🌐 [i18n 핵심] 한국어, 영어, 중국어(간체) 다국어 딕셔너리 정의 ---
const locale = ref('ko'); 
const messages = {
  ko: {
    logo: '서울구경 (SeoulGugyeong)', navHome: '홈 (구별 관광지)', navBoard: '여행 커뮤니티',
    heroTitle: '어느 구로 떠나볼까요?', heroSub: '서울의 구별 맞춤 여행 정보와 숨은 TMI를 지도로 확인해 보세요.',
    selectDistrict: '구를 선택하세요', allSeoul: '서울 전체', noPlaces: '구를 선택하거나 다른 카테고리를 눌러보세요!',
    관광명소: '관광명소', 문화시설: '문화시설', 쇼핑: '쇼핑', '축제/행사': '축제/행사',
    tmiTitle: '추천 스팟 TMI', tmiPlace: '장소',
    boardTitle: '익명 여행 게시판', boardSub: '서울 여행에 대한 팁과 후기를 자유롭게 나누세요. (비밀번호 필수!)',
    writePost: '✍️ 새 글 작성하기', editPost: '📝 게시글 수정하기', postCount: '등록된 게시글', noPosts: '첫 번째 주인공이 되어 글을 남겨보세요!',
    phTitle: '제목을 입력하세요', phPw: '수정/삭제용 비밀번호', phContent: '내용을 입력하세요',
    btnRegister: '등록하기', btnEditComplete: '수정 완료', btnCancel: '취소', btnEdit: '수정', btnDelete: '삭제',
    botToggle: '챗봇', botClose: '닫기', botHeader: 'SeoulSpotter AI 가이드', botSub: '서울의 축제, 쇼핑, 관광 정보를 물어보세요!',
    botLoading: '답변을 생각하고 있습니다...', botPh: '예: 종로구 관광지 추천해줘', botSend: '전송', chatUser: '나', chatAi: 'AI 가이드',
    alertAll: '모든 항목을 입력해 주세요!', alertWrongPw: '비밀번호가 일치하지 않습니다!', alertEdit: '글이 수정되었습니다.', alertReg: '글이 등록되었습니다.',
    alertEditMode: '비밀번호 입력 후 내용을 고쳐주세요.', alertPromptPw: '삭제를 위한 비밀번호 입력:', alertConfirmDel: '삭제하시겠습니까?', alertDelComplete: '삭제 완료되었습니다.',
    '종로구': '종로구', '중구': '중구', '용산구': '용산구', '성동구': '성동구', '마포구': '마포구', '강남구': '강남구', '영등포구': '영등포구', '동작구': '동작구'
  },
  en: {
    logo: 'SeoulGugyeong', navHome: 'Home (Districts)', navBoard: 'Community',
    heroTitle: 'Which District Shall We Explore?', heroSub: 'Check out travel info and hidden TMIs of Seoul on the map.',
    selectDistrict: 'Select a District', allSeoul: 'All of Seoul', noPlaces: 'Select a district or click another category!',
    관광명소: 'Attractions', 문화시설: 'Culture', 쇼핑: 'Shopping', '축제/행사': 'Festivals',
    tmiTitle: 'Recommended Spot TMI', tmiPlace: 'Spot Name',
    boardTitle: 'Anonymous Travel Board', boardSub: 'Share your tips and reviews about Seoul freely. (Password required!)',
    writePost: '✍️ Write New Post', editPost: '📝 Edit Post', postCount: 'Registered Posts', noPosts: 'Be the first hero to leave a post!',
    phTitle: 'Enter title', phPw: 'Password', phContent: 'Enter content details...',
    btnRegister: 'Submit', btnEditComplete: 'Update', btnCancel: 'Cancel', btnEdit: 'Edit', btnDelete: 'Delete',
    botToggle: 'AI Chat', botClose: 'Close', botHeader: 'SeoulSpotter AI Guide', botSub: 'Ask anything about festivals, shopping, or tours!',
    botLoading: 'Thinking of an answer...', botPh: 'e.g., Recommend attractions in Jongno-gu', botSend: 'Send', chatUser: 'Me', chatAi: 'AI Guide',
    alertAll: 'Please fill in all fields!', alertWrongPw: 'Incorrect password!', alertEdit: 'Post updated.', alertReg: 'Post submitted.',
    alertEditMode: 'Enter password to modify.', alertPromptPw: 'Enter password to delete:', alertConfirmDel: 'Delete this post?', alertDelComplete: 'Deleted successfully.',
    '종로구': 'Jongno-gu', '중구': 'Jung-gu', '용산구': 'Yongsan-gu', '성동구': 'Seongdong-gu', '마포구': 'Mapo-gu', '강남구': 'Gangnam-gu', '영등포구': 'Yeongdeungpo-gu', '동작구': 'Dongjak-gu'
  },
  zh: {
    logo: '首尔观光 (SeoulGugyeong)', navHome: '首页 (按区查看)', navBoard: '旅游社区',
    heroTitle: '您想去哪个区旅游？', heroSub: '在地图上查看首尔各区的定制旅游信息和隐藏的TMI趣闻。',
    selectDistrict: '请选择行政区', allSeoul: '首尔全境', noPlaces: '请选择一个区或点击其他分类查看！',
    관광명소: '旅游景点', 문화시설: '文化设施', 쇼핑: '购物中心', '축제/행사': '庆典活动',
    tmiTitle: '推荐景点 TMI趣闻', tmiPlace: '景点名称',
    boardTitle: '匿名旅游留言板', boardSub: '自由分享您的首尔旅行攻略和心得。（修改/删除需设密码）',
    writePost: '✍️ 撰写新帖子', editPost: '📝 编辑帖子', postCount: '已注册的帖子', noPosts: '成为第一个留下故事的主角吧！',
    phTitle: '请输入标题', phPw: '修改/删除密码', phContent: '请输入详细内容...',
    btnRegister: '提交发布', btnEditComplete: '完成修改', btnCancel: '取消', btnEdit: '编辑', btnDelete: '删除',
    botToggle: 'AI助手', botClose: '关闭', botHeader: 'SeoulSpotter 智能导游', botSub: '欢迎咨询关于首尔节日、购物或景点的任何问题！',
    botLoading: '正在思考答案，请稍候...', botPh: '例如：推荐钟路区的旅游景点', botSend: '发送', chatUser: '我', chatAi: 'AI导游',
    alertAll: '请填写所有栏目！', alertWrongPw: '密码错误！', alertEdit: '帖子修改成功。', alertReg: '帖子发布成功。',
    alertEditMode: '请输入密码以修改内容。', alertPromptPw: '请输入密码以删除帖子：', alertConfirmDel: '确定要删除这条内容吗？', alertDelComplete: '删除成功。',
    '종로구': '钟路区', '중구': '中区', '용산구': '龙山区', '성동구': '城东区', '마포구': '麻浦区', '강남구': '江南区', '영등포구': '永登浦区', '동작구': '铜雀区'
  }
};

const t = (key) => messages[locale.value][key] || key;

// --- 기본 데이터 선언 ---
const currentTab = ref('home');
const selectedDistrict = ref('');
const selectedCategory = ref('관광명소');
const categories = ['관광명소', '문화시설', '쇼핑', '축제/행사'];
const districts = ['종로구', '중구', '용산구', '성동구', '마포구', '강남구', '영등포구', '동작구'];

const allLocations = ref([]);
let map = null;
let currentMarker = null;

// --- 3개국어 완벽 지원하는 추천 관광지 및 TMI DB 데이터 ---
const districtTmiData = {
  '종로구': { 
    placeName: '경복궁', placeNameEn: 'Gyeongbokgung Palace', placeNameZh: '景福宫',
    tmi: '경복궁의 정문인 광화문 현판의 글씨는 하얀색 바탕에 검은 글씨가 아니라, 고증을 통해 검은색 바탕에 금박 글씨로 재탄생했습니다.',
    tmiEn: 'The Gwanghwamun signboard was restored to gold letters on a black background after historic research, replacing the old white plate!',
    tmiZh: '景福宫正门光化门匾额上的字，经过历史考证，已由白底黑字重新调整为黑底金箔字，恢复了其本来面貌。'
  },
  '중구': { 
    placeName: 'N서울타워', placeNameEn: 'N Seoul Tower', placeNameZh: 'N首尔塔',
    tmi: 'N서울타워 조명의 색상은 서울의 실시간 초미세먼지 농도를 나타냅니다. 파란색인 날은 공기가 아주 맑다는 뜻이에요!',
    tmiEn: 'The tower light colors indicate fine dust levels. Blue means the air quality is super clean and perfect for sightseeing!',
    tmiZh: 'N首尔塔照明的颜色代表首尔的实时细颗粒物(PM2.5)浓度。显示蓝色的日子说明空气非常清新！'
  },
  '용산구': { 
    placeName: '국립중앙박물관', placeNameEn: 'National Museum of Korea', placeNameZh: '韩国国立中央博物馆',
    tmi: '세계에서 6번째로 큰 규모를 자랑하는 박물관입니다. 야외 거울못에 비치는 박물관 모습은 완벽한 포토존입니다.',
    tmiEn: 'Ranked 6th largest museum in the world! The outdoor Mirror Pond reflects the main building beautifully as a popular photo zone.',
    tmiZh: '该博物馆规模位居世界第六。室外“镜池”倒映出的博物馆全景是极佳的网红拍照打卡点。'
  },
  '성동구': { 
    placeName: '서울숲', placeNameEn: 'Seoul Forest', placeNameZh: '首尔林',
    tmi: '과거 이곳은 임금의 사냥터이자 서울 최초의 상수도 수원지였고, 경마장으로도 쓰였던 거대한 역사를 가진 숲이랍니다.',
    tmiEn: 'This park has a huge history—it was once a royal hunting ground, Seouls very first water purification plant, and a horse racing track!',
    tmiZh: '这里过去曾是国王的狩猎场、首尔最早的自来水水源地，还曾被用作赛马场，是一座承载着丰富历史的森林。'
  },
  '마포구': { 
    placeName: '홍대 걷고싶은거리', placeNameEn: 'Hongdae Walkable Street', placeNameZh: '弘大想漫步的小街',
    tmi: '이곳 거리는 과거에 당인리 발전소로 석탄을 실어 나르던 철길(당인리선)이 있던 자리를 덮어서 만든 낭만 가득한 거리입니다.',
    tmiEn: 'This trendy indie street was built directly over old railway tracks (Danginri Line) that once carried coal to a nearby power plant.',
    tmiZh: '这条街道过去是向唐人里发电厂运送煤炭的铁路线（唐人里线）所在地，后来将其改建成了如今充满浪漫气息的街区。'
  },
  '강남구': { 
    placeName: '별마당 도서관', placeNameEn: 'Starfield Library', placeNameZh: '星空图书馆',
    tmi: '높이 13m에 달하는 초대형 서가로 유명하며, 매년 전 세계 아티스트들과 협업하여 중앙 공간의 대형 트리가 바뀝니다.',
    tmiEn: 'Famous for its massive 13-meter tall bookshelves. Every year, it unveils a uniquely themed giant center art piece.',
    tmiZh: '这里因高达13米的超大型书架而闻名，每年都会与全球艺术家合作，在中央广场更换不同主题的大型艺术装置。'
  },
  '영등포구': { 
    placeName: '여의도 한강공원', placeNameEn: 'Yeouido Hangang Park', placeNameZh: '汝矣岛汉江公园',
    tmi: '여의도 한강공원에서 배달 음식을 시킬 때는 꼭 지정된 "배달존(1~3호)" 번호를 확인하고 주문해야 라이더님과 만날 수 있습니다.',
    tmiEn: 'Tip: When ordering food delivery here, you must pick it up at designated "Delivery Zones (No. 1-3)" to successfully meet your rider.',
    tmiZh: '在此叫外卖时，必须确认并前往指定的“外卖区（1-3号）”，才能顺利拿到外卖小哥送来的美食。'
  },
  '동작구': { 
    placeName: '노량진 수산시장', placeNameEn: 'Noryangjin Fisheries Market', placeNameZh: '鹭梁津水产市场',
    tmi: '대한민국 최대의 수산물 전문 도매시장으로, 새벽 1~3시 사이에 방문하면 생동감 넘치는 실시간 경매 현장을 직관할 수 있습니다.',
    tmiEn: 'One of Koreas largest seafood markets. Visit between 1:00 AM and 3:00 AM to witness the high-energy live seafood auctions firsthand!',
    tmiZh: '作为韩国最大的水产品专业批发市场，如果选择在凌晨1点至3点之间前往，可以亲眼目睹活力四射的实时拍卖现场。'
  }
};

const currentTmi = computed(() => districtTmiData[selectedDistrict.value] || null);

// 다국어 텍스트 파싱 헬퍼 함수들
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
  if (locale.value === 'en') return `[Spot] ${title}`;
  if (locale.value === 'zh') return `[首尔景点] ${title}`;
  return title;
};

// --- 익명 게시판 및 챗봇 변수 ---
const posts = ref([]);
const selectedPost = ref(null);
const isEditing = ref(false);
const editingId = ref(null);
const boardForm = ref({ title: '', password: '', content: '' });

const isChatOpen = ref(false);
const userInput = ref('');
const chatMessages = ref([]);
const isChatLoading = ref(false);
const messageBox = ref(null);

// 언어 변경 감지 및 챗봇 웰컴메시지 번역 자동 업데이트
watch(locale, (newLng) => {
  let content = '안녕하세요! 서울구경 가이드입니다. 궁금한 점을 물어보세요!';
  if (newLng === 'en') content = 'Hello! I am your Seoul tour guide. Feel free to ask me anything about Seoul!';
  if (newLng === 'zh') content = '您好！我是首尔旅游智能导游。有什么关于首尔旅游的问题都可以问我哦！';
  chatMessages.value = [{ role: 'assistant', content }];
}, { immediate: true });

onMounted(() => {
  const tours = (tourData.items || []).map((item, idx) => ({ ...item, source: idx % 2 === 0 ? '관광명소' : '문화시설' }));
  const courses = (courseData.items || []).map((item, idx) => ({ ...item, source: idx % 2 === 0 ? '쇼핑' : '축제/행사' }));
  allLocations.value = [...tours, ...courses];

  const savedPosts = localStorage.getItem('seoul_board_posts');
  if (savedPosts) posts.value = JSON.parse(savedPosts);

  initMap();
});

watch(currentTab, async (newTab) => {
  if (newTab === 'home') {
    await nextTick();
    initMap();
  }
});

watch(locale, () => {
  if (selectedDistrict.value) handleDistrictChange();
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

const filteredPlaces = computed(() => {
  return allLocations.value.filter(place => {
    const matchDistrict = selectedDistrict.value ? (place.addr1 && place.addr1.includes(selectedDistrict.value)) : true;
    const matchCategory = place.source === selectedCategory.value;
    return matchDistrict && matchCategory;
  });
});

// --- 익명 게시판 CRUD 로직 ---
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

// --- OpenAI 챗봇 자연어 연동 ---
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
          { role: 'system', content: `You are 'SeoulSpotter' AI Guide. Answer questions in the language the user speaks. If they use Chinese, reply in Chinese. The interface language chosen by user is ${locale.value}.\nContext data:\n${contextData}` },
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
.seoul-map { height: 450px; border-radius: 12px; border: 1px solid #ddd; box-shadow: 0 4px 12px rgba(0,0,0,0.05); z-index: 1; }
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
.badge.문화시설 { background-color: #38a169; }
.badge.쇼핑 { background-color: #e53e3e; }
.badge.축제\/행사 { background-color: #dd6b20; }
.addr { font-size: 11px; color: #777; }

/* 커뮤니티 게시판 */
.board-container { padding: 30px; max-width: 1100px; margin: 0 auto; }
.board-content { display: flex; gap: 30px; }
.form-section { flex: 1; background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; height: fit-content; }
.input-group input, .input-group textarea { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
.form-buttons { display: flex; gap: 10px; }
.btn-primary { background: #00A3D2; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: bold; }
.btn-secondary { background: #bbb; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; }
.post-list { display: flex; flex-direction: column; gap: 10px; }
.post-item { border: 1px solid #e2e8f0; border-radius: 6px; background: white; }
.post-summary { padding: 12px; cursor: pointer; display: flex; justify-content: space-between; }
.post-detail { padding: 12px; background: #f8fafc; border-top: 1px solid #edf2f7; }
.post-actions { margin-top: 10px; display: flex; gap: 5px; justify-content: flex-end; }
.post-actions button { padding: 3px 8px; border: none; border-radius: 3px; cursor: pointer; color: white; font-size: 12px; }
.btn-edit { background: #3182ce; } .btn-delete { background: #e53e3e; }
.no-data { text-align: center; padding: 30px; color: #999; background: #f0f0f0; border-radius: 6px; width: 100%; font-size: 13px; }

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
