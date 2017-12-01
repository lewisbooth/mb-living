const navMenu = $(".nav-menu");
const navMenuToggle = $(".nav-menu-toggle");

navMenuToggle.addEventListener("click", toggleMenu);

function toggleMenu() {
  if (navMenu.classList.contains("active")) {
    navMenu.classList.remove("active");
    navMenu.setAttribute("aria-expanded", "false");
  } else {
    navMenu.classList.add("active");
    navMenu.setAttribute("aria-expanded", "true");
  }
}
