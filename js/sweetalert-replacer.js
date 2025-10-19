// sweetalert-replacer.js
(function() {
  // 動態載入 SweetAlert2
  if (!window.Swal) {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
    script.onload = () => {
      console.log("✅ SweetAlert2 已載入，並取代原生 alert()");

      // 攔截 alert
      const originalAlert = window.alert;
      window.alert = function(message) {
        return Swal.fire({
          icon: "warning",
          title: message || "⚠️ 系統提示",
          confirmButtonText: "確定"
        });
      };
    };
    document.head.appendChild(script);
  }
})();
