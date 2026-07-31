<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted, nextTick } from "vue";
import { catalog } from "../store/catalog";
import { addToCart, adjustQty, cartKey, toggleCheese } from "../store/cart";
import {
  cartLines,
  cartTotal,
  cheeseUpcharge,
} from "../composables/presentation";
import type { Cart } from "../types";

defineOptions({
  inheritAttrs: false,
});

const props = defineProps<{
  tableNum: number | null;
  hasOrders: boolean;
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [cart: Cart, note: string, paid: boolean];
}>();

const tableCart = reactive<Cart>({});
const tableCategory = ref("pizza");
const tableNote = ref("");
const tablePaid = ref(false);
const submitting = ref(false);
const bottomBarRef = ref<HTMLElement | null>(null);
const bottomBarHeight = ref(120);

const upcharge = computed(() => cheeseUpcharge());
const lines = computed(() => cartLines(tableCart));
const total = computed(() => cartTotal(tableCart));
const menuPaddingBottom = computed(() => `${bottomBarHeight.value + 20}px`);

const tableMenuDisplay = computed(() =>
  catalog.items
    .filter((item) => item.category === tableCategory.value && item.enabled)
    .map((item) => {
      if (item.hasTemp) {
        return {
          item,
          qty: 0,
          cheese: false,
          showCheese: false,
          iceQty: tableCart[cartKey(item.id, "ice")]?.qty ?? 0,
          hotQty: tableCart[cartKey(item.id, "hot")]?.qty ?? 0,
          displayPrice: item.price,
        };
      }
      const line = tableCart[item.id];
      const qty = line?.qty ?? 0;
      const cheese = line?.cheese ?? false;
      const showCheese = item.category === "pizza";
      return {
        item,
        qty,
        cheese,
        showCheese,
        iceQty: 0,
        hotQty: 0,
        displayPrice: item.price + (cheese && showCheese ? upcharge.value : 0),
      };
    }),
);

function removeTableCartItem(lineId: string) {
  delete tableCart[lineId];
}

function handleSubmit() {
  if (submitting.value || lines.value.length === 0) return;
  submitting.value = true;
  emit("submit", tableCart, tableNote.value, tablePaid.value);
}

function updateBottomBarHeight() {
  if (bottomBarRef.value) {
    bottomBarHeight.value = bottomBarRef.value.offsetHeight;
  }
}

// 清空購物車（關閉抽屜或送出後）
watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) {
      Object.keys(tableCart).forEach((id) => delete tableCart[id]);
      tableNote.value = "";
      tablePaid.value = false;
      submitting.value = false;
    } else {
      // 抽屜打開時，等待 DOM 更新後測量底部區塊高度
      await nextTick();
      updateBottomBarHeight();
    }
  },
);
</script>

