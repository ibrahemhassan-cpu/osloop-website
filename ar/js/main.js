(function () {
  "use strict";

  let osloopCountryCode = "";
  let osloopCountryName = "";
  const countryLookupController = typeof AbortController !== "undefined"
    ? new AbortController()
    : null;
  const countryLookupTimeout = countryLookupController
    ? setTimeout(function () { countryLookupController.abort(); }, 2000)
    : null;

  fetch("/site-context.php", {
    cache: "no-store",
    signal: countryLookupController ? countryLookupController.signal : undefined
  })
    .then(function (response) { return response.ok ? response.json() : null; })
    .then(function (data) {
      const country = data && typeof data.country === "string"
        ? data.country.trim().toUpperCase()
        : "";
      if (/^[A-Z]{2}$/.test(country) && country !== "XX") {
        osloopCountryCode = country;
        if (typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function") {
          osloopCountryName = new Intl.DisplayNames(["en"], { type: "region" }).of(country) || "";
        }
      }
    })
    .catch(function () {})
    .finally(function () {
      if (countryLookupTimeout) clearTimeout(countryLookupTimeout);
    });

  const menuButton = document.querySelector(".menu-toggle");
  const navLinks = document.getElementById("nav-links");

  function closeMenu() {
    if (!menuButton || !navLinks) return;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "فتح القائمة");
    navLinks.classList.remove("is-open");
  }

  if (menuButton && navLinks) {
    menuButton.addEventListener("click", function () {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "فتح القائمة" : "إغلاق القائمة");
      navLinks.classList.toggle("is-open", !isOpen);
    });

    navLinks.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu();
    });

    document.addEventListener("click", function (event) {
      if (!event.target.closest(".navbar")) closeMenu();
    });
  }

  const videoDialog = document.getElementById("video-dialog");
  const videoFrame = document.getElementById("video-frame");
  const openVideoButton = document.querySelector("[data-open-video]");
  const closeVideoButton = document.querySelector(".video-close");

  function closeVideo() {
    if (!videoDialog) return;
    if (videoDialog.open) videoDialog.close();
    if (videoFrame) videoFrame.replaceChildren();
  }

  if (videoDialog && videoFrame && openVideoButton) {
    openVideoButton.addEventListener("click", function () {
      const iframe = document.createElement("iframe");
      iframe.src = "https://www.youtube.com/embed/S7Ue-qoUh64?autoplay=1&controls=1&playsinline=1&rel=0&origin=https%3A%2F%2Fagency.osloop.com&widget_referrer=https%3A%2F%2Fagency.osloop.com%2Far%2F";
      iframe.title = "فيديو أعمال أسلوب";
      iframe.allow = "autoplay; encrypted-media; picture-in-picture";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allowFullscreen = true;
      videoFrame.replaceChildren(iframe);
      videoDialog.showModal();
    });

    closeVideoButton.addEventListener("click", closeVideo);
    videoDialog.addEventListener("click", function (event) {
      if (event.target === videoDialog) closeVideo();
    });
    videoDialog.addEventListener("cancel", function () {
      if (videoFrame) videoFrame.replaceChildren();
    });
  }

  const formDialog = document.getElementById("form-dialog");
  const openFormButtons = document.querySelectorAll("[data-open-form]");
  const closeFormButton = document.querySelector(".form-dialog-close");

  function closeFormDialog() {
    if (formDialog && formDialog.open) formDialog.close();
  }

  if (formDialog && openFormButtons.length) {
    openFormButtons.forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        closeMenu();
        formDialog.showModal();
      });
    });

    if (closeFormButton) closeFormButton.addEventListener("click", closeFormDialog);
    formDialog.addEventListener("click", function (event) {
      if (event.target === formDialog) closeFormDialog();
    });
  }

  function setupLeadForm(form) {
    let started = false;
    let submitting = false;
    function track(name, parameters) {
      try {
        if (typeof window.gtag === "function") window.gtag("event", name, Object.assign({
          send_to: "G-D459YHGKXM", form_id: form.id, form_name: "Arabic enquiry"
        }, parameters));
      } catch (_) {}
    }
    function start() {
      if (started) return;
      started = true;
      track("form_start");
    }
    form.addEventListener("focusin", start);
    form.addEventListener("input", start);
    if (typeof IntersectionObserver === "function") {
      const observer = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          track("form_view");
          observer.disconnect();
        }
      }, { threshold: 0.2 });
      observer.observe(form);
    }
    const submitButton = form.querySelector(".form-submit");
    const successMessage = form.querySelector(".form-message--success");
    const failMessage = form.querySelector(".form-message--error");
    const timeField = form.querySelector('input[name="time"]');

    if (!submitButton || !successMessage || !failMessage) return;

    const defaultButtonText = submitButton.textContent;
    if (timeField) timeField.value = new Date().toISOString();

    function setSubmitting(isSubmitting) {
      submitButton.disabled = isSubmitting;
      submitButton.textContent = isSubmitting ? "جارٍ الإرسال..." : defaultButtonText;
    }

    function showFailure(message) {
      successMessage.hidden = true;
      failMessage.textContent = message || "تعذر إرسال الطلب. يرجى المحاولة مرة أخرى.";
      failMessage.hidden = false;
    }

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (submitting) return;
      start();
      failMessage.hidden = true;

      const requiredFields = Array.from(form.querySelectorAll("[required]"));
      requiredFields.forEach(function (field) {
        field.classList.toggle("is-invalid", !field.checkValidity());
      });

      if (!form.checkValidity()) {
        track("form_validation_error");
        form.reportValidity();
        showFailure("يرجى مراجعة البيانات المطلوبة ثم المحاولة مرة أخرى.");
        return;
      }

      setSubmitting(true);
      submitting = true;
      track("form_submit_attempt");

      try {
        const formData = new FormData(form);
        if (osloopCountryCode) formData.set("Country", osloopCountryCode);
        if (osloopCountryName) formData.set("CountryName", osloopCountryName);

        const response = await fetch(form.action, {
          method: "POST",
          body: formData,
          headers: { "X-Requested-With": "XMLHttpRequest" }
        });

        const result = await response.json().catch(function () { return null; });
        if (response.status !== 200 || !result || result.ok !== true) throw new Error("Submission failed");

        setSubmitting(false);
        form.querySelectorAll("input:not([type=hidden]), select, textarea, button").forEach(function (element) {
          element.hidden = true;
        });
        failMessage.hidden = true;
        successMessage.hidden = false;
        track("form_submit");
        track("generate_lead", { value: 1.0, currency: "EGP" });

        if (typeof window.gtag === "function") {
          track("conversion", {
            send_to: "AW-18238858840/IT81CO2X-r8cENjM-_hD",
            value: 1.0,
            currency: "EGP"
          });
        }
      } catch (error) {
        track("form_error", { error_type: "submission" });
        showFailure();
      } finally {
        submitting = false;
        setSubmitting(false);
      }
    });

    form.addEventListener("input", function (event) {
      if (event.target.matches("[required]")) event.target.classList.remove("is-invalid");
    });
  }

  document.querySelectorAll(".lead-form").forEach(setupLeadForm);
})();
