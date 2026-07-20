<script setup lang="ts">
import { watch, ref, onMounted, onUnmounted } from "vue";

const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
  }>(),
  {
    title: "Are you sure?",
    message: "",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
  },
);

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const dialogRef = ref<HTMLDialogElement | null>(null);

watch(
  () => props.open,
  (isOpen) => {
    if (!dialogRef.value) return;
    if (isOpen) {
      dialogRef.value.showModal();
    } else {
      dialogRef.value.close();
    }
  },
);

function onDialogCancel() {
  emit("cancel");
}

function onBackdropClick(e: MouseEvent) {
  if (e.target === dialogRef.value) {
    emit("cancel");
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") {
    emit("cancel");
  }
}

onMounted(() => {
  document.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  document.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <dialog
    ref="dialogRef"
    class="rounded-2xl border-0 shadow-2xl p-0 w-full max-w-[420px] open:animate-fade-in"
    @cancel="onDialogCancel"
    @click="onBackdropClick"
  >
    <div class="p-8">
      <div
        class="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
        style="background-color: #fce8dc"
      >
        <svg
          class="w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#e8703a"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      </div>

      <h2
        class="text-[22px] font-bold mb-3"
        style="
          font-family: Georgia, &quot;Times New Roman&quot;, serif;
          color: #1a1410;
        "
      >
        {{ title }}
      </h2>

      <p class="text-sm leading-relaxed mb-8" style="color: #8a7f75">
        {{ message }}
      </p>

      <div class="flex gap-3">
        <button
          type="button"
          class="flex-1 py-3 px-4 text-sm font-medium rounded-lg border transition-colors cursor-pointer"
          style="border-color: #d8d2cc; color: #1a1410; background: transparent"
          @click="emit('cancel')"
        >
          {{ cancelLabel }}
        </button>
        <button
          type="button"
          class="flex-1 py-3 px-4 text-sm font-bold text-white rounded-lg transition-colors cursor-pointer"
          style="background-color: #d9342b"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </dialog>
</template>

<style>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

dialog {
  margin: auto;
}

dialog::backdrop {
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
}

.open\:animate-fade-in[open] {
  animation: fade-in 0.15s ease-out;
}
</style>
