// Waits until the course catalogue and its dialog are available in the document.
document.addEventListener("DOMContentLoaded", () => { // Starts setup after the browser has parsed the page.
  // Finds the course details popup and its content controls.
  const dialog = document.querySelector("#course-dialog"); // Stores the native accessible dialog element.
  const title = document.querySelector("#dialog-course-title"); // Stores the dialog course heading.
  const description = document.querySelector("#modal-course-description"); // Stores the dialog course description.
  const category = document.querySelector("#modal-course-category"); // Stores the dialog course category label.
  const price = document.querySelector("#modal-course-price"); // Stores the dialog's current price display.
  const icon = document.querySelector("#modal-app-icon"); // Stores the dialog's course app-style icon.
  const form = document.querySelector("#coupon-form"); // Stores the coupon form.
  const input = document.querySelector("#coupon-code"); // Stores the coupon text field.
  const message = document.querySelector("#coupon-message"); // Stores the live coupon validation message.
  const buyLink = document.querySelector("#modal-buy-link"); // Stores the WhatsApp purchase link.
  const closeButton = document.querySelector(".modal-close"); // Stores the button that closes the dialog.
  // Stops setup with a visible developer error if required page markup is missing.
  if (!dialog || !title || !description || !category || !price || !icon || !form || !input || !message || !buyLink || !closeButton) { // Checks every required dialog element before binding events.
    console.error("Course purchase dialog could not initialize because required elements are missing."); // Reports broken markup instead of silently failing.
    return; // Prevents later event handlers from using missing elements.
  } // Ends the required-element guard.
  // Tracks the selected course and its undiscounted price.
  let selectedCourse = null; // Holds the course details currently shown in the popup.
  // Tracks whether the visitor successfully applied the coupon.
  let couponApplied = false; // Prevents an unverified coupon from changing the order price.
  // Maps course titles to concise app-style marks for the popup banner.
  const appMarks = { "Adobe Photoshop": "Ps", "Adobe Illustrator": "Ai", "Adobe Premiere Pro": "Pr", "Adobe After Effects": "Ae", "Adobe Lightroom": "Lr", "Adobe InDesign": "Id", "Adobe Express": "Ex", "Adobe Audition": "Au", "Adobe Animate": "An", "Adobe Acrobat Pro": "Ac", "Adobe Dreamweaver": "Dw", "Adobe Firefly": "Ff", "CapCut Video Editing": "CC", "Python Programming": "Py", "Java Programming": "Ja", "HTML Fundamentals": "5", "CSS Fundamentals": "3", "C Programming": "C", "C++ Programming": "C++", "JavaScript Fundamentals": "JS", "C# Programming": "C#", "SQL & Databases": "SQL", "React Fundamentals": "⚛", "Git & GitHub Basics": "Git", "Digital Marketing Fundamentals": "DM", "SEO Fundamentals": "SEO", "Social Media Marketing": "SM", "Google Ads Basics": "Ad" }; // Keeps the selected course icon recognizable in its detail popup.
  // Formats a course fee as a readable Bangladeshi taka amount.
  const formatPrice = (amount) => `BDT ${amount.toLocaleString("en-BD")}`; // Adds currency and thousands separators consistently.
  // Builds the order message from the selected course and final price.
  const updateBuyLink = () => { // Refreshes WhatsApp checkout whenever a course or coupon changes.
    const discount = couponApplied ? Math.min(200, selectedCourse.amount) : 0; // Caps the discount so the order never becomes negative.
    const finalAmount = selectedCourse.amount - discount; // Calculates the amount the visitor will request to pay.
    const orderLines = [`Hello, I would like to enroll in ${selectedCourse.name}.`, `Course fee: ${formatPrice(selectedCourse.amount)}.`]; // Starts a clear WhatsApp order message.
    if (couponApplied) orderLines.push(`Coupon code: DPI (-${formatPrice(discount)}).`); // Includes the verified coupon and its discount.
    orderLines.push(`Total: ${formatPrice(finalAmount)}.`); // Adds the final amount to the WhatsApp message.
    buyLink.href = `https://wa.me/8801817155707?text=${encodeURIComponent(orderLines.join(" "))}`; // Makes the purchase button send the exact order details.
    price.textContent = formatPrice(finalAmount); // Updates the price shown in the popup.
  }; // Ends the order-link update function.
  // Opens the course popup when a visitor selects a course's Buy button.
  document.querySelectorAll(".course-card").forEach((card) => { // Adds the purchase interaction to every course card.
    const buyButton = card.querySelector(".course-buy a"); // Finds the existing WhatsApp fallback link in this card.
    const courseTitle = card.querySelector("h3"); // Finds the visible course name.
    const courseDescription = card.querySelector("p"); // Finds the course description.
    const courseCategory = card.querySelector(".course-tag"); // Finds the course's category label.
    const coursePrice = card.querySelector(".course-buy strong"); // Finds the card's displayed sample fee.
    if (!buyButton || !courseTitle || !courseDescription || !courseCategory || !coursePrice) { // Checks that this card has all information needed for the popup.
      console.error("A course card is missing its title, description, category, price, or purchase link.", card); // Reports the broken card for easy correction.
      return; // Leaves this invalid card's original link untouched.
    } // Ends the per-card validation.
    buyButton.addEventListener("click", (event) => { // Intercepts this card's Buy link to show course details first.
      event.preventDefault(); // Opens the popup instead of immediately leaving for WhatsApp.
      const amount = Number(coursePrice.textContent.replace(/[^\d]/g, "")); // Reads the numerical fee from the visible BDT price.
      if (!Number.isSafeInteger(amount) || amount < 0) { // Rejects malformed or unsafe course pricing.
        console.error(`Invalid course price for "${courseTitle.textContent.trim()}".`); // Reports the invalid price rather than producing an incorrect order.
        return; // Keeps a malformed price from entering the checkout flow.
      } // Ends the price validation.
      selectedCourse = { name: courseTitle.textContent.trim(), description: courseDescription.textContent.trim(), category: courseCategory.textContent.trim(), amount }; // Saves the clicked course information for the popup.
      couponApplied = false; // Resets coupon state each time a different course is selected.
      title.textContent = selectedCourse.name; // Shows the selected course name in the popup.
      description.textContent = selectedCourse.description; // Shows the selected course details in the popup.
      category.textContent = selectedCourse.category; // Shows the selected course category in the popup.
      icon.textContent = appMarks[selectedCourse.name] || selectedCourse.name.slice(0, 2); // Displays the matching software or course mark.
      input.value = ""; // Clears any coupon from the previous course selection.
      message.textContent = ""; // Removes coupon suggestions when opening a course popup.
      message.classList.remove("coupon-error", "coupon-success"); // Clears coupon feedback from the previous selection.
      buyLink.textContent = "Buy this course"; // Resets the purchase label for the selected course.
      updateBuyLink(); // Prepares the non-discounted WhatsApp order before the visitor chooses.
      dialog.showModal(); // Opens the modal with built-in focus handling and Escape support.
    }); // Ends the card's Buy interaction.
  }); // Ends the course-card event setup.
  // Applies the discount only when the submitted coupon matches DPI exactly, ignoring case and surrounding spaces.
  form.addEventListener("submit", (event) => { // Validates the coupon when the visitor presses Apply coupon.
    event.preventDefault(); // Keeps the visitor in the course popup while validating.
    if (!selectedCourse) { // Ensures a course was selected before applying a coupon.
      console.error("Cannot apply a coupon because no course is selected."); // Reports an invalid form state.
      return; // Stops without creating a success-shaped checkout state.
    } // Ends the selected-course guard.
    if (input.value.trim().toLowerCase() !== "dpi") { // Accepts DPI, dpi, and mixed case, but rejects other codes.
      couponApplied = false; // Ensures an invalid code never retains a previous discount.
      message.textContent = "That coupon code is not valid. Try DPI."; // Clearly explains why the coupon was rejected.
      message.classList.add("coupon-error"); // Adds the visual error state to the validation message.
      message.classList.remove("coupon-success"); // Clears any previous success styling.
      updateBuyLink(); // Restores the original course fee and full-price order link.
      buyLink.textContent = "Buy this course"; // Makes the full-price purchase action explicit.
      input.setAttribute("aria-invalid", "true"); // Announces the invalid coupon state to assistive technology.
      input.focus(); // Returns focus to the field so the visitor can correct the code.
      return; // Prevents invalid coupons from receiving a discount.
    } // Ends the invalid-code branch.
    couponApplied = true; // Applies the verified BDT 200 discount to the current course.
    message.textContent = "Coupon applied. BDT 200 has been deducted from your course fee."; // Confirms the discount in an accessible live region.
    message.classList.add("coupon-success"); // Adds the visual success state to the validation message.
    message.classList.remove("coupon-error"); // Clears any previous error styling.
    input.removeAttribute("aria-invalid"); // Clears the invalid state from the coupon field.
    updateBuyLink(); // Updates the displayed price and WhatsApp order with the discount.
    buyLink.textContent = "Buy with BDT 200 discount"; // Makes the discounted purchase action clear.
  }); // Ends coupon form validation.
  // Closes the dialog when the visitor selects its close button.
  closeButton.addEventListener("click", () => dialog.close()); // Uses the native close method to restore focus correctly.
  // Closes the dialog when the visitor clicks outside its panel.
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); }); // Treats a click on the transparent backdrop as a close action.
  // Clears temporary coupon state after the dialog closes.
  dialog.addEventListener("close", () => { couponApplied = false; selectedCourse = null; }); // Avoids carrying checkout state into the next course.
}); // Ends catalogue setup.
