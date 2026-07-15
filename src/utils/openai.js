/**
 * 사용자 질문과 JSON 데이터를 받아와 백엔드 서버(FastAPI)로 전달하는 함수
 * @param {string} userQuestion - 사용자가 입력한 질문
 * @param {Object} tourData - 바인딩된 JSON 데이터 (관광지, 코스 등)
 */
export async function getChatbotResponse(userQuestion, tourData) {
  try {
    // 우리가 띄워둔 FastAPI 백엔드 서버로 요청을 보냅니다
    const response = await fetch("http://127.0.0.1:8000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: userQuestion,
        tour_data: tourData,
      }),
    });

    if (!response.ok) {
      throw new Error("서버 응답이 올바르지 않습니다.");
    }

    const data = await response.json();
    return data.reply; // 백엔드에서 보내준 답변 리턴
  } catch (error) {
    console.error("챗봇 통신 에러:", error);
    return "죄송합니다. 백엔드 서버와의 통신 중에 에러가 발생했어요! FastAPI 서버가 켜져 있는지 확인해 주세요.";
  }
}
