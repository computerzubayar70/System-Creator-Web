// CLASS B interactions: course previews, coupon price previews, and sign-in-gated checkout.
document.addEventListener("DOMContentLoaded", () => {
  if (!document.body.classList.contains("class-b")) return;

  const cards = [...document.querySelectorAll(".course-card")];
  const dialog = document.querySelector("#course-dialog");
  const buyLink = document.querySelector("#modal-buy-link");
  if (!cards.length || !dialog || !buyLink) return;

  const formatPrice = (amount) => `৳${amount.toLocaleString("en-BD")}`;
  cards.forEach((card) => {
    const price = card.querySelector(".course-buy strong");
    const buyButton = card.querySelector(".course-buy a");
    if (!price || !buyButton) return;

    const amount = Number(price.textContent.replace(/[^\d]/g, ""));
    if (Number.isSafeInteger(amount) && amount >= 0) {
      const prices = document.createElement("div");
      prices.className = "course-prices";
      price.textContent = `Original: ${formatPrice(amount)}`;
      const discountPrice = document.createElement("span");
      discountPrice.className = "course-discount-price";
      const discounted = Math.max(0, amount - 400);
      discountPrice.append("DPI price ");
      const discountedAmount = document.createElement("strong");
      discountedAmount.textContent = formatPrice(discounted);
      discountPrice.append(discountedAmount);
      price.replaceWith(prices);
      prices.append(price, discountPrice);
    }

    const actions = document.createElement("div");
    actions.className = "course-actions";
    const detailsButton = document.createElement("button");
    detailsButton.type = "button";
    detailsButton.className = "button course-details-button";
    detailsButton.textContent = "View Details";
    detailsButton.addEventListener("click", () => buyButton.click());
    buyButton.className = "button course-buy-now";
    buyButton.textContent = "Buy Now";
    buyButton.insertAdjacentHTML("beforeend", ' <span aria-hidden="true">↗</span>');
    actions.append(detailsButton, buyButton);
    card.querySelector(".course-buy").append(actions);
  });

  const authReady = window.systemCreatorAuthReady || Promise.resolve(window.systemCreatorUser || null);
  const goToCheckout = async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const user = await authReady;
    if (user) {
      window.location.assign(buyLink.href);
      return;
    }

    const courseName = document.querySelector("#dialog-course-title").textContent.trim();
    const params = new URLSearchParams({ checkout: courseName });
    window.location.assign(`login.html?${params.toString()}`);
  };
  buyLink.addEventListener("click", goToCheckout);

  const checkoutCourse = new URLSearchParams(window.location.search).get("checkout");
  if (checkoutCourse) {
    const selectedCard = cards.find((card) => card.querySelector("h3")?.textContent.trim() === checkoutCourse);
    if (selectedCard) selectedCard.querySelector(".course-buy a")?.click();
  }
});
