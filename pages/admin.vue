<script setup lang="ts">
import { questions } from '~/shared/questions'

useHead({ title: 'Back Office Kuesioner' })

const search = ref(''), keyword = ref(''), page = ref(1)
const { data, pending, error: loadError, refresh } = useFetch('/api/admin/responses', { query: { q: keyword, page }, server: false })
const totalPages = computed(() => Math.max(1, Math.ceil((data.value?.total || 0) / (data.value?.perPage || 20))))
const showAnalysis = ref(false)
const { data: analysis, pending: analysisPending, error: analysisError, refresh: refreshAnalysis } = useFetch('/api/admin/analysis', { server: false, immediate: false })

// null = daftar, 0 = tambah data, >0 = ubah data
const editing = ref<number | null>(null)
const form = reactive({ name: '', workUnit: '', position: '', yearsOfService: '', submittedAt: '', answers: {} as Record<string, number> })
const saving = ref(false), error = ref('')

function find() { page.value = 1; keyword.value = search.value.trim() }
async function openAnalysis() { showAnalysis.value = true; await refreshAnalysis() }
function downloadExcel() { window.location.href = '/api/admin/export' }
function localDateTime(value = new Date()) { const pad = (number: number) => String(number).padStart(2, '0'); return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}` }
function message(e: any) { return e.data?.statusMessage || 'Permintaan gagal. Silakan coba lagi.' }
function create() {
  Object.assign(form, { name: '', workUnit: '', position: '', yearsOfService: '', submittedAt: localDateTime(), answers: {} })
  error.value = ''; editing.value = 0
}
async function edit(id: number) {
  error.value = ''
  try {
    const { name, workUnit, position, yearsOfService, submittedAt, answers } = await $fetch<any>(`/api/admin/responses/${id}`)
    Object.assign(form, { name, workUnit, position, yearsOfService, submittedAt: localDateTime(new Date(submittedAt)), answers })
    editing.value = id
  } catch (e) { error.value = message(e) }
}
async function save() {
  saving.value = true; error.value = ''
  try {
    await $fetch(editing.value ? `/api/admin/responses/${editing.value}` : '/api/admin/responses', { method: editing.value ? 'PUT' : 'POST', body: form })
    editing.value = null
    await refresh()
  } catch (e) { error.value = message(e) } finally { saving.value = false }
}
async function remove(id: number, name: string) {
  if (!window.confirm(`Hapus data "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return
  error.value = ''
  try {
    await $fetch(`/api/admin/responses/${id}`, { method: 'DELETE' })
    if (data.value?.items.length === 1 && page.value > 1) page.value--
    else await refresh()
  } catch (e) { error.value = message(e) }
}
const date = (value: string) => new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  window.location.href = '/login'
}
</script>

<template>
  <div class="admin">
    <div class="admin-heading">
      <h1>Back Office Kuesioner</h1>
      <button type="button" class="logout" @click="logout">Keluar</button>
    </div>

    <section v-if="editing === null && !showAnalysis" class="card">
      <form class="toolbar" @submit.prevent="find">
        <input v-model="search" placeholder="Cari nama, unit kerja, jabatan" />
        <button type="submit">Cari</button>
        <button type="button" class="secondary analysis-button" @click="openAnalysis">Rekap analisis</button>
        <button type="button" class="secondary analysis-button" @click="downloadExcel">Unduh Excel</button>
        <button type="button" @click="create">Tambah data</button>
      </form>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="loadError" class="error">Gagal memuat data.</p>
      <p v-else-if="pending">Memuat…</p>
      <p v-else-if="!data?.items.length">Belum ada data.</p>
      <div v-else class="table">
        <table>
          <thead><tr><th>Nama</th><th>Unit kerja</th><th>Jabatan</th><th>Masa kerja</th><th>Dikirim</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-for="item in data.items" :key="item.id">
              <td>{{ item.name }}</td><td>{{ item.workUnit }}</td><td>{{ item.position }}</td><td>{{ item.yearsOfService }}</td><td>{{ date(item.submittedAt) }}</td>
              <td><div class="row-actions"><button @click="edit(item.id)">Ubah</button><button class="danger" @click="remove(item.id, item.name)">Hapus</button></div></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pager">
        <button class="secondary" :disabled="page <= 1" @click="page--">Sebelumnya</button>
        <span>Halaman {{ page }} dari {{ totalPages }} · {{ data?.total || 0 }} data</span>
        <button class="secondary" :disabled="page >= totalPages" @click="page++">Berikutnya</button>
      </div>
    </section>

    <section v-else-if="editing === null" class="card analysis-card">
      <div class="analysis-heading">
        <div><p class="eyebrow">ANALISIS PENGUKURAN</p><h2>Rekap per variabel</h2></div>
        <div class="row-actions"><button type="button" class="secondary" @click="showAnalysis = false">Kembali</button><button type="button" @click="refreshAnalysis">Perbarui</button></div>
      </div>
      <p class="analysis-note">Ringkasan otomatis dari jawaban tersimpan. Outer loading dihitung sebagai korelasi indikator dengan skor konstruk tanpa indikator tersebut; gunakan sebagai pemeriksaan awal sebelum model PLS dan bootstrapping.</p>
      <p v-if="analysisPending">Menghitung rekap…</p>
      <p v-else-if="analysisError" class="error">Gagal menghitung rekap analisis.</p>
      <template v-else-if="analysis">
        <div class="summary-grid"><div><strong>{{ analysis.respondents }}</strong><span>Responden</span></div><div><strong>{{ analysis.variables.length }}</strong><span>Variabel</span></div><div><strong>1–5</strong><span>Skala jawaban</span></div></div>
        <article v-for="variable in analysis.variables" :key="variable.code" class="variable-report">
          <div class="variable-title"><div><span class="code">{{ variable.code }}</span><h3>{{ variable.name }}</h3><p>{{ variable.respondents }} respons lengkap · rerata {{ variable.mean }} · SD {{ variable.sd }} · rentang {{ variable.min }}–{{ variable.max }}</p></div><div class="badges"><span :class="variable.reliable ? 'pass' : 'review'">{{ variable.reliable ? 'Reliabel' : 'Perlu tinjau' }}</span><span :class="variable.convergentValid ? 'pass' : 'review'">{{ variable.convergentValid ? 'AVE memadai' : 'AVE rendah' }}</span></div></div>
          <div class="metrics"><div><span>Cronbach’s α</span><b>{{ variable.cronbachAlpha }}</b><small>≥ 0,70</small></div><div><span>Composite Reliability</span><b>{{ variable.compositeReliability }}</b><small>≥ 0,70</small></div><div><span>AVE</span><b>{{ variable.ave }}</b><small>≥ 0,50</small></div></div>
          <div class="table"><table><thead><tr><th>Indikator</th><th>Rerata</th><th>SD</th><th>Outer loading</th><th>Status</th></tr></thead><tbody><tr v-for="indicator in variable.indicators" :key="indicator.key"><td><b>{{ indicator.key }}</b><span class="indicator-text">{{ indicator.indicator }}</span></td><td>{{ indicator.mean }}</td><td>{{ indicator.sd }}</td><td>{{ indicator.loading }}</td><td><span :class="indicator.valid ? 'pass' : 'review'">{{ indicator.valid ? 'Valid' : 'Tinjau' }}</span></td></tr></tbody></table></div>
        </article>
        <p class="analysis-footnote">Kriteria: loading ≥ 0,70; Cronbach’s alpha dan composite reliability ≥ 0,70; AVE ≥ 0,50. Hasil reliabilitas/validitas perlu ditafsirkan bersama ukuran sampel, arah item, dan model penelitian.</p>
      </template>
    </section>

    <form v-else class="card" @submit.prevent="save">
      <h2>{{ editing ? 'Ubah data' : 'Tambah data' }}</h2>
      <div class="profile">
        <label>Nama<input v-model="form.name" required maxlength="150" /></label>
        <label>Unit kerja<input v-model="form.workUnit" required maxlength="150" /></label>
        <label>Jabatan<input v-model="form.position" required maxlength="150" /></label>
        <label>Masa kerja<input v-model="form.yearsOfService" required maxlength="100" /></label>
        <label>Tanggal dikirim<input v-model="form.submittedAt" type="datetime-local" required /></label>
      </div>
      <div v-for="q in questions" :key="q.key" class="question">
        <span><b>{{ q.key }}</b> ({{ q.variableCode }}) {{ q.text }}</span>
        <select v-model="form.answers[q.key]" required :aria-label="`Skor ${q.key}`">
          <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <div class="pager">
        <button type="button" class="secondary" @click="editing = null; error = ''">Batal</button>
        <button type="submit" :disabled="saving">{{ saving ? 'Menyimpan…' : 'Simpan' }}</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.admin { max-width: 1100px; margin: auto; padding: 32px 16px; }
.admin-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.admin-heading h1 { margin: 0 0 24px; }
.logout { margin-bottom: 24px; background: #eef3f1; color: #28544f; box-shadow: none; }
.toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.analysis-button { justify-self: auto; }
.toolbar input { flex: 1; width: auto; min-width: 200px; }
.table { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: .9rem; }
th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #e5ebe8; }
.row-actions { display: flex; gap: 6px; }
.row-actions button { padding: 7px 12px; }
button.danger { background: #b42318; box-shadow: none; }
.pager { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 20px; }
.question { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 12px 0; border-top: 1px solid #e5ebe8; line-height: 1.5; }
.analysis-heading,.variable-title { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; }.analysis-heading h2,.variable-title h3{margin:3px 0}.analysis-note,.analysis-footnote{color:#607174;line-height:1.55}.summary-grid,.metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:22px 0}.summary-grid>div,.metrics>div{background:#f1f7f4;border:1px solid #dceae4;border-radius:10px;padding:14px;display:grid;gap:4px}.summary-grid strong,.metrics b{font-size:1.25rem;color:#075b53}.summary-grid span,.metrics span,.metrics small{font-size:.78rem;color:#607174}.variable-report{border-top:1px solid #dce7e2;padding:24px 0}.variable-title p{margin:5px 0 0;color:#607174}.code{display:inline-block;background:#e4f1ec;color:#075b53;border-radius:5px;padding:3px 7px;font-size:.75rem;font-weight:700}.badges{display:flex;gap:7px;flex-wrap:wrap}.pass,.review{display:inline-block;border-radius:99px;padding:4px 8px;font-size:.72rem;font-weight:700;white-space:nowrap}.pass{background:#dcf3e8;color:#08715f}.review{background:#fff0dc;color:#a04a00}.indicator-text{display:block;color:#607174;font-size:.78rem;margin-top:3px}.analysis-footnote{font-size:.82rem}
.profile { margin-bottom: 24px; }
select { padding: 8px 12px; border: 1px solid #ccd8d4; border-radius: 8px; font: inherit; }
@media(max-width:600px){.analysis-heading,.variable-title{flex-direction:column}.summary-grid,.metrics{grid-template-columns:1fr}.variable-title{gap:10px}}
</style>
