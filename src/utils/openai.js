import OpenAI from "openai";

// .env 파일에 입력한 환경 변수에서 키를 안전하게 불러옵니다
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // 프론트엔드 환경에서 직접 호출하기 위한 옵션
});

/**
 * 사용자 질문과 JSON 데이터를 받아와 OpenAI에 질의하는 함수
 * @param {string} userQuestion - 사용자가 입력한 질문
 * @param {Object} tourData - 바인딩된 JSON 데이터 (관광지, 코스 등)
 */
export async function getChatbotResponse(userQuestion, tourData) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 빠르고 가성비 좋은 모델
      messages: [
        {
          role: "system",
          content: `너는 서울 관광 안내 챗봇이야. 아래 제공된 JSON 데이터를 기반으로만 사용자의 질문에 친절하고 정확하게 답변해 줘. 데이터에 없는 내용은 모른다고 대답해줘.\n\n[데이터]\n${JSON.stringify(tourData)}`,
        },
        {
          role: "user",
          content: userQuestion,
        },
      ],
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI API 호출 에러:", error);
    return "죄송합니다. 답변을 생성하는 중에 오류가 발생했습니다.";
  }
}