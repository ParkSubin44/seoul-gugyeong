<template>
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
          ⏳ AI가 답변을 생성 중입니다...
        </div>
      </div>

      <div class="chatbot-input">
        <input v-model="userInput" @keyup.enter="askChatbot" type="text" placeholder="코스를 물어보세요!" :disabled="isChatLoading" />
        <button @click="askChatbot" :disabled="isChatLoading">보내기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';

const userInput = ref('');
const chatMessages = ref([]);
const isChatOpen = ref(false);
const isChatLoading = ref(false);
const messageBox = ref(null);

const askChatbot = async () => {
  if (!userInput.value.trim() || isChatLoading.value) return;
  
  const userText = userInput.value;
  chatMessages.value.push({ role: 'user', content: userText });
  userInput.value = '';
  isChatLoading.value = true;
  
  await nextTick(() => { 
    if (messageBox.value) messageBox.value.scrollTop = messageBox.value.scrollHeight; 
  });

  try {
    const response = await fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: userText }),
    });

    if (!response.ok) {
      throw new Error('백엔드 통신 실패');
    }

    const data = await response.json();
    chatMessages.value.push({ role: 'assistant', content: data.reply || data.message });

  } catch (error) {
    console.error(error);
    chatMessages.value.push({ 
      role: 'assistant', 
      content: '앗, 백엔드 서버와의 통신 중에 에러가 발생했어요! FastAPI 서버가 켜져 있는지 확인해 주세요.' 
    });
  } finally {
    isChatLoading.value = false;
    await nextTick(() => { 
      if (messageBox.value) messageBox.value.scrollTop = messageBox.value.scrollHeight; 
    });
  }
};
</script>

<style scoped>
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
</style>