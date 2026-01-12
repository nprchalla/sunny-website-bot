(function () {
  const modal = document.getElementById("tavusModal");
  const backdrop = document.getElementById("tavusBackdrop");
  const closeBtn = document.getElementById("tavusClose");
  const openBtns = document.querySelectorAll(".open-tavus");

  const frame = document.getElementById("tavusFrame");
  const loading = document.getElementById("tavusLoading");

  // Guard: if you include tavus.js on a page without the modal HTML, don't crash
  if (!modal || !frame || !loading) {
    console.warn("Tavus modal elements not found on this page. Skipping Tavus init.");
    return;
  }

  function openModal() {
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
  }

  function resetModal() {
    frame.src = "";
    frame.style.display = "none";
    loading.style.display = "flex";
    loading.textContent = "Starting video…";
  }

  function closeModal() {
    modal.style.display = "none";
    document.body.style.overflow = "";
    resetModal();
  }

  async function safeReadJson(res) {
    try {
      return await res.json();
    } catch (e) {
      // If response isn't JSON, try text
      try {
        const text = await res.text();
        return { raw: text };
      } catch {
        return {};
      }
    }
  }

  async function startTavus() {
    openModal();
    resetModal();

    try {
      const res = await fetch("/api/tavus/conversation", { method: "POST" });
      const data = await safeReadJson(res);

      if (!res.ok) {
        console.error("Tavus error JSON:", data);

        // Try to show a useful error message in the UI
        const msg =
          data?.details?.raw ||
          data?.details?.message ||
          data?.error ||
          data?.raw ||
          JSON.stringify(data);

        loading.textContent = `Tavus error (${res.status}): ${msg}`;
        throw new Error(`Tavus backend error ${res.status}: ${msg}`);
      }

      if (!data.conversation_url) {
        console.error("Missing conversation_url:", data);
        loading.textContent = "Server did not return conversation_url.";
        return;
      }

      frame.src = data.conversation_url;
      loading.style.display = "none";
      frame.style.display = "block";
    } catch (e) {
      console.error(e);
      // If loading already has a detailed error, keep it; otherwise show generic
      if (!loading.textContent || loading.textContent === "Starting video…") {
        loading.textContent = "Could not start video. Please try again.";
      }
    }
  }

  openBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      startTavus();
    });
  });

  backdrop?.addEventListener("click", closeModal);
  closeBtn?.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
})();
