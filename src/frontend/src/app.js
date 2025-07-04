import "regenerator-runtime/runtime"; // if needed for async/await in older browsers
// --- DOM Elements ---
const chatMessages = document.getElementById("chat-messages");
const modeNotice = document.getElementById("mode-notice");
const messageForm = document.getElementById("message-form");
const userInput = document.getElementById("user-input");
const drugTagsContainer = document.getElementById("drug-tags-container");
const newChatBtn = document.getElementById("new-chat-btn");
const menuToggleBtn = document.getElementById("menu-toggle-btn");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");
const addDrugBtn = document.getElementById("add-drug-btn");
const drugModal = document.getElementById("drug-modal");
const closeModalBtn = document.getElementById("close-modal-btn");
const drugSearchInput = document.getElementById("drug-search-input");
const drugSearchBtn = document.getElementById("drug-search-btn");
const drugSearchResults = document.getElementById("drug-search-results");
const saveProfileBtn = document.getElementById("save-profile");
const themeToggle = document.getElementById("theme-toggle");
const headerIcon = document.getElementById("header-icon");
const headerTitle = document.getElementById("header-title");
const toggleLabelMed = document.getElementById("toggle-label-med");
const toggleLabelMind = document.getElementById("toggle-label-mind");

// --- State and Config ---
let currentQueryDrugs = [];
const BASE_URL = "http://localhost:8000";
let db;
let currentMode = "assistant"; // 'assistant' or 'naive'

// --- IndexedDB Functions ---
async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("medChatDB-v2", 1);
    request.onupgradeneeded = (e) => {
      db = e.target.result;
      if (!db.objectStoreNames.contains("chats")) {
        db.createObjectStore("chats", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("metadata")) {
        db.createObjectStore("metadata", { keyPath: "key" });
      }
    };
    request.onsuccess = (e) => {
      db = e.target.result;
      resolve();
    };
    request.onerror = (e) => {
      console.error("IndexedDB error:", e.target.errorCode);
      reject(e);
    };
  });
}

// --- IndexedDB Functions ---
async function saveMessage(role, content) {
  if (!db) return;
  const tx = db.transaction("chats", "readwrite");
  const store = tx.objectStore("chats");
  store.add({ role, content, timestamp: new Date() });
}

async function getAllMessages() {
  if (!db) return [];
  const tx = db.transaction("chats", "readonly");
  const store = tx.objectStore("chats");
  return await store.getAll();
}

async function saveMetadata(key, value) {
  if (!db) return;
  const tx = db.transaction("metadata", "readwrite");
  const store = tx.objectStore("metadata");
  store.put({ key, value });
}

async function getMetadata(key) {
  if (!db) return null;
  const tx = db.transaction("metadata", "readonly");
  const store = tx.objectStore("metadata");
  const req = await store.get(key);
  return req ? req.value : null;
}

async function clearAllData() {
  if (!db) return;
  const tx = db.transaction(["chats", "metadata"], "readwrite");
  tx.objectStore("chats").clear();
  tx.objectStore("metadata").clear();
}

// --- UI & Theme Functions ---
function applyTheme(isCalm) {
  if (isCalm) {
    document.body.classList.add("theme-calm");
    headerIcon.textContent = "🌙";
    headerTitle.textContent = "AI 마음 상담";
    toggleLabelMed.classList.add("opacity-70");
    toggleLabelMed.classList.remove("font-semibold");
    toggleLabelMind.classList.remove("opacity-70");
    toggleLabelMind.classList.add("font-semibold");
    addDrugBtn.style.display = "none"; // 마음상담 모드에서 약 추가 버튼 숨기기
    currentMode = "naive";
  } else {
    document.body.classList.remove("theme-calm");
    headerIcon.textContent = "💊";
    headerTitle.textContent = "AI 복약 상담";
    toggleLabelMed.classList.remove("opacity-70");
    toggleLabelMed.classList.add("font-semibold");
    toggleLabelMind.classList.add("opacity-70");
    toggleLabelMind.classList.remove("font-semibold");
    addDrugBtn.style.display = "block";
    currentMode = "assistant";
  }
}

