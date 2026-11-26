<script setup lang="ts">
import { questions } from '~/shared/questions'
const profile = reactive({ name: '', workUnit: '', position: '', yearsOfService: '' })
const answers = reactive<Record<string, number>>({})
const step = ref(0), saving = ref(false), done = ref(false), error = ref('')
const sections = computed(() => [{ title: 'Data responden', items: [] as typeof questions }, ...Object.entries(Object.groupBy(questions, q => q.variable)).map(([title, items]) => ({ title, items: items! }))])
const current = computed(() => sections.value[step.value])
const scoreLabels = ['Sangat Tidak Setuju', 'Tidak Setuju', 'Netral / Ragu-ragu', 'Setuju', 'Sangat Setuju']
const validCurrent = computed(() => step.value === 0 ? Object.values(profile).every(v => v.trim()) : current.value.items.every(q => answers[q.key]))
function next() { if (!validCurrent.value) { error.value = 'Lengkapi semua jawaban pada bagian ini.'; return }; error.value = ''; step.value++ }
function previous() { error.value=''; step.value-- }
async function submit() { if (!validCurrent.value) return; saving.value=true; error.value=''; try { await $fetch('/api/responses', { method:'POST', body: { ...profile, answers } }); done.value=true; window.scrollTo({ top: 0, behavior: 'smooth' }) } catch (e: any) { error.value=e.data?.statusMessage || 'Data gagal disimpan. Silakan coba lagi.' } finally { saving.value=false } }
</script>

<template>
  <main><div class="shell">
    <header><span class="eyebrow">PENELITIAN TESIS</span><h1>Kuesioner Pegawai PKWT Internal</h1><p>Universitas Diponegoro · Vedo Yustinevan</p><div class="header-orbit orbit-one"></div><div class="header-orbit orbit-two"></div></header>
    <section v-if="done" class="card success"><div class="check">✓</div><h2>Terima kasih atas partisipasi Anda</h2><p>Jawaban Anda telah tersimpan secara aman dan hanya digunakan untuk kepentingan penelitian akademik.</p></section>
    <template v-else>
      <div class="progress"><span>Bagian {{ step + 1 }} dari {{ sections.length }}</span><div><i :style="{ width: `${((step + 1) / sections.length) * 100}%` }"></i></div></div>
      <Transition name="form" mode="out-in"><section :key="step" class="card"><span class="section-number">0{{ step + 1 }}</span><h2>{{ current.title }}</h2>
        <p v-if="step === 0" class="intro">Kuesioner ini ditujukan untuk Pegawai PKWT Internal Universitas Diponegoro (non-vendor/non-outsourcing) dengan masa kerja minimal satu tahun. Identitas dan jawaban Anda dijaga kerahasiaannya.</p>
        <p v-else class="intro">Pilih jawaban yang paling sesuai dengan kondisi yang Anda rasakan. Skala: 1 = Sangat Tidak Setuju sampai 5 = Sangat Setuju.</p>
        <div v-if="step === 0" class="profile">
          <label>Nama<input v-model="profile.name" placeholder="Nama lengkap" /></label><label>Unit kerja<input v-model="profile.workUnit" placeholder="Contoh: Fakultas / Biro" /></label><label>Jabatan<input v-model="profile.position" placeholder="Jabatan saat ini" /></label><label>Masa kerja<input v-model="profile.yearsOfService" placeholder="Contoh: 3 tahun" /></label>
        </div>
        <div v-else class="questions"><article v-for="(q, i) in current.items" :key="q.key"><div class="meta">{{ q.variableCode }} · {{ q.indicator }}</div><p><b>{{ i + 1 }}.</b> {{ q.text }}</p><div class="scale"><label v-for="(label, index) in scoreLabels" :key="label" :class="{ selected: answers[q.key] === index + 1 }"><input v-model="answers[q.key]" :value="index + 1" :name="q.key" type="radio"><strong>{{ index + 1 }}</strong><small>{{ label }}</small></label></div></article></div>
        <p v-if="error" class="error">{{ error }}</p><div class="actions"><button v-if="step" class="secondary" @click="previous">Kembali</button><span></span><button v-if="step < sections.length - 1" @click="next">Lanjutkan</button><button v-else :disabled="saving" @click="submit">{{ saving ? 'Menyimpan…' : 'Kirim jawaban' }}</button></div>
      </section></Transition>
    </template>
  </div></main>
</template>
