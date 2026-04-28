const toggles = document.querySelectorAll('.toggle');
const fields = {
  home: document.querySelectorAll('.home-field'),
  auto: document.querySelectorAll('.auto-field')
};

const inputs = {
  currentHome: document.getElementById('current-home'),
  currentAuto: document.getElementById('current-auto'),
  newHome: document.getElementById('new-home'),
  newAuto: document.getElementById('new-auto')
};

const resultCard = document.querySelector('.results');
const savingsAmount = document.getElementById('savings-amount');
const currentAnnualEl = document.getElementById('current-annual');
const newAnnualEl = document.getElementById('new-annual');
const resultCopy = document.getElementById('result-copy');

const confettiCanvas = document.getElementById('confetti');
const ctx = confettiCanvas.getContext('2d');

let selectedPolicy = 'home';
let displaySavings = 0;
let confetti = [];
let confettiAnimationId;

function resizeCanvas() {
  confettiCanvas.width = confettiCanvas.clientWidth;
  confettiCanvas.height = confettiCanvas.clientHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function parseValue(input) {
  return Number.parseFloat(input.value) || 0;
}

function currency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}

function relevantMonthlyTotal(currentOrNew) {
  const isHome = selectedPolicy === 'home' || selectedPolicy === 'both';
  const isAuto = selectedPolicy === 'auto' || selectedPolicy === 'both';

  const homeValue = currentOrNew === 'current' ? parseValue(inputs.currentHome) : parseValue(inputs.newHome);
  const autoValue = currentOrNew === 'current' ? parseValue(inputs.currentAuto) : parseValue(inputs.newAuto);

  return (isHome ? homeValue : 0) + (isAuto ? autoValue : 0);
}

function animateNumber(from, to, ms = 850) {
  const start = performance.now();

  function frame(now) {
    const progress = Math.min((now - start) / ms, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = from + (to - from) * eased;
    savingsAmount.textContent = Math.round(value).toLocaleString('en-US');

    if (progress < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

function launchConfetti() {
  cancelAnimationFrame(confettiAnimationId);
  confetti = Array.from({ length: 90 }, () => ({
    x: Math.random() * confettiCanvas.width,
    y: -20 - Math.random() * confettiCanvas.height,
    r: 2 + Math.random() * 5,
    vx: -1 + Math.random() * 2,
    vy: 2 + Math.random() * 4,
    hue: 120 + Math.random() * 120,
    alpha: 0.85 + Math.random() * 0.15
  }));

  function animate() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confetti.forEach((piece) => {
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.vy += 0.025;
      piece.alpha -= 0.005;

      ctx.fillStyle = `hsla(${piece.hue}, 95%, 60%, ${Math.max(piece.alpha, 0)})`;
      ctx.beginPath();
      ctx.arc(piece.x, piece.y, piece.r, 0, Math.PI * 2);
      ctx.fill();
    });

    confetti = confetti.filter((piece) => piece.alpha > 0 && piece.y < confettiCanvas.height + 40);
    if (confetti.length) {
      confettiAnimationId = requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  animate();
}

function updateResultText(savings, currentAnnual, newAnnual) {
  if (savings > 0) {
    resultCopy.textContent = `Great news! Your estimated savings is ${currency(savings)} per year.`;
    resultCard.classList.add('positive');
    resultCard.classList.remove('negative');
    launchConfetti();
  } else if (savings < 0) {
    resultCopy.textContent = `This quote costs about ${currency(Math.abs(savings))} more per year.`;
    resultCard.classList.add('negative');
    resultCard.classList.remove('positive');
  } else {
    resultCopy.textContent = 'No annual difference yet. Adjust the premiums to compare policies.';
    resultCard.classList.remove('positive', 'negative');
  }

  currentAnnualEl.textContent = currency(currentAnnual);
  newAnnualEl.textContent = currency(newAnnual);
}

function compute() {
  const currentAnnual = relevantMonthlyTotal('current') * 12;
  const newAnnual = relevantMonthlyTotal('new') * 12;
  const savings = currentAnnual - newAnnual;

  animateNumber(displaySavings, savings);
  displaySavings = savings;
  updateResultText(savings, currentAnnual, newAnnual);
}

function syncVisibleFields() {
  const showHome = selectedPolicy === 'home' || selectedPolicy === 'both';
  const showAuto = selectedPolicy === 'auto' || selectedPolicy === 'both';

  fields.home.forEach((field) => field.classList.toggle('hidden', !showHome));
  fields.auto.forEach((field) => field.classList.toggle('hidden', !showAuto));

  compute();
}

toggles.forEach((btn) => {
  btn.addEventListener('click', () => {
    selectedPolicy = btn.dataset.policy;
    toggles.forEach((toggle) => {
      const active = toggle === btn;
      toggle.classList.toggle('active', active);
      toggle.setAttribute('aria-pressed', String(active));
    });
    syncVisibleFields();
  });
});

Object.values(inputs).forEach((input) => {
  input.addEventListener('input', compute);
});

compute();
