/**
 * game-reviews.js
 * Quản lý giao diện phần đánh giá trong trang Game Details và kết nối API.
 */

(function () {
  'use strict';

  /* =============================================
     HELPERS & STATE
     ============================================= */

  let reviews = [];
  const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get("id");

  function renderStars(container, score) {
    container.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const icon = document.createElement('i');
      icon.className = i <= Math.round(score) ? 'bx bxs-star' : 'bx bx-star';
      container.appendChild(icon);
    }
  }

  function getInitial(name) {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN');
  }

  /* =============================================
     CÁC PHẦN TỬ DOM
     ============================================= */
  const starDisplay       = document.getElementById('star-display');
  const avgScoreEl        = document.getElementById('avg-score');
  const reviewCountLabel  = document.getElementById('review-count-label');
  const commentsCountLbl  = document.getElementById('comments-count-label');
  const commentsList      = document.getElementById('comments-list');
  const commentsEmpty     = document.getElementById('comments-empty');

  const btnOpenModal      = document.getElementById('btn-open-review-modal');
  const btnEditReview     = document.getElementById('btn-edit-review');
  const reviewModal       = document.getElementById('review-modal');
  const reviewModalOverlay= document.getElementById('review-modal-overlay');
  const closReviewModal   = document.getElementById('close-review-modal');
  const cancelReviewBtn   = document.getElementById('cancel-review-btn');
  const reviewForm        = document.getElementById('review-form');
  const reviewModalTitle  = document.getElementById('review-modal-title');
  const submitReviewBtn   = document.getElementById('submit-review-btn');

  const starPicker        = document.getElementById('star-picker');
  const ratingValueInput  = document.getElementById('review-rating-value');
  const reviewCommentEl   = document.getElementById('review-comment');

  /* =============================================
     ĐỒNG BỘ ẢNH THUMBNAIL
     ============================================= */
  function syncThumbnail() {
    const reviewThumb = document.getElementById('review-game-thumb');
    const mainCover   = document.getElementById('gd-cover-img');
    if (reviewThumb && mainCover && mainCover.src) {
      if (mainCover.complete) {
        reviewThumb.src = mainCover.src;
      } else {
        mainCover.addEventListener('load', () => {
          reviewThumb.src = mainCover.src;
        }, { once: true });
      }
    }
  }

  const contentState = document.getElementById('game-content-state');
  if (contentState) {
    const observer = new MutationObserver(() => {
      if (contentState.style.display !== 'none') {
        setTimeout(syncThumbnail, 300);
      }
    });
    observer.observe(contentState, { attributes: true, attributeFilter: ['style'] });
  }

  /* =============================================
     RENDER RATING SUMMARY
     ============================================= */
  function updateRatingSummary() {
    const total = reviews.length;
    const avg   = total > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
      : 0;

    avgScoreEl.textContent      = avg.toFixed(1);
    reviewCountLabel.textContent = `${total} Reviews`;
    commentsCountLbl.textContent = `${total} Comments`;

    renderStars(starDisplay, avg);
  }

  /* =============================================
     RENDER REVIEW CARDS & BUTTONS
     ============================================= */
  function renderReviews() {
    const oldCards = commentsList.querySelectorAll('.review-card');
    oldCards.forEach(c => c.remove());

    if (reviews.length === 0) {
      commentsEmpty.style.display = 'flex';
      return;
    }

    commentsEmpty.style.display = 'none';

    reviews.forEach(review => {
      const card = document.createElement('div');
      card.className = 'review-card';
      // Fallback ID if missing
      card.dataset.id = review.id || review.review_id;

      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
        starsHtml += `<i class="bx ${i <= review.rating ? 'bxs-star' : 'bx-star'}"></i>`;
      }

      const reviewDate = review.created_at || review.createdAt || new Date().toISOString();
      const userName = review.username || review.display_name || 'Người dùng';

      card.innerHTML = `
        <div class="review-avatar">${getInitial(userName)}</div>
        <div class="review-body">
          <div class="review-body__header">
            <span class="review-username">${userName}</span>
            <div class="review-stars">${starsHtml}</div>
            <span class="review-date">${formatDate(reviewDate)}</span>
          </div>
          <p class="review-comment-text">${review.comment}</p>
        </div>
      `;

      commentsList.appendChild(card);
    });
  }

  function updateButtons() {
    if (!currentUser) {
      btnEditReview.style.display = 'none';
      return;
    }
    // Check if current user has already reviewed
    const myReview = reviews.find(r => r.user_id === currentUser.user_id || r.user_id === currentUser.id);
    if (myReview) {
      btnOpenModal.style.display = 'none'; // Đã viết rồi thì ẩn nút viết
      btnEditReview.style.display = 'inline-flex'; // Hiện nút sửa
    } else {
      btnOpenModal.style.display = 'inline-flex';
      btnEditReview.style.display = 'none';
    }
  }

  /* =============================================
     API FETCH REVIEWS
     ============================================= */
  async function fetchReviews() {
    if (!gameId) return;
    try {
      const res = await fetch(`http://localhost:5000/api/reviews/${gameId}`);
      const result = await res.json();
      if (result.success) {
        reviews = result.data || [];
        updateRatingSummary();
        renderReviews();
        updateButtons();
      }
    } catch (e) {
      console.error("Lỗi khi tải đánh giá:", e);
    }
  }

  /* =============================================
     STAR PICKER – INTERACTIVE
     ============================================= */
  let selectedRating = 0;

  function updateStarPicker(value) {
    const stars = starPicker.querySelectorAll('.star-pick');
    stars.forEach(star => {
      const v = parseInt(star.dataset.value, 10);
      if (v <= value) {
        star.classList.add('active');
        star.className = star.className.replace('bx-star', 'bxs-star');
      } else {
        star.classList.remove('active');
        star.className = star.className.replace('bxs-star', 'bx-star');
      }
    });
    ratingValueInput.value = value;
    selectedRating = value;
  }

  starPicker.querySelectorAll('.star-pick').forEach(star => {
    star.addEventListener('mouseenter', () => updateStarPicker(parseInt(star.dataset.value, 10)));
    star.addEventListener('mouseleave', () => updateStarPicker(selectedRating));
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.value, 10);
      updateStarPicker(selectedRating);
    });
  });

  /* =============================================
     MODAL – MỞ / ĐÓNG
     ============================================= */
  function openModal(mode = 'create', existingReview = null) {
    if (!currentUser) {
      alert("Bạn cần đăng nhập để đánh giá!");
      return;
    }

    reviewModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (mode === 'edit' && existingReview) {
      reviewModalTitle.textContent = 'Chỉnh sửa đánh giá';
      submitReviewBtn.textContent  = 'Lưu thay đổi';
      reviewCommentEl.value        = existingReview.comment;
      selectedRating               = existingReview.rating;
      updateStarPicker(selectedRating);
    } else {
      reviewModalTitle.textContent = 'Viết đánh giá';
      submitReviewBtn.textContent  = 'Gửi đánh giá';
      reviewCommentEl.value        = '';
      selectedRating               = 0;
      updateStarPicker(0);
    }
  }

  function closeModal() {
    reviewModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  btnOpenModal.addEventListener('click', () => openModal('create'));
  btnEditReview.addEventListener('click', () => {
    const myReview = reviews.find(r => r.user_id === currentUser.user_id || r.user_id === currentUser.id);
    if (myReview) openModal('edit', myReview);
  });

  closReviewModal.addEventListener('click', closeModal);
  cancelReviewBtn.addEventListener('click', closeModal);
  reviewModalOverlay.addEventListener('click', closeModal);

  /* =============================================
     SUBMIT REVIEW (GỌI API)
     ============================================= */
  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert('Vui lòng đăng nhập để đánh giá!');
      return;
    }

    const rating  = parseInt(ratingValueInput.value, 10);
    const comment = reviewCommentEl.value.trim();

    if (rating === 0) {
      alert('Vui lòng chọn số sao đánh giá!');
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại!");
      return;
    }

    const isEditing = reviewModalTitle.textContent.includes('Chỉnh sửa');
    const method = isEditing ? 'PUT' : 'POST';

    // Thay đổi UI lúc submit
    submitReviewBtn.textContent = 'Đang xử lý...';
    submitReviewBtn.disabled = true;

    try {
      const response = await fetch(`http://localhost:5000/api/reviews/${gameId}`, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment })
      });

      const result = await response.json();
      if (result.success) {
        closeModal();
        await fetchReviews(); // Tải lại danh sách từ server
      } else {
        alert(result.message || 'Có lỗi xảy ra!');
      }
    } catch (err) {
      console.error("Lỗi khi lưu đánh giá:", err);
      alert('Có lỗi xảy ra khi gửi đánh giá!');
    } finally {
      submitReviewBtn.disabled = false;
      submitReviewBtn.textContent = isEditing ? 'Lưu thay đổi' : 'Gửi đánh giá';
    }
  });

  /* =============================================
     KHỞI TẠO
     ============================================= */
  if (gameId) {
    fetchReviews();
  }

})();
