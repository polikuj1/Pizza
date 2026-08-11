<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref } from "vue";
  import { useRouter } from "vue-router";
  import { api } from "../api";
  import { handleLoadError } from "../composables/authGuard";
  import {
    STATUS_LABELS,
    STATUS_COLORS,
    channelLabel,
    itemsSummary,
    orderLineKey,
    orderTypeColor,
    orderTypeLabel,
    paymentLabel,
    pickupLabel,
    timeLabel,
  } from "../composables/presentation";
  import {
    clearOrderItems,
    isItemChecked,
    toggleItem,
  } from "../store/checkedItems";
  import type { Order } from "../types";

  const router = useRouter();
  const orders = ref<Order[]>([]);
  const scheduledOrders = ref<Order[]>([]);
  let timer: ReturnType<typeof setInterval> | undefined;

  async function load() {
    try {
      const [active, scheduled] = await Promise.all([
        api.getOrders("active"),
        api.getScheduledOrders(),
      ]);
      orders.value = active;
      scheduledOrders.value = scheduled;
    } catch (err) {
      handleLoadError(err, router);
    }
  }

  onMounted(async () => {
    await load();
    timer = setInterval(load, 5000);
  });
  onUnmounted(() => clearInterval(timer));

  // 餐點已出（status 2）交給桌況／出餐流程處理，訂單佇列只留「已接單」「製作中」兩欄
  const columns = computed(() => [
    {
      key: "pending",
      title: "已接單",
      orders: orders.value.filter((o) => o.status === 0),
    },
    {
      key: "making",
      title: "製作中",
      orders: orders.value.filter((o) => o.status === 1),
    },
  ]);

  const orderProcessingCount = computed(() => {
    return (orders.value || []).filter((el) => el.status < 2)?.length;
  });

  async function advance(id: number) {
    try {
      const order = await api.advanceOrder(id);
      // 外帶／線上訂單從「製作中」推進會直接跳過「餐點已出」變成已完成，之後不會再出現在任何畫面，勾選狀態要在這裡清掉
      if (order.status === STATUS_LABELS.length - 1) clearOrderItems(id);
      await load();
    } catch (err) {
      handleLoadError(err, router);
    }
  }

  async function deleteScheduled(order: Order) {
    if (
      !confirm(
        `確定要刪除訂單 #${order.id}（${order.customerName}）嗎？此動作無法復原。`,
      )
    )
      return;
    try {
      await api.deleteOrder(order.id);
      await load();
    } catch (err) {
      handleLoadError(err, router);
    }
  }
</script>

