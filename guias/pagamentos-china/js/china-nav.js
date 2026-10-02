/* Botão "Índice" que aparece depois que o leitor passa dos atalhos.
   Mostra a seção em que ele está e volta para os atalhos com um toque. */
(function () {
  "use strict";

  var button = document.querySelector("[data-china-back]");
  var jump = document.getElementById("atalhos");
  if (!button || !jump) return;
  var current = button.querySelector("[data-china-back-current]");
  var heads = Array.prototype.slice.call(document.querySelectorAll(".guide-reference > h2"));
  // Do bloco de fontes em diante (fontes, FAQ, próximos passos) o guia acabou.
  var end = document.querySelector(".sources");
  var raf = null;

  function update() {
    raf = null;
    var line = 100; // logo abaixo do header fixo
    var show = jump.getBoundingClientRect().bottom < 0 &&
      (!end || end.getBoundingClientRect().top > window.innerHeight);
    button.hidden = !show;
    if (!show || !current) return;
    var here = "";
    heads.forEach(function (h) { if (h.getBoundingClientRect().top <= line) here = h.textContent; });
    if (current.textContent !== here) current.textContent = here;
  }
  function onScroll() { if (raf === null) raf = requestAnimationFrame(update); }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
