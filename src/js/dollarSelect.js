function $(element) {
  if (typeof element !== "string") {
    console.error("Invalid parameter type, requires String");
    return;
  }
  return document.querySelector(element);
}
function $$(element) {
  if (typeof element !== "string") {
    console.error("Invalid parameter type, requires String");
    return;
  }
  return document.querySelectorAll(element);
}
