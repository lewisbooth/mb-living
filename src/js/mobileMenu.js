const nav = $("nav");
const navMenuToggle = $(".nav-menu-toggle");
const navMenuItems = $$(".scroll");

navMenuToggle.addEventListener("click", toggleMenu);
addEventListeners(navMenuItems, "click", navClick);

function toggleMenu() {
  if (nav.classList.contains("active")) {
    nav.classList.remove("active");
    nav.setAttribute("aria-expanded", "false");
  } else {
    nav.classList.add("active");
    nav.setAttribute("aria-expanded", "true");
  }
}

function navClick(e) {
  nav.classList.remove("active");
  const target = e.target.attributes["href"].value.split("/")[1];
  if ($(target) && target.startsWith("#")) {
    e.preventDefault();
    $(target).scrollIntoView({
      behavior: "smooth",
      block: "start",
      inline: "start"
    });
  }
}

function addEventListeners(elementArray, event = "click", callback) {
  for (var i = 0; i < elementArray.length; i++) {
    elementArray[i].addEventListener(event, callback);
  }
}
