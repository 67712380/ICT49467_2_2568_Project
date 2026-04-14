<template>
  <div id="app">
    <header class="top-nav-wrap">
      <nav class="menu" role="navigation" aria-label="Main menu">
        <router-link to="/" class="menu-link" aria-label="Home">
          <span class="menu-icon material-symbols-rounded">home</span>
          <span class="menu-title">Home</span>
        </router-link>

        <router-link to="/about" class="menu-link" aria-label="Dashboard">
          <span class="menu-icon material-symbols-rounded">dashboard</span>
          <span class="menu-title">Dashboard</span>
        </router-link>

        <router-link to="/admin-approve" class="menu-link" aria-label="Return Management">
          <span class="menu-icon material-symbols-rounded">assignment_return</span>
          <span class="menu-title">Return Desk</span>
        </router-link>
      </nav>
    </header>

    <main class="page-content">
      <router-view />
    </main>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded');
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&display=swap');

:root {
  --menu-bg: rgba(255, 255, 255, 0.78);
  --menu-border: rgba(0, 0, 0, 0.08);
  --menu-accent: #2563eb;
  --menu-text: #111827;
  --menu-muted: #6b7280;
  --menu-radius: 14px;
  --menu-transition: 0.28s ease;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

#app {
  min-height: 100vh;
  font-family: "Outfit", "Segoe UI", Arial, sans-serif;
  color: var(--menu-text);
}

.top-nav-wrap {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: center;
  padding: 14px 14px 10px;
  background: linear-gradient(180deg, rgba(241, 245, 249, 0.95), rgba(241, 245, 249, 0.45));
  backdrop-filter: blur(8px);
}

.menu {
  display: flex;
  gap: 12px;
  padding: 10px;
  border-radius: 16px;
  border: 1px solid var(--menu-border);
  background: var(--menu-bg);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
}

.menu-link {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 56px;
  height: 46px;
  border-radius: var(--menu-radius);
  color: var(--menu-muted);
  text-decoration: none;
  font-weight: 500;
  overflow: hidden;
  transition: all var(--menu-transition);
}

.menu-icon {
  font-size: 24px;
  margin-left: 14px;
  flex-shrink: 0;
  transition: transform var(--menu-transition);
}

.menu-title {
  margin-left: 10px;
  font-size: 14px;
  white-space: nowrap;
  opacity: 0;
  transform: translateX(8px);
  transition: opacity var(--menu-transition), transform var(--menu-transition);
}

.menu-link:hover,
.menu-link:focus-visible,
.menu-link.router-link-exact-active {
  width: 158px;
  color: #fff;
  background: var(--menu-accent);
  box-shadow: 0 6px 14px rgba(37, 99, 235, 0.35);
}

.menu-link:hover .menu-icon,
.menu-link:focus-visible .menu-icon,
.menu-link.router-link-exact-active .menu-icon {
  transform: scale(1.08);
}

.menu-link:hover .menu-title,
.menu-link:focus-visible .menu-title,
.menu-link.router-link-exact-active .menu-title {
  opacity: 1;
  transform: translateX(0);
}

.page-content {
  min-height: calc(100vh - 78px);
}

@media (max-width: 700px) {
  .menu {
    width: 100%;
    justify-content: space-between;
  }

  .menu-link,
  .menu-link:hover,
  .menu-link:focus-visible,
  .menu-link.router-link-exact-active {
    width: auto;
    padding: 0 12px;
    flex: 1;
    justify-content: center;
  }

  .menu-icon {
    margin-left: 0;
    margin-right: 6px;
  }

  .menu-title,
  .menu-link:hover .menu-title,
  .menu-link:focus-visible .menu-title,
  .menu-link.router-link-exact-active .menu-title {
    opacity: 1;
    transform: none;
    margin-left: 4px;
  }
}
</style>
