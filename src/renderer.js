const addTab = (id, title, url, partition) => {
  const tabGroup = document.querySelector('tab-group');
  const tab = tabGroup.addTab({
    title: title,
    src: url,
    webviewAttributes: {
      id: id,
      partition: partition,
      allowpopups: true,
      webpreferences: "nativeWindowOpen=true",
      useragent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36 Edg/113.0.1774.57'
    },
    closable: true,
    active: true
  });

  let mediaTimeStart = 0;

  tab.webview.addEventListener('media-started-playing', () => {
    mediaTimeStart = Date.now();
  });

  tab.webview.addEventListener('media-paused', () => {
    const mediaTimeEnd = Date.now();
    const mediaTime = mediaTimeEnd - mediaTimeStart;
    if (mediaTime < 1400) {
      window.api.showNoti(`${data.title}: Have a new message`);
    }
  });

  tab.webview.addEventListener('page-favicon-updated', (event) => {
    const favicon = event.favicons[0];
    tab.setIcon(favicon);
  });

  tab.on("close", (tab) => { 
    window.api.deleteTab(tab.webviewAttributes.id)
  });
};
window.addTab = addTab;
window.addEventListener('DOMContentLoaded', () => {
  window.api.domContentLoaded('', (defaultData) => {
    if (Array.isArray(defaultData)) {
      defaultData.forEach((item) => {
        addTab(item.id, item.title, item.url, item.partition);
      });
    }
  });
});

window.addEventListener("message", (event) => {
  const eventData = event.data;
  if (eventData.type === 'newTabData') {
    window.api.addNewTab(eventData.title, eventData.url, eventData.partition, (tab) => {
      addTab(tab.id, tab.title, tab.url, tab.partition);
    })
  }
})

// Get the modal
var modal = document.getElementById("settingModal");

// Get the button that opens the modal
var btn = document.getElementById("settingBtn");

// When the user clicks on the button, open the modal
btn.onclick = function() {
  modal.style.display = "block";
}