function updateModeNotice() {
  if (currentMode === "assistant") {
    modeNotice.innerHTML = `
      <div class="mx-auto max-w-2xl flex items-center gap-3 rounded-xl bg-indigo-50 border border-indigo-200 shadow-sm px-4 py-3 mb-2">
        <span class="text-2xl">💊</span>
        <div class="text-left flex-1">
          <div class="text-indigo-900 font-bold text-base">복약 상담 안내</div>
          <div class="text-sm text-indigo-800 mt-1">
            복용하시려는 약에 대해 궁금한 점을 질문해주세요.<br>
            약이나 영양제를 추가하고 질문을 입력하시면, 저장된 프로필 정보를 바탕으로 답변해 드립니다.
            <br><span class="text-xs text-indigo-500">본 서비스는 정보 제공을 목적으로 하며,<br>
            의학적 진단을 대체할 수 없습니다.<br>
            정확한 진단 및 처방은 반드시 의사 또는 약사와 상담하세요.</span>
          </div>
        </div>
      </div>
    `;
  } else {
    modeNotice.innerHTML = `
      <div class="mx-auto max-w-2xl flex items-center gap-3 rounded-xl bg-pink-50 border border-pink-200 shadow-sm px-4 py-3 mb-2">
        <span class="text-2xl">🌙</span>
        <div class="text-left flex-1">
          <div class="text-pink-900 font-bold text-base">마음 상담 안내</div>
          <div class="text-sm text-pink-800 mt-1">
            안녕하세요, 마음 상담사 '마음이'입니다.<br>
            어떤 이야기든 편안하게 들려주세요.
          </div>
        </div>
      </div>
    `;
  }
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
function createMessageBubble(content, sender = "user", timestamp) {
  const wrapper = document.createElement("div");
  wrapper.classList.add(
    "flex",
    "items-end",
    "gap-2",
    "mb-4",
    "message-fade-in"
  );

  const avatar = document.createElement("div");
  avatar.classList.add(
    "w-8",
    "h-8",
    "rounded-full",
    "flex-shrink-0",
    "flex",
    "items-center",
    "justify-center",
    "font-bold",
    "text-lg",
    "shadow-sm"
  );

  const bubbleContainer = document.createElement("div");
  bubbleContainer.classList.add("flex", "flex-col", "max-w-xs", "sm:max-w-md");

  const bubble = document.createElement("div");
  bubble.classList.add("p-3", "rounded-lg", "shadow-sm", "text-body");

  const timeEl = document.createElement("span");
  timeEl.classList.add("text-xs", "text-subtle", "mt-1");
  timeEl.textContent = formatTime(timestamp || new Date());

  if (sender === "assistant") {
    wrapper.classList.add("justify-start");
    avatar.classList.add("primary-accent-bg", "text-white");
    avatar.textContent = "💬";
    bubble.classList.add("chat-bubble-bot", "rounded-bl-none");
    bubbleContainer.classList.add("items-start");
    wrapper.append(avatar, bubbleContainer);
  } else {
    wrapper.classList.add("justify-end");
    avatar.classList.add("bg-gray-300", "text-gray-600");
    avatar.textContent = "나";
    bubble.classList.add("chat-bubble-user", "text-white", "rounded-br-none");
    bubbleContainer.classList.add("items-end");
    wrapper.append(bubbleContainer, avatar);
  }

  bubble.innerHTML = content.replace(/\n/g, "<br>");
  bubbleContainer.append(bubble, timeEl);

  return wrapper;
}
function createLoadingBubble() {
  const wrapper = document.createElement("div");
  wrapper.id = "loading-bubble";
  wrapper.classList.add("flex", "items-end", "gap-2", "mb-4");

  const avatar = document.createElement("div");
  avatar.classList.add(
    "w-8",
    "h-8",
    "rounded-full",
    "primary-accent-bg",
    "flex-shrink-0",
    "flex",
    "items-center",
    "justify-center",
    "text-lg",
    "text-white"
  );
  
  const bubble = document.createElement("div");
  bubble.classList.add(
    "p-3",
    "rounded-lg",
    "chat-bubble-bot",
    "max-w-xs",
    "sm:max-w-md",
    "animate-pulse",
    "rounded-bl-none"
  );
  bubble.innerHTML = `<div class="h-4 bg-gray-200 rounded w-24"></div>`;

  wrapper.append(avatar, bubble);
  return wrapper;
}

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderDrugTags() {
  drugTagsContainer.innerHTML = "";
  currentQueryDrugs.forEach((drug, index) => {
    const tag = document.createElement("div");
    tag.className =
      "component flex items-center tag-bg tag-text text-sm font-medium px-2.5 py-0.5 rounded-full";
    tag.innerHTML = `
            <span>${drug.name} (${drug.ingredient})</span>
            <button type="button" data-index="${index}" class="ml-2 primary-accent-text">&times;</button>
        `;
    drugTagsContainer.appendChild(tag);
  });
}

// --- API & Logic Functions ---
function getProfileContext() {
  const age = document.getElementById("age").value;
  const gender = document.getElementById("gender").value;
  const conditions = document.getElementById("conditions").value;
  const medications = document.getElementById("medications").value;
  return `[사용자 프로필]\n- 나이: ${age}세\n- 성별: ${gender}\n- 기저질환: ${
    conditions || "없음"
  }\n- 현재 복용 약물: ${medications || "없음"}`;
}

async function getAssistantResponse(userMessage) {
  let url;
  let payload;
  let finalMessage = userMessage;

  if (currentMode === "assistant") {
    // 복약상담 로직
    const profileContext = getProfileContext();
    const drugContext =
      currentQueryDrugs.length > 0
        ? `[질문 약물]\n${currentQueryDrugs
            .map((d) => `- ${d.name}(${d.ingredient})`)
            .join("\n")}`
        : "";
    finalMessage =
      `${profileContext}\n\n${drugContext}\n\n[질문]\n${userMessage}`.trim();

    const thread_id = await getMetadata("assistant_thread_id");
    payload = { message: finalMessage, thread_id: thread_id };
    url = `${BASE_URL}/assistant`;
  } else {
    // 마음상담 로직 - 전체 메시지 히스토리를 사용하여 스레드 공유
    const allMsgs = await getAllMessages();
    const messagesForAPI = [
      {
        role: "system",
        content:
          "당신은 사용자의 마음을 위로하고 공감해주는 따뜻한 상담사 '마음이'입니다. 사용자의 이야기에 깊이 공감하며, 안정감을 주는 말투로 대화해주세요. 모든 답변은 한국어로, 다정하게 해주세요.",
      },
      ...allMsgs.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: finalMessage },
    ];
    payload = { messages: messagesForAPI };
    url = `${BASE_URL}/chat`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `Network response was not ok: ${response.status} ${errText}`
    );
  }

  const data = await response.json();

  if (currentMode === "assistant" && data.thread_id) {
    await saveMetadata("assistant_thread_id", data.thread_id);
  }

  await saveMessage("user", userMessage);
  await saveMessage("assistant", data.reply);

  return data.reply;
}

