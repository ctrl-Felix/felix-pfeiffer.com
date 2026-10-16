export const welcomeKey = "welcome-seen";

export const hideSeenWelcomeScript = `try{if(localStorage.getItem("${welcomeKey}")!==null){var s=document.createElement("style");s.textContent=".window-initial{display:none}";document.head.appendChild(s)}}catch(e){}`;