<template>
  <main class="mx-auto max-w-[1100px] px-5 pt-[26px] pb-[60px]">
    <div class="brand-text mb-1 text-xl sm:text-[22px]">當日訂單佇列</div>
    <div class="mb-[22px] text-[13px] font-bold text-[rgba(26,26,29,.55)]">
      共 {{ orderProcessingCount }} 筆進行中訂單
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section v-for="col in columns" :key="col.key">
        <div class="mb-3 flex items-center gap-2">
          <span class="brand-text text-lg">{{ col.title }}</span>
          <span
            class="rounded-full border-2 border-[#1a1a1a] bg-white px-2.5 py-0.5 text-xs font-extrabold"
            >{{ col.orders.length }}</span
          >
        </div>

        <div
          v-if="col.orders.length === 0"
          class="rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white py-10 text-center text-sm text-[rgba(26,26,29,.5)]"
        >
          目前沒有訂單
        </div>

        <div class="flex flex-col gap-3.5">
          <div
            v-for="order in col.orders"
            :key="order.id"
            class="rounded-2xl border-[2.5px] border-l-[6px] border-[#1a1a1a] bg-white p-4 px-5"
            :style="{ borderLeftColor: STATUS_COLORS[order.status] }"
          >
            <div class="mb-2.5 flex flex-wrap justify-between gap-2.5">
              <div>
                <span class="text-base font-black">#{{ order.id }}</span>
                <span
                  class="ml-2 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold text-white"
                  :style="{ background: orderTypeColor(order) }"
                  >{{ orderTypeLabel(order) }}</span
                >
                <span
                  v-if="channelLabel(order)"
                  class="ml-1 rounded-full border-2 border-[#1a1a1a] px-2 py-0.5 text-[11px] font-extrabold text-[#1a1a1a]"
                  >{{ channelLabel(order) }}</span
                >
                <span class="ml-2 text-xs text-[rgba(26,26,29,.55)]">{{
                  timeLabel(order.createdAt)
                }}</span>
              </div>
              <span
                class="rounded-full border-2 border-[#1a1a1a] px-3 py-1 text-xs font-extrabold text-[#1a1a1a]"
                :style="{ background: STATUS_COLORS[order.status] }"
                >{{ STATUS_LABELS[order.status] }}</span
              >
            </div>
            <div class="mb-3 text-[13px] text-[rgba(26,26,29,.8)]">
              {{ order.customerName }}・{{ order.customerPhone }}・{{
                paymentLabel(order)
              }}
              <span
                v-if="pickupLabel(order)"
                class="font-extrabold text-[#e8384f]"
                >・取餐 {{ pickupLabel(order) }}</span
              >
            </div>

            <div
              v-if="order.note"
              class="mb-3 rounded-lg border border-[rgba(26,26,29,.1)] bg-[rgba(255,223,60,.2)] px-2.5 py-1.5 text-xs leading-relaxed text-[rgba(26,26,29,.75)]"
            >
              <span class="font-extrabold text-[rgba(26,26,29,.85)]"
                >備註：</span
              >{{ order.note }}
            </div>

            <div class="mb-3 flex flex-col gap-2">
              <label
                v-for="item in order.items"
                :key="orderLineKey(item)"
                class="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 select-none"
                :class="
                  isItemChecked(order.id, orderLineKey(item))
                    ? 'bg-[#eafbf0]'
                    : 'bg-[#f2fbff]'
                "
              >
                <input
                  type="checkbox"
                  :checked="isItemChecked(order.id, orderLineKey(item))"
                  @change="toggleItem(order.id, orderLineKey(item))"
                  class="size-7 shrink-0 accent-[#3fae66]"
                />
                <span
                  class="flex-1 text-base font-bold"
                  :class="
                    isItemChecked(order.id, orderLineKey(item))
                      ? 'text-[rgba(26,26,29,.4)] line-through'
                      : 'text-[#1a1a1a]'
                  "
                >
                  {{ item.zh }}{{ item.tempSuffix }}{{ item.cheeseSuffix }} ×
                  {{ item.qty }}
                </span>
              </label>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-[15px] font-black text-[#e8384f]"
                >${{ order.total }}</span
              >
              <button
                v-debounce
                @click="advance(order.id)"
                class="cursor-pointer rounded-[10px] border-2 border-[#1a1a1a] bg-[#ffdf3c] px-4 py-2 text-xs font-extrabold text-[#1a1a1a]"
              >
                推進至「{{
                  order.orderType !== "dinein" && order.status + 1 >= 2
                    ? STATUS_LABELS[3]
                    : STATUS_LABELS[order.status + 1]
                }}」
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <section class="mt-10">
      <div class="mb-3 flex items-center gap-2">
        <span class="brand-text text-lg">已排程訂單</span>
        <span
          class="rounded-full border-2 border-[#1a1a1a] bg-white px-2.5 py-0.5 text-xs font-extrabold"
          >{{ scheduledOrders.length }}</span
        >
      </div>
      <div class="mb-3 text-xs font-bold text-[rgba(26,26,29,.5)]">
        取餐日尚未到，先在這裡確認訂單有沒有存成功；到了取餐日會自動出現在上面的佇列
      </div>

      <div
        v-if="scheduledOrders.length === 0"
        class="rounded-2xl border-[2.5px] border-[#1a1a1a] bg-white py-10 text-center text-sm text-[rgba(26,26,29,.5)]"
      >
        目前沒有已排程的訂單
      </div>

      <div class="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <div
          v-for="order in scheduledOrders"
          :key="order.id"
          class="rounded-2xl border-[2.5px] border-dashed border-[rgba(26,26,29,.35)] bg-[rgba(26,26,29,.02)] p-4 px-5"
        >
          <div class="mb-2.5 flex flex-wrap justify-between gap-2.5">
            <div>
              <span class="text-base font-black">#{{ order.id }}</span>
              <span
                class="ml-2 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold text-white"
                :style="{ background: orderTypeColor(order) }"
                >{{ orderTypeLabel(order) }}</span
              >
              <span
                v-if="channelLabel(order)"
                class="ml-1 rounded-full border-2 border-[#1a1a1a] px-2 py-0.5 text-[11px] font-extrabold text-[#1a1a1a]"
                >{{ channelLabel(order) }}</span
              >
            </div>
            <span
              class="rounded-full border-2 border-[#1a1a1a] bg-white px-3 py-1 text-xs font-extrabold text-[#e8384f]"
              >取餐 {{ pickupLabel(order) }}</span
            >
          </div>
          <div class="mb-2 text-[13px] text-[rgba(26,26,29,.8)]">
            {{ order.customerName }}・{{ order.customerPhone }}・{{
              paymentLabel(order)
            }}
          </div>
          <div
            class="mb-2.5 text-[13px] leading-relaxed text-[rgba(26,26,29,.7)]"
          >
            {{ itemsSummary(order) }}
          </div>
          <div
            v-if="order.note"
            class="mb-2.5 rounded-lg border border-[rgba(26,26,29,.1)] bg-[rgba(255,223,60,.2)] px-2.5 py-1.5 text-xs leading-relaxed text-[rgba(26,26,29,.75)]"
          >
            <span class="font-extrabold text-[rgba(26,26,29,.85)]"
              >備註：</span
            >{{ order.note }}
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[15px] font-black text-[#e8384f]"
              >${{ order.total }}</span
            >
            <button
              @click="deleteScheduled(order)"
              aria-label="刪除訂單"
              class="cursor-pointer rounded-[10px] border-2 border-[#1a1a1a] bg-white p-2 text-[#1a1a1a] hover:bg-[#fde8ea]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 6h18" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
