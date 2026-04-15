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
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&family=Noto+Sans+Thai:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0');

/* ─────────────────────────────────────────────
   GLOBAL TOKENS
───────────────────────────────────────────── */
:root {
  --navy:       #0f2233;
  --navy-mid:   #1a3a55;
  --slate:      #4a6380;
  --mist:       #8fa3b8;
  --fog:        #c8d6e3;
  --frost:      #edf2f7;
  --snow:       #f8fafc;
  --white:      #ffffff;

  --gold:       #c8922a;
  --gold-light: #f0d99a;

  --menu-active-bg: #2563eb;
  --menu-radius: 12px;
  --menu-transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html { scroll-behavior: smooth; }

body {
  background: var(--snow);
  font-family: 'Noto Sans Thai', 'DM Sans', system-ui, sans-serif;
  color: var(--navy);
  -webkit-font-smoothing: antialiased;
}

#app { min-height: 100vh; }

/* ─────────────────────────────────────────────
   TOP NAV — pill floating (เหมือนเดิม)
───────────────────────────────────────────── */
.top-nav-wrap {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: center;
  padding: 14px 14px 10px;
  background: linear-gradient(180deg, rgba(248,250,252,0.96) 60%, rgba(248,250,252,0) 100%);
  backdrop-filter: blur(10px);
}

.menu {
  display: flex;
  gap: 6px;
  padding: 8px;
  border-radius: 18px;
  border: 1px solid var(--fog);
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 24px rgba(15,34,51,0.10), 0 1px 3px rgba(15,34,51,0.06);
}

.menu-link {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 48px;
  height: 42px;
  border-radius: var(--menu-radius);
  color: var(--mist);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.88rem;
  overflow: hidden;
  transition: all var(--menu-transition);
  letter-spacing: 0.01em;
}

.menu-icon {
  font-size: 22px;
  margin-left: 13px;
  flex-shrink: 0;
  transition: transform var(--menu-transition), color var(--menu-transition);
}

.menu-title {
  margin-left: 8px;
  font-size: 0.86rem;
  white-space: nowrap;
  opacity: 0;
  transform: translateX(6px);
  transition: opacity var(--menu-transition), transform var(--menu-transition);
}

.menu-link:hover,
.menu-link:focus-visible,
.menu-link.router-link-exact-active {
  width: 148px;
  color: var(--white);
  background: #2563eb;
  box-shadow: 0 4px 16px rgba(37,99,235,0.35);
}

.menu-link:hover .menu-icon,
.menu-link:focus-visible .menu-icon,
.menu-link.router-link-exact-active .menu-icon {
  transform: scale(1.05);
  color: var(--white);
}

.menu-link:hover .menu-title,
.menu-link:focus-visible .menu-title,
.menu-link.router-link-exact-active .menu-title {
  opacity: 1;
  transform: translateX(0);
}

/* ─────────────────────────────────────────────
   PAGE CONTENT
───────────────────────────────────────────── */
.page-content { min-height: calc(100vh - 76px); }

/* ─────────────────────────────────────────────
   SCROLLBAR
───────────────────────────────────────────── */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--fog); border-radius: 99px; }

/* ─────────────────────────────────────────────
   RESPONSIVE
───────────────────────────────────────────── */
@media (max-width: 680px) {
  .menu {
    width: calc(100vw - 28px);
    justify-content: space-between;
  }

  .menu-link,
  .menu-link:hover,
  .menu-link:focus-visible,
  .menu-link.router-link-exact-active {
    width: auto;
    flex: 1;
    justify-content: center;
    padding: 0 10px;
  }

  .menu-icon { margin-left: 0; }

  .menu-title,
  .menu-link:hover .menu-title,
  .menu-link:focus-visible .menu-title,
  .menu-link.router-link-exact-active .menu-title {
    display: none;
  }
}
</style>
