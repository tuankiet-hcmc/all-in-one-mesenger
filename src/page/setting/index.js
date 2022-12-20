//
// Tabs Toggler
//

(function ($) {
  // Variables
  const $tabLink = $('#tabs-section .tab-link');
  const $tabBody = $('#tabs-section .tab-body');
  let timerOpacity;
  // Toggle Class
  const init = () => {
    // Menu Click
    $tabLink.off('click').on('click', function (e) {
      // Prevent Default
      e.preventDefault();
      e.stopPropagation();

      // Clear Timers
      window.clearTimeout(timerOpacity);

      // Toggle Class Logic
      // Remove Active Classes
      $tabLink.removeClass('active ');
      $tabBody.removeClass('active ');
      $tabBody.removeClass('active-content');

      // Add Active Classes
      $(this).addClass('active');
      $($(this).attr('href')).addClass('active');

      // Opacity Transition Class
      timerOpacity = setTimeout(() => {
        $($(this).attr('href')).addClass('active-content');
      }, 50);
    });
  };

  // Document Ready
  $(function () {
    init();
  });
})(jQuery);

const closeButton = document.getElementById('closeBtn');
closeButton.onclick = function () {
  window.parent.document.getElementById('settingModal').style.display = 'none';
};

const addTabButton = document.getElementById('addTabBtn');
addTabButton.onclick = function () {
  const title = document.getElementById('tabTitle').value;
  const url = document.getElementById('tabURL').value;
  const partition = document.getElementById('tabPartition').value;
  if (title && url && partition) {
    window.parent.postMessage({ type: 'newTabData', title, url, partition });
  }
};
