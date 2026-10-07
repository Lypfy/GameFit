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
  function getActiveUser() {
    return typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  }
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
    return name && name.trim() ? name.trim().charAt(0).toUpperCase() : 'U';
  }

  function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN');
  }

  /* =============================================
     CÁC PHẦN TỬ DOM
     ============================================= */
  const starDisplay = document.getElementById('star-display');
  const avgScoreEl = document.getElementById('avg-score');
  const reviewCountLabel = document.getElementById('review-count-label');
  const commentsCountLbl = document.getElementById('comments-count-label');
  const commentsList = document.getElementById('comments-list');
  const commentsEmpty = document.getElementById('comments-empty');

  const btnAiSummarize = document.getElementById('btn-ai-summarize');
  const aiSummaryBox = document.getElementById('ai-review-summary');

  const btnOpenModal = document.getElementById('btn-open-review-modal');
  const reviewModal = document.getElementById('review-modal');
  const reviewModalOverlay = document.getElementById('review-modal-overlay');
  const closReviewModal = document.getElementById('close-review-modal');
  const cancelReviewBtn = document.getElementById('cancel-review-btn');
  const reviewForm = document.getElementById('review-form');
  const reviewModalTitle = document.getElementById('review-modal-title');
  const submitReviewBtn = document.getElementById('submit-review-btn');

  const reportModal = document.getElementById('report-modal');
  const reportModalOverlay = document.getElementById('report-modal-overlay');
  const closeReportModal = document.getElementById('close-report-modal');
  const cancelReportBtn = document.getElementById('cancel-report-btn');
  const reportForm = document.getElementById('report-form');
  const reportTargetUser = document.getElementById('report-target-user');
  const reportReviewIdInput = document.getElementById('report-review-id');
  const reportDetailInput = document.getElementById('report-detail');

  const confirmDeleteModal = document.getElementById('confirm-delete-modal');
  const confirmDeleteOverlay = document.getElementById('confirm-delete-overlay');
  const closeConfirmDeleteBtn = document.getElementById('close-confirm-delete-modal');
  const cancelConfirmDeleteBtn = document.getElementById('cancel-confirm-delete-btn');
  const submitConfirmDeleteBtn = document.getElementById('submit-confirm-delete-btn');
  const confirmDeleteTitle = document.getElementById('confirm-delete-title');
  const confirmDeleteMessage = document.getElementById('confirm-delete-message');

  const starPicker = document.getElementById('star-picker');
  const ratingValueInput = document.getElementById('review-rating-value');
  const reviewCommentEl = document.getElementById('review-comment');

  /* =============================================
     ĐỒNG BỘ ẢNH THUMBNAIL
     ============================================= */
  function syncThumbnail() {
    const reviewThumb = document.getElementById('review-game-thumb');
    const mainCover = document.getElementById('gd-cover-img');
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
    const avg = total > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
      : 0;

    avgScoreEl.textContent = avg.toFixed(1);
    const reviewText = `${total} ${total === 1 ? 'Review' : 'Reviews'}`;
    if (reviewCountLabel) reviewCountLabel.textContent = reviewText;
    if (commentsCountLbl) commentsCountLbl.textContent = reviewText;

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
      if (btnAiSummarize) btnAiSummarize.style.display = 'none';
      if (aiSummaryBox) aiSummaryBox.style.display = 'none';
      return;
    }

    commentsEmpty.style.display = 'none';
    if (btnAiSummarize) btnAiSummarize.style.display = 'inline-flex';

    const activeUser = getActiveUser();

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
      const isMyReview = Boolean(activeUser && (
        review.user_id === activeUser.user_id ||
        review.user_id === activeUser.id
      ));

      const userName =
        (isMyReview ? (activeUser.user_name || activeUser.username) : null) ||
        review.user_name ||
        review.username ||
        'Người dùng';

      card.innerHTML = `
        <div class="review-avatar">${getInitial(userName)}</div>
        <div class="review-body">
          <div class="review-body__header">
            <span class="review-username">${userName}</span>
            <div class="review-stars">${starsHtml}</div>
            <span class="review-dot">•</span>
            <span class="review-date">${formatDate(reviewDate)}</span>
            ${isMyReview ? `
              <div class="review-actions">
                <button type="button" class="btn-edit-comment" title="Chỉnh sửa đánh giá của bạn">
                  <i class="bx bx-edit-alt"></i>
                  <span>Chỉnh sửa</span>
                </button>
                <button type="button" class="btn-delete-comment" title="Xóa đánh giá của bạn">
                  <i class="bx bx-trash"></i>
                  <span>Xóa</span>
                </button>
              </div>
            ` : `
              <button type="button" class="btn-report-comment" title="Báo cáo bình luận vi phạm">
                <i class="bx bx-flag"></i>
                <span>Báo cáo</span>
              </button>
            `}
          </div>
          <p class="review-comment-text">${review.comment}</p>
        </div>
      `;

      if (isMyReview) {
        const editBtn = card.querySelector('.btn-edit-comment');
        if (editBtn) {
          editBtn.addEventListener('click', () => {
            openModal('edit', review);
          });
        }
        const deleteBtn = card.querySelector('.btn-delete-comment');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', () => {
            promptDeleteMyReview();
          });
        }
      } else {
        const reportBtn = card.querySelector('.btn-report-comment');
        if (reportBtn) {
          reportBtn.addEventListener('click', () => {
            openReportModal(review, userName);
          });
        }
      }

      commentsList.appendChild(card);
    });
  }

  function updateButtons() {
    if (!btnOpenModal) return;
    const activeUser = getActiveUser();
    if (!activeUser) {
      btnOpenModal.style.display = 'inline-flex';
      return;
    }
    // Check if current user has already reviewed
    const myReview = reviews.find(r => r.user_id === activeUser.user_id || r.user_id === activeUser.id);
    if (myReview) {
      btnOpenModal.style.display = 'none'; // Đã viết rồi thì ẩn nút viết ở card trên
    } else {
      btnOpenModal.style.display = 'inline-flex';
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
     AI SUMMARIZE
     ============================================= */
  if (btnAiSummarize) {
      btnAiSummarize.addEventListener('click', async () => {
          const originalText = btnAiSummarize.innerHTML;
          btnAiSummarize.innerHTML = `<i class="bx bx-loader-alt bx-spin"></i> Đang tóm tắt...`;
          btnAiSummarize.disabled = true;
          aiSummaryBox.style.display = 'none';
          
          try {
              const res = await fetch('/api/ai/summarize-reviews', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ reviews: reviews })
              });
              const result = await res.json();
              if (result.success) {
                  aiSummaryBox.style.display = 'block';
                  aiSummaryBox.innerHTML = `<strong><i class='bx bxs-bot'></i> AI Tóm Tắt Đánh Giá:</strong><br/>${result.summary}`;
              } else {
                  if (typeof showToast === 'function') showToast(result.message || 'Lỗi AI', 'error');
              }
          } catch(e) {
              if (typeof showToast === 'function') showToast('Lỗi kết nối AI', 'error');
          } finally {
              btnAiSummarize.innerHTML = originalText;
              btnAiSummarize.disabled = false;
          }
      });
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
    const activeUser = getActiveUser();
    if (!activeUser) {
      if (typeof showToast === 'function') {
        showToast('Bạn cần đăng nhập để đánh giá!', 'error');
      } else {
        alert('Bạn cần đăng nhập để đánh giá!');
      }
      return;
    }

    reviewModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (mode === 'edit' && existingReview) {
      reviewModalTitle.textContent = 'Chỉnh sửa đánh giá';
      submitReviewBtn.textContent = 'Lưu thay đổi';
      reviewCommentEl.value = existingReview.comment;
      selectedRating = existingReview.rating;
      updateStarPicker(selectedRating);
    } else {
      reviewModalTitle.textContent = 'Viết đánh giá';
      submitReviewBtn.textContent = 'Gửi đánh giá';
      reviewCommentEl.value = '';
      selectedRating = 0;
      updateStarPicker(0);
    }
  }

  function closeModal() {
    reviewModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (btnOpenModal) {
    btnOpenModal.addEventListener('click', () => openModal('create'));
  }

  closReviewModal.addEventListener('click', closeModal);
  cancelReviewBtn.addEventListener('click', closeModal);
  reviewModalOverlay.addEventListener('click', closeModal);

  /* =============================================
     CONFIRM DELETE MODAL – MỞ / ĐÓNG / DÙNG CHUNG
     ============================================= */
  function openConfirmDeleteModal(title, message, onConfirm) {
    if (confirmDeleteTitle && title) confirmDeleteTitle.textContent = title;
    if (confirmDeleteMessage && message) confirmDeleteMessage.textContent = message;

    if (confirmDeleteModal) {
      confirmDeleteModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    if (submitConfirmDeleteBtn) {
      submitConfirmDeleteBtn.onclick = async () => {
        hideConfirmDeleteModal();
        if (typeof onConfirm === 'function') {
          await onConfirm();
        }
      };
    }
  }

  function hideConfirmDeleteModal() {
    if (confirmDeleteModal) {
      confirmDeleteModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  if (closeConfirmDeleteBtn) closeConfirmDeleteBtn.addEventListener('click', hideConfirmDeleteModal);
  if (cancelConfirmDeleteBtn) cancelConfirmDeleteBtn.addEventListener('click', hideConfirmDeleteModal);
  if (confirmDeleteOverlay) confirmDeleteOverlay.addEventListener('click', hideConfirmDeleteModal);

  /* =============================================
     XÓA ĐÁNH GIÁ CỦA CHÍNH MÌNH (API)
     ============================================= */
  function promptDeleteMyReview() {
    const activeUser = getActiveUser();
    if (!activeUser) {
      if (typeof showToast === 'function') {
        showToast('Vui lòng đăng nhập để thực hiện!', 'error');
      } else {
        alert('Vui lòng đăng nhập để thực hiện!');
      }
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại!");
      return;
    }

    openConfirmDeleteModal(
      'Xác nhận xóa đánh giá',
      'Bạn có chắc chắn muốn xóa đánh giá của mình không? Thao tác này không thể hoàn tác.',
      async () => {
        try {
          const response = await fetch(`http://localhost:5000/api/reviews/${gameId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          const result = await response.json();
          if (result.success) {
            if (typeof showToast === 'function') {
              showToast('Đã xóa đánh giá thành công!', 'delete');
            } else {
              alert('Đã xóa đánh giá thành công!');
            }
            await fetchReviews();
          } else {
            alert(result.message || 'Xóa đánh giá thất bại!');
          }
        } catch (err) {
          console.error("Lỗi khi xóa đánh giá:", err);
          alert('Có lỗi xảy ra khi xóa đánh giá!');
        }
      }
    );
  }

  /* =============================================
     REPORT MODAL – MỞ / ĐÓNG / GỬI
     ============================================= */
  function openReportModal(review, userName) {
    const activeUser = getActiveUser();
    if (!activeUser) {
      if (typeof showToast === 'function') {
        showToast('Vui lòng đăng nhập để báo cáo bình luận!', 'error');
      } else {
        alert('Vui lòng đăng nhập để báo cáo bình luận!');
      }
      return;
    }

    if (reportTargetUser) reportTargetUser.textContent = userName;
    if (reportReviewIdInput) reportReviewIdInput.value = review.id || review.review_id || '';
    if (reportDetailInput) reportDetailInput.value = '';

    if (reportModal) {
      const defaultRadio = reportModal.querySelector('input[name="report-reason"][value="Ngôn từ xúc phạm, thù hận"]');
      if (defaultRadio) defaultRadio.checked = true;

      reportModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeReportModalFunc() {
    if (reportModal) {
      reportModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  if (closeReportModal) closeReportModal.addEventListener('click', closeReportModalFunc);
  if (cancelReportBtn) cancelReportBtn.addEventListener('click', closeReportModalFunc);
  if (reportModalOverlay) reportModalOverlay.addEventListener('click', closeReportModalFunc);

  if (reportForm) {
    reportForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const activeUser = getActiveUser();
      if (!activeUser) {
        if (typeof showToast === 'function') {
          showToast('Vui lòng đăng nhập để báo cáo bình luận!', 'error');
        } else {
          alert('Vui lòng đăng nhập để báo cáo bình luận!');
        }
        return;
      }

      const reviewId = reportReviewIdInput?.value;
      if (!reviewId) {
        if (typeof showToast === 'function') {
          showToast('Không tìm thấy thông tin đánh giá cần báo cáo!', 'error');
        }
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        if (typeof showToast === 'function') {
          showToast('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!', 'error');
        }
        return;
      }

      const selectedReason = reportForm.querySelector('input[name="report-reason"]:checked')?.value || 'Lý do khác';
      const detailText = reportDetailInput?.value?.trim();
      const finalReason = detailText ? `${selectedReason} - ${detailText}` : selectedReason;

      const submitBtn = reportForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang gửi...';
      }

      try {
        const res = await fetch(`/api/reviews/report/${reviewId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ report_reason: finalReason })
        });
        const result = await res.json();

        if (result.success) {
          closeReportModalFunc();
          if (typeof showToast === 'function') {
            showToast('Đã gửi báo cáo vi phạm thành công!', 'success');
          } else {
            alert('Đã gửi báo cáo vi phạm tới Ban quản trị!');
          }
        } else {
          if (typeof showToast === 'function') {
            showToast(result.message || 'Lỗi khi gửi báo cáo!', 'error');
          } else {
            alert(result.message || 'Lỗi khi gửi báo cáo!');
          }
        }
      } catch (err) {
        console.error('Lỗi khi gửi báo cáo:', err);
        if (typeof showToast === 'function') {
          showToast('Lỗi kết nối máy chủ khi gửi báo cáo!', 'error');
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Gửi báo cáo';
        }
      }
    });
  }

  /* =============================================
     SUBMIT REVIEW (GỌI API)
     ============================================= */
  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const activeUser = getActiveUser();
    if (!activeUser) {
      if (typeof showToast === 'function') {
        showToast('Bạn cần đăng nhập để đánh giá!', 'error');
      } else {
        alert('Bạn cần đăng nhập để đánh giá!');
      }
      return;
    }

    const rating = parseInt(ratingValueInput.value, 10);
    const comment = reviewCommentEl.value.trim();

    if (rating === 0) {
      if (typeof showToast === 'function') {
        showToast('Vui lòng chọn số sao đánh giá!', 'error');
      } else {
        alert('Vui lòng chọn số sao đánh giá!');
      }
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      if (typeof showToast === 'function') {
        showToast('Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại!', 'error');
      } else {
        alert('Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại!');
      }
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
        if (typeof showToast === 'function') {
          showToast(isEditing ? 'Cập nhật đánh giá thành công!' : 'Đã gửi đánh giá thành công!', 'success');
        }
        await fetchReviews(); // Tải lại danh sách từ server
      } else {
        if (typeof showToast === 'function') {
          showToast(result.message || 'Có lỗi xảy ra!', 'error');
        } else {
          alert(result.message || 'Có lỗi xảy ra!');
        }
      }
    } catch (err) {
      console.error("Lỗi khi lưu đánh giá:", err);
      if (typeof showToast === 'function') {
        showToast('Có lỗi xảy ra khi gửi đánh giá!', 'error');
      } else {
        alert('Có lỗi xảy ra khi gửi đánh giá!');
      }
    } finally {
      submitReviewBtn.disabled = false;
      submitReviewBtn.textContent = isEditing ? 'Lưu thay đổi' : 'Gửi đánh giá';
    }
  });

  /* =============================================
     KHỞI TẠO & LẮNG NGHE SỰ KIỆN
     ============================================= */
  window.addEventListener('userProfileUpdated', () => {
    renderReviews();
    updateButtons();
  });

  if (gameId) {
    fetchReviews();
    fetchRecommendations();
  }

  /* =============================================
     PC RECOMMENDATION LOGIC
     ============================================= */
  const btnOpenRecommend = document.getElementById('btn-open-recommend-modal');
  const recommendModal = document.getElementById('recommend-modal');
  const recommendOverlay = document.getElementById('recommend-modal-overlay');
  const closeRecommendModal = document.getElementById('close-recommend-modal');
  const cancelRecommendBtn = document.getElementById('cancel-recommend-btn');
  const recommendForm = document.getElementById('recommend-form');
  const recommendPcSelect = document.getElementById('recommend-pc-select');
  const recommendTypeSelect = document.getElementById('recommend-type-select');
  const recommendNote = document.getElementById('recommend-note');
  const submitRecommendBtn = document.getElementById('submit-recommend-btn');
  const pcRecommendList = document.getElementById('pc-recommend-list');

  async function fetchUserPCs() {
    const token = localStorage.getItem("token");
    if (!token) return [];
    try {
      const res = await fetch('/api/computer-config', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      return result.success ? result.data : [];
    } catch (e) {
      console.error("Lỗi lấy danh sách PC:", e);
      return [];
    }
  }

  function openRecommendModalFunc() {
    const activeUser = getActiveUser();
    if (!activeUser) {
      if (typeof showToast === 'function') {
        showToast('Bạn cần đăng nhập để đề xuất cấu hình!', 'error');
      } else {
        alert('Bạn cần đăng nhập để đề xuất cấu hình!');
      }
      return;
    }

    // Tải danh sách PC
    if (recommendPcSelect) recommendPcSelect.innerHTML = '<option value="">-- Đang tải... --</option>';
    fetchUserPCs().then(pcs => {
      if (recommendPcSelect) {
        if (pcs.length === 0) {
          recommendPcSelect.innerHTML = '<option value="">Bạn chưa thêm máy tính nào. Vui lòng thêm trong hồ sơ.</option>';
        } else {
          recommendPcSelect.innerHTML = '<option value="">-- Chọn máy tính --</option>' + pcs.map(pc => 
            `<option value="${pc.pc_id}">${pc.pc_name} - ${pc.cpu_name || 'CPU N/A'}, ${pc.gpu_name || 'GPU N/A'}, RAM ${pc.ram}GB</option>`
          ).join('');
        }
      }
    });

    if (recommendNote) recommendNote.value = '';
    if (recommendTypeSelect) recommendTypeSelect.value = 'MINIMUM';

    if (recommendModal) {
      recommendModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeRecommendModalFunc() {
    if (recommendModal) {
      recommendModal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  if (btnOpenRecommend) btnOpenRecommend.addEventListener('click', openRecommendModalFunc);
  if (closeRecommendModal) closeRecommendModal.addEventListener('click', closeRecommendModalFunc);
  if (cancelRecommendBtn) cancelRecommendBtn.addEventListener('click', closeRecommendModalFunc);
  if (recommendOverlay) recommendOverlay.addEventListener('click', closeRecommendModalFunc);

  if (recommendForm) {
    recommendForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pcId = recommendPcSelect.value;
      if (!pcId) {
        if (typeof showToast === 'function') showToast('Vui lòng chọn một máy tính!', 'error');
        return;
      }
      
      const token = localStorage.getItem("token");
      if (submitRecommendBtn) {
        submitRecommendBtn.disabled = true;
        submitRecommendBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Đang gửi...';
      }

      try {
        const response = await fetch(`http://localhost:5000/api/reviews/recommendation/${gameId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            pc_id: pcId,
            type: recommendTypeSelect.value,
            note: recommendNote.value
          })
        });
        const result = await response.json();
        if (result.success) {
          if (typeof showToast === 'function') showToast('Đã đăng đề xuất thành công!', 'success');
          closeRecommendModalFunc();
          fetchRecommendations(); // Tải lại danh sách
        } else {
          if (typeof showToast === 'function') showToast(result.message || 'Có lỗi xảy ra!', 'error');
        }
      } catch (err) {
        if (typeof showToast === 'function') showToast('Lỗi kết nối!', 'error');
      } finally {
        if (submitRecommendBtn) {
          submitRecommendBtn.disabled = false;
          submitRecommendBtn.innerHTML = '<i class="bx bx-share"></i> Đăng đề xuất';
        }
      }
    });
  }

  async function fetchRecommendations() {
    if (!gameId || !pcRecommendList) return;
    try {
      const res = await fetch(`http://localhost:5000/api/reviews/recommendation/${gameId}`);
      const result = await res.json();
      if (result.success && result.data && result.data.length > 0) {
        renderRecommendations(result.data);
      } else {
        pcRecommendList.innerHTML = `
          <div class="comments-empty">
            <i class="bx bx-desktop empty-chat-icon"></i>
            <p>Chưa có cấu hình nào được đề xuất. Hãy là người đầu tiên!</p>
          </div>
        `;
      }
    } catch (e) {
      console.error('Lỗi tải đề xuất cấu hình:', e);
    }
  }

  window.deleteRecommendation = async function(recId) {
    const token = localStorage.getItem('token');
    if (!token) return;
    openConfirmDeleteModal(
      'Xác nhận xóa đề xuất',
      'Bạn có chắc chắn muốn xóa đề xuất này không?',
      async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/reviews/recommendation/${recId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const result = await res.json();
          if (result.success) {
            if (typeof showToast === 'function') showToast('Đã xóa đề xuất thành công', 'success');
            fetchRecommendations();
          } else {
            if (typeof showToast === 'function') showToast(result.message, 'error');
          }
        } catch(e) {}
      }
    );
  };

  window.vote = async function(targetType, targetId, voteType) {
    const token = localStorage.getItem('token');
    if (!token) {
      if (typeof showToast === 'function') showToast('Vui lòng đăng nhập để đánh giá', 'error');
      else alert('Vui lòng đăng nhập để đánh giá');
      return;
    }
    
    try {
      const res = await fetch('http://localhost:5000/api/reviews/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ target_type: targetType, target_id: targetId, vote_type: voteType })
      });
      const result = await res.json();
      if (result.success) {
        if (targetType === 'RECOMMENDATION') {
            fetchRecommendations();
        } else {
            fetchReviews();
        }
      } else {
        if (typeof showToast === 'function') showToast(result.message, 'error');
      }
    } catch (e) {
      console.error('Lỗi khi vote:', e);
    }
  };

  window.vote = async function(targetType, targetId, voteType) {
    const token = localStorage.getItem('token');
    if (!token) {
      if (typeof showToast === 'function') showToast('Vui lòng đăng nhập để đánh giá', 'error');
      else alert('Vui lòng đăng nhập để đánh giá');
      return;
    }
    
    try {
      const res = await fetch('http://localhost:5000/api/reviews/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ target_type: targetType, target_id: targetId, vote_type: voteType })
      });
      const result = await res.json();
      if (result.success) {
        if (targetType === 'RECOMMENDATION') {
            fetchRecommendations();
        } else {
            fetchReviews();
        }
      } else {
        if (typeof showToast === 'function') showToast(result.message, 'error');
      }
    } catch (e) {
      console.error('Lỗi khi vote:', e);
    }
  };

  function renderRecommendations(list) {
    const activeUser = getActiveUser();
    pcRecommendList.innerHTML = list.map(rec => {
      const isMyRec = activeUser && (rec.user_id === activeUser.user_id || rec.user_id === activeUser.id);
      
      let typeLabel = 'Khác';
      let badgeColor = '#3b82f6'; // default
      if (rec.type === 'MINIMUM') {
        typeLabel = 'Tối thiểu';
        badgeColor = '#3b82f6';
      } else if (rec.type === 'RECOMMENDED') {
        typeLabel = 'Đề nghị';
        badgeColor = '#10b981';
      }
      
      let userVote = 0;
      if (activeUser && rec.voters) {
        const myVote = rec.voters.find(v => v.user_id === activeUser.user_id || v.user_id === activeUser.id);
        if (myVote) userVote = myVote.vote_type;
      }
      
      return `
        <div class="review-card">
          <div class="review-avatar">${getInitial(rec.user_name || rec.username)}</div>
          <div class="review-body" style="width: 100%;">
            <div class="review-body__header" style="justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span class="review-username">${rec.user_name || rec.username || 'Người dùng'}</span>
                <span class="review-dot">•</span>
                <span class="review-date">${formatDate(rec.created_at || rec.createdAt || new Date())}</span>
              </div>
              ${isMyRec ? `<button type="button" class="btn-delete-comment" onclick="deleteRecommendation(${rec.id || rec.recommendation_id})" title="Xóa đề xuất">
                <i class="bx bx-trash"></i>
              </button>` : ''}
            </div>
            
            <div style="margin-top: 10px; padding: 12px; background: #0f172a; border-radius: 8px; border: 1px solid #1e293b;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="background: ${badgeColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                  ${typeLabel}
                </span>
                <strong style="color: #f8fafc; font-size: 15px;">${rec.pc_name || 'Máy tính của ' + (rec.user_name || rec.username)}</strong>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; color: #94a3b8; margin-bottom: ${rec.note ? '10px' : '0'};">
                <div><i class="bx bx-chip"></i> CPU: ${rec.cpu_name || 'N/A'}</div>
                <div><i class="bx bx-microchip"></i> GPU: ${rec.gpu_name || 'N/A'}</div>
                <div><i class="bx bx-memory-card"></i> RAM: ${rec.ram ? rec.ram + ' GB' : 'N/A'}</div>
                <div><i class="bx bx-hdd"></i> Storage: ${rec.storage ? rec.storage + ' GB' : 'N/A'}</div>
              </div>
              ${rec.note ? `<div style="padding-top: 10px; border-top: 1px solid #1e293b; color: #cbd5e1; font-size: 14px; font-style: italic;">
                "${rec.note}"
              </div>` : ''}
              
              <div class="vote-actions" style="display: flex; gap: 12px; margin-top: 12px; border-top: 1px solid #1e293b; padding-top: 12px;">
                <button type="button" onclick="vote('RECOMMENDATION', ${rec.id || rec.recommendation_id}, 1)" style="background: none; border: none; color: ${userVote === 1 ? '#3b82f6' : '#94a3b8'}; cursor: pointer; display: flex; align-items: center; gap: 5px; font-size: 14px; font-weight: bold; transition: color 0.2s;">
                  <i class="bx ${userVote === 1 ? 'bxs-upvote' : 'bx-upvote'}" style="font-size: 18px;"></i> <span>${rec.likes || 0}</span>
                </button>
                <button type="button" onclick="vote('RECOMMENDATION', ${rec.id || rec.recommendation_id}, -1)" style="background: none; border: none; color: ${userVote === -1 ? '#ef4444' : '#94a3b8'}; cursor: pointer; display: flex; align-items: center; gap: 5px; font-size: 14px; font-weight: bold; transition: color 0.2s;">
                  <i class="bx ${userVote === -1 ? 'bxs-downvote' : 'bx-downvote'}" style="font-size: 18px;"></i> <span>${rec.dislikes || 0}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

})();
