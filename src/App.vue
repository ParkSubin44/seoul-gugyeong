<template>
  <div class="app-container">
    <!-- 상단 네비게이션 바 -->
    <header class="navbar">
      <div class="logo">📍 서울구경 (SeoulGugyeong)</div>
      <nav class="nav-links">
        <a href="#home" :class="{ active: currentTab === 'home' }" @click="currentTab = 'home'">홈</a>
        <a href="#board" :class="{ active: currentTab === 'board' }" @click="currentTab = 'board'">여행 커뮤니티</a>
      </nav>
    </header>

    <!-- ==================== [탭 1: 홈 (기존 관광지 조회)] ==================== -->
    <div v-if="currentTab === 'home'">
      <section class="hero">
        <h1>어디로 떠나볼까요?</h1>
        <p>서울의 25개 구별 맞춤 여행 정보를 확인해 보세요.</p>
        <div class="search-box">
          <select v-model="selectedDistrict">
            <option value="">구를 선택하세요</option>
            <option v-for="dist in districts" :key="dist" :value="dist">{{ dist }}</option>
          </select>
        </div>
      </section>

      <main class="main-content">
        <div class="map-section">
          <div class="mock-map">
            <p>🗺️ <strong>{{ selectedDistrict || '서울 전체' }}</strong> 지도 영역</p>
            <p class="map-hint">(4단계에서 Leaflet.js 지도가 연동될 예정입니다.)</p>
          </div>
        </div>

        <div class="list-section">
          <h2>선택된 지역 정보 ({{ filteredPlaces.length }}건)</h2>
          <div v-if="!selectedDistrict" class="no-data">💡 구를 선택하시면 정보가 나타납니다!</div>
          <div v-else-if="filteredPlaces.length === 0" class="no-data">😭 데이터가 없습니다.</div>
          <div v-else class="card-grid">
            <div v-for="(place, index) in filteredPlaces" :key="index" class="card">
              <span class="badge" :class="place.source">{{ place.source }}</span>
              <h3>{{ place.title }}</h3>
              <p class="addr" v-if="place.addr1">📍 {{ place.addr1 }}</p>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- ==================== [탭 2: 여행 커뮤니티 (익명 게시판)] ==================== -->
    <div v-if="currentTab === 'board'" class="board-container">
      <section class="board-header">
        <h1>익명 여행 게시판</h1>
        <p>서울 여행에 대한 팁과 후기를 자유롭게 나누세요. (비밀번호 필수!)</p>
      </section>

      <div class="board-content">
        <!-- 좌측: 글 작성 및 수정 폼 -->
        <div class="form-section">
          <h2>{{ isEditing ? '📝 게시글 수정하기' : '✍️ 새 글 작성하기' }}</h2>
          <div class="input-group">
            <input v-model="boardForm.title" type="text" placeholder="제목을 입력하세요" />
            <input v-model="boardForm.password" type="password" placeholder="수정/삭제용 비밀번호" />
            <textarea v-model="boardForm.content" placeholder="내용을 입력하세요" rows="6"></textarea>
          </div>
          <div class="form-buttons">
            <button @click="savePost" class="btn-primary">{{ isEditing ? '수정 완료' : '등록하기' }}</button>
            <button v-if="isEditing" @click="resetForm" class="btn-secondary">취소</button>
          </div>
        </div>

        <!-- 우측: 글 목록 및 상세 조회 -->
        <div class="list-section">
          <h2>등록된 게시글 ({{ posts.length }}개)</h2>
          <div v-if="posts.length === 0" class="no-data">첫 번째 주인공이 되어 글을 남겨보세요!</div>
          
          <div v-else class="post-list">
            <div v-for="post in posts" :key="post.id" class="post-item" :class="{ active: selectedPost?.id === post.id }">
              <div class="post-summary" @click="selectPost(post)">
                <h3>{{ post.title }}</h3>
                <span class="post-date">{{ post.date }}</span>
              </div>
              
              <!-- 상세 조회 영역 (클릭 시 펼쳐짐) -->
              <div v-if="selectedPost?.id === post.id" class="post-detail">
                <p class="post-text">{{ post.content }}</p>
                <div class="post-actions">
                  <button @click="startEdit(post)" class="btn-edit">수정</button>
                  <button @click="deletePost(post)" class="btn-delete">삭제</button>
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
import { ref, computed, onMounted } from 'vue';
import tourData from './assets/seoul_tour.json';
import courseData from './assets/seoul_course.json';