function searchDrugs(term) {
  const mockResults = [
    { id: "1", name: "타이레놀정500mg", ingredient: "아세트아미노펜" },
    { id: "2", name: "부루펜정", ingredient: "이부프로펜" },
    { id: "3", name: "베아제정", ingredient: "판크레아틴 복합" },
    { id: "4", name: "겔포스엠현탁액", ingredient: "알마게이트 복합" },
    { id: "5", name: "파리에트정", ingredient: "라베프라졸" },
    { id: "6", name: "란소정", ingredient: "란소프라졸" },
    { id: "7", name: "가스모틴정", ingredient: "모사프리드" },
    { id: "8", name: "큐란정", ingredient: "라니티딘" },
    { id: "9", name: "자렐토정", ingredient: "리바록사반" },
    { id: "10", name: "플라빅스정", ingredient: "클로피도그렐" },
    { id: "11", name: "로벨리토정", ingredient: "텔미사르탄 복합" },
    { id: "12", name: "아모디핀정", ingredient: "암로디핀" },
    { id: "13", name: "크레스토정", ingredient: "로수바스타틴" },
    { id: "14", name: "리피토정", ingredient: "아토르바스타틴" },
    { id: "15", name: "디오반정", ingredient: "발사르탄" },
    { id: "16", name: "지르텍정", ingredient: "세티리진" },
    { id: "17", name: "알레그라정", ingredient: "페폭소페나딘" },
    { id: "18", name: "페라딘정", ingredient: "로라타딘" },
    { id: "19", name: "이모듐캡슐", ingredient: "로페라마이드" },
    { id: "20", name: "타나민정", ingredient: "은행잎추출물" },
    { id: "21", name: "자녹센정", ingredient: "덱시부프로펜" },
    { id: "22", name: "펜잘큐정", ingredient: "아세트아미노펜 복합" },
    { id: "23", name: "헬리코캡슐", ingredient: "아목시실린 복합" },
    { id: "24", name: "스티렌정", ingredient: "징크카르노신" },
    { id: "25", name: "시메치콘정", ingredient: "시메치콘" },
    { id: "26", name: "오로나민씨드링크정", ingredient: "비타민C" },
    { id: "27", name: "센트룸 포맨", ingredient: "종합비타민" },
    { id: "28", name: "비맥스 메타", ingredient: "비타민B군 복합" },
    { id: "29", name: "에너비타정", ingredient: "비타민B1" },
    { id: "30", name: "쏘팔메토 옥타코사놀", ingredient: "쏘팔메토" },
    { id: "31", name: "오메가3골드", ingredient: "오메가3" },
    { id: "32", name: "루테인플러스", ingredient: "루테인 복합" },
    { id: "33", name: "칼디맥스디", ingredient: "칼슘 복합" },
    { id: "34", name: "마그온정", ingredient: "마그네슘" },
    { id: "35", name: "철분정 푸로틴", ingredient: "철분" },
    { id: "36", name: "락토핏 생유산균 골드", ingredient: "유산균" },
  ].filter(
    (d) =>
      d.name.toLowerCase().includes(term.toLowerCase()) ||
      d.ingredient.toLowerCase().includes(term.toLowerCase())
  );

  drugSearchResults.innerHTML = "";
  if (mockResults.length === 0) {
    drugSearchResults.innerHTML =
      '<p class="text-sm text-subtle p-4 text-center">검색 결과가 없습니다.</p>';
    return;
  }

  mockResults.forEach((drug) => {
    const resultItem = document.createElement("div");
    resultItem.className =
      "p-3 border-b border-color cursor-pointer hover:bg-main";
    resultItem.innerHTML = `<p class="font-semibold text-body">${drug.name}</p><p class="text-sm text-subtle">${drug.ingredient}</p>`;
    resultItem.onclick = () => {
      if (!currentQueryDrugs.some((d) => d.id === drug.id)) {
        currentQueryDrugs.push(drug);
        renderDrugTags();
      }
      drugModal.classList.add("hidden");
    };
    drugSearchResults.appendChild(resultItem);
  });
}

async function loadChatHistory() {
  const allMsgs = await getAllMessages();
  chatMessages.innerHTML = "";

  if (allMsgs.length === 0) {
    // 처음에만 welcome 메시지
    const welcomeMsg = "안녕하세요! 궁금한 점을 입력해 주세요.";
    chatMessages.appendChild(
      createMessageBubble(welcomeMsg, "assistant", new Date())
    );
  } else {
    for (const msg of allMsgs) {
      chatMessages.appendChild(
        createMessageBubble(msg.content, msg.role, msg.timestamp)
      );
    }
  }
  scrollToBottom();
}

// --- Event Listeners ---
messageForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (!message && currentQueryDrugs.length === 0) return;

  const fullQuestionForUI = `${currentQueryDrugs
    .map((d) => `[${d.name}]`)
    .join(" ")} ${message}`.trim();

  chatMessages.appendChild(
    createMessageBubble(fullQuestionForUI, "user", new Date())
  );
  scrollToBottom();

  const loadingBubble = createLoadingBubble();
  chatMessages.appendChild(loadingBubble);
  scrollToBottom();

  userInput.value = "";

  try {
    const response = await getAssistantResponse(message);
    loadingBubble.remove();
    chatMessages.appendChild(
      createMessageBubble(response, "assistant", new Date())
    );
    scrollToBottom();
  } catch (error) {
    console.error("Error fetching assistant response:", error);
    const errMsg = "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    loadingBubble.remove();
    chatMessages.appendChild(
      createMessageBubble(errMsg, "assistant", new Date())
    );
    scrollToBottom();
  } finally {
    currentQueryDrugs = [];
    renderDrugTags();
  }
});

