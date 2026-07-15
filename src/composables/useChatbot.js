import { ref } from 'vue'
import { askChatbot } from '../services/openaiService.js'
import { getAllItems } from '../services/dataService.js'

// 담당(WBS): 김소진 - "OpenAI 기반 지역 정보 챗봇 구현"
// 대화 히스토리 유지 요구사항(RFP) 반영: 컴포넌트가 unmount 되어도 유지되도록 모듈 스코프에 상태를 둠.

const messages = ref([
  { role: 'assistant', content: '안녕하세요! 서울 지역 정보에 대해 무엇이든 물어보세요 🙂' }
])
const isLoading = ref(false)
const errorMessage = ref('')

export function useChatbot() {
  async function sendMessage(text) {
    const content = text.trim()
    if (!content || isLoading.value) return

    messages.value.push({ role: 'user', content })
    isLoading.value = true
    errorMessage.value = ''

    try {
      const items = await getAllItems()
      // API 히스토리에는 role/content만 필요하므로 매핑해서 전달
      const history = messages.value.map(({ role, content }) => ({ role, content }))
      const reply = await askChatbot(history, items)
      messages.value.push({ role: 'assistant', content: reply })
    } catch (err) {
      console.error(err)
      errorMessage.value = '챗봇 응답 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
      messages.value.push({ role: 'assistant', content: errorMessage.value })
    } finally {
      isLoading.value = false
    }
  }

  return { messages, isLoading, errorMessage, sendMessage }
}
