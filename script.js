
/* ==========================================
   North Star Bakery
   Touchstone 4: Interactivity and Client-Side Data
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Product data
  const products = [
    { id: "sourdough", name: "Sourdough Bread", category: "bread", price: 8.00 },
    { id: "baguette", name: "French Baguette", category: "bread", price: 4.50 },
    { id: "croissant", name: "Butter Croissant", category: "pastry", price: 3.50 },
    { id: "muffin", name: "Blueberry Muffin", category: "pastry", price: 3.00 },
    { id: "chocolate-cake", name: "Chocolate Cake", category: "cake", price: 28.00 },
    { id: "cheesecake", name: "Cheesecake", category: "cake", price: 32.00 }
  ];

  const STORAGE_KEY = "northStarBakeryPreOrder";

  // Page elements
  const productContainer = document.getElementById("product-list");
  const summaryContainer = document.getElementById("order-summary");
  const totalElement = document.getElementById("order-total");
  const form = document.getElementById("preorder-form");
  const clearButton = document.getElementById("clear-order");
  const statusMessage = document.getElementById("storage-message");

  // Saved selections: { productId: quantity }
  let selections = loadSelections();

  // Restore customer selections from browser storage
  function loadSelections() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : {};

      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        return {};
      }

      const validSelections = {};

      Object.entries(parsed).forEach(([id, quantity]) => {
        if (
          products.some(product => product.id === id) &&
          Number.isInteger(quantity) &&
          quantity > 0 &&
          quantity <= 99
        ) {
          validSelections[id] = quantity;
        }
      });

      return validSelections;
    } catch (error) {
      console.warn("Unable to load saved selections:", error);
      return {};
    }
  }

  // Save selections to localStorage
  function saveSelections() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));

      if (statusMessage) {
        statusMessage.textContent =
          "Your selections have been saved in this browser.";
      }
    } catch (error) {
      console.error("Unable to save selections:", error);

      if (statusMessage) {
        statusMessage.textContent =
          "Your selections could not be saved. Check your browser storage settings.";
      }
    }
  }

  // Format prices consistently
  function formatPrice(price) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(price);
  }

  // Display products
  function renderProducts() {
    if (!productContainer) return;

    productContainer.replaceChildren();

    products.forEach(product => {
      const card = document.createElement("div");
      card.className = "product-card";

      const heading = document.createElement("h3");
      heading.textContent = product.name;

      const price = document.createElement("p");
      price.textContent = formatPrice(product.price);

      const category = document.createElement("p");
      category.textContent =
        product.category.charAt(0).toUpperCase() +
        product.category.slice(1);

      const quantityLabel = document.createElement("label");
      quantityLabel.htmlFor = `quantity-${product.id}`;
      quantityLabel.textContent = "Quantity:";

      const quantityInput = document.createElement("input");
      quantityInput.type = "number";
      quantityInput.id = `quantity-${product.id}`;
      quantityInput.min = "0";
      quantityInput.max = "99";
      quantityInput.step = "1";
      quantityInput.value = selections[product.id] || 0;
      quantityInput.setAttribute("aria-label", `${product.name} quantity`);

      quantityInput.addEventListener("change", () => {
        const quantity = Number(quantityInput.value);

        if (
          !Number.isInteger(quantity) ||
          quantity < 0 ||
          quantity > 99
        ) {
          quantityInput.value = selections[product.id] || 0;
          return;
        }

        if (quantity === 0) {
          delete selections[product.id];
        } else {
          selections[product.id] = quantity;
        }

        saveSelections();
        renderSummary();
      });

      card.append(heading, price, category, quantityLabel, quantityInput);
      productContainer.appendChild(card);
    });
  }

  // Update the live order summary
  function renderSummary() {
    if (!summaryContainer) return;

    summaryContainer.replaceChildren();

    let total = 0;
    let itemCount = 0;

    products.forEach(product => {
      const quantity = selections[product.id] || 0;
      if (quantity <= 0) return;

      const lineTotal = product.price * quantity;
      total += lineTotal;
      itemCount += quantity;

      const item = document.createElement("div");
      item.className = "summary-item";

      const description = document.createElement("span");
      description.textContent =
        `${product.name} × ${quantity} — ${formatPrice(lineTotal)}`;

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.textContent = "Remove";
      removeButton.setAttribute(
        "aria-label",
        `Remove ${product.name} from your order`
      );

      removeButton.addEventListener("click", () => {
        delete selections[product.id];
        saveSelections();
        renderProducts();
        renderSummary();
      });

      item.append(description, removeButton);
      summaryContainer.appendChild(item);
    });

    if (itemCount === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.textContent = "No products selected yet.";
      summaryContainer.appendChild(emptyMessage);
    }

    if (totalElement) {
      totalElement.textContent =
        `${formatPrice(total)} (${itemCount} item${itemCount === 1 ? "" : "s"})`;
    }
  }

  // Display a validation error beside a field
  function showError(field, message) {
    const errorElement = document.getElementById(`${field.id}-error`);

    field.setAttribute("aria-invalid", "true");

    if (errorElement) {
      errorElement.textContent = message;
    } else {
      console.warn(`Add an element with id="${field.id}-error" to show: ${message}`);
    }
  }

  // Clear a validation error
  function clearError(field) {
    const errorElement = document.getElementById(`${field.id}-error`);

    field.removeAttribute("aria-invalid");

    if (errorElement) {
      errorElement.textContent = "";
    }
  }

  // Validate the customer inquiry form
  function validateForm() {
    if (!form) return false;

    let isValid = true;

    const nameField = form.querySelector("#customer-name");
    const emailField = form.querySelector("#customer-email");
    const requestField = form.querySelector("#request-type");
    const detailsField = form.querySelector("#order-details");

    const fields = [
      nameField,
      emailField,
      requestField,
      detailsField
    ].filter(Boolean);

    fields.forEach(clearError);

    if (!nameField || !nameField.value.trim()) {
      if (nameField) showError(nameField, "Please enter your name.");
      isValid = false;
    }

    if (emailField) {
      const email = emailField.value.trim();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!email) {
        showError(emailField, "Please enter your email address.");
        isValid = false;
      } else if (!emailPattern.test(email)) {
        showError(emailField, "Please enter a valid email address.");
        isValid = false;
      }
    } else {
      isValid = false;
    }

    if (requestField && !requestField.value) {
      showError(requestField, "Please select a request type.");
      isValid = false;
    } else if (!requestField) {
      isValid = false;
    }

    const hasSelectedProducts = Object.values(selections).some(
      quantity => quantity > 0
    );

    if (detailsField && !detailsField.value.trim() && !hasSelectedProducts) {
      showError(
        detailsField,
        "Please enter order details or select at least one bakery product."
      );
      isValid = false;
    } else if (!detailsField) {
      isValid = false;
    }

    return isValid;
  }

  // Connect form validation and submit handling
  if (form) {
    form.addEventListener("submit", event => {
      event.preventDefault();

      if (!validateForm()) {
        const firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const order = {
        customerName: form.querySelector("#customer-name").value.trim(),
        customerEmail: form.querySelector("#customer-email").value.trim(),
        requestType: form.querySelector("#request-type").value,
        orderDetails: form.querySelector("#order-details").value.trim(),
        selections: { ...selections },
        submittedAt: new Date().toISOString()
      };

      // Save a local copy of the inquiry.
      // This does not email or transmit the order to the bakery.
      try {
        localStorage.setItem(
          "northStarBakeryLastInquiry",
          JSON.stringify(order)
        );

        if (statusMessage) {
          statusMessage.textContent =
            "Your inquiry passed validation and was saved in this browser. Connect a backend to send it to the bakery.";
        }
      } catch (error) {
        console.error("Unable to save inquiry:", error);

        if (statusMessage) {
          statusMessage.textContent =
            "Your inquiry is valid, but it could not be saved in this browser.";
        }
      }
    });

    // Clear errors as customers correct their entries
    ["customer-name", "customer-email", "request-type", "order-details"]
      .forEach(id => {
        const field = form.querySelector(`#${id}`);

        if (field) {
          field.addEventListener("input", () => clearError(field));
          field.addEventListener("change", () => clearError(field));
        }
      });
  }

  // Clear all selected products
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      selections = {};
      saveSelections();
      renderProducts();
      renderSummary();
    });
  }

  // Initial page render
  renderProducts();
  renderSummary();

  if (statusMessage) {
    statusMessage.textContent = Object.keys(selections).length
      ? "Your saved selections have been restored."
      : "Choose your favorite bakery products to start your pre-order.";
  }
});