<template>
  <main>
    <!-- 遮罩層 -->
    <Transition name="fade">
      <div
        v-if="open"
        @click="$emit('close')"
        class="fixed inset-0 z-40 bg-black/30"
      ></div>
    </Transition>

    <!-- 抽屜 -->
    <Transition name="slide">
      <div
        v-if="open"
        class="fixed right-0 top-0 z-50 h-full w-full overflow-y-auto bg-white shadow-2xl sm:w-[500px]"
      >
        <!-- 桌號標題（滾動時 fixed） -->
        <div
          class="sticky top-0 z-10 border-b-[2.5px] border-[#1a1a1a] bg-white px-5 py-4"
        >
          <div class="mb-3 flex items-center justify-between">
            <div class="brand-text text-2xl">
              {{ tableNum }} 桌{{ hasOrders ? "加點" : "點餐" }}
            </div>
            <button
              @click="$emit('close')"
              class="flex size-9 cursor-pointer items-center justify-center rounded-full border-2 border-[#1a1a1a] bg-white text-xl font-black hover:bg-[rgba(26,26,29,.05)]"
            >
              ×
            </button>
          </div>

          <!-- 目前訂單摘要 -->
          <div class="rounded-xl border-2 border-[#1a1a1a] bg-[#f2fbff] p-3">
            <div class="mb-2 text-xs font-extrabold">目前訂單</div>
            <div
              v-if="lines.length === 0"
              class="py-2 text-center text-xs text-[rgba(26,26,29,.5)]"
            >
              尚未加入品項
            </div>
            <div
              v-for="line in lines"
              :key="line.id"
              class="flex items-center justify-between border-b border-dashed border-[rgba(26,26,29,.15)] py-[12px] text-[15px] last:border-b-0"
            >
              <span
                >{{ line.zh }} × {{ line.qty
                }}<span class="text-[rgba(26,26,29,.5)]"
                  >{{ line.tempSuffix }}{{ line.cheeseSuffix }}</span
                ></span
              >
              <div class="flex items-center gap-2.5">
                <span class="font-extrabold">${{ line.lineTotal }}</span>
                <button
                  @click="removeTableCartItem(line.id)"
                  class="flex size-7 cursor-pointer items-center justify-center rounded-md bg-[rgba(26,26,29,.1)] text-lg font-bold text-[#1a1a1a] hover:bg-[rgba(26,26,29,.2)]"
                >
                  ×
                </button>
              </div>
            </div>
            <div
              v-if="lines.length > 0"
              class="mt-2 flex justify-between border-t-2 border-dashed border-[rgba(26,26,29,.2)] pt-2 text-base font-black text-[#e8384f]"
            >
              <span>總計</span><span>${{ total }}</span>
            </div>
          </div>
        </div>

        <!-- 菜單內容 -->
        <div class="px-5 pt-4" :style="{ paddingBottom: menuPaddingBottom }">
          <!-- 分類切換 -->
          <div class="mb-4 flex flex-wrap gap-2">
            <button
              v-for="cat in catalog.categories"
              :key="cat.id"
              @click="tableCategory = cat.id"
              :class="tableCategory === cat.id ? 'bg-[#ffdf3c]' : 'bg-white'"
              class="tab-font cursor-pointer rounded-xl border-[2.5px] border-[#1a1a1a] px-[18px] py-2.5 text-[13px] text-[#1a1a1a]"
            >
              {{ cat.label }}
            </button>
          </div>

          <!-- 品項列表 -->
          <div class="flex flex-col gap-3">
            <div
              v-for="row in tableMenuDisplay"
              :key="row.item.id"
              class="flex flex-col items-stretch justify-between gap-3 rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white p-3.5 px-4 sm:flex-row sm:items-center"
            >
              <div class="min-w-0 flex-1">
                <div class="flex items-baseline gap-2">
                  <span class="text-base font-black">{{ row.item.zh }}</span>
                  <span
                    v-if="row.item.soldOut"
                    class="rounded-full bg-[rgba(26,26,29,.5)] px-2 py-0.5 text-[11px] font-extrabold text-white"
                    >已完售</span
                  >
                </div>
                <div class="mt-0.5 text-xs text-[rgba(26,26,29,.6)]">
                  {{ row.item.description }}
                </div>
                <label
                  v-if="row.showCheese"
                  class="mt-2 flex w-fit cursor-pointer items-center gap-1.5 text-xs font-bold text-[rgba(26,26,29,.7)]"
                >
                  <input
                    type="checkbox"
                    :checked="row.cheese"
                    @change="toggleCheese(tableCart, row.item.id)"
                    class="size-[15px] accent-[#e8384f]"
                  />
                  加起司 +{{ upcharge }}
                </label>
              </div>
              <div
                v-if="!row.item.hasTemp"
                class="flex flex-none items-center justify-between gap-2 sm:flex-col sm:items-end"
              >
                <div class="text-[15px] font-black text-[#e8384f] sm:mb-2">
                  ${{ row.displayPrice }}
                </div>
                <div
                  v-if="row.qty > 0"
                  class="flex items-center gap-2 rounded-[10px] border-2 border-[#1a1a1a] bg-[#f2fbff] px-1.5 py-1"
                >
                  <button
                    @click="adjustQty(tableCart, row.item.id, -1)"
                    class="size-[30px] cursor-pointer rounded-md border-none bg-white text-lg font-black"
                  >
                    −
                  </button>
                  <span class="min-w-4 text-center text-[15px] font-black">{{
                    row.qty
                  }}</span>
                  <button
                    @click="adjustQty(tableCart, row.item.id, 1)"
                    :disabled="row.item.soldOut"
                    class="size-[30px] cursor-pointer rounded-md border-none bg-white text-lg font-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
                <button
                  v-else
                  @click="addToCart(tableCart, row.item.id)"
                  :disabled="row.item.soldOut"
                  class="cursor-pointer rounded-[10px] border-[2.5px] border-[#1a1a1a] bg-[#ffdf3c] px-4 py-2 text-[13px] font-extrabold text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {{ row.item.soldOut ? "已完售" : "加點" }}
                </button>
              </div>
              <div v-else class="flex flex-none flex-col gap-2">
                <div
                  v-for="temp in ['ice', 'hot'] as const"
                  :key="temp"
                  class="flex items-center justify-between gap-3 rounded-[10px] border-2 border-[#1a1a1a] bg-[#f2fbff] px-2.5 py-1.5"
                >
                  <span class="whitespace-nowrap text-[13px] font-extrabold"
                    >{{ temp === "ice" ? "冰" : "熱" }} ${{
                      row.displayPrice
                    }}</span
                  >
                  <div
                    v-if="(temp === 'ice' ? row.iceQty : row.hotQty) > 0"
                    class="flex items-center gap-2 rounded-md border-2 border-[#1a1a1a] bg-white px-1.5 py-1"
                  >
                    <button
                      @click="
                        adjustQty(tableCart, cartKey(row.item.id, temp), -1)
                      "
                      class="size-[30px] cursor-pointer rounded-md border-none bg-white text-lg font-black"
                    >
                      −
                    </button>
                    <span class="min-w-4 text-center text-[15px] font-black">{{
                      temp === "ice" ? row.iceQty : row.hotQty
                    }}</span>
                    <button
                      @click="
                        adjustQty(tableCart, cartKey(row.item.id, temp), 1)
                      "
                      :disabled="row.item.soldOut"
                      class="size-[30px] cursor-pointer rounded-md border-none bg-white text-lg font-black disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                  <button
                    v-else
                    @click="addToCart(tableCart, row.item.id, temp)"
                    :disabled="row.item.soldOut"
                    class="cursor-pointer whitespace-nowrap rounded-lg border-2 border-[#1a1a1a] bg-[#ffdf3c] px-3 py-1.5 text-[11px] font-extrabold text-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {{ row.item.soldOut ? "已完售" : "加點" }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部固定區：備註和送出按鈕 -->
        <div
          ref="bottomBarRef"
          class="fixed bottom-0 right-0 w-full border-t-[2.5px] border-[#1a1a1a] bg-white p-5 sm:w-[500px]"
        >
          <label class="mb-3 block text-xs font-extrabold">
            備註（選填）
            <input
              v-model="tableNote"
              type="text"
              placeholder="例如：不要洋蔥"
              class="mt-1.5 block w-full rounded-lg border-2 border-[#1a1a1a] px-2.5 py-2 text-[13px]"
            />
          </label>

          <!-- 付款狀態 -->
          <div class="mb-3">
            <div class="mb-1.5 text-xs font-extrabold">付款狀態</div>
            <div class="flex gap-2">
              <label
                class="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-2 border-[#1a1a1a] px-3 py-2.5 text-xs font-bold transition-colors"
                :class="
                  tablePaid ? 'bg-[#4ade80] border-[#22c55e]' : 'bg-white'
                "
              >
                <input
                  type="radio"
                  :checked="tablePaid"
                  @change="tablePaid = true"
                  class="size-3.5 accent-[#22c55e]"
                />
                已結帳
              </label>
              <label
                class="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-2 border-[#1a1a1a] px-3 py-2.5 text-xs font-bold transition-colors"
                :class="
                  !tablePaid ? 'bg-[#fbbf24] border-[#f59e0b]' : 'bg-white'
                "
              >
                <input
                  type="radio"
                  :checked="!tablePaid"
                  @change="tablePaid = false"
                  class="size-3.5 accent-[#f59e0b]"
                />
                未結帳
              </label>
            </div>
          </div>

          <button
            v-debounce
            @click="handleSubmit"
            :disabled="lines.length === 0 || submitting"
            class="w-full cursor-pointer rounded-xl border-[2.5px] border-[#1a1a1a] bg-[#ffdf3c] p-3.5 text-sm font-black text-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ submitting ? "處理中…" : "送出訂單（現金）" }}
          </button>
        </div>
      </div>
    </Transition>
  </main>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
