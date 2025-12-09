(function () {
  'use strict';

  const POSTS_PER_PAGE = 10;
  let currentPage = 1;
  let allPosts = [];
  let paginationUI = null;
  let observer = null;

  function createPaginationUI() {
    const container = document.createElement('div');
    container.id = 'ig-pagination-controls';
    container.innerHTML = `
      <div class="pagination-wrapper">
        <button id="prev-page" class="pagination-btn">← Previous</button>
        <span class="page-info">Page <span id="current-page">1</span></span>
        <button id="next-page" class="pagination-btn">Next →</button>
      </div>
    `;
    return container;
  }

  function getAllPosts() {
    const feedContainer = document.querySelector('main[role="main"]');
    if (!feedContainer) return [];

    return Array.from(feedContainer.querySelectorAll('article[role="presentation"]'));
  }

  function hideAllPosts() {
    allPosts.forEach(post => {
      post.style.display = 'none';
      post.classList.add('ig-paginated');
    });
  }

  function showCurrentPage() {
    const startIdx = (currentPage - 1) * POSTS_PER_PAGE;
    const endIdx = startIdx + POSTS_PER_PAGE;

    hideAllPosts();

    const postsToShow = allPosts.slice(startIdx, endIdx);
    postsToShow.forEach(post => {
      post.style.display = 'block';
    });

    updatePaginationUI();

    const main = document.querySelector('main[role="main"]');
    if (main) {
      main.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function updatePaginationUI() {
    const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);
    const currentPageSpan = document.getElementById('current-page');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    if (currentPageSpan) {
      currentPageSpan.textContent = `${currentPage} of ${totalPages}`;
    }

    if (prevBtn) {
      prevBtn.disabled = currentPage === 1;
    }

    if (nextBtn) {
      nextBtn.disabled = currentPage >= totalPages;
    }
  }

  function initPagination() {
    allPosts = getAllPosts();

    if (allPosts.length === 0) return;

    const existing = document.getElementById('ig-pagination-controls');
    if (existing) existing.remove();

    paginationUI = createPaginationUI();
    const feedContainer = document.querySelector('main[role="main"]');

    if (feedContainer) {
      feedContainer.insertBefore(paginationUI, feedContainer.firstChild);

      const bottomPagination = paginationUI.cloneNode(true);
      bottomPagination.id = 'ig-pagination-controls-bottom';
      feedContainer.appendChild(bottomPagination);

      setupPaginationListeners('#ig-pagination-controls');
      setupPaginationListeners('#ig-pagination-controls-bottom');
    }

    showCurrentPage();

    disableInfiniteScroll();
  }

  function setupPaginationListeners(selector) {
    const container = document.querySelector(selector);
    if (!container) return;

    const prevBtn = container.querySelector('#prev-page');
    const nextBtn = container.querySelector('#next-page');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          showCurrentPage();
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(allPosts.length / POSTS_PER_PAGE);
        if (currentPage < totalPages) {
          currentPage++;
          showCurrentPage();
        }
      });
    }
  }

  function disableInfiniteScroll() {
    window.addEventListener('scroll', (e) => {
      e.stopPropagation();
    }, true);

    if (observer) observer.disconnect();

    observer = new MutationObserver((mutations) => {
      let newPostsAdded = false;

      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeName === 'ARTICLE' && node.getAttribute('role') === 'presentation') {
            newPostsAdded = true;
          }
        });
      });

      if (newPostsAdded) {
        setTimeout(() => {
          allPosts = getAllPosts();
          showCurrentPage();
        }, 100);
      }
    });

    const feedContainer = document.querySelector('main[role="main"]');
    if (feedContainer) {
      observer.observe(feedContainer, {
        childList: true,
        subtree: true
      });
    }
  }

  function waitForFeed() {
    const checkFeed = setInterval(() => {
      const posts = getAllPosts();
      if (posts.length > 0) {
        clearInterval(checkFeed);
        initPagination();
      }
    }, 1000);

    setTimeout(() => clearInterval(checkFeed), 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForFeed);
  } else {
    waitForFeed();
  }

  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      currentPage = 1;
      if (url === 'https://www.instagram.com/' || url === 'https://www.instagram.com') {
        setTimeout(waitForFeed, 1000);
      }
    }
  }).observe(document, { subtree: true, childList: true });
})();