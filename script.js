const API_URL = "https://shopee-affiliate-api-five.vercel.app/api/convert";

const urlInput = document.getElementById("urlInput");
const convertBtn = document.getElementById("convertBtn");
const clearBtn = document.getElementById("clearBtn");
const statusText = document.getElementById("status");
const resultArea = document.getElementById("resultArea");
const toast = document.getElementById("toast");

convertBtn.addEventListener("click", convertLinks);
clearBtn.addEventListener("click", clearAll);

let convertedLinks = [];

async function convertLinks() {
  const urls = urlInput.value
    .split(/\n+/)
    .map((url) => url.trim())
    .filter(Boolean);

  if (urls.length === 0) {
    statusText.textContent = "請先貼上蝦皮連結";
    return;
  }

  if (urls.length > 5) {
    statusText.textContent = "每次最多只能轉換 5 個蝦皮連結";
    return;
  }

  convertBtn.disabled = true;
  statusText.textContent = "轉換中，請稍候...";
  resultArea.innerHTML = "";
  convertedLinks = [];

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        urls
      })
    });

    const data = await response.json();

    if (!data.success) {
      statusText.textContent = data.error || "轉換失敗";
      return;
    }

    const successLinks = data.results
      .filter((item) => item.success && item.shortLink)
      .map((item) => item.shortLink);

    const failedItems = data.results.filter((item) => !item.success);

    if (successLinks.length === 0) {
      statusText.textContent = "沒有成功產生推廣連結";
      renderErrors(failedItems);
      return;
    }

    convertedLinks = successLinks;

    statusText.textContent = `完成，共產生 ${successLinks.length} 個推廣連結`;
    renderResults(successLinks, failedItems);
  } catch (error) {
    statusText.textContent = "連線失敗，請稍後再試";
    console.error(error);
  } finally {
    convertBtn.disabled = false;
  }
}

function renderResults(links, failedItems) {
  resultArea.innerHTML = "";

  const card = document.createElement("div");
  card.className = "result-card";

  const linkList = links
    .map((link, index) => {
      return `
        <div class="single-link">
          <span>${index + 1}.</span>
          <a href="${escapeAttribute(link)}" target="_blank" rel="noopener noreferrer">
            ${escapeHtml(link)}
          </a>
        </div>
      `;
    })
    .join("");

  card.innerHTML = `
    <div class="result-title">推廣連結</div>
    <div class="link-list">
      ${linkList}
    </div>
    <div class="result-actions">
      <button onclick="copyAllLinks()">一鍵複製全部</button>
    </div>
  `;

  resultArea.appendChild(card);

  if (failedItems.length > 0) {
    renderErrors(failedItems);
  }
}

function renderErrors(failedItems) {
  failedItems.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "result-card error";

    card.innerHTML = `
      <div class="result-title">第 ${index + 1} 個連結轉換失敗</div>
      <div>${escapeHtml(item.error || "未知錯誤")}</div>
    `;

    resultArea.appendChild(card);
  });
}

function copyAllLinks() {
  if (convertedLinks.length === 0) {
    return;
  }

  const text = convertedLinks.join("\n");

  navigator.clipboard.writeText(text).then(() => {
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 900);
  });
}

function clearAll() {
  urlInput.value = "";
  statusText.textContent = "";
  resultArea.innerHTML = "";
  convertedLinks = [];
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
