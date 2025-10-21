emailjs.init("bDRUEr8c8GVv7VbvQ");

const form = document.getElementById("contact-form");

form.addEventListener("submit", function(e) {
  e.preventDefault();

  const templateParams = {
    name: document.getElementById("name").value,
    title: document.getElementById("subject").value,
    email: document.getElementById("email").value,
    message: document.getElementById("message").value
  };

  form.querySelector("button").textContent = "寄送中...";

  // 只寄給管理員
  emailjs.send("service_1uv1uw9", "template_jb9q4l4", templateParams)
    .then(() => {
      Swal.fire({
        icon: "success",
        title: "訊息已送出！",
        text: "感謝您的來信，我們將盡快回覆您。",
        confirmButtonText: "確定"
      });
      form.reset();
      form.querySelector("button").textContent = "送出留言";
    })
    .catch((err) => {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "寄送失敗",
        text: "請稍後再試，或聯絡客服",
        confirmButtonText: "確定"
      });
      form.querySelector("button").textContent = "送出留言";
    });
});
