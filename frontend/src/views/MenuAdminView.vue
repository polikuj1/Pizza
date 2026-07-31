<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from "vue";
  import { useRouter } from "vue-router";
  import { api } from "../api";
  import { handleLoadError } from "../composables/authGuard";
  import type { Category, MenuItem } from "../types";

  const router = useRouter();
  const items = ref<MenuItem[]>([]);
  const categories = ref<Category[]>([]);
  const drafts = reactive<Record<string, MenuItem>>({});
  const rowError = reactive<Record<string, string>>({});
  const activeCategory = ref("all");

  const visibleItems = computed(() =>
    activeCategory.value === "all"
      ? items.value
      : items.value.filter((item) => item.category === activeCategory.value),
  );

  const newItem = reactive({
    zh: "",
    en: "",
    description: "",
    price: 0,
    category: "pizza",
    hasTemp: false,
    soldOut: false,
    error: "",
  });
  const newItemId = computed(() => toId(newItem.en));

  function titleCase(value: string): string {
    return value
      .split(" ")
      .map((word) =>
        word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word,
      )
      .join(" ");
  }

  function toId(en: string): string {
    return en.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  async function load() {
    try {
      const menu = await api.getMenu();
      items.value = menu.items;
      categories.value = menu.categories;
      for (const item of menu.items) drafts[item.id] = { ...item };
    } catch (err) {
      handleLoadError(err, router);
    }
  }
  onMounted(load);

  async function save(id: string) {
    rowError[id] = "";
    try {
      await api.updateMenuItem(id, drafts[id]);
      await load();
    } catch (err) {
      rowError[id] = err instanceof Error ? err.message : "儲存失敗";
    }
  }

  // ponytail: 用 PATCH 送已儲存的 item（不是 draft），避免順手把未儲存的編輯一起寫進去
  async function toggleEnabled(item: MenuItem) {
    rowError[item.id] = "";
    try {
      await api.updateMenuItem(item.id, { ...item, enabled: !item.enabled });
      await load();
    } catch (err) {
      rowError[item.id] = err instanceof Error ? err.message : "儲存失敗";
    }
  }

  async function createItem() {
    newItem.error = "";
    if (!newItemId.value) {
      newItem.error = "請填寫英文名稱";
      return;
    }
    try {
      await api.createMenuItem({ ...newItem, id: newItemId.value, enabled: true });
      newItem.zh = "";
      newItem.en = "";
      newItem.description = "";
      newItem.price = 0;
      newItem.hasTemp = false;
      newItem.soldOut = false;
      await load();
    } catch (err) {
      newItem.error = err instanceof Error ? err.message : "新增失敗";
    }
  }
</script>

<template>
  <main class="mx-auto max-w-[820px] px-5 pt-[26px] pb-[60px]">
    <div class="brand-text mb-1 text-xl sm:text-[22px]">菜單管理</div>
    <div class="mb-[22px] text-[13px] font-bold text-[rgba(26,26,29,.55)]">
      新增／調整品項，設定是否完售
    </div>

    <div
      class="mb-5 flex flex-col gap-3 rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-4 px-5"
    >
      <div class="text-[13px] font-extrabold">新增品項</div>
      <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <input
          v-model="newItem.zh"
          type="text"
          placeholder="中文名稱"
          class="rounded-[10px] border-2 border-[#1a1a1a] px-3 py-2 text-sm"
        />
        <input
          :value="newItem.en"
          @input="
            newItem.en = titleCase(($event.target as HTMLInputElement).value)
          "
          type="text"
          placeholder="英文名稱"
          class="rounded-[10px] border-2 border-[#1a1a1a] px-3 py-2 text-sm"
        />
        <input
          v-model.number="newItem.price"
          type="number"
          placeholder="價格"
          class="rounded-[10px] border-2 border-[#1a1a1a] px-3 py-2 text-sm"
          min="0"
        />
        <select
          v-model="newItem.category"
          class="rounded-[10px] border-2 border-[#1a1a1a] px-3 py-2 text-sm"
        >
          <option v-for="c in categories" :key="c.id" :value="c.id">
            {{ c.label }}
          </option>
        </select>
        <input
          v-model="newItem.description"
          type="text"
          placeholder="描述"
          class="col-span-2 rounded-[10px] border-2 border-[#1a1a1a] px-3 py-2 text-sm sm:col-span-3"
        />
      </div>
      <div class="flex flex-wrap gap-4 text-[13px] font-bold">
        <label class="flex items-center gap-1.5"
          ><input type="checkbox" v-model="newItem.hasTemp" /> 可選冰／熱</label
        >
        <label class="flex items-center gap-1.5"
          ><input type="checkbox" v-model="newItem.soldOut" /> 已完售</label
        >
      </div>
      <div
        v-if="newItem.error"
        class="text-[13px] font-extrabold text-[#e8384f]"
      >
        {{ newItem.error }}
      </div>
      <button
        v-debounce
        @click="createItem"
        class="w-full cursor-pointer rounded-xl border-[2.5px] border-[#1a1a1a] bg-[#ffdf3c] p-2.5 text-sm font-black text-[#1a1a1a]"
      >
        新增
      </button>
    </div>

    <div class="mb-3.5 flex flex-wrap gap-2">
      <button
        @click="activeCategory = 'all'"
        :class="activeCategory === 'all' ? 'bg-[#ffdf3c]' : 'bg-white'"
        class="tab-font cursor-pointer rounded-xl border-[2.5px] border-[#1a1a1a] px-[18px] py-2.5 text-[13px] text-[#1a1a1a]"
      >
        全部
      </button>
      <button
        v-for="cat in categories"
        :key="cat.id"
        @click="activeCategory = cat.id"
        :class="activeCategory === cat.id ? 'bg-[#ffdf3c]' : 'bg-white'"
        class="tab-font cursor-pointer rounded-xl border-[2.5px] border-[#1a1a1a] px-[18px] py-2.5 text-[13px] text-[#1a1a1a]"
      >
        {{ cat.label }}
      </button>
    </div>

    <div class="flex flex-col gap-3.5">
      <div
        v-for="item in visibleItems"
        :key="item.id"
        :class="!item.enabled ? 'opacity-50' : ''"
        class="rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-4 px-5"
      >
        <div v-if="drafts[item.id]" class="flex flex-col gap-2.5">
          <div class="flex items-center justify-between">
            <span class="text-[13px] font-bold text-[rgba(26,26,29,.5)]"
              >{{ item.id }}<span v-if="!item.enabled" class="ml-2 rounded-full bg-[rgba(26,26,29,.5)] px-2 py-0.5 text-[11px] font-extrabold text-white">已停用</span></span
            >
            <button
              @click="toggleEnabled(item)"
              :class="item.enabled ? 'text-[#e8384f]' : 'text-[#1a1a1a]'"
              class="cursor-pointer rounded-[10px] border-2 border-[#1a1a1a] bg-white px-2.5 py-1.5 text-xs font-extrabold"
            >
              {{ item.enabled ? "停用" : "啟用" }}
            </button>
          </div>
          <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <input
              v-model="drafts[item.id].zh"
              type="text"
              class="rounded-[10px] border-2 border-[#1a1a1a] px-3 py-2 text-sm"
            />
            <input
              :value="drafts[item.id].en"
              @input="
                drafts[item.id].en = titleCase(
                  ($event.target as HTMLInputElement).value,
                )
              "
              type="text"
              class="rounded-[10px] border-2 border-[#1a1a1a] px-3 py-2 text-sm"
            />
            <input
              v-model.number="drafts[item.id].price"
              type="number"
              class="rounded-[10px] border-2 border-[#1a1a1a] px-3 py-2 text-sm"
            />
            <select
              v-model="drafts[item.id].category"
              class="rounded-[10px] border-2 border-[#1a1a1a] px-3 py-2 text-sm"
            >
              <option v-for="c in categories" :key="c.id" :value="c.id">
                {{ c.label }}
              </option>
            </select>
            <input
              v-model="drafts[item.id].description"
              type="text"
              placeholder="描述"
              class="col-span-2 rounded-[10px] border-2 border-[#1a1a1a] px-3 py-2 text-sm sm:col-span-3"
            />
          </div>
          <div class="flex flex-wrap items-center gap-4 text-[13px] font-bold">
            <label class="flex items-center gap-1.5"
              ><input type="checkbox" v-model="drafts[item.id].hasTemp" />
              可選冰／熱</label
            >
            <label class="flex items-center gap-1.5"
              ><input type="checkbox" v-model="drafts[item.id].soldOut" />
              已完售</label
            >
            <button
              @click="save(item.id)"
              class="ml-auto cursor-pointer rounded-[10px] border-2 border-[#1a1a1a] bg-[#ffdf3c] px-3.5 py-1.5 text-xs font-extrabold text-[#1a1a1a]"
            >
              儲存
            </button>
          </div>
          <div
            v-if="rowError[item.id]"
            class="text-[13px] font-extrabold text-[#e8384f]"
          >
            {{ rowError[item.id] }}
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
