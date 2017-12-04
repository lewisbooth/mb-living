function initSwiper() {
  var topSwiper = new Swiper(".top-swiper .swiper-container", {
    speed: 600,
    loop: true,
    autoplay: { delay: 4000, disableOnInteraction: false }
  });
  var propertyOrchardManorSwiper = new Swiper(
    ".orchard-manor-swiper .swiper-container",
    {
      speed: 600,
      loop: true,
      autoplay: { delay: 4000, disableOnInteraction: false }
    }
  );
}
