 emailjs.init("bDRUEr8c8GVv7VbvQ");

  const form = document.getElementById("contact-form");
  const formMessage = document.getElementById("form-message");

  form.addEventListener("submit", function(e){
    e.preventDefault();

    const templateParams = {
      name: document.getElementById("name").value,
      title: document.getElementById("subject").value,
      email: document.getElementById("email").value,
      message: document.getElementById("message").value
    };

    formMessage.textContent = "寄送中...";
    formMessage.className = "text-center text-info mt-3";

    // 寄給管理員
    emailjs.send("service_1uv1uw9", "template_jb9q4l4", templateParams)
      .then(() => {
        // 自動回覆給使用者
        emailjs.send("service_1uv1uw9", "template_v09qkpp", templateParams)
          .then(() => {
            Swal.fire({
              icon: "success",
              title: "訊息已送出！",
              text: "感謝您的來信，我們將盡快回覆您。",
              confirmButtonText: "確定"
            });
            formMessage.textContent = "";
            form.reset();
          })
          .catch((err) => {
            formMessage.textContent = "❌ 自動回覆失敗：" + JSON.stringify(err);
            formMessage.className = "text-center text-danger mt-3";
          });
      })
      .catch((err) => {
        formMessage.textContent = "❌ 提交申請失敗：" + JSON.stringify(err);
        formMessage.className = "text-center text-danger mt-3";
      });
  });