document.addEventListener('DOMContentLoaded', function() {
    let currentLang = 'zh';

    const productsData = {
        '1': {
            name_zh: '三轴栏板半挂车',
            name_en: 'Tri-Axle Flatbed Semi Trailer',
            price: '[请填写价格]',
            specs: {
                model: '[请填写]',
                load: '[请填写]',
                length: '[请填写]',
                width: '[请填写]',
                height: '[请填写]',
                wheelbase: '[请填写]',
                tire: '[请填写]',
                tireCount: '[请填写]',
                totalMass: '[请填写]',
                curbMass: '[请填写]',
                material: '[请填写]',
                application: '[请填写]',
                certification: '[请填写]'
            },
            description_zh: '[请填写产品详细描述]',
            description_en: '[Please fill product description]',
            features: {
                f1_zh: '[特点1]',
                f1_en: '[Feature 1]',
                f2_zh: '[特点2]',
                f2_en: '[Feature 2]',
                f3_zh: '[特点3]',
                f3_en: '[Feature 3]',
                f4_zh: '[特点4]',
                f4_en: '[Feature 4]'
            }
        },
        '2': {
            name_zh: '厢式半挂车',
            name_en: 'Van Semi Trailer',
            price: '[请填写价格]',
            specs: {
                model: '[请填写]',
                load: '[请填写]',
                length: '[请填写]',
                width: '[请填写]',
                height: '[请填写]',
                wheelbase: '[请填写]',
                tire: '[请填写]',
                tireCount: '[请填写]',
                totalMass: '[请填写]',
                curbMass: '[请填写]',
                material: '[请填写]',
                application: '[请填写]',
                certification: '[请填写]'
            },
            description_zh: '[请填写产品详细描述]',
            description_en: '[Please fill product description]',
            features: {
                f1_zh: '[特点1]',
                f1_en: '[Feature 1]',
                f2_zh: '[特点2]',
                f2_en: '[Feature 2]',
                f3_zh: '[特点3]',
                f3_en: '[Feature 3]',
                f4_zh: '[特点4]',
                f4_en: '[Feature 4]'
            }
        },
        '3': {
            name_zh: '油罐车',
            name_en: 'Oil Tanker',
            price: '[请填写价格]',
            specs: {
                model: '[请填写]',
                load: '[请填写]',
                length: '[请填写]',
                width: '[请填写]',
                height: '[请填写]',
                wheelbase: '[请填写]',
                tire: '[请填写]',
                tireCount: '[请填写]',
                totalMass: '[请填写]',
                curbMass: '[请填写]',
                material: '[请填写]',
                application: '[请填写]',
                certification: '[请填写]'
            },
            description_zh: '[请填写产品详细描述]',
            description_en: '[Please fill product description]',
            features: {
                f1_zh: '[特点1]',
                f1_en: '[Feature 1]',
                f2_zh: '[特点2]',
                f2_en: '[Feature 2]',
                f3_zh: '[特点3]',
                f3_en: '[Feature 3]',
                f4_zh: '[特点4]',
                f4_en: '[Feature 4]'
            }
        },
        '4': {
            name_zh: '集装箱骨架车',
            name_en: 'Container Chassis',
            price: '[请填写价格]',
            specs: {
                model: '[请填写]',
                load: '[请填写]',
                length: '[请填写]',
                width: '[请填写]',
                height: '[请填写]',
                wheelbase: '[请填写]',
                tire: '[请填写]',
                tireCount: '[请填写]',
                totalMass: '[请填写]',
                curbMass: '[请填写]',
                material: '[请填写]',
                application: '[请填写]',
                certification: '[请填写]'
            },
            description_zh: '[请填写产品详细描述]',
            description_en: '[Please fill product description]',
            features: {
                f1_zh: '[特点1]',
                f1_en: '[Feature 1]',
                f2_zh: '[特点2]',
                f2_en: '[Feature 2]',
                f3_zh: '[特点3]',
                f3_en: '[Feature 3]',
                f4_zh: '[特点4]',
                f4_en: '[Feature 4]'
            }
        },
        '5': {
            name_zh: '轿运车',
            name_en: 'Car Carrier',
            price: '[请填写价格]',
            specs: {
                model: '[请填写]',
                load: '[请填写]',
                length: '[请填写]',
                width: '[请填写]',
                height: '[请填写]',
                wheelbase: '[请填写]',
                tire: '[请填写]',
                tireCount: '[请填写]',
                totalMass: '[请填写]',
                curbMass: '[请填写]',
                material: '[请填写]',
                application: '[请填写]',
                certification: '[请填写]'
            },
            description_zh: '[请填写产品详细描述]',
            description_en: '[Please fill product description]',
            features: {
                f1_zh: '[特点1]',
                f1_en: '[Feature 1]',
                f2_zh: '[特点2]',
                f2_en: '[Feature 2]',
                f3_zh: '[特点3]',
                f3_en: '[Feature 3]',
                f4_zh: '[特点4]',
                f4_en: '[Feature 4]'
            }
        },
        '6': {
            name_zh: '化工液体运输车',
            name_en: 'Chemical Liquid Tanker',
            price: '[请填写价格]',
            specs: {
                model: '[请填写]',
                load: '[请填写]',
                length: '[请填写]',
                width: '[请填写]',
                height: '[请填写]',
                wheelbase: '[请填写]',
                tire: '[请填写]',
                tireCount: '[请填写]',
                totalMass: '[请填写]',
                curbMass: '[请填写]',
                material: '[请填写]',
                application: '[请填写]',
                certification: '[请填写]'
            },
            description_zh: '[请填写产品详细描述]',
            description_en: '[Please fill product description]',
            features: {
                f1_zh: '[特点1]',
                f1_en: '[Feature 1]',
                f2_zh: '[特点2]',
                f2_en: '[Feature 2]',
                f3_zh: '[特点3]',
                f3_en: '[Feature 3]',
                f4_zh: '[特点4]',
                f4_en: '[Feature 4]'
            }
        }
    };

    function setLang(lang) {
        currentLang = lang;
        const elements = document.querySelectorAll('[data-zh]');
        elements.forEach(function(el) {
            el.textContent = el.getAttribute('data-' + lang);
        });
        document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    }

    const langToggle = document.getElementById('langToggle');
    langToggle.addEventListener('click', function() {
        const newLang = currentLang === 'zh' ? 'en' : 'zh';
        setLang(newLang);
    });

    setLang('zh');

    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    hamburger.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('toggle');
    });

    navLinks.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', function() {
            navLinks.classList.remove('active');
            hamburger.classList.remove('toggle');
        });
    });

    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    let currentSlide = 0;
    let slideInterval;

    function showSlide(index) {
        slides.forEach(function(slide) {
            slide.classList.remove('active');
        });
        dots.forEach(function(dot) {
            dot.classList.remove('active');
        });
        
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        currentSlide = index;
    }

    function nextSlide() {
        let newIndex = currentSlide + 1;
        if (newIndex >= slides.length) {
            newIndex = 0;
        }
        showSlide(newIndex);
    }

    function prevSlide() {
        let newIndex = currentSlide - 1;
        if (newIndex < 0) {
            newIndex = slides.length - 1;
        }
        showSlide(newIndex);
    }

    function startSlideInterval() {
        slideInterval = setInterval(nextSlide, 5000);
    }

    function stopSlideInterval() {
        clearInterval(slideInterval);
    }

    nextBtn.addEventListener('click', function() {
        stopSlideInterval();
        nextSlide();
        startSlideInterval();
    });

    prevBtn.addEventListener('click', function() {
        stopSlideInterval();
        prevSlide();
        startSlideInterval();
    });

    dots.forEach(function(dot, index) {
        dot.addEventListener('click', function() {
            stopSlideInterval();
            showSlide(index);
            startSlideInterval();
        });
    });

    document.querySelector('.hero').addEventListener('mouseenter', stopSlideInterval);
    document.querySelector('.hero').addEventListener('mouseleave', startSlideInterval);

    startSlideInterval();

    const filterBtns = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');

    filterBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            filterBtns.forEach(function(b) {
                b.classList.remove('active');
            });
            this.classList.add('active');
            
            const category = this.getAttribute('data-category');
            
            productCards.forEach(function(card) {
                if (category === 'all' || card.getAttribute('data-category') === category) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    const contactForm = document.getElementById('contactForm');
    const formSuccess = document.getElementById('formSuccess');

    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const message = document.getElementById('message').value;
        
        if (!name || !phone || !message) {
            alert(currentLang === 'zh' ? '请填写必填项' : 'Please fill required fields');
            return;
        }

        formSuccess.classList.add('show');
        contactForm.reset();
        
        setTimeout(function() {
            formSuccess.classList.remove('show');
        }, 5000);
    });

    const quickForm = document.getElementById('quickForm');
    const quickSuccess = document.getElementById('quickSuccess');

    quickForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('quickName').value;
        const phone = document.getElementById('quickPhone').value;
        
        if (!name || !phone) {
            alert(currentLang === 'zh' ? '请填写姓名和电话' : 'Please fill name and phone');
            return;
        }

        quickSuccess.classList.add('show');
        quickForm.reset();
        
        setTimeout(function() {
            quickSuccess.classList.remove('show');
        }, 3000);
    });

    const modalOverlay = document.getElementById('productModal');
    const closeModalBtn = document.getElementById('closeModal');
    const detailBtns = document.querySelectorAll('.detail-btn');

    const modalTitle = document.getElementById('modalTitle');
    const productName = document.getElementById('productName');
    const productPrice = document.getElementById('productPrice');
    const specModel = document.getElementById('specModel');
    const specLoad = document.getElementById('specLoad');
    const specLength = document.getElementById('specLength');
    const specWidth = document.getElementById('specWidth');
    const specHeight = document.getElementById('specHeight');
    const specWheelbase = document.getElementById('specWheelbase');
    const specTire = document.getElementById('specTire');
    const specTireCount = document.getElementById('specTireCount');
    const specTotalMass = document.getElementById('specTotalMass');
    const specCurbMass = document.getElementById('specCurbMass');
    const specMaterial = document.getElementById('specMaterial');
    const specApplication = document.getElementById('specApplication');
    const specCertification = document.getElementById('specCertification');
    const productDescription = document.getElementById('productDescription');
    const feature1 = document.getElementById('feature1');
    const feature2 = document.getElementById('feature2');
    const feature3 = document.getElementById('feature3');
    const feature4 = document.getElementById('feature4');

    detailBtns.forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const productId = this.getAttribute('data-product-id');
            const product = productsData[productId];
            
            if (product) {
                productName.textContent = currentLang === 'zh' ? product.name_zh : product.name_en;
                productPrice.textContent = product.price;
                
                specModel.textContent = product.specs.model;
                specLoad.textContent = product.specs.load;
                specLength.textContent = product.specs.length;
                specWidth.textContent = product.specs.width;
                specHeight.textContent = product.specs.height;
                specWheelbase.textContent = product.specs.wheelbase;
                specTire.textContent = product.specs.tire;
                specTireCount.textContent = product.specs.tireCount;
                specTotalMass.textContent = product.specs.totalMass;
                specCurbMass.textContent = product.specs.curbMass;
                specMaterial.textContent = product.specs.material;
                specApplication.textContent = product.specs.application;
                specCertification.textContent = product.specs.certification;
                
                productDescription.textContent = currentLang === 'zh' ? product.description_zh : product.description_en;
                
                feature1.textContent = currentLang === 'zh' ? product.features.f1_zh : product.features.f1_en;
                feature2.textContent = currentLang === 'zh' ? product.features.f2_zh : product.features.f2_en;
                feature3.textContent = currentLang === 'zh' ? product.features.f3_zh : product.features.f3_en;
                feature4.textContent = currentLang === 'zh' ? product.features.f4_zh : product.features.f4_en;
            }
            
            modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    function closeModal() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    closeModalBtn.addEventListener('click', closeModal);

    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
            closeModal();
        }
    });

    const mediaTabs = document.querySelectorAll('.media-tab');
    const mediaImages = document.getElementById('mediaImages');
    const mediaVideo = document.getElementById('mediaVideo');

    mediaTabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            mediaTabs.forEach(function(t) {
                t.classList.remove('active');
            });
            this.classList.add('active');
            
            const tabType = this.getAttribute('data-tab');
            if (tabType === 'images') {
                mediaImages.classList.add('active');
                mediaVideo.classList.remove('active');
            } else {
                mediaImages.classList.remove('active');
                mediaVideo.classList.add('active');
            }
        });
    });

    const thumbItems = document.querySelectorAll('.thumb-item');
    
    thumbItems.forEach(function(item) {
        item.addEventListener('click', function() {
            thumbItems.forEach(function(t) {
                t.classList.remove('active');
            });
            this.classList.add('active');
        });
    });
});