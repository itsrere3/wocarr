/* ===========================================================
   SAYAREH APP – LANGUAGE + NAV + MAIN LOGIC
=========================================================== */

/* --------------- GLOBAL STATE --------------- */
let currentLang = localStorage.getItem("lang") || "ar";

/* --------------- LANGUAGE LOADER --------------- */
async function loadLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang);

  document.documentElement.setAttribute("lang", lang);
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

  try {
    const response = await fetch(`lang/${lang}.json`);
    const dictionary = await response.json();
    applyTranslations(dictionary);
  } catch (err) {
    console.error("Language load failed:", err);
  }
}

/* Apply text to DOM */
function applyTranslations(dict) {
  document.querySelectorAll("[data-text]").forEach(el => {
    const key = el.getAttribute("data-text");
    if (dict[key]) el.innerHTML = dict[key];
  });
}

/* --------------- INITIALIZE LANGUAGE --------------- */
loadLanguage(currentLang);

/* --------------- TOGGLE LANGUAGE BUTTON --------------- */
document.getElementById("toggleLang")?.addEventListener("click", () => {
  const newLang = currentLang === "ar" ? "en" : "ar";
  loadLanguage(newLang);
  document.getElementById("toggleLang").innerText =
    newLang === "ar" ? "🌍 English" : "🌍 العربية";
});

/* ===========================================================
   NAVIGATION – SINGLE PAGE APP SECTIONS
=========================================================== */

document.querySelectorAll(".nav-btn, [data-section]").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-section");
    if (!target) return;

    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(target)?.classList.add("active");

    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    if (btn.classList.contains("nav-btn")) btn.classList.add("active");
  });
});

/* ===========================================================
   PLACEHOLDER – CAR MATCH, AI, COMMUNITY, ETC
=========================================================== */
// Future logic can be placed here...

console.log("Sayareh App Loaded");

// ================== STATE & THEME ==================
(function ($) {
  'use strict';

  var $win = $(window);
  var $doc = $(document);
  var $body = $('body');
  var $html = $('html');

  var currentUser = {
    name: 'زائر/ة',
    email: null,
    stats: { questions: 0, posts: 0, likes: 0 },
    savedItems: { cars: [], posts: [], diagnosis: [] },
    settings: { notifications: true, darkMode: false, location: false }
  };

  var chatHistory = [];
  var activeMapFilter = 'all';

  // ================== STORAGE ==================
  function loadUserData() {
    try {
      var saved = localStorage.getItem('rafiqaUserData');
      if (saved) currentUser = JSON.parse(saved);
    } catch (e) {
      console.warn('loadUserData error', e);
    }
  }

  function saveUserData() {
    try {
      localStorage.setItem('rafiqaUserData', JSON.stringify(currentUser));
    } catch (e) {
      console.warn('saveUserData error', e);
    }
  }

  // ================== THEME (موحّد) ==================
function applyTheme(mode) {
  var theme = mode ||
    localStorage.getItem('theme') ||
    (currentUser.settings.darkMode ? 'dark' : 'light');

  var isDark = theme === 'dark';

  $body.toggleClass('dark', isDark);
  if (isDark) {
    $html.attr('data-theme', 'dark');
  } else {
    $html.removeAttr('data-theme');
  }

  $('#darkModeToggle').prop('checked', isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  currentUser.settings.darkMode = isDark;
  saveUserData();

  // تحديث نص زر الفوتر - إصلاح بسيط
  var $toggle = $('#toggleTheme');
  if ($toggle.length > 0) {
    if (isDark) {
      $toggle.html('☀️ الوضع الفاتح');
    } else {
      $toggle.html('🌙 الوضع الليلي');
    }
  }
  
  console.log('Theme applied:', theme, 'isDark:', isDark); // للتشخيص
}

  // ================== UI UPDATE ==================
  function updateUI() {
    // الاسم والإيميل
    $('#userName').text(currentUser.name);
    $('#userEmail').text(currentUser.email || 'لم تقومي بتسجيل الدخول');

    // الإحصائيات
    $('#questionsCount').text(currentUser.stats.questions);
    $('#postsCount').text(currentUser.stats.posts);
    $('#likesCount').text(currentUser.stats.likes);

    // الإعدادات (غير الثيم – الثيم له applyTheme)
    $('#notificationsToggle').prop('checked', currentUser.settings.notifications);
    $('#locationToggle').prop('checked', currentUser.settings.location);

    updateNavIndicator();
    updateSavedCars();
    updateSavedPosts();
    updateSavedDiagnosis();
  }

  // ================== NAVIGATION ==================
  function updateNavIndicator() {
    var $active = $('.nav-btn.active');
    var $indicator = $('.nav-indicator');
    var $nav = $('.main-nav');

    if (!$active.length || !$indicator.length || !$nav.length) return;

    var btnRect = $active[0].getBoundingClientRect();
    var navRect = $nav[0].getBoundingClientRect();

    $indicator.css({
      width: btnRect.width + 'px',
      transform: 'translateX(' + (btnRect.left - navRect.left) + 'px)'
    });
  }

  function showSection(id) {
    var $target = $('#' + id);

    $('.section')
      .removeClass('active')
      .css('opacity', 0);

    if ($target.length) {
      $target.addClass('active');
      setTimeout(function () {
        $target.css('opacity', 1);
      }, 50);
    }

    $('.nav-btn').removeClass('active')
      .each(function () {
        if ($(this).data('section') === id) $(this).addClass('active');
      });

    setTimeout(updateNavIndicator, 100);

    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      localStorage.setItem('lastSection', id);
    } catch (e) {}
  }

  function initNavigation() {
    var lastSection = localStorage.getItem('lastSection') || 'home';
    showSection(lastSection);

    $doc.on('click', '.nav-btn, .soft-mini-card, [data-section]', function (e) {
      var target = $(this).data('section');
      if (!target) return;
      e.preventDefault();
      showSection(target);
      var $btn = $(this);
      $btn.css('transform', 'scale(0.95)');
      setTimeout(function () { $btn.css('transform', ''); }, 200);
    });

    $win.on('scroll resize', updateNavIndicator);
  }

  // ================== CAR WIZARD ==================
function initCarWizard() {
  // تعريف المتغيرات المهمة
  const $wizard = $('#carWizard');
  const $steps = $('.car-step');
  const $carMatchResult = $('#carMatchResult');
  const $answersSummary = $('#answersSummary');
  const $restartBtn = $('#restartWizard');
  const $editAnswersBtn = $('#editAnswers');
  const $saveResultsBtn = $('#saveResults');
  const $compareCarsBtn = $('#compareCars');
  
  let currentStep = 0;
  const totalSteps = $steps.length;
  const wizardAnswers = {};

  // تهيئة الخطوة الأولى
  $steps.not(':first').addClass('hidden');
  $steps.first().removeClass('hidden');
  updateProgress();

  // تحديث شريط التقدم
  function updateProgress() {
    $steps.each(function(index) {
      const $step = $(this);
      const $progressBar = $step.find('.progress span');
      const $progressText = $step.find('.progress-text');
      
      if (index < currentStep) {
        $progressBar.css('width', '100%');
      } else if (index === currentStep) {
        $progressBar.css('width', `${((currentStep + 1) / totalSteps * 100)}%`);
        $progressText.text(`الخطوة ${currentStep + 1} من ${totalSteps}`);
      } else {
        $progressBar.css('width', '0%');
      }
    });
  }

  // الانتقال للخطوة التالية
  function nextStep() {
    if (currentStep < totalSteps - 1) {
      $steps.eq(currentStep).addClass('hidden');
      currentStep++;
      $steps.eq(currentStep).removeClass('hidden');
      updateProgress();
    } else {
      showResults();
    }
  }

  // العودة للخطوة السابقة
  function prevStep() {
    if (currentStep > 0) {
      $steps.eq(currentStep).addClass('hidden');
      currentStep--;
      $steps.eq(currentStep).removeClass('hidden');
      updateProgress();
    }
  }

  // التعامل مع اختيار الإجابة
  $wizard.on('click', '.step-btn', function(e) {
    e.preventDefault();
    
    const $btn = $(this);
    const $step = $btn.closest('.car-step');
    const stepNumber = parseInt($step.data('step'));
    const answerValue = $btn.data('value');
    
    // تخزين الإجابة
    wizardAnswers[`step${stepNumber}`] = answerValue;
    
    // تأثير بصري على الزر
    $btn.css('transform', 'scale(0.95)');
    setTimeout(() => {
      $btn.css('transform', '');
      nextStep();
    }, 200);
  });

  // التعامل مع زر الرجوع
  $wizard.on('click', '.back-btn', function(e) {
    e.preventDefault();
    prevStep();
  });

  // عرض النتائج
  function showResults() {
    $wizard.addClass('hidden');
    $carMatchResult.removeClass('hidden');
    $answersSummary.removeClass('hidden');
    
    // عرض ملخص الإجابات
    updateAnswersSummary();
    
    // توليد اقتراحات السيارات
    generateCarCards();
  }

  // تحديث ملخص الإجابات
  function updateAnswersSummary() {
    const $summaryContent = $('#summaryContent');
    let html = '';
    
    const stepTitles = {
      1: 'الميزانية',
      2: 'نوع الاستخدام',
      3: 'الأولوية',
      4: 'أهم شيء في السيارة',
      5: 'حجم السيارة',
      6: 'عدد الركاب',
      7: 'جديدة أم مستعملة',
      8: 'أهمية صرفية البنزين',
      9: 'التقنيات والأنظمة',
      10: 'الطرق الترابية'
    };

    const stepOptions = {
      1: {
        low: 'أقل من 70,000 ريال',
        mid: '70,000 - 140,000 ريال',
        high: 'أكثر من 140,000 ريال'
      },
      2: {
        city: 'داخل المدينة',
        travel: 'سفر وطرق سريعة',
        mixed: 'الاثنين معًا'
      },
      3: {
        comfort: 'راحة وعزل',
        saving: 'توفير بالبنزين',
        space: 'مساحة للعائلة'
      },
      4: {
        comfort: 'راحة',
        power: 'قوة',
        cargo: 'تحميل / شنط'
      },
      5: {
        small: 'صغيرة',
        sedan: 'سيدان متوسطة',
        suv: 'SUV / كروس أوفر'
      },
      6: {
        '1-2': '1 - 2 أشخاص',
        '3-4': '3 - 4 أشخاص',
        '5plus': '5 أو أكثر'
      },
      7: {
        new: 'جديدة من الوكيل',
        used: 'مستعملة',
        'no-preference': 'ما يهم'
      },
      8: {
        'very-important': 'مهمة جداً',
        medium: 'مهمة لكن مو كل شيء',
        'not-important': 'مو فارقة كثير'
      },
      9: {
        'high-tech': 'أحب التقنيات',
        'basic-ok': 'أساسيات تكفي',
        'no-tech': 'مو مهم'
      },
      10: {
        'no-offroad': 'لا، غالباً شوارع مدينة',
        'sometimes-offroad': 'أحياناً بر / استراحة',
        offroad: 'كثير بر / استراحات'
      }
    };

    for (let i = 1; i <= 10; i++) {
      const answerKey = `step${i}`;
      if (wizardAnswers[answerKey]) {
        const answerText = stepOptions[i]?.[wizardAnswers[answerKey]] || wizardAnswers[answerKey];
        html += `
          <div class="summary-item">
            <strong>${stepTitles[i] || `السؤال ${i}`}</strong>
            <p>${answerText}</p>
          </div>
        `;
      }
    }
    
    $summaryContent.html(html || '<p>لا توجد إجابات لعرضها</p>');
  }

  // توليد اقتراحات السيارات
  function generateCarCards() {
    const $carCards = $('#carCards');
    
    // بيانات السيارات (مثال مبسط)
    const suggestedCars = [
      {
        id: 'toyota-camry-2022',
        name: 'تويوتا كامري 2022',
        type: 'سيدان',
        price: 120000,
        features: ['اقتصادية في البنزين', 'صيانة سهلة', 'راحة عالية', 'أمان متطور'],
        available: true
      },
      {
        id: 'hyundai-tucson-2023',
        name: 'هيونداي توسان 2023',
        type: 'SUV',
        price: 140000,
        features: ['مساحة واسعة', 'تقنيات حديثة', 'مكيف بارد', 'عازل صوتي'],
        available: true
      },
      {
        id: 'kia-sportage-2022',
        name: 'كيا سبورتاج 2022',
        type: 'SUV',
        price: 130000,
        features: ['تصميم أنيق', 'شاشة كبيرة', 'مقاعد جلد', 'نظام صوتي ممتاز'],
        available: false
      }
    ];
    
    let html = '';
    suggestedCars.forEach(car => {
      html += `
        <div class="car-card" data-car="${car.id}">
          <div class="car-card-header">
            <h3>${car.name}</h3>
            <span class="car-type">${car.type}</span>
          </div>
          <ul class="car-features">
            ${car.features.map(feature => `<li><i class="fas fa-check-circle"></i> ${feature}</li>`).join('')}
          </ul>
          <div class="car-price">
            ${car.price.toLocaleString('ar-SA')} ريال
            <span class="car-availability ${car.available ? 'available' : 'unavailable'}">
              ${car.available ? 'متوفرة' : 'تحت الطلب'}
            </span>
          </div>
          <div class="car-actions">
            <button class="primary-btn small-btn save-car-btn" data-car="${car.id}">
              <i class="fas fa-bookmark"></i> حفظ
            </button>
            <button class="ghost-btn small-btn details-btn" data-car="${car.id}">
              <i class="fas fa-info-circle"></i> التفاصيل
            </button>
          </div>
        </div>
      `;
    });
    
    $carCards.html(html);
  }

  // إعادة الاختيار
  if ($restartBtn.length) {
    $restartBtn.on('click', function(e) {
      e.preventDefault();
      resetWizard();
    });
  }

  // تعديل الإجابات
  if ($editAnswersBtn.length) {
    $editAnswersBtn.on('click', function(e) {
      e.preventDefault();
      $wizard.removeClass('hidden');
      $carMatchResult.addClass('hidden');
      $answersSummary.addClass('hidden');
    });
  }

  // حفظ النتائج
  if ($saveResultsBtn.length) {
    $saveResultsBtn.on('click', function(e) {
      e.preventDefault();
      currentUser.stats.questions++;
      saveUserData();
      updateUI();
      showToast('تم حفظ النتائج بنجاح', 'success');
    });
  }

  // إعادة تعيين المعالج
  function resetWizard() {
    currentStep = 0;
    
    // إخفاء جميع الخطوات
    $steps.addClass('hidden');
    
    // إظهار الخطوة الأولى فقط
    $steps.first().removeClass('hidden');
    
    // إخفاء النتائج وملخص الإجابات
    $carMatchResult.addClass('hidden');
    $answersSummary.addClass('hidden');
    
    // إظهار المعالج
    $wizard.removeClass('hidden');
    
    // تحديث شريط التقدم
    updateProgress();
  }
}

// تفعيل أزرار كارت الكامري
function initFeaturedCar() {
  // زر المفضلة
  $('.featured-car .favorite-btn').on('click', function() {
    $(this).toggleClass('active');
    if ($(this).hasClass('active')) {
      showToast('تمت إضافة تويوتا كامري إلى المفضلة', 'success');
    } else {
      showToast('تمت إزالة تويوتا كامري من المفضلة', 'info');
    }
  });
  
  // زر المقارنة
  $('.featured-car .compare-btn').on('click', function() {
    showToast('تمت إضافة تويوتا كامري للمقارنة', 'success');
  });
  
  // زر التواصل
  $('.featured-car .contact-btn').on('click', function() {
    showToast('جاري فتح معلومات التواصل مع الوكيل', 'info');
    // هنا يمكن فتح نموذج أو نافذة جديدة
  });
  
  // زر طلب عرض سعر
  $('.featured-car .request-btn').on('click', function() {
    showToast('تم إرسال طلب عرض السعر', 'success');
    // هنا يمكن فتح نموذج طلب
  });
}

// استدعاء الدالة عند تحميل الصفحة
$(document).ready(function() {
  initFeaturedCar();
});
  // ================== FIX SECTION ==================
  function initFixSection() {
    var $fixForm = $('#fixForm');
    var $fixResult = $('#fixResult');
    if (!$fixForm.length || !$fixResult.length) return;

    var $problemText = $('#problemText');
    var $solutionSteps = $('#solutionSteps');
    var $severityIndicator = $('.severity-indicator');
    var $saveDiagnosisBtn = $('#saveDiagnosis');
    var $findWorkshopBtn = $('#findWorkshop');

    // مشاكل سريعة
    $('.problem-btn').on('click', function () {
      var id = $(this).data('problem');
      var title;

      if (id === 'engine-light') title = 'لمبة المكينه تضيء';
      else if (id === 'battery') title = 'البطارية تخلص بسرعة';
      else if (id === 'brake') title = 'صوت فرامل مزعج';
      else if (id === 'tire') title = 'ضغط كفرات منخفض';

      if (title) {
        $('input[name="car"]').val('سيارتي');
        $('textarea[name="issue"]').val(title);
        showDiagnosis('سيارتي', title, 'always');
      }
    });

    // إرسال النموذج
    $fixForm.on('submit', function (e) {
      e.preventDefault();
      var car = $.trim($fixForm.find('input[name="car"]').val());
      var issue = $.trim($fixForm.find('textarea[name="issue"]').val());
      var freq = $fixForm.find('select[name="frequency"]').val() || '';
      if (!car || !issue) return;
      showDiagnosis(car, issue, freq);
    });

    function showDiagnosis(car, issue, freq) {
      var severity = 'medium';
      if (issue.indexOf('دخان') !== -1 || issue.indexOf('حريق') !== -1) severity = 'critical';
      else if (issue.indexOf('صوت') !== -1 || issue.indexOf('رج') !== -1) severity = 'high';
      else if (issue.indexOf('لمبة') !== -1 || issue.indexOf('ضوء') !== -1) severity = 'medium';
      else severity = 'low';

      $problemText.text(issue);
      $severityIndicator
        .removeClass('severity-low severity-medium severity-high severity-critical')
        .addClass('severity-' + severity);

      var steps = [
        'تأكدي من أنك في مكان آمن',
        'أطفئي المحرك وانتظري 5 دقائق',
        'افحصي النقطة الظاهرية للمشكلة إن وجدت',
        'جربي إعادة تشغيل السيارة',
        'إذا استمرت المشكلة، توجهي للورشة'
      ];

      $solutionSteps.html(
        steps.map(function (s) { return '<li>' + s + '</li>'; }).join('')
      );

      $fixResult.removeClass('hidden');
      setTimeout(function () {
        $fixResult[0].scrollIntoView({ behavior: 'smooth' });
      }, 250);

      currentUser.stats.questions++;
      saveUserData();
      updateUI();
    }

    if ($saveDiagnosisBtn.length) {
      $saveDiagnosisBtn.on('click', function () {
        var diag = {
          id: Date.now(),
          car: $.trim($fixForm.find('input[name="car"]').val()),
          issue: $.trim($fixForm.find('textarea[name="issue"]').val()),
          date: new Date().toLocaleDateString('ar-SA')
        };
        currentUser.savedItems.diagnosis.push(diag);
        saveUserData();
        updateSavedDiagnosis();
        showToast('تم حفظ التشخيص', 'success');
      });
    }

    if ($findWorkshopBtn.length) {
      $findWorkshopBtn.on('click', function () {
        showSection('map');
        showToast('جاري البحث عن أقرب ورشة', 'info');
      });
    }
  }

  // ================== MAP SECTION ==================
  function initMapSection() {
    var $citySelect = $('#citySelect');
    var $mapSearch = $('#mapSearch');
    var $filterBtns = $('.map-controls .filter-btn');
    var $locateMeBtn = $('#locateMe');
    var $placesList = $('#placesList');

    if (!$citySelect.length || !$placesList.length) return;

    var placesDB = {
      riyadh: [
        {
          name: 'ورشة البنات – شمال الرياض',
          type: 'ورشة / صيانة',
          rating: 4.8,
          reviews: 120,
          services: ['غسيل', 'صيانة', 'تغيير زيت'],
          womenOnly: true,
          distance: '2.5 كم'
        },
        {
          name: 'مغسلة نسائية – طريق الملك',
          type: 'غسيل وتشحيم',
          rating: 4.5,
          reviews: 85,
          services: ['غسيل', 'تلميع', 'تشحيم'],
          womenOnly: true,
          distance: '4.2 كم'
        }
      ],
      jeddah: [
        {
          name: 'مركز صيانة البحر الأحمر',
          type: 'ورشة',
          rating: 4.3,
          reviews: 95,
          services: ['صيانة شاملة', 'كهرباء', 'مكينة'],
          womenOnly: false,
          distance: '3.1 كم'
        }
      ],
      dammam: [
        {
          name: 'مركز الشرقية النسائي للسيارات',
          type: 'خدمة شاملة',
          rating: 4.7,
          reviews: 150,
          services: ['غسيل', 'صيانة', 'تأمين', 'بيع قطع'],
          womenOnly: true,
          distance: '1.8 كم'
        }
      ]
    };

    function generateStars(r) {
      var full = Math.floor(r);
      var half = (r % 1) >= 0.5;
      var empty = 5 - full - (half ? 1 : 0);
      var h = '';

      for (var i = 0; i < full; i++) h += '<i class="fas fa-star"></i>';
      if (half) h += '<i class="fas fa-star-half-alt"></i>';
      for (var j = 0; j < empty; j++) h += '<i class="far fa-star"></i>';
      return h;
    }

    function filterPlaces(list) {
      var filtered = list.slice(0);
      var term = $mapSearch.val() ? $mapSearch.val().toLowerCase() : '';

      if (activeMapFilter !== 'all') {
        filtered = filtered.filter(function (p) {
          if (activeMapFilter === 'women') return p.womenOnly;
          if (activeMapFilter === 'workshop') return p.type.indexOf('ورشة') !== -1;
          if (activeMapFilter === 'wash') return p.type.indexOf('غسيل') !== -1;
          return true;
        });
      }

      if (term) {
        filtered = filtered.filter(function (p) {
          var inName = p.name.toLowerCase().indexOf(term) !== -1;
          var inService = p.services.some(function (s) {
            return s.toLowerCase().indexOf(term) !== -1;
          });
          return inName || inService;
        });
      }

      return filtered;
    }

    function updatePlacesList(city) {
      $placesList.empty();

      if (!city || !placesDB[city]) {
        $placesList.html(
          '<div class="empty-state">' +
          '<i class="fas fa-map-marker-alt"></i>' +
          '<p>لا توجد أماكن متاحة في هذه المدينة</p>' +
          '</div>'
        );
        return;
      }

      var list = filterPlaces(placesDB[city]);
      if (!list.length) {
        $placesList.html(
          '<div class="empty-state">' +
          '<i class="fas fa-filter"></i>' +
          '<p>لا توجد أماكن تطابق الفلترة</p>' +
          '</div>'
        );
        return;
      }

      var html = list.map(function (p) {
        return (
          '<div class="place-item card" data-women="' + p.womenOnly + '">' +
          '<div class="place-header">' +
          '<div>' +
          '<strong>' + p.name + '</strong>' +
          '<div class="place-rating">' +
          generateStars(p.rating) +
          '<span>' + p.rating + ' (' + p.reviews + ' تقييم)</span>' +
          '</div>' +
          '</div>' +
          (p.womenOnly
            ? '<span class="badge"><i class="fas fa-female"></i> نسائية</span>'
            : '') +
          '</div>' +
          '<div class="place-services">' +
          p.services.map(function (s) {
            return '<span class="service-tag">' + s + '</span>';
          }).join('') +
          '</div>' +
          '<div class="place-meta">' +
          '<span><i class="fas fa-clock"></i> ٨ صباحاً - ١٠ مساءً</span>' +
          '<span><i class="fas fa-location-arrow"></i> ' + p.distance + '</span>' +
          '</div>' +
          '<div class="place-actions">' +
          '<button class="ghost-btn small-btn"><i class="fas fa-phone"></i> اتصلي</button>' +
          '<button class="primary-btn small-btn"><i class="fas fa-directions"></i> اتجاهات</button>' +
          '</div>' +
          '</div>'
        );
      }).join('');

      $placesList.html(html);
    }

    $citySelect.on('change', function () {
      updatePlacesList($(this).val());
    });

    if ($mapSearch.length) {
      $mapSearch.on('input', function () {
        updatePlacesList($citySelect.val());
      });
    }

    $filterBtns.on('click', function () {
      $filterBtns.removeClass('active');
      $(this).addClass('active');
      activeMapFilter = $(this).data('filter') || 'all';
      updatePlacesList($citySelect.val());
    });

    if ($locateMeBtn.length && 'geolocation' in navigator) {
      $locateMeBtn.on('click', function () {
        showToast('جاري تحديد موقعك...', 'info');
        navigator.geolocation.getCurrentPosition(
          function (pos) {
            var lat = pos.coords.latitude.toFixed(4);
            var lng = pos.coords.longitude.toFixed(4);
            showToast('موقعك: ' + lat + ', ' + lng, 'success');
          },
          function () {
            showToast('تعذّر تحديد الموقع', 'error');
          }
        );
      });
    }

    updatePlacesList($citySelect.val());
  }
  // ========== مساعد AI ==========

// بيانات مساعد AI (محاكاة للذكاء الاصطناعي)
const aiResponses = {
  "default": `أهلاً وسهلاً بك! 👋

أنا مساعدك الذكي الخاص بالسيارات. يمكنني مساعدتك في:

🚗 **اختيار سيارة** مناسبة لميزانيتك واحتياجاتك
🔧 **تشخيص مشاكل** سيارتك وإصلاحها
⛽ **نصائح صيانة** دورية للحفاظ على سيارتك
🗺️ **معرفة أماكن** الورش والمحلات الموثوقة
💡 **إجابة أي سؤال** يخص عالم السيارات

كيف يمكنني مساعدتك اليوم؟`,

  "وش أفضل suv صغيرة للرياض؟": `أفضل SUV صغيرة للرياض بناءً على تجارب المستخدمات:

🏆 **الهيونداي كريتا**
✓ اقتصادي في البنزين والقطع
✓ صيانة متوفرة في كل مكان
✓ سعره مناسب من 70,000 ريال

🏆 **التويوتا كورولا كروس**
✓ ثقة وموثوقية تويوتا
✓ مناسبة للطرق السعودية
✓ خدمة ما بعد البيع ممتازة

🏆 **المازدا CX-30**
✓ تصميم أنثوي وجذاب
✓ توفير في البنزين
✓ راحة في القيادة

💡 **نصيحتي**: جربي القيادة بنفسك قبل الشراء. بعض المحلات النسائية تتيح تجربة قيادة خاصة.`,

  "وش يعني لما تطلع لمبة الزيت؟": `⚠️ **تحذير مهم**: لمبة الزيت الحمراء تعني خطر على محرك سيارتك!

**الأسباب المحتملة:**
1. مستوى الزيت منخفض جداً
2. ضغط الزيت غير كافي
3. مشكلة في مضخة الزيت
4. انسداد في فلتر الزيت

**الخطوات الفورية:**
1. ⛔ أوقفي السيارة فوراً في مكان آمن
2. 🔍 افحصي مستوى الزيت بالمقياس
3. ➕ أضيفي نفس نوع الزيت الموجود
4. 📞 اطلبي المساعدة إذا لم تختفي اللمبة

**لا تقودي السيارة مع إضاءة هذه اللمبة!**`,

  "كم مرة لازم أغير زيت السيارة؟": `تغيير الزيت يعتمد على عدة عوامل:

📊 **بناءً على المسافة:**
• سيارات 2015+ فما فوق: كل 10,000 - 15,000 كم
• سيارات أقدم: كل 5,000 - 8,000 كم

📅 **بناءً على الزمن:**
• استعمال يومي: كل 6 أشهر
• استعمال قليل: كل سنة

🌡️ **عوامل إضافية:**
• القيادة في زحام: تغيير متكرر أكثر
• القيادة في صحراء: كل 5,000 كم
• القيادة في جبال: كل 6,000 كم

🔧 **فحص شهري**: تأكدي من مستوى الزيت كل شهر`,

  "وش أفضل موقع لبيع السيارات المستعملة في السعودية؟": `أفضل المنصات لبيع/شراء السيارات المستعملة:

1. **🏆 حراج السيارات**
   • الأشهر والأكبر في السعودية
   • خيارات كثيرة ومتنوعة
   • خاصية التواصل المباشر

2. **🚗 سيارة.كوم**
   • واجهة احترافية وسهلة
   • فحص للسيارات المعروضة
   • أسعار عادلة

3. **📱 هتلاقي**
   • تطبيق سهل الاستخدام
   • خيارات متعددة للتصفية
   • تقييمات المستخدمين

4. **👑 أوتو ماسترز**
   • متخصص في السيارات الفاخرة
   • ضمان على بعض السيارات
   • خدمة عملاء متميزة

💡 **نصيحة**: التقطي صور واضحة من جميع الزوايا واكتبي وصفاً مفصلاً لتحصلي على سعر أفضل.`
};

// تهيئة مساعد AI
function initAIAssistant() {
  const aiForm = document.getElementById('aiForm');
  const aiInput = document.getElementById('aiInput');
  const aiChat = document.getElementById('aiChat');
  const voiceBtn = document.getElementById('voiceBtn');
  const attachBtn = document.getElementById('attachBtn');
  const exampleBtns = document.querySelectorAll('.example-btn');
  const questionChips = document.querySelectorAll('.question-chip');
  const saveChatBtn = document.getElementById('saveChat');
  const clearChatBtn = document.getElementById('clearChat');
  const exportChatBtn = document.getElementById('exportChat');

  // إضافة رسالة إلى المحادثة
  function addMessage(text, sender = 'user', isTyping = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-msg ai-msg-${sender} ${isTyping ? 'ai-msg-typing' : ''}`;
    
    if (isTyping) {
      msgDiv.innerHTML = `
        <div class="msg-avatar">
          <i class="fas fa-robot"></i>
        </div>
        <div class="msg-content">
          <div class="msg-sender">مساعد AI</div>
          <div class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      `;
    } else {
      const avatarDiv = document.createElement('div');
      avatarDiv.className = 'msg-avatar';
      
      const icon = document.createElement('i');
      icon.className = sender === 'bot' ? 'fas fa-robot' : 'fas fa-user';
      avatarDiv.appendChild(icon);
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'msg-content';
      
      const senderDiv = document.createElement('div');
      senderDiv.className = 'msg-sender';
      senderDiv.textContent = sender === 'bot' ? 'مساعد AI' : 'أنت';
      
      const textDiv = document.createElement('div');
      textDiv.className = 'msg-text';
      textDiv.textContent = text;
      
      const timeDiv = document.createElement('div');
      timeDiv.className = 'msg-time';
      timeDiv.textContent = getCurrentTime();
      
      contentDiv.appendChild(senderDiv);
      contentDiv.appendChild(textDiv);
      contentDiv.appendChild(timeDiv);
      
      msgDiv.appendChild(avatarDiv);
      msgDiv.appendChild(contentDiv);
    }
    
    aiChat.appendChild(msgDiv);
    aiChat.scrollTop = aiChat.scrollHeight;
    
    if (sender === 'user') {
      aiInput.value = '';
    }
  }

  // الحصول على الوقت الحالي
  function getCurrentTime() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }

  // محاكاة الاستجابة الذكية
  function simulateAIResponse(question) {
    const normalizedQuestion = question.toLowerCase().trim();
    let response = aiResponses.default;
    
    // البحث عن أفضل تطابق
    const matchingResponses = [];
    for (const [key, value] of Object.entries(aiResponses)) {
      if (key === 'default') continue;
      
      if (normalizedQuestion.includes(key.toLowerCase()) || 
          key.toLowerCase().includes(normalizedQuestion)) {
        matchingResponses.push({ key, value });
      }
    }
    
    if (matchingResponses.length > 0) {
      // اختيار أفضل تطابق
      const bestMatch = matchingResponses[0];
      response = bestMatch.value;
    } else {
      // إذا لم يكن هناك تطابق، أضف بعض المعلومات العامة
      response = `${aiResponses.default}

🔍 **ملاحظة**: لم أجد إجابة محددة لسؤالك، لكن يمكنني مساعدتك في:
• توصيات سيارات حسب ميزانيتك
• حل مشاكل الصيانة الشائعة
• نصائح لشراء سيارة مستعملة
• فهم مصطلحات السيارات

يمكنك صياغة سؤالك بطريقة أخرى أو استخدام أحد الأمثلة أعلاه.`;
    }
    
    // محاكاة الكتابة
    setTimeout(() => {
      // إزالة مؤشر الكتابة
      const typingMsg = document.querySelector('.ai-msg-typing');
      if (typingMsg) typingMsg.remove();
      
      // إضافة الرسالة
      addMessage(response, 'bot');
    }, 1500 + (response.length * 10)); // وقت محاكاة الكتابة حسب طول النص
  }

  // إرسال سؤال
  function sendQuestion(question) {
    if (!question.trim()) return;
    
    // إضافة رسالة المستخدم
    addMessage(question, 'user');
    
    // إضافة مؤشر الكتابة
    addMessage('', 'bot', true);
    
    // محاكاة الاستجابة
    simulateAIResponse(question);
    
    // تحديث الإحصائيات
    updateAIStats();
  }

  // تحديث إحصائيات AI
  function updateAIStats() {
    const questionsCount = document.querySelectorAll('.ai-msg-user').length;
    const statNumber = document.querySelector('.ai-stats .stat-number:first-child');
    if (statNumber) {
      statNumber.textContent = `${questionsCount}`;
    }
  }

  // التعامل مع نموذج الإرسال
  if (aiForm) {
    aiForm.addEventListener('submit', function(e) {
      e.preventDefault();
      sendQuestion(aiInput.value);
    });
  }

  // زر الصوت
  if (voiceBtn) {
    voiceBtn.addEventListener('click', function() {
      voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
      voiceBtn.style.color = 'var(--danger)';
      voiceBtn.style.background = 'var(--danger-light)';
      
      addMessage('🎤 التحدث مفعل... قل سؤالك الآن', 'bot');
      
      // محاكاة الاستماع
      setTimeout(() => {
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        voiceBtn.style.color = '';
        voiceBtn.style.background = '';
        
        // أمثلة للأسئلة الصوتية
        const sampleQuestions = [
          "وش أفضل SUV صغيرة للرياض؟",
          "كم مرة لازم أغير زيت السيارة؟",
          "وش يعني لما تطلع لمبة الزيت؟",
          "وش أفضل موقع لبيع السيارات المستعملة؟"
        ];
        
        const randomQuestion = sampleQuestions[Math.floor(Math.random() * sampleQuestions.length)];
        aiInput.value = randomQuestion;
        aiInput.focus();
        
        // إرسال تلقائي بعد ثانيتين
        setTimeout(() => {
          if (aiForm) aiForm.dispatchEvent(new Event('submit'));
        }, 2000);
      }, 3000);
    });
  }

  // زر الإرفاق
  if (attachBtn) {
    attachBtn.addEventListener('click', function() {
      addMessage('📎 هذه الميزة قيد التطوير حالياً. قريباً يمكنك إرفاق صور لمشاكل سيارتك وسأقوم بتحليلها.', 'bot');
    });
  }

  // أزرار الأمثلة
  exampleBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const question = this.getAttribute('data-question');
      aiInput.value = question;
      aiInput.focus();
      sendQuestion(question);
    });
  });

  // رقائق الأسئلة
  questionChips.forEach(chip => {
    chip.addEventListener('click', function() {
      const question = this.getAttribute('data-question');
      aiInput.value = question;
      aiInput.focus();
      sendQuestion(question);
    });
  });

  // حفظ المحادثة
  if (saveChatBtn) {
    saveChatBtn.addEventListener('click', function() {
      const messages = [];
      document.querySelectorAll('.ai-msg:not(.ai-msg-typing)').forEach(msg => {
        const sender = msg.classList.contains('ai-msg-user') ? 'أنت' : 'مساعد AI';
        const text = msg.querySelector('.msg-text')?.textContent || '';
        const time = msg.querySelector('.msg-time')?.textContent || '';
        
        if (text) {
          messages.push({ sender, text, time });
        }
      });
      
      localStorage.setItem('aiChatHistory', JSON.stringify(messages));
      addMessage('💾 تم حفظ المحادثة بنجاح! يمكنك الوصول إليها من الملف الشخصي.', 'bot');
      
      // تأثير النجاح
      saveChatBtn.innerHTML = '<i class="fas fa-check"></i> تم الحفظ';
      saveChatBtn.style.background = 'var(--success)';
      saveChatBtn.style.color = 'white';
      
      setTimeout(() => {
        saveChatBtn.innerHTML = '<i class="fas fa-download"></i> حفظ المحادثة';
        saveChatBtn.style.background = '';
        saveChatBtn.style.color = '';
      }, 2000);
    });
  }

  // مسح المحادثة
  if (clearChatBtn) {
    clearChatBtn.addEventListener('click', function() {
      if (confirm('هل أنت متأكدة من مسح المحادثة؟ لا يمكن التراجع عن هذا الإجراء.')) {
        const firstMessage = aiChat.querySelector('.ai-msg-bot:first-child');
        const allMessages = Array.from(aiChat.children);
        
        allMessages.forEach(msg => {
          if (msg !== firstMessage) {
            msg.remove();
          }
        });
        
        addMessage('🗑️ تم مسح المحادثة بنجاح. يمكنك البدء بمحادثة جديدة.', 'bot');
      }
    });
  }

  // تصدير المحادثة
  if (exportChatBtn) {
    exportChatBtn.addEventListener('click', function() {
      const messages = [];
      document.querySelectorAll('.ai-msg:not(.ai-msg-typing)').forEach(msg => {
        const sender = msg.classList.contains('ai-msg-user') ? 'أنت' : 'مساعد AI';
        const text = msg.querySelector('.msg-text')?.textContent || '';
        const time = msg.querySelector('.msg-time')?.textContent || '';
        
        if (text) {
          messages.push(`${time} - ${sender}: ${text}`);
        }
      });
      
      const chatText = messages.join('\n\n');
      const blob = new Blob([chatText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `محادثة-وكار-${new Date().toLocaleDateString('ar-SA')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      addMessage('📤 تم تصدير المحادثة كملف نصي.', 'bot');
    });
  }

  // تحميل المحادثة السابقة
  function loadChatHistory() {
    try {
      const savedChat = localStorage.getItem('aiChatHistory');
      if (savedChat) {
        const messages = JSON.parse(savedChat);
        const firstMessage = aiChat.querySelector('.ai-msg-bot:first-child');
        const allMessages = Array.from(aiChat.children);
        
        // مسح جميع الرسائل عدا الأولى
        allMessages.forEach(msg => {
          if (msg !== firstMessage) {
            msg.remove();
          }
        });
        
        // إضافة الرسائل المحفوظة
        messages.forEach(msg => {
          if (msg.sender === 'مساعد AI') {
            addMessage(msg.text, 'bot');
          } else {
            addMessage(msg.text, 'user');
          }
        });
        
        // إضافة رسالة تأكيد
        addMessage('📖 تم تحميل محادثتك السابقة بنجاح.', 'bot');
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }

  // تحميل المحادثة عند فتح قسم AI
  document.addEventListener('sectionChanged', function(e) {
    if (e.detail.section === 'ai') {
      // يمكن إضافة تحميل المحادثة إذا أردت
      // loadChatHistory();
    }
  });

  // تحديث الإحصائيات عند التحميل
  updateAIStats();
}

// تهيئة مساعد AI عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  // انتظر قليلاً لضمان تحميل كل شيء
  setTimeout(initAIAssistant, 500);
});
  // ================== PROFILE & SAVED ==================
  function updateSavedCars() {
    var $container = $('#savedCars');
    if (!$container.length) return;

    var cars = currentUser.savedItems.cars;
    if (!cars.length) {
      $container.html(
        '<div class="empty-state">' +
        '<i class="fas fa-car"></i>' +
        '<p>لا توجد سيارات محفوظة بعد</p>' +
        '</div>'
      );
      return;
    }

    var html = cars.map(function (c) {
      return (
        '<div class="saved-item">' +
        '<h4>' + c.name + '</h4>' +
        '<p>' + c.price.toLocaleString('ar-SA') + ' ريال</p>' +
        '<button class="ghost-btn small-btn remove-saved-car" data-id="' + c.id + '">' +
        '<i class="fas fa-trash"></i> حذف</button>' +
        '</div>'
      );
    }).join('');

    $container.html(html);

    $container.find('.remove-saved-car').off('click').on('click', function () {
      var id = $(this).data('id');
      currentUser.savedItems.cars = currentUser.savedItems.cars.filter(function (c) {
        return c.id !== id;
      });
      saveUserData();
      updateSavedCars();
      showToast('تم حذف السيارة من المحفوظات', 'info');
    });
  }

  function updateSavedPosts() {
    var $container = $('#savedPosts');
    if (!$container.length) return;

    var posts = currentUser.savedItems.posts;
    if (!posts.length) {
      $container.html(
        '<div class="empty-state">' +
        '<i class="fas fa-comment"></i>' +
        '<p>لا توجد مشاركات محفوظة</p>' +
        '</div>'
      );
      return;
    }

    var html = posts.map(function (p) {
      return (
        '<div class="saved-item">' +
        '<h4>' + p.title + '</h4>' +
        '<p>' + (p.content || '').substring(0, 50) + '...</p>' +
        '<button class="ghost-btn small-btn remove-post-btn" data-id="' + p.id + '">' +
        '<i class="fas fa-trash"></i> حذف</button>' +
        '</div>'
      );
    }).join('');

    $container.html(html);

    $container.find('.remove-post-btn').off('click').on('click', function () {
      var id = parseInt($(this).data('id'), 10);
      currentUser.savedItems.posts = currentUser.savedItems.posts.filter(function (p) {
        return p.id !== id;
      });
      saveUserData();
      updateSavedPosts();
      showToast('تم حذف المشاركة من المحفوظات', 'info');
    });
  }

  function updateSavedDiagnosis() {
    var $container = $('#savedDiagnosis');
    if (!$container.length) return;

    var list = currentUser.savedItems.diagnosis;
    if (!list.length) {
      $container.html(
        '<div class="empty-state">' +
        '<i class="fas fa-stethoscope"></i>' +
        '<p>لا توجد تشخيصات محفوظة</p>' +
        '</div>'
      );
      return;
    }

    var html = list.map(function (d) {
      return (
        '<div class="saved-item">' +
        '<h4>' + d.car + '</h4>' +
        '<p>' + d.issue + '</p>' +
        '<small>' + d.date + '</small>' +
        '<button class="ghost-btn small-btn remove-diagnosis-btn" data-id="' + d.id + '">' +
        '<i class="fas fa-trash"></i> حذف</button>' +
        '</div>'
      );
    }).join('');

    $container.html(html);

    $container.find('.remove-diagnosis-btn').off('click').on('click', function () {
      var id = parseInt($(this).data('id'), 10);
      currentUser.savedItems.diagnosis = currentUser.savedItems.diagnosis.filter(function (d) {
        return d.id !== id;
      });
      saveUserData();
      updateSavedDiagnosis();
      showToast('تم حذف التشخيص', 'info');
    });
  }

  function initProfile() {
    var $profileBtn = $('#profileBtn');
    var $darkModeToggle = $('#darkModeToggle');
    var $notificationsToggle = $('#notificationsToggle');
    var $locationToggle = $('#locationToggle');
    var $exportDataBtn = $('#exportData');
    var $clearDataBtn = $('#clearData');
    var $tabBtns = $('.tab-btn');

    if ($profileBtn.length) {
      $profileBtn.on('click', function () {
        showSection('profile');
      });
    }

    if ($darkModeToggle.length) {
      $darkModeToggle.on('change', function () {
        applyTheme(this.checked ? 'dark' : 'light');
        showToast(this.checked ? 'تم تفعيل الوضع الليلي' : 'تم إيقاف الوضع الليلي', 'success');
      });
    }

    if ($notificationsToggle.length) {
      $notificationsToggle.on('change', function () {
        currentUser.settings.notifications = this.checked;
        saveUserData();
        showToast(
          this.checked ? 'تم تفعيل التنبيهات' : 'تم إيقاف التنبيهات',
          'success'
        );
      });
    }

    if ($locationToggle.length) {
      $locationToggle.on('change', function () {
        currentUser.settings.location = this.checked;
        saveUserData();
        if (this.checked && 'geolocation' in navigator) {
          showToast('تم تفعيل تحديد الموقع', 'success');
        } else {
          showToast('تم إيقاف تحديد الموقع', 'info');
        }
      });
    }

    if ($exportDataBtn.length) {
      $exportDataBtn.on('click', function () {
        var dataStr = JSON.stringify(currentUser, null, 2);
        var dataUri = 'data:application/json;charset=utf-8,' +
          encodeURIComponent(dataStr);
        var fileName = 'rafiqa-data-' + new Date().toISOString().split('T')[0] + '.json';

        var link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', fileName);
        link.click();

        showToast('تم تصدير البيانات', 'success');
      });
    }

    if ($clearDataBtn.length) {
      $clearDataBtn.on('click', function () {
        if (confirm('هل أنت متأكدة من مسح جميع بياناتك؟ لا يمكن التراجع عن هذا الإجراء.')) {
          localStorage.removeItem('rafiqaUserData');
          localStorage.removeItem('aiConversations');
          currentUser = {
            name: 'زائر/ة',
            email: null,
            stats: { questions: 0, posts: 0, likes: 0 },
            savedItems: { cars: [], posts: [], diagnosis: [] },
            settings: { notifications: true, darkMode: false, location: false }
          };
          saveUserData();
          applyTheme('light');
          updateUI();
          showToast('تم مسح جميع البيانات', 'success');
        }
      });
    }

    $tabBtns.on('click', function () {
      var tabId = $(this).data('tab');
      $tabBtns.removeClass('active');
      $(this).addClass('active');
      $('.tab-content').removeClass('active');
      $('#' + tabId).addClass('active');
    });

    // تحديث المحفوظات في البداية
    updateSavedCars();
    updateSavedPosts();
    updateSavedDiagnosis();
  }

  // ================== TOASTS ==================
  function getToastIcon(type) {
    var icons = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    };
    return icons[type] || 'info-circle';
  }

  function showToast(message, type) {
    type = type || 'info';

    $('.toast').remove();

    var $toast = $(
      '<div class="toast toast-' + type + '">' +
      '<div class="toast-content">' +
      '<i class="fas fa-' + getToastIcon(type) + '"></i>' +
      '<span>' + message + '</span>' +
      '</div>' +
      '<button class="toast-close"><i class="fas fa-times"></i></button>' +
      '</div>'
    );

    $body.append($toast);

    setTimeout(function () {
      $toast.addClass('show');
    }, 10);

    $toast.find('.toast-close').on('click', function () {
      $toast.remove();
    });

    setTimeout(function () {
      if ($toast.parent().length) $toast.remove();
    }, 5000);
  }

  function injectToastStyles() {
    var css =
      '.toast{position:fixed;top:20px;left:20px;background:var(--bg-card);' +
      'border-radius:var(--radius-md);padding:1rem 1.5rem;box-shadow:var(--shadow-large);' +
      'display:flex;align-items:center;justify-content:space-between;gap:1rem;z-index:1000;' +
      'transform:translateX(-100%);opacity:0;transition:var(--transition-normal);' +
      'border-right:4px solid var(--accent-main);min-width:300px;max-width:90%}' +
      '.toast.show{transform:translateX(0);opacity:1}' +
      '.toast-success{border-right-color:var(--accent-green)}' +
      '.toast-error{border-right-color:var(--accent-red)}' +
      '.toast-warning{border-right-color:var(--accent-orange)}' +
      '.toast-info{border-right-color:var(--accent-blue)}' +
      '.toast-content{display:flex;align-items:center;gap:.75rem;flex:1}' +
      '.toast-content i{font-size:1.2rem}' +
      '.toast-success .toast-content i{color:var(--accent-green)}' +
      '.toast-error .toast-content i{color:var(--accent-red)}' +
      '.toast-warning .toast-content i{color:var(--accent-orange)}' +
      '.toast-info .toast-content i{color:var(--accent-blue)}' +
      '.toast-close{background:none;border:none;color:var(--text-gray);cursor:pointer;' +
      'padding:.25rem;border-radius:var(--radius-sm);transition:var(--transition-fast)}' +
      '.toast-close:hover{color:var(--accent-main);background:rgba(228,86,139,.1)}';

    $('<style/>', { text: css }).appendTo('head');
  }

  // ================== GLOBAL EVENTS ==================
function initGlobalEvents() {
  $doc.on('click', function (e) {
    if (!$(e.target).closest('.toast').length) {
      $('.toast').remove();
    }
  });

  // استخدم vanilla JavaScript للزر - أكثر موثوقية
  var themeBtn = document.getElementById('toggleTheme');
  if (themeBtn) {
    // إزالة جميع المستمعات السابقة
    var newThemeBtn = themeBtn.cloneNode(true);
    themeBtn.parentNode.replaceChild(newThemeBtn, themeBtn);
    
    // إضافة مستمع جديد
    newThemeBtn.addEventListener('click', function() {
      var isDark = document.body.classList.contains('dark');
      applyTheme(isDark ? 'light' : 'dark');
    });
  }
}

  // ================== SERVICE WORKER ==================
  function initServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(function (reg) {
          console.log('Service Worker registered:', reg.scope);
        })
        .catch(function (err) {
          console.error('Service Worker failed:', err);
        });
    }
  }

  // ================== INIT ==================
$(function () {
  injectToastStyles();
  loadUserData();
  initThemeFromStorage();
  updateUI();
  initNavigation();
  initCarWizard();  
  initFixSection();
  initMapSection();
  initAIAssistant(); 
  initProfile();
  initGlobalEvents();
  initServiceWorker();
});

})(jQuery);

// ================== حل طارئ لزر الفوتر ==================
document.addEventListener('DOMContentLoaded', function() {
  // اختيار الزر بعد تحميل الصفحة مباشرة
  var themeBtn = document.getElementById('toggleTheme');
  
  if (themeBtn) {
    console.log('تم العثور على زر toggleTheme');
    
    // تحديث النص بناءً على الوضع الحالي
    if (document.body.classList.contains('dark')) {
      themeBtn.textContent = '☀️ الوضع الفاتح';
    } else {
      themeBtn.textContent = '🌙 الوضع الليلي';
    }
    
    // إضافة مستمع الحدث
    themeBtn.addEventListener('click', function() {
      var isDark = document.body.classList.contains('dark');
      
      if (isDark) {
        // تحويل إلى وضع فاتح
        document.body.classList.remove('dark');
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        themeBtn.textContent = '🌙 الوضع الليلي';
        console.log('تم التبديل إلى الوضع الفاتح');
      } else {
        // تحويل إلى وضع ليلي
        document.body.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeBtn.textContent = '☀️ الوضع الفاتح';
        console.log('تم التبديل إلى الوضع الليلي');
      }
    });
  }
});
