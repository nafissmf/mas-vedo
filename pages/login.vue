<script setup lang="ts">
useHead({
  title: 'Masuk - Back Office'
})

const route = useRoute()
const router = useRouter()
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { username: username.value, password: password.value }
    })
    await router.replace(typeof route.query.next === 'string' ? route.query.next : '/admin')
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'Tidak dapat masuk. Silakan coba lagi.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <div class="login-orb login-orb-one"></div>
    <div class="login-orb login-orb-two"></div>

    <section class="login-shell" aria-labelledby="login-title">
      <aside class="login-brand">
        <div class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none">
            <path d="M8 23V11l8-5 8 5v12l-8 5-8-5Z" stroke="currentColor" stroke-width="2"/>
            <path d="M12 20v-7l4-2.5 4 2.5v7l-4 2.5L12 20Z" fill="currentColor"/>
          </svg>
        </div>
        <div>
          <span class="brand-kicker">Universitas Diponegoro</span>
          <h2>Back Office</h2>
        </div>

        <div class="brand-copy">
          <span class="brand-badge">Panel Penelitian</span>
          <h3>Kelola data kuesioner dengan aman.</h3>
          <p>Pusat pengelolaan respons, profil responden, dan hasil penelitian tesis.</p>
        </div>

        <div class="brand-footer">
          <span></span>
          <p>Sistem Kuesioner<br><strong>Vedo Yustinevan</strong></p>
        </div>
      </aside>

      <div class="login-panel">
        <div class="login-heading">
          <span class="login-overline">AREA TERBATAS</span>
          <h1 id="login-title">Selamat datang kembali</h1>
          <p>Masuk untuk mengelola data kuesioner.</p>
        </div>

        <form class="login-form" @submit.prevent="submit">
          <label for="username">Nama pengguna</label>
          <div class="field">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="8" r="3.5" stroke="currentColor" stroke-width="1.8"/>
              <path d="M5.5 20c.5-4 3-6 6.5-6s6 2 6.5 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
            <input id="username" v-model="username" autocomplete="username" placeholder="Masukkan nama pengguna" required>
          </div>

          <label for="password">Kata sandi</label>
          <div class="field">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.8"/>
              <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" stroke="currentColor" stroke-width="1.8"/>
            </svg>
            <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="Masukkan kata sandi" required>
            <button class="password-toggle" type="button" :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'" @click="showPassword = !showPassword">
              <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z" stroke="currentColor" stroke-width="1.7"/>
                <circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="1.7"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m4 4 16 16M10.6 7.2A9.7 9.7 0 0 1 12 7c6 0 9.5 5 9.5 5a16 16 0 0 1-2.6 2.8M6.2 9.1A15.7 15.7 0 0 0 2.5 12s3.5 5 9.5 5c1.1 0 2.1-.2 3-.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <p v-if="error" class="login-error" role="alert">{{ error }}</p>

          <button class="login-submit" type="submit" :disabled="loading">
            <span>{{ loading ? 'Memproses...' : 'Masuk ke dashboard' }}</span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 5 7 7-7 7M16 12H3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </form>

        <p class="login-security">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 5 6v5c0 4.5 2.8 8.4 7 10 4.2-1.6 7-5.5 7-10V6l-7-3Z" stroke="currentColor" stroke-width="1.6"/><path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Terhubung dengan koneksi aman
        </p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.login-page { position: relative; min-height: 100vh; display: grid; place-items: center; padding: 32px; overflow: hidden; background: #edf3ef !important; }
.login-page:before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 12% 14%, #bde1d8 0, transparent 24%), radial-gradient(circle at 88% 82%, #dfd1ac 0, transparent 22%), linear-gradient(135deg, #f7faf8 0%, #e8f0ec 100%); }
.login-page:after { content: ''; position: absolute; inset: 0; opacity: .22; background-image: linear-gradient(#557c7312 1px, transparent 1px), linear-gradient(90deg, #557c7312 1px, transparent 1px); background-size: 38px 38px; mask-image: linear-gradient(135deg, #000, transparent 70%); }
.login-orb { position: absolute; border-radius: 50%; z-index: 1; pointer-events: none; }
.login-orb-one { width: 220px; height: 220px; left: -70px; bottom: -75px; border: 1px solid #2d726c38; box-shadow: inset 0 0 60px #91bdaf24; }
.login-orb-two { width: 130px; height: 130px; right: 5%; top: 7%; border: 1px solid #be955638; }
.login-shell { position: relative; z-index: 2; width: min(960px, 100%); min-height: 590px; display: grid; grid-template-columns: 42% 58%; border: 1px solid #ffffffcc; border-radius: 24px; overflow: hidden; background: #fff; box-shadow: 0 30px 80px #345d5126, 0 8px 24px #345d5112; animation: loginIn .65s cubic-bezier(.2,.8,.2,1) both; }
.login-brand { position: relative; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; align-content: flex-start; padding: 38px; color: #fff; background: linear-gradient(145deg, #0d3d3a 0%, #0c5a50 58%, #247d6c 100%); overflow: hidden; }
.login-brand:before { content: ''; position: absolute; width: 300px; height: 300px; right: -180px; bottom: -120px; border: 1px solid #ffffff24; border-radius: 50%; box-shadow: 0 0 0 45px #ffffff08, 0 0 0 90px #ffffff06; }
.brand-mark { width: 44px; height: 44px; display: grid; place-items: center; border: 1px solid #ffffff38; border-radius: 12px; background: #ffffff12; backdrop-filter: blur(8px); }
.brand-mark svg { width: 26px; height: 26px; }
.brand-kicker { display: block; color: #b9dcd4; font-size: 10px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; }
.login-brand h2 { margin: 2px 0 0; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 19px; letter-spacing: -.02em; }
.brand-copy { width: 100%; position: absolute; left: 38px; right: 38px; top: 48%; transform: translateY(-50%); }
.brand-badge { display: inline-block; margin-bottom: 16px; padding: 7px 10px; border: 1px solid #ffffff2b; border-radius: 999px; color: #dbece7; background: #ffffff0d; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.brand-copy h3 { max-width: 290px; margin: 0 0 14px; color: #fff; font-family: 'Playfair Display', serif; font-size: 34px; line-height: 1.12; }
.brand-copy p { max-width: 290px; margin: 0; color: #bdd4ce; font-size: 14px; line-height: 1.7; }
.brand-footer { position: absolute; left: 38px; right: 38px; bottom: 30px; display: flex; align-items: center; gap: 12px; }
.brand-footer > span { width: 34px; height: 1px; background: #b9dcd477; }
.brand-footer p { margin: 0; color: #b5d0c9; font-size: 10px; line-height: 1.5; text-transform: uppercase; letter-spacing: .08em; }
.brand-footer strong { color: #fff; font-size: 11px; }
.login-panel { display: flex; flex-direction: column; justify-content: center; padding: 58px 64px 34px; background: linear-gradient(145deg, #fff 65%, #fafcfb); }
.login-heading { margin-bottom: 34px; }
.login-overline { color: #167368; font-size: 10px; font-weight: 800; letter-spacing: .16em; }
.login-heading h1 { margin: 8px 0 8px; color: #18312e; font-family: 'Playfair Display', serif; font-size: 34px; line-height: 1.15; }
.login-heading p { margin: 0; color: #7b8986; font-size: 14px; }
.login-form { display: grid; }
.login-form label { margin: 0 0 8px; color: #40534f; font-size: 13px; font-weight: 700; }
.field { position: relative; display: flex; align-items: center; margin-bottom: 20px; }
.field > svg { position: absolute; left: 15px; width: 19px; height: 19px; color: #7f9691; z-index: 1; }
.field input { height: 52px; padding: 0 48px 0 46px; border: 1px solid #dce5e2; border-radius: 11px; background: #fbfcfc; color: #1e3935; font-size: 14px; transition: .2s ease; }
.field input::placeholder { color: #a1adaa; }
.field input:focus { border-color: #388879; background: #fff; box-shadow: 0 0 0 4px #2d807018; transform: none; }
.password-toggle { position: absolute; right: 8px; width: 36px; height: 36px; display: grid; place-items: center; padding: 0; border: 0; border-radius: 8px; background: transparent; color: #839893; box-shadow: none; }
.password-toggle:hover { transform: none; background: #edf4f1; color: #247269; box-shadow: none; }
.password-toggle svg { width: 19px; height: 19px; }
.login-error { margin: -8px 0 16px; padding: 10px 12px; border: 1px solid #efcac5; border-radius: 8px; background: #fff4f2; color: #a64135; font-size: 12px; }
.login-submit { width: 100%; height: 54px; display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 2px; border-radius: 11px; background: linear-gradient(135deg, #176c61, #0d584f); box-shadow: 0 12px 24px #1b70602b; font-size: 14px; }
.login-submit svg { width: 18px; height: 18px; transition: transform .2s; }
.login-submit:hover svg { transform: translateX(3px); }
.login-security { display: flex; align-items: center; justify-content: center; gap: 7px; margin: 24px 0 0; color: #94a39f; font-size: 11px; }
.login-security svg { width: 15px; height: 15px; color: #69958c; }
@keyframes loginIn { from { opacity: 0; transform: translateY(18px) scale(.985); } to { opacity: 1; transform: none; } }
@media (max-width: 760px) {
  .login-page { padding: 16px; align-items: start; }
  .login-shell { grid-template-columns: 1fr; max-width: 520px; min-height: auto; margin-top: 20px; }
  .login-brand { min-height: 155px; padding: 24px 26px; }
  .brand-copy { position: static; transform: none; margin: 12px 0 0; }
  .brand-copy h3 { max-width: none; font-size: 24px; margin-bottom: 8px; }
  .brand-copy p, .brand-badge, .brand-footer { display: none; }
  .login-panel { padding: 38px 28px 28px; }
  .login-heading { margin-bottom: 28px; }
  .login-heading h1 { font-size: 29px; }
}
@media (max-width: 420px) {
  .login-page { padding: 0; }
  .login-shell { min-height: 100vh; margin: 0; border: 0; border-radius: 0; }
  .login-brand { min-height: 138px; }
  .login-panel { justify-content: flex-start; }
}
</style>