// --- 탭 메뉴 및 관광지 데이터 관련 변수 ---
const currentTab = ref('home');
const selectedDistrict = ref('');
const allLocations = ref([]);
const districts = ['종로구', '중구', '용산구', '성동구', '마포구', '강남구', '영등포구', '동작구']; // 예시 축약

// --- [CRUD] 게시판 관련 반응형 변수 ---
const posts = ref([]); // 게시글 배열
const selectedPost = ref(null); // 현재 상세 조회 중인 게시글
const isEditing = ref(false); // 수정 모드 여부
const editingId = ref(null); // 수정 중인 글의 ID

// 글 작성을 위한 입력 폼 데이터
const boardForm = ref({
  title: '',
  password: '',
  content: ''
});

onMounted(() => {
  // 1. 관광지 데이터 바인딩
  const tours = (tourData.items || []).map(item => ({ ...item, source: '관광지' }));
  const courses = (courseData.items || []).map(item => ({ ...item, source: '여행코스' }));
  allLocations.value = [...tours, ...courses];

  // 2. 로컬스토리지에서 기존 게시글 불러오기
  const savedPosts = localStorage.getItem('seoul_board_posts');
  if (savedPosts) {
    posts.value = JSON.parse(savedPosts);
  }
});

// 관광지 필터링 함수
const filteredPlaces = computed(() => {
  if (!selectedDistrict.value) return [];
  return allLocations.value.filter(place => place.addr1 && place.addr1.includes(selectedDistrict.value));
});

// --- 게시판 CRUD 핵심 로직 ---

// 로컬스토리지에 저장하는 공통 함수
const updateLocalStorage = () => {
  localStorage.setItem('seoul_board_posts', JSON.stringify(posts.value));
};

// 글 선택 (상세 조회)
const selectPost = (post) => {
  if (selectedPost.value?.id === post.id) {
    selectedPost.value = null; // 이미 열려있으면 닫기
  } else {
    selectedPost.value = post;
  }
};

// 폼 초기화
const resetForm = () => {
  boardForm.value = { title: '', password: '', content: '' };
  isEditing.value = false;
  editingId.value = null;
};

// 작성 및 수정 저장 (C & U)
const savePost = () => {
  if (!boardForm.value.title || !boardForm.value.password || !boardForm.value.content) {
    alert('모든 항목을 입력해 주세요!');
    return;
  }

  if (isEditing.value) {
    // [수정 모드]
    const index = posts.value.findIndex(p => p.id === editingId.value);
    if (index !== -1) {
      // 비밀번호 검증
      if (posts.value[index].password !== boardForm.value.password) {
        alert('비밀번호가 일치하지 않습니다!');
        return;
      }
      // 데이터 업데이트
      posts.value[index].title = boardForm.value.title;
      posts.value[index].content = boardForm.value.content;
      alert('글이 성공적으로 수정되었습니다.');
    }
  } else {
    // [신규 작성 모드]
    const newPost = {
      id: Date.now(), // 고유 ID로 타임스탬프 활용
      title: boardForm.value.title,
      password: boardForm.value.password,
      content: boardForm.value.content,
      date: new Date().toLocaleDateString('ko-KR')
    };
    posts.value.unshift(newPost); // 최신글이 맨 위로 오도록 추가
    alert('글이 등록되었습니다.');
  }

  updateLocalStorage();
  resetForm();
  selectedPost.value = null;
};

// 수정 모드 진입
const startEdit = (post) => {
  isEditing.value = true;
  editingId.value = post.id;
  boardForm.value = {
    title: post.title,
    password: '', // 비밀번호는 보안상 비워두고 입력을 유도
    content: post.content
  };
  alert('수정을 위해 비밀번호를 입력한 뒤 내용을 고쳐주세요.');
};

// 글 삭제 (D)
const deletePost = (post) => {
  const inputPassword = prompt('글을 삭제하시려면 비밀번호를 입력하세요:');
  if (inputPassword === null) return; // 취소 클릭 시

  if (post.password !== inputPassword) {
    alert('비밀번호가 일치하지 않습니다!');
    return;
  }

  if (confirm('정말 이 글을 삭제하시겠습니까?')) {
    posts.value = posts.value.filter(p => p.id !== post.id);
    updateLocalStorage();
    selectedPost.value = null;
    alert('글이 삭제되었습니다.');
  }
};
</script>

<style scoped>
/* 기존 스타일 생략 및 추가 디자인 적용 */
.app-container { font-family: 'Malgun Gothic', sans-serif; color: #333; }
.navbar { display: flex; justify-content: space-between; align-items: center; padding: 20px 40px; border-bottom: 1px solid #eee; background: white; position: sticky; top: 0; z-index: 100; }
.logo { font-size: 20px; font-weight: bold; color: #00A3D2; }
.nav-links a { margin-left: 20px; text-decoration: none; color: #666; cursor: pointer; padding: 5px 10px; }
.nav-links a.active { color: #00A3D2; font-weight: bold; border-bottom: 2px solid #00A3D2; }

/* 홈 탭 디자인 */
.hero { text-align: center; padding: 40px 20px; background-color: #f7f9fa; }
.search-box select { padding: 12px 30px; font-size: 16px; border-radius: 25px; border: 2px solid #00A3D2; }
.main-content { display: flex; padding: 40px; gap: 30px; }
.map-section { flex: 1; }
.mock-map { background-color: #e9ecef; height: 450px; border-radius: 12px; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 2px dashed #ccc; }
.list-section { flex: 1.2; }
.card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-height: 450px; overflow-y: auto; }
.card { background: #fff; border: 1px solid #e1e4e6; border-radius: 8px; padding: 15px; }
.badge { display: inline-block; padding: 4px 8px; font-size: 11px; border-radius: 4px; color: white; }
.badge.관광지 { background-color: #3182ce; }
.badge.여행코스 { background-color: #805ad5; }

/* 게시판 탭 디자인 */
.board-container { padding: 40px; max-width: 1200px; margin: 0 auto; }
.board-header { text-align: center; margin-bottom: 30px; }
.board-content { display: flex; gap: 40px; }
.form-section { flex: 1; background: #f8f9fa; padding: 25px; border-radius: 12px; height: fit-content; }
.input-group input, .input-group textarea { width: 100%; padding: 10px; margin-bottom: 12px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
.form-buttons { display: flex; gap: 10px; }
.btn-primary { background: #00A3D2; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold; }
.btn-secondary { background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }

.post-list { display: flex; flex-direction: column; gap: 15px; }
.post-item { border: 1px solid #e2e8f0; border-radius: 8px; background: white; overflow: hidden; }
.post-item.active { border-color: #00A3D2; box-shadow: 0 0 8px rgba(0,163,210,0.1); }
.post-summary { padding: 15px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; background: #fff; }
.post-summary:hover { background: #f7fafc; }
.post-date { font-size: 12px; color: #a0aec0; }
.post-detail { padding: 15px; background: #f7fafc; border-top: 1px solid #edf2f7; }
.post-text { white-space: pre-line; line-height: 1.6; color: #4a5568; }
.post-actions { margin-top: 15px; display: flex; gap: 10px; justify-content: flex-end; }
.btn-edit { background: #3182ce; color: white; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; }
.btn-delete { background: #e53e3e; color: white; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; }
.no-data { text-align: center; padding: 40px; color: #718096; background: #edf2f7; border-radius: 8px; width: 100%; }
</style>