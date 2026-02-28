const pageData = {
    title: document.title,
    url: window.location.href,
    text: document.body.innerText.substring(0,300)
}


// content.ts
chrome.runtime.sendMessage({ type: "PAGE_DATA", payload: pageData })
  .then((response) => {
    console.log("Response:", response);
  });