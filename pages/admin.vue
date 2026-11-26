<script setup lang="ts">
import { questions } from '~/shared/questions'

useHead({ title: 'Back Office Kuesioner' })

const search = ref(''), keyword = ref(''), page = ref(1)
const { data, pending, error: loadError, refresh } = useFetch('/api/admin/responses', { query: { q: keyword, page }, server: false })
const totalPages = computed(() => Math.max(1, Math.ceil((data.value?.total || 0) / (data.value?.perPage || 20))))

// null = daftar, 0 = tambah data, >0 = ubah data
const editing = ref<number | null>(null)
const form = reactive({ name: '', workUnit: '', position: '', yearsOfService: '', answers: {} as Record<string, number> })
const saving = ref(false), error = ref('')

function find() { page.value = 1; keyword.value = search.value.trim() }
function message(e: any) { return e.data?.statusMessage || 'Permintaan gagal. Silakan coba lagi.' }
function create() {
  Object.assign(form, { name: '', workUnit: '', position: '', yearsOfService: '', answers: {} })
  error.value = ''; editing.value = 0
}
async function edit(id: number) {
  error.value = ''
  try {
    const { name, workUnit, position, yearsOfService, answers } = await $fetch<any>(`/api/admin/responses/${id}`)
    Object.assign(form, { name, workUnit, position, yearsOfService, answers })
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
</script>

<template>
  <div class="admin">
    <h1>Back Office Kuesioner</h1>

    <section v-if="editing === null" class="card">
      <form class="toolbar" @submit.prevent="find">
        <input v-model="search" placeholder="Cari nama, unit kerja, jabatan" />
        <button type="submit">Cari</button>
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

    <form v-else class="card" @submit.prevent="save">
      <h2>{{ editing ? 'Ubah data' : 'Tambah data' }}</h2>
      <div class="profile">
        <label>Nama<input v-model="form.name" required maxlength="150" /></label>
        <label>Unit kerja<input v-model="form.workUnit" required maxlength="150" /></label>
        <label>Jabatan<input v-model="form.position" required maxlength="150" /></label>
        <label>Masa kerja<input v-model="form.yearsOfService" required maxlength="100" /></label>
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
.toolbar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
.toolbar input { flex: 1; width: auto; min-width: 200px; }
.table { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: .9rem; }
th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #e5ebe8; }
.row-actions { display: flex; gap: 6px; }
.row-actions button { padding: 7px 12px; }
button.danger { background: #b42318; box-shadow: none; }
.pager { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 20px; }
.question { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 12px 0; border-top: 1px solid #e5ebe8; line-height: 1.5; }
.profile { margin-bottom: 24px; }
select { padding: 8px 12px; border: 1px solid #ccd8d4; border-radius: 8px; font: inherit; }
</style>