// 수정된 부분: 모드 변경 시 메시지를 지우지 않고 테마와 안내만 변경
themeToggle.addEventListener("change", (e) => {
  const isCalm = e.target.checked;
  applyTheme(isCalm);
  localStorage.setItem("chatTheme", isCalm ? "calm" : "default");
  updateModeNotice(); // 안내 메시지만 업데이트
  // chatMessages.innerHTML = ""; 제거 - 메시지 유지
  // loadChatHistory(); 제거 - 메시지 유지
});

newChatBtn.addEventListener("click", async () => {
  if (confirm("모든 대화 기록을 지우고 새로 시작하시겠습니까?")) {
    await clearAllData();      // 전체 기록 완전 삭제
    await loadChatHistory();   // 환영 메시지 출력
  }
});

menuToggleBtn.addEventListener("click", () => {
  sidebar.classList.toggle("-translate-x-full");
  sidebarOverlay.classList.toggle("hidden");
});

sidebarOverlay.addEventListener("click", () => {
  sidebar.classList.add("-translate-x-full");
  sidebarOverlay.classList.add("hidden");
});

addDrugBtn.addEventListener("click", () =>
  drugModal.classList.remove("hidden")
);
closeModalBtn.addEventListener("click", () =>
  drugModal.classList.add("hidden")
);
drugSearchBtn.addEventListener("click", () =>
  searchDrugs(drugSearchInput.value)
);
drugSearchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    searchDrugs(drugSearchInput.value);
  }
});

saveProfileBtn.addEventListener("click", () => {
  saveProfileBtn.textContent = "저장 완료!";
  saveProfileBtn.classList.remove(
    "primary-accent-bg",
    "primary-accent-bg-hover"
  );
  saveProfileBtn.classList.add("bg-green-500");
  setTimeout(() => {
    saveProfileBtn.textContent = "프로필 저장";
    saveProfileBtn.classList.remove("bg-green-500");
    saveProfileBtn.classList.add(
      "primary-accent-bg",
      "primary-accent-bg-hover"
    );
  }, 2000);
});

// 약물 태그 삭제 이벤트 리스너 추가
drugTagsContainer.addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") {
    const index = parseInt(e.target.dataset.index);
    currentQueryDrugs.splice(index, 1);
    renderDrugTags();
  }
});

// --- Initialization ---
async function initializeApp() {
  await initDB();
  const savedTheme = localStorage.getItem("chatTheme");
  const isCalm = savedTheme === "calm";
  themeToggle.checked = isCalm;
  applyTheme(isCalm);
  updateModeNotice();
  await loadChatHistory();
}

initializeApp